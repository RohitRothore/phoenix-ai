import https from "node:https";
import { GenerateImageRequest, GenerateImageResponse } from "@phoenix/ai-core";
import { BaseImageProvider } from "../base/BaseImageProvider";

/**
 * HuggingFace Stability AI SD3 Image Provider
 *
 * Uses Stability AI Stable Diffusion 3 via HuggingFace Inference Router.
 * Returns a base64 data URL to avoid browser-only APIs like FileReader.
 */
export class HuggingFaceImageProvider extends BaseImageProvider {
  readonly provider = "huggingface-stabilityai-sd3";

  readonly model = "stabilityai/stable-diffusion-3-medium-diffusers";

  private readonly apiKey: string;
  private readonly baseUrl =
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers";

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || "";
  }

  async generateImage(
    request: GenerateImageRequest,
  ): Promise<GenerateImageResponse> {
    const start = Date.now();
    const width = request.width ?? 1024;
    const height = request.height ?? 1024;
    const seed = request.seed ?? Math.floor(Math.random() * 2_147_483_647);

    if (!this.apiKey) {
      throw new Error(
        "HuggingFace API key is required for Stability AI SD3 image generation",
      );
    }

    const body = {
      inputs: request.prompt,
      parameters: {
        negative_prompt: request.negativePrompt,
        width,
        height,
        seed,
      },
    };

    const jsonData = JSON.stringify(body);
    const responseData = await new Promise<Buffer>((resolve, reject) => {
      const req = https.request(
        this.baseUrl,
        {
          method: "POST",
          family: 4,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(jsonData),
          },
          timeout: 120_000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(Buffer.concat(chunks));
            } else {
              const text = Buffer.concat(chunks).toString();
              reject(
                new Error(
                  `Stability AI SD3 image generation failed: ${res.statusCode} ${res.statusMessage} - ${text}`,
                ),
              );
            }
          });
          res.on("error", reject);
        },
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });
      req.write(jsonData);
      req.end();
    });

    const base64 = responseData.toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;
    const imagePath = `images/sd3-${Date.now()}-${seed}.png`;

    return {
      imageUrl,
      imagePath,
      width,
      height,
      seed,
      provider: this.provider,
      model: this.model,
      generationTime: Date.now() - start,
      metadata: {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt ?? "",
        style: request.style ?? "default",
      },
    };
  }
}
