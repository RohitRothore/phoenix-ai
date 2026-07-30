"""
Indic Parler-TTS — Hindi-optimized, expressive, no API key needed.
Better suited for Hindi comedy than Bark: instead of guessing at [laughs] tags,
you describe the DELIVERY STYLE in plain English/Hindi and it steers pitch,
speed, energy, and expressiveness accordingly.

This script is designed to be called as a subprocess from the Phoenix AI
Node.js backend. It accepts JSON on stdin (or CLI args) and writes a WAV file
to the requested output path, then prints a single JSON line to stdout with
metadata (path, sample_rate, duration_seconds).

Setup (run once):
    pip install git+https://github.com/huggingface/parler-tts.git
    pip install soundfile numpy torch

Usage (CLI):
    python indic_tts.py --text "मेरा दोस्त इतना आलसी है" --output out.wav
    python indic_tts.py --text "पड़ोसी ने पूछा भाई इतना मोटा कैसे हुआ" \
        --output out.wav --style "cheerful, fast-paced, energetic comedian voice"
    python indic_tts.py --file joke.txt --output long_joke.wav --chunk

Usage (stdin JSON):
    echo '{"text":"नमस्ते दुनिया","output":"out.wav"}' | python indic_tts.py --stdin

Notes:
- Officially supports Hindi plus 19 other Indic languages + English.
- No special voice-preset names needed — the style description IS the control.
- --chunk splits text at sentence boundaries (।, ., !, ?) and stitches results,
  with a short silence gap between segments — much more stable than one huge
  generation call, and lets you vary style per line if you want punchier timing.
- Hindi named speakers (trained voices, more consistent than generic descriptions):
  Rohit, Divya (recommended), Aman, Rani. Reference them by name in --style, e.g.
  "Divya speaks in a fast, energetic, comedic tone, very clear audio."
- Use the phrase "very clear audio" in your style description to push toward the
  highest quality output. Commas inside the TEXT (not just style) add small
  natural pauses/prosody breaks.
"""

import argparse
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
import torch

DEFAULT_STYLE = (
    "Rohit speaks in a witty, playful, comedic tone with expressive and animated delivery, "
    "at a moderate-fast pace, very clear audio with excellent recording quality and no background noise."
)

_model = None
_tokenizer = None
_description_tokenizer = None
_device = None
_sample_rate = None


def load_model(force_cpu: bool = False):
    global _model, _tokenizer, _description_tokenizer, _device, _sample_rate
    if _model is not None:
        return
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    use_cuda = torch.cuda.is_available() and not force_cpu
    # float16 causes the DAC audio decoder to produce static/noise due to precision
    # loss - bfloat16 is far more numerically stable for this model's audio codec,
    # at the same memory cost. Requires Turing (RTX 20-series) or newer GPU.
    bf16_supported = use_cuda and torch.cuda.is_bf16_supported()
    _device = "cuda:0" if use_cuda else "cpu"
    if use_cuda and bf16_supported:
        dtype = torch.bfloat16
    elif use_cuda:
        dtype = torch.float16
    else:
        dtype = torch.float32

    print(f"Loading Indic Parler-TTS on {_device} (dtype={dtype}) ...", file=sys.stderr)
    try:
        _model = ParlerTTSForConditionalGeneration.from_pretrained(
            "ai4bharat/indic-parler-tts", torch_dtype=dtype, low_cpu_mem_usage=True
        ).to(_device)
        if use_cuda and not bf16_supported:
            print(
                "WARNING: GPU doesn't support bfloat16 - using float16, which can cause static/noise "
                "in the audio output. If output sounds broken, rerun with --cpu instead.",
                file=sys.stderr,
            )
    except torch.OutOfMemoryError:
        if use_cuda:
            print(
                "GPU out of memory - falling back to CPU float32 (slower but numerically correct).",
                file=sys.stderr,
            )
            torch.cuda.empty_cache()
            _device = "cpu"
            _model = ParlerTTSForConditionalGeneration.from_pretrained(
                "ai4bharat/indic-parler-tts", torch_dtype=torch.float32, low_cpu_mem_usage=True
            ).to(_device)
        else:
            raise

    _tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
    _description_tokenizer = AutoTokenizer.from_pretrained(_model.config.text_encoder._name_or_path)
    _sample_rate = _model.config.sampling_rate


def generate_segment(text: str, style: str, force_cpu: bool = False) -> np.ndarray:
    load_model(force_cpu=force_cpu)
    desc_ids = _description_tokenizer(style, return_tensors="pt").to(_device)
    prompt_ids = _tokenizer(text, return_tensors="pt").to(_device)

    generation = _model.generate(
        input_ids=desc_ids.input_ids,
        attention_mask=desc_ids.attention_mask,
        prompt_input_ids=prompt_ids.input_ids,
        prompt_attention_mask=prompt_ids.attention_mask,
    )
    if generation.dtype in (torch.float16, torch.bfloat16):
        generation = generation.to(torch.float32)
    audio = generation.cpu().numpy().squeeze()
    return audio


def split_sentences(text: str):
    # Splits on Hindi danda (।), period, exclamation, question mark
    parts = re.split(r"(?<=[।.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def synthesize(
    text: str,
    out_path: str,
    style: str,
    chunk: bool,
    gap_seconds: float = 0.35,
    force_cpu: bool = False,
):
    # Make sure the model is loaded first so we can read its ACTUAL sample rate -
    # hardcoding this was the bug causing the pitched-down "ghost voice" effect.
    load_model(force_cpu=force_cpu)
    sample_rate = _sample_rate

    # Ensure the output directory exists
    out_dir = os.path.dirname(os.path.abspath(out_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    if chunk:
        sentences = split_sentences(text)
        print(f"Splitting into {len(sentences)} segment(s)...", file=sys.stderr)
        audio_chunks = []
        for i, sentence in enumerate(sentences):
            print(f"  [{i+1}/{len(sentences)}] {sentence[:60]!r}", file=sys.stderr)
            audio = generate_segment(sentence, style, force_cpu=force_cpu)
            audio_chunks.append(audio)
            if i < len(sentences) - 1:
                silence = np.zeros(int(gap_seconds * sample_rate), dtype=audio.dtype)
                audio_chunks.append(silence)
        full_audio = np.concatenate(audio_chunks)
    else:
        full_audio = generate_segment(text, style, force_cpu=force_cpu)

    sf.write(out_path, full_audio, sample_rate)

    # Estimate duration from the array length and sample rate
    duration_seconds = float(len(full_audio) / sample_rate)

    # Print a single JSON line to stdout for the parent process to parse
    result = {
        "path": out_path,
        "sample_rate": int(sample_rate),
        "duration_seconds": duration_seconds,
    }
    print(json.dumps(result), flush=True)
    print(f"Saved: {out_path}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Indic Parler-TTS — Hindi comedy optimized")
    parser.add_argument("--text", help="Hindi text to synthesize")
    parser.add_argument("--output", default="output.wav", help="Output .wav path")
    parser.add_argument("--file", help="Read text from a file instead of the CLI arg")
    parser.add_argument(
        "--style",
        default=DEFAULT_STYLE,
        help="Plain-English/Hindi description of voice + delivery style",
    )
    parser.add_argument(
        "--chunk",
        action="store_true",
        help="Split into sentences and stitch (recommended for long text)",
    )
    parser.add_argument(
        "--gap", type=float, default=0.15, help="Silence gap between chunks in seconds"
    )
    parser.add_argument(
        "--cpu", action="store_true", help="Force CPU (skip GPU/fp16 attempt entirely)"
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read a JSON object from stdin with keys: text, output, style, chunk, gap, cpu, file",
    )
    args = parser.parse_args()

    # Allow JSON-on-stdin mode for cleaner subprocess integration
    if args.stdin:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        text = payload.get("text")
        out_path = payload.get("output", "output.wav")
        style = payload.get("style", DEFAULT_STYLE)
        chunk = bool(payload.get("chunk", False))
        gap = float(payload.get("gap", 0.15))
        force_cpu = bool(payload.get("cpu", False))
        file_path = payload.get("file")
    else:
        text = args.text
        out_path = args.output
        style = args.style
        chunk = args.chunk
        gap = args.gap
        force_cpu = args.cpu
        file_path = args.file

    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    elif not text:
        parser.error("Provide text via --text, --file, or --stdin JSON")

    synthesize(
        text,
        out_path,
        style=style,
        chunk=chunk,
        gap_seconds=gap,
        force_cpu=force_cpu,
    )


if __name__ == "__main__":
    sys.exit(main())