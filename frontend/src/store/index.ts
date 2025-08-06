import { configureStore } from '@reduxjs/toolkit';
import { baseApi, baseApiWithFile } from '@/services/api/baseApi';
import authReducer from '@/services/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [baseApiWithFile.reducerPath]: baseApiWithFile.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'api/executeQuery/fulfilled',
          'fileApi/executeQuery/fulfilled',
        ],
      },
    })
      .concat(baseApi.middleware)
      .concat(baseApiWithFile.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;