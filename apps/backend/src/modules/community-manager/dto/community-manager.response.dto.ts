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
}

export interface GenerateResponse {
  id: string;
  status: string;
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