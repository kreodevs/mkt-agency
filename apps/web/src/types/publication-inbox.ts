export interface PublicationInboxItem {
  contentId: string;
  title: string;
  type: string;
  status: string;
  campaignId: string | null;
  campaignName: string | null;
  productId: string | null;
  productName: string | null;
  versionId: string | null;
  versionNumber: number | null;
  signatureHash: string | null;
  scheduledDate: string;
  preview: string;
  body: string;
  platform: string | null;
  visualFormat: string;
  assets: unknown[];
}

export interface AgencyNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  productId: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface PublicationInboxData {
  pendingApproval: PublicationInboxItem[];
  readyToPublish: PublicationInboxItem[];
  upcoming: PublicationInboxItem[];
  notifications: AgencyNotification[];
  stats: {
    pendingCount: number;
    readyCount: number;
    upcomingCount: number;
    unreadNotifications: number;
  };
}

export interface BulkApproveResult {
  approved: number;
  failed: Array<{ contentId: string; reason: string }>;
}

export interface CopilotStatus {
  productId: string;
  productName: string;
  onboardingCompleted: boolean;
  competitorsCount: number;
  analysisStatus: string;
  analysisUpdatedAt: string | null;
  inbox: PublicationInboxData['stats'];
  nextStep: string;
  canPrepareWeek: boolean;
  prepareBlockedReason: string | null;
}

export interface PrepareWeekResult {
  status: 'completed' | 'empty' | 'blocked';
  message: string;
  productId: string;
  productName: string;
  postsGenerated: number;
  imagesAttached: number;
  strategyId?: string | null;
  topicsUsed?: string[];
  warnings: string[];
}

export interface PrepareWeekJobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: PrepareWeekResult;
  error?: string;
}

export interface SohoSummary {
  leadsToday: number;
  leadsThisWeek: number;
  attributedLeadsThisWeek: number;
  strategyFocus: string | null;
  todayScheduledCount: number;
}
