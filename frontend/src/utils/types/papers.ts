import { User } from './auth';

export interface GeminiAnalysis {
  research_area?: string;
  methodology?: string;
  key_findings?: string[];
  limitations?: string[];
  research_impact?: string;
  future_directions?: string[];
}

export interface CloudinaryInfo {
  public_id?: string;
  url?: string;
  secure_url?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
}

export interface ProcessingInfo {
  extraction_method?: string;
  ai_processing_time?: number;
  gemini_tokens_used?: number;
  confidence_score?: number;
}

export interface Paper {
  _id: string;
  title: string;
  detailed_summary?: string;
  abstract?: string;
  keywords: string[];
  paperLink?: string;
  journalName?: string;
  authors: string[];
  publication_date?: string;
  uploadedBy: User;
  fileName: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  cloudinary?: CloudinaryInfo;
  isPublic: boolean;
  downloadCount: number;
  gemini_analysis?: GeminiAnalysis;
  processing_info?: ProcessingInfo;
  createdAt: string;
  updatedAt: string;
  formattedFileSize: string;
  downloadUrl: string;
  fileUrl: string;
}

export interface PaperListResponse {
  success: boolean;
  data: {
    papers: Paper[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PaperResponse {
  success: boolean;
  data: {
    paper: Paper;
  };
}

export interface UploadPaperRequest {
  file: File;
  metadata?: {
    title?: string;
    detailed_summary?: string;
    abstract?: string;
    keywords?: string[];
    paperLink?: string;
    journalName?: string;
    authors?: string[];
    publication_date?: string;
    isPublic?: boolean;
  };
}

export interface UpdatePaperRequest {
  title?: string;
  detailed_summary?: string;
  abstract?: string;
  keywords?: string[];
  paperLink?: string;
  journalName?: string;
  authors?: string[];
  isPublic?: boolean;
}

export interface PaperFilters {
  uploadedBy?: string;
  journalName?: string;
  keywords?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  isPublic?: boolean;
}

export interface PaperSortOptions {
  sortBy: 'uploadedAt' | 'title' | 'journalName' | 'downloadCount';
  order: 'asc' | 'desc';
}