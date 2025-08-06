import { baseApi } from './baseApi';
import { API_ENDPOINTS } from '@/utils/constants/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  User,
  ApiResponse,
} from '@/utils/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: API_ENDPOINTS.AUTH.LOGIN,
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: API_ENDPOINTS.AUTH.REGISTER,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    getProfile: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => API_ENDPOINTS.AUTH.PROFILE,
      providesTags: ['User'],
    }),
    
    updateProfile: builder.mutation<ApiResponse<{ user: User }>, UpdateProfileRequest>({
      query: (updates) => ({
        url: API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
    
    changePassword: builder.mutation<ApiResponse<{ message: string }>, ChangePasswordRequest>({
      query: (passwords) => ({
        url: API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        method: 'PUT',
        body: passwords,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;