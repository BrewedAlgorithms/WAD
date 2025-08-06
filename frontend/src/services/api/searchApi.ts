import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants/api';
import type {
  SearchRequest,
  SearchResponse,
  SearchSuggestionsResponse,
  PopularKeywordsResponse,
  SearchStatsResponse,
  AvailableAuthorsResponse,
  AvailableJournalsResponse,
} from '@/utils/types';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchPapers: builder.query<
      SearchResponse,
      {
        q?: string;
        filters?: string;
        page?: number;
        limit?: number;
        sort?: string;
        order?: string;
        journalName?: string;
        uploadedBy?: string;
      }
    >({
      query: (params) => ({
        url: API_ENDPOINTS.SEARCH.BASE,
        params,
      }),
      providesTags: ['Search'],
    }),
    
    advancedSearch: builder.mutation<SearchResponse, SearchRequest>({
      query: (searchData) => ({
        url: API_ENDPOINTS.SEARCH.ADVANCED,
        method: 'POST',
        body: searchData,
      }),
      invalidatesTags: ['Search'],
    }),
    
    getSearchSuggestions: builder.query<SearchSuggestionsResponse, string>({
      query: (q) => ({
        url: API_ENDPOINTS.SEARCH.SUGGESTIONS,
        params: { q },
      }),
    }),
    
    getPopularKeywords: builder.query<PopularKeywordsResponse, number | undefined>({
      query: (limit) => ({
        url: API_ENDPOINTS.SEARCH.KEYWORDS,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Search'],
    }),
    
    getSearchStats: builder.query<SearchStatsResponse, void>({
      query: () => API_ENDPOINTS.SEARCH.STATS,
      providesTags: ['Search'],
    }),
    
    getAvailableAuthors: builder.query<AvailableAuthorsResponse, number | undefined>({
      query: (limit) => ({
        url: API_ENDPOINTS.SEARCH.AUTHORS,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Search'],
    }),
    
    getAvailableJournals: builder.query<AvailableJournalsResponse, number | undefined>({
      query: (limit) => ({
        url: API_ENDPOINTS.SEARCH.JOURNALS,
        params: limit ? { limit } : undefined,
      }),
      providesTags: ['Search'],
    }),
  }),
});

export const {
  useSearchPapersQuery,
  useLazySearchPapersQuery,
  useAdvancedSearchMutation,
  useGetSearchSuggestionsQuery,
  useLazyGetSearchSuggestionsQuery,
  useGetPopularKeywordsQuery,
  useGetAvailableAuthorsQuery,
  useGetAvailableJournalsQuery,
  useGetSearchStatsQuery,
} = searchApi;