export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:3001';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json();
}

// AI Studio API
export interface GenerateArtDto {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  category?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:2' | '2:3';
  imageSize?: '256x256' | '512x512' | '1024x1024' | string;
  quality?: 'standard' | 'hd';
  walletAddress: string;
  customMetadata?: {
    name?: string;
    description?: string;
    category?: string;
    traits?: Array<{ traitType: string; value: string }>;
    royaltyPercentage?: number;
    externalUrl?: string;
    unlockableContent?: string;
  };
}

export async function enhancePrompt(prompt: string, style?: string): Promise<{ enhancedPrompt: string }> {
  return fetchApi('/api/v1/ai/enhance-prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt, style }),
  });
}

export async function startGeneration(data: GenerateArtDto): Promise<{ success: boolean; assetId: string; status: string; message: string }> {
  return fetchApi('/api/v1/ai/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getGenerationStatus(assetId: string): Promise<any> {
  return fetchApi(`/api/v1/ai/generation/${assetId}`);
}

export async function getGenerationHistory(walletAddress: string, page = 1, limit = 10, status?: string): Promise<any> {
  let url = `/api/v1/ai/history?walletAddress=${walletAddress}&page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }
  return fetchApi(url);
}

export async function deleteGenerationDraft(assetId: string, walletAddress: string): Promise<{ success: boolean }> {
  return fetchApi(`/api/v1/ai/generation/${assetId}?walletAddress=${walletAddress}`, {
    method: 'DELETE',
  });
}
