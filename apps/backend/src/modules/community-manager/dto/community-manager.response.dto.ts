export interface SocialCopyPostResponse {
  id: string;
  platform: string;
  title: string;
  body: string;
  hashtags: string[];
  visualDescription: string;
  bestTime: string;
  targetAudience: string;
  callToAction: string;
  tone: string;
  contentId?: string;
}

export interface SocialCopyBatchResponse {
  id: string;
  summary: string;
  posts: SocialCopyPostResponse[];
  publishingGuide: string;
  generatedAt: string;
  createdAt: string;
  status: 'completed' | 'failed';
  errorMessage: string | null;
  publishedCount: number;
}

export interface GenerateResponse {
  id: string;
  status: 'completed' | 'failed';
  postsGenerated: number;
  imagesAttached?: number;
  error?: string;
}

export interface CommunityManagerPreferencesResponse {
  platforms: string[];
  count: number;
}

export interface CommunityManagerReadinessItem {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  href: string;
}

export interface CommunityManagerReadinessResponse {
  completed: number;
  total: number;
  items: CommunityManagerReadinessItem[];
}