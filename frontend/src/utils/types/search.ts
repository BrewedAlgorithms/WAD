import { Paper } from './papers';

export interface SearchFilters {
  keywords?: string[];
  journalName?: string;
  uploadedBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  authors?: string[];
}

export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  sortBy?: 'relevance' | 'uploadedAt' | 'title' | 'journalName';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
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
    searchStats: {
      query: string;
      filters?: SearchFilters;
      totalResults: number;
      searchTime: number;
    };
  };
}

export type SuggestionItem = {
  type: 'history' | 'popular' | 'title' | 'keyword';
  value: string;
};

export interface SearchSuggestionsResponse {
  success: boolean;
  data: {
    suggestions: SuggestionItem[];
  };
}

export interface PopularKeywordsResponse {
  success: boolean;
  data: {
    keywords: Array<{
      keyword: string;
      count: number;
    }>;
  };
}

export interface SearchStatsResponse {
  success: boolean;
  data: {
    totalPapers: number;
    uniqueKeywords: number;
    topJournals: Array<{
      _id: string;
      count: number;
    }>;
    searchIndexStatus: string;
  };
}

export interface AvailableAuthorsResponse {
  success: boolean;
  data: {
    authors: string[];
  };
}

export interface AvailableJournalsResponse {
  success: boolean;
  data: {
    journals: string[];
  };
}