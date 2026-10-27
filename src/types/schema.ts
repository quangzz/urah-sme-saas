// ================================================================
// URAH SME — Firestore Data Schema (Hierarchical Subcollections)
// Cấu trúc phân cấp: users → workspaces → projects → brandkits/social/website/pr/booking
// ================================================================

// Firebase Timestamp type — tránh import firebase-admin types
type FirebaseTimestamp = { seconds: number; nanoseconds: number } | unknown;

// ── ENUMS & UNIONS ──────────────────────────────────────────────

export type SubscriptionPlan = "Free" | "Pro" | "Enterprise";
export type SubscriptionStatus = "active" | "inactive" | "trial";
export type WorkspaceRole = "Owner" | "Admin" | "Member" | "Guest";
export type ContentStatus = "draft" | "approved" | "published" | "archived";
export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "tiktok" | "twitter";
export type BookingWorkflowState = "scouting" | "negotiating" | "live" | "completed" | "cancelled";

// ── USERS (/users/{uid}) ────────────────────────────────────────

export interface GlobalSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  globalSubscription: GlobalSubscription;
  workspaces: string[]; // Mảng workspaceId references — query nhanh
  createdAt: FirebaseTimestamp;
  lastLoginAt: FirebaseTimestamp;
}

// ── WORKSPACES (/workspaces/{workspaceId}) ───────────────────────

export interface BillingInfo {
  stripeCustomerId?: string;
  plan?: SubscriptionPlan;
  billingEmail?: string;
}

export interface AiQuota {
  used: number;
  limit: number;
  resetAt?: FirebaseTimestamp;
}

export interface Workspace {
  id: string;
  companyName: string;
  billingInfo?: BillingInfo;
  members: Record<string, WorkspaceRole>; // { uid: "Owner" }
  memberIds: string[]; // Cho array-contains query
  aiQuota: AiQuota;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── PROJECTS (/workspaces/{wId}/projects/{pId}) ─────────────────

export interface Project {
  id: string;
  workspaceId: string;
  brandName: string;
  slogan: string;
  industry: string;
  targetAudience: string;
  createdBy: string; // uid
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── BRANDKITS (/workspaces/{wId}/projects/{pId}/brandkits/{bkId}) 

export interface LogoAssets {
  png?: string; // Firebase Storage URL
  svg?: string;
  transparent?: string;
}

export interface Typography {
  heading: string; // Font family
  body: string;
}

export interface Brandkit {
  id: string;
  isPrimary: boolean;
  colorPalette: string[]; // Mảng mã HEX
  typography: Typography;
  logoAssets: LogoAssets;
  logoConceptShape?: string;
  logoBase64?: string; // Preview base64 (tạm thời trước khi upload Storage)
  brandVoice: string; // Văn phong thương hiệu
  visualContext: string; // Phong cách thị giác
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── SOCIAL CONTENTS (/workspaces/{wId}/projects/{pId}/social_contents/{scId})

export interface SocialContent {
  id: string;
  platform: SocialPlatform;
  imageUrl: string; // Firebase Storage URL
  imageBase64?: string; // Preview base64
  caption: string;
  hashtags: string[];
  aiPromptHistory: string; // JSON string lưu prompt history
  status: ContentStatus;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── WEBSITE CONTENTS (/workspaces/{wId}/projects/{pId}/website_contents/{wcId})

export interface WebsiteMetaData {
  title: string; // Max 60 chars
  description: string; // Max 160 chars
}

export interface WebsiteContent {
  id: string;
  sourceUrl?: string; // URL crawler
  contentBody: string; // HTML hoặc Markdown
  metaData: WebsiteMetaData;
  structuredSchema: string; // JSON-LD string (FAQPage, Article, LocalBusiness)
  extractedAssets: string[]; // URLs
  status: ContentStatus;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── PR ARTICLES (/workspaces/{wId}/projects/{pId}/pr_articles/{prId})

export interface AuthorInfo {
  name: string;
  title: string; // Chức danh
  bio: string; // Hồ sơ chuyên môn (EEAT)
}

export interface PrArticle {
  id: string;
  headline: string;
  pressReleaseBody: string;
  authorInfo: AuthorInfo;
  mediaContacts: string[]; // IDs tham chiếu tệp nhà báo
  releaseDate: FirebaseTimestamp; // Embargo date
  prSchema: string; // JSON-LD NewsArticle
  status: ContentStatus;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── INFLUENCERS (/workspaces/{wId}/influencers/{infId}) ─────────
// Danh bạ KOL/Influencer cấp workspace — dùng lại cho nhiều project/campaign

export interface Influencer {
  id: string;
  name: string;
  handle: string;            // @username
  platform: SocialPlatform;
  avatarUrl?: string;
  followerCount?: number;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  tags?: string[];           // VD: ["beauty", "tech", "lifestyle"]
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── BOOKING CAMPAIGNS (/workspaces/{wId}/projects/{pId}/booking_campaigns/{bcId})

export type DeliverableStatus = "pending" | "in_progress" | "completed";

export interface Deliverable {
  format: string;            // "Video", "Post", "Story", "Reel"
  description: string;       // Mô tả chi tiết deliverable
  status: DeliverableStatus;
  deadline?: string;         // ISO date string — dễ serialize
}

export interface CampaignFinancials {
  flatFee: number;
  commissionPerTrial?: number;
  currency: string;          // "VND" (default), "USD"
}

export interface PerformanceMetrics {
  clicks: number;
  views: number;
  demos: number;
}

export interface BookingCampaign {
  id: string;
  campaignName: string;      // Tên campaign dễ nhận diện
  influencerId: string;      // Reference → /workspaces/{wId}/influencers/{infId}
  influencerName: string;    // Denormalized — hiển thị nhanh trên card
  platform: SocialPlatform;
  deliverables: Deliverable[];
  financials: CampaignFinancials;
  performanceMetrics: PerformanceMetrics;
  workflowState: BookingWorkflowState;
  trackingUrl?: string;      // UTM link
  discountCode?: string;
  requirements?: string;     // Yêu cầu dành cho KOL (Brief/Guidelines)
  notes?: string;            // Ghi chú nội bộ
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// ── FIRESTORE PATH HELPERS ──────────────────────────────────────

export const firestorePaths = {
  users: "users",
  user: (uid: string) => `users/${uid}`,
  
  workspaces: "workspaces",
  workspace: (wId: string) => `workspaces/${wId}`,
  
  projects: (wId: string) => `workspaces/${wId}/projects`,
  project: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}`,
  
  brandkits: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}/brandkits`,
  brandkit: (wId: string, pId: string, bkId: string) => `workspaces/${wId}/projects/${pId}/brandkits/${bkId}`,
  
  socialContents: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}/social_contents`,
  socialContent: (wId: string, pId: string, scId: string) => `workspaces/${wId}/projects/${pId}/social_contents/${scId}`,
  
  websiteContents: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}/website_contents`,
  websiteContent: (wId: string, pId: string, wcId: string) => `workspaces/${wId}/projects/${pId}/website_contents/${wcId}`,
  
  prArticles: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}/pr_articles`,
  prArticle: (wId: string, pId: string, prId: string) => `workspaces/${wId}/projects/${pId}/pr_articles/${prId}`,
  
  bookingCampaigns: (wId: string, pId: string) => `workspaces/${wId}/projects/${pId}/booking_campaigns`,
  bookingCampaign: (wId: string, pId: string, bcId: string) => `workspaces/${wId}/projects/${pId}/booking_campaigns/${bcId}`,
  
  influencers: (wId: string) => `workspaces/${wId}/influencers`,
  influencer: (wId: string, infId: string) => `workspaces/${wId}/influencers/${infId}`,
} as const;
