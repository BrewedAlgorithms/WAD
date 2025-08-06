import { baseApi, baseApiWithFile } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants/api';
import type {
  PaperListResponse,
  PaperResponse,
  UpdatePaperRequest,
  PaginationParams,
  ApiResponse,
} from '@/utils/types';

export const papersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPapers: builder.query<
      PaperListResponse,
      PaginationParams & {
        sort?: string;
        order?: string;
        uploadedBy?: string;
      }
    >({
      query: (params) => ({
        url: API_ENDPOINTS.PAPERS.BASE,
        params,
      }),
      providesTags: ['Paper'],
    }),
    
    getPaperById: builder.query<PaperResponse, string>({
      query: (id) => API_ENDPOINTS.PAPERS.BY_ID(id),
      providesTags: (_result, _error, id) => [{ type: 'Paper', id }],
    }),
    
    getUserPapers: builder.query<PaperListResponse, string | undefined>({
      query: (userId) => ({
        url: userId ? API_ENDPOINTS.PAPERS.USER_PAPERS + `/${userId}` : API_ENDPOINTS.PAPERS.USER_PAPERS,
      }),
      providesTags: ['Paper'],
    }),
    
    updatePaper: builder.mutation<PaperResponse, { id: string; data: UpdatePaperRequest }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.PAPERS.UPDATE(id),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Paper', id }, 'Paper'],
    }),
    
    deletePaper: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({
        url: API_ENDPOINTS.PAPERS.DELETE(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Paper', id }, 'Paper'],
    }),
    
    downloadPaper: builder.query<Blob, string>({
      query: (id) => ({
        url: API_ENDPOINTS.PAPERS.DOWNLOAD(id),
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const paperUploadApi = baseApiWithFile.injectEndpoints({
  endpoints: (builder) => ({
    uploadPaper: builder.mutation<PaperResponse, { file?: File; url?: string; metadata?: Record<string, any> }>({
      query: ({ file, url, metadata }) => {
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
          }
          
          return {
            url: API_ENDPOINTS.PAPERS.UPLOAD,
            method: 'POST',
            body: formData,
          };
        } else if (url) {
          const formData = new FormData();
          formData.append('url', url);
          if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
          }
          
          return {
            url: API_ENDPOINTS.PAPERS.UPLOAD,
            method: 'POST',
            body: formData,
          };
        }
        
        throw new Error('Either file or url must be provided');
      },
      invalidatesTags: ['Paper'],
    }),
    
    extractMetadataFromAI: builder.mutation<any, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: API_ENDPOINTS.PAPERS.METADATA_FROM_AI,
          method: 'POST',
          body: formData,
        };
      },
    }),
    
    extractMetadataFromUrl: builder.mutation<any, string>({
      query: (url) => ({
        url: API_ENDPOINTS.PAPERS.METADATA_FROM_URL,
        method: 'POST',
        body: { url },
      }),
    }),
  }),
});

export const {
  useGetAllPapersQuery,
  useGetPaperByIdQuery,
  useGetUserPapersQuery,
  useUpdatePaperMutation,
  useDeletePaperMutation,
  useLazyDownloadPaperQuery,
} = papersApi;

export const {
  useUploadPaperMutation,
  useExtractMetadataFromAIMutation,
  useExtractMetadataFromUrlMutation,
} = paperUploadApi;