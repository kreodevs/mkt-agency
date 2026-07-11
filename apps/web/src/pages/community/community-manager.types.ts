export interface Batch {
  id: string;
  summary: string;
  posts: import('./CmPostCard').SocialPost[];
  publishingGuide: string;
  generatedAt: string;
  createdAt: string;
  status: 'completed' | 'failed';
  errorMessage: string | null;
  publishedCount: number;
}

export interface TonePreset {
  id: string;
  name: string;
  toneText: string;
  isDefault: boolean;
  createdAt: string;
}
