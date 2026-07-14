import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { AIImageProvider, GenerateImageRequest, GeneratedImageResult } from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AIImageProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException('OpenAI API key is not configured.');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI art prompt engineer. Enhance the user's prompt to generate a high-quality, detailed image. Preserve the user's original concept but add useful artistic details, lighting, mood, and camera angles if appropriate. Do not change the core meaning. Output ONLY the enhanced prompt string without quotes or additional text. ${style ? `The requested art style is: ${style}` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250,
      });

      return response.choices[0]?.message?.content?.trim() || prompt;
    } catch (error) {
      console.error('Failed to enhance prompt with OpenAI:', error);
      // Fallback to original prompt if enhancement fails
      return prompt;
    }
  }

  async generateImage(request: GenerateImageRequest): Promise<GeneratedImageResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException('OpenAI API key is not configured.');
    }

    try {
      // For DALL-E 3, we construct a descriptive prompt that includes style and negative prompt if possible.
      // DALL-E 3 doesn't natively support negative prompts via API, but we can instruct it in the prompt.
      let finalPrompt = request.prompt;
      if (request.style) {
        finalPrompt += `, ${request.style} style`;
      }
      if (request.negativePrompt) {
        finalPrompt += `. Do not include: ${request.negativePrompt}`;
      }

      // Map sizes and ratios (DALL-E 3 supports specific sizes)
      let size: "1024x1024" | "1024x1792" | "1792x1024" = '1024x1024';
      if (request.aspectRatio === '16:9') size = '1792x1024';
      if (request.aspectRatio === '9:16') size = '1024x1792';

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: finalPrompt,
        n: 1, // DALL-E 3 only supports n=1
        size: size,
        quality: request.quality === 'hd' ? 'hd' : 'standard',
        response_format: 'b64_json', // Get base64 so we can upload it ourselves
      });

      const imageData = response.data[0]?.b64_json;
      if (!imageData) {
        throw new InternalServerErrorException('No image data returned from OpenAI.');
      }

      const imageBuffer = Buffer.from(imageData, 'base64');
      
      // OpenAI DALL-E 3 revises the prompt, let's use the revised one if available
      const revisedPrompt = response.data[0]?.revised_prompt || finalPrompt;

      return {
        imageBuffer,
        mimeType: 'image/png',
        provider: 'OpenAI',
        model: 'dall-e-3',
        finalPrompt: revisedPrompt,
      };
    } catch (error: any) {
      console.error('Failed to generate image with OpenAI:', error);
      throw new InternalServerErrorException(
        error.message ? `AI Provider Error: ${error.message}` : 'Failed to generate image via AI provider.'
      );
    }
  }
}
