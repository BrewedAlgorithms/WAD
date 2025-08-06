import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants/api';
import type {
  AnalyticsResponse,
  UploadStats,
  UserStats,
  SystemHealth,
  ResearchInsights,
} from '@/utils/types';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUploadStats: builder.query<AnalyticsResponse<UploadStats>, void>({
      query: () => API_ENDPOINTS.ANALYTICS.UPLOADS,
      providesTags: ['Analytics'],
    }),
    
    getUserStats: builder.query<AnalyticsResponse<UserStats>, string | undefined>({
      query: (userId) => ({
        url: userId 
          ? API_ENDPOINTS.ANALYTICS.USER_STATS_BY_ID(userId)
          : API_ENDPOINTS.ANALYTICS.USER_STATS,
      }),
      providesTags: ['Analytics'],
    }),
    
    getSystemHealth: builder.query<AnalyticsResponse<SystemHealth>, void>({
      query: () => API_ENDPOINTS.ANALYTICS.HEALTH,
      providesTags: ['Analytics'],
    }),
    
    getResearchInsights: builder.query<
      AnalyticsResponse<ResearchInsights>,
      '1month' | '3months' | '6months' | '1year' | undefined
    >({
      query: (timeframe) => ({
        url: API_ENDPOINTS.ANALYTICS.INSIGHTS,
        params: timeframe ? { timeframe } : undefined,
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetUploadStatsQuery,
  useGetUserStatsQuery,
  useGetSystemHealthQuery,
  useGetResearchInsightsQuery,
} = analyticsApi;