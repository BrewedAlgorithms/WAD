import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/utils/constants/api';
import type { RootState } from '@/store';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Paper', 'Search', 'Analytics'],
  endpoints: () => ({}),
});

export const baseApiWithFile = createApi({
  reducerPath: 'fileApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      // Don't set content-type for file uploads - let the browser set it
      return headers;
    },
  }),
  tagTypes: ['Paper'],
  endpoints: () => ({}),
});