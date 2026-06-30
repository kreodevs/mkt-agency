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
