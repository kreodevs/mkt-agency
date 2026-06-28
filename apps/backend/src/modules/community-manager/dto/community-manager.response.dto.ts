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