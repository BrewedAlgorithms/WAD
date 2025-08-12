// Use env when provided; otherwise default to a same-origin relative path to avoid mixed-content in HTTPS
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Papers
  PAPERS: {
    BASE: '/papers',
    UPLOAD: '/papers/upload',
    METADATA_FROM_AI: '/papers/metadatafromai',
    METADATA_FROM_URL: '/papers/metadatafromurl',
    USER_PAPERS: '/papers/user',
    BY_ID: (id: string) => `/papers/${id}`,
    UPDATE: (id: string) => `/papers/${id}`,
    DELETE: (id: string) => `/papers/${id}`,
    DOWNLOAD: (id: string) => `/papers/${id}/download`,
    RELATED: (id: string) => `/papers/${id}/related`,
    FAVORITE: (id: string) => `/papers/${id}/favorite`,
    MY_FAVORITES: '/papers/favorites/me',
  },
  
  // Search
  SEARCH: {
    BASE: '/search',
    ADVANCED: '/search/advanced',
    SUGGESTIONS: '/search/suggestions',
    KEYWORDS: '/search/keywords',
    AUTHORS: '/search/authors',
    JOURNALS: '/search/journals',
    STATS: '/search/stats',
  },
  
  // Analytics
  ANALYTICS: {
    UPLOADS: '/analytics/uploads',
    USER_STATS: '/analytics/user',
    USER_STATS_BY_ID: (id: string) => `/analytics/user/${id}`,
    HEALTH: '/analytics/health',
    INSIGHTS: '/analytics/insights',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const REQUEST_TIMEOUT = 300000; // 5 minutes for large file processing