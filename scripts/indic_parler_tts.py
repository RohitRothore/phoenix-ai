#!/usr/bin/env python3
"""
Indic Parler-TTS batch wrapper for Phoenix AI.
Loads the model once, generates WAV for every line in a batch input JSON,
and writes result metadata to stdout.

Usage (called by NestJS voice-generation.service.ts):
    python scripts/indic_parler_tts.py \
        --input /tmp/batch.json \
        --output-dir /tmp/voice-out

Input JSON format:
    {
        "lines": [
            {"id": "scene-1-line-0", "text": "...", "style": "..."},
            {"id": "scene-1-line-1", "text": "...", "style": "..."}
        ]
    }

Output (written to stdout as JSON):
    {
        "success": true,
        "files": [
            {"id": "scene-1-line-0", "path": "/tmp/voice-out/scene-1-line-0.wav", "duration": 2.5, "sample_rate": 24000},
            ...
        ]
    }
"""

import argparse
import json
import os
import sys
import time
import warnings

import numpy as np
import soundfile as sf
import torch

warnings.filterwarnings("ignore")

DEFAULT_STYLE = (
    "Rohit speaks in a witty, playful, comedic tone with expressive and animated delivery, "
    "at a moderate-fast pace, very clear audio with excellent recording quality and no background noise."
)

_model = None
_tokenizer = None
_description_tokenizer = None
_device = None


def load_model(force_cpu: bool = False):
    global _model, _tokenizer, _description_tokenizer, _device
    if _model is not None:
        return _model.config.sampling_rate
    from parler_tts import ParlerTTSForConditionalGeneration
    from transformers import AutoTokenizer

    use_cuda = torch.cuda.is_available() and not force_cpu
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
            print("WARNING: GPU doesn't support bfloat16 - using float16, which can cause noise.", file=sys.stderr)
    except torch.OutOfMemoryError:
        if use_cuda:
            print("GPU OOM - falling back to CPU float32.", file=sys.stderr)
            torch.cuda.empty_cache()
            _device = "cpu"
            _model = ParlerTTSForConditionalGeneration.from_pretrained(
                "ai4bharat/indic-parler-tts", torch_dtype=torch.float32, low_cpu_mem_usage=True
            ).to(_device)
        else:
            raise

    _tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
    _description_tokenizer = AutoTokenizer.from_pretrained(_model.config.text_encoder._name_or_path)
    return _model.config.sampling_rate


def generate_segment(text: str, style: str) -> np.ndarray:
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
    return generation.cpu().numpy().squeeze()


def process_batch(batch, output_dir: str):
    sample_rate = load_model()
    os.makedirs(output_dir, exist_ok=True)

    results = []
    lines = batch.get("lines", [])
    for i, item in enumerate(lines):
        line_id = item.get("id", f"line-{i}")
        text = item["text"]
        style = item.get("style", DEFAULT_STYLE)

        print(f"  [{i+1}/{len(lines)}] {line_id}: {text[:50]!r}...", file=sys.stderr)
        t0 = time.time()

        try:
            audio = generate_segment(text, style)
        except Exception as e:
            print(f"ERROR generating {line_id}: {e}", file=sys.stderr)
            results.append({"id": line_id, "path": "", "duration": 0, "sample_rate": sample_rate, "error": str(e)})
            continue

        out_path = os.path.join(output_dir, f"{line_id}.wav")
        sf.write(out_path, audio, sample_rate)
        duration = len(audio) / sample_rate
        elapsed = time.time() - t0
        print(f"    done in {elapsed:.1f}s, duration={duration:.2f}s", file=sys.stderr)

        results.append({
            "id": line_id,
            "path": out_path,
            "duration": round(duration, 3),
            "sample_rate": sample_rate,
        })

    return results


def main():
    parser = argparse.ArgumentParser(description="Indic Parler-TTS batch wrapper")
    parser.add_argument("--input", required=True, help="Path to JSON batch input file")
    parser.add_argument("--output-dir", required=True, help="Directory to write WAV files")
    parser.add_argument("--cpu", action="store_true", help="Force CPU inference")
    args = parser.parse_args()

    if not os.path.isfile(args.input):
        print(json.dumps({"success": False, "error": f"Input file not found: {args.input}"}))
        sys.exit(1)

    with open(args.input, "r", encoding="utf-8") as f:
        batch = json.load(f)

    try:
        results = process_batch(batch, args.output_dir)
        output = {"success": True, "files": results}
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
