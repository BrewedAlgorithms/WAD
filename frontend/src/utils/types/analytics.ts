export interface UploadStats {
  totalPapers: number;
  totalUsers: number;
  papersThisMonth: number;
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  topJournals: Array<{
    journal: string;
    count: number;
  }>;
  uploadTrend: Array<{
    month: string;
    count: number;
  }>;
}

export interface UserStats {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  stats: {
    totalUploads: number;
    totalDownloads: number;
    favoriteKeywords: string[];
    uploadTrend: Array<{
      month: string;
      count: number;
    }>;
    recentUploads: Array<{
      _id: string;
      title: string;
      uploadedAt: string;
      downloadCount: number;
    }>;
  };
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: string;
    microservice: string;
    fileSystem: string;
  };
  stats: {
    totalPapers: number;
    totalUsers: number;
  };
  version: string;
}

export interface ResearchInsights {
  timeframe: string;
  trendingAreas: Array<{
    area: string;
    count: number;
  }>;
  activeJournals: Array<{
    journal: string;
    count: number;
  }>;
  popularPapers: Array<{
    _id: string;
    title: string;
    downloadCount: number;
    uploadedAt: string;
    uploadedBy: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
}