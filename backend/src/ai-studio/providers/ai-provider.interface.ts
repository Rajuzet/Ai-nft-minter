export interface GenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  category?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:2' | '2:3';
  imageSize?: '256x256' | '512x512' | '1024x1024' | string;
  quality?: 'standard' | 'hd';
  numberOfOutputs?: number;
  seed?: number;
}

export interface GeneratedImageResult {
  imageUrl?: string;
  imageBuffer?: Buffer;
  mimeType: string;
  provider: string;
  model: string;
  finalPrompt: string;
  seed?: number;
}

export interface AIImageProvider {
  generateImage(request: GenerateImageRequest): Promise<GeneratedImageResult>;
  enhancePrompt(prompt: string, style?: string): Promise<string>;
}
