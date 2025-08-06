import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { RootState, AppDispatch } from '@/store';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  updateUser,
  clearError
} from '@/services/auth/authSlice';
import { 
  useLoginMutation, 
  useRegisterMutation,
  useGetProfileQuery 
} from '@/services/api/authApi';
import { ROUTES } from '@/utils/constants/routes';
import type { LoginRequest, RegisterRequest } from '@/utils/types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  
  // Auto-fetch profile if token exists but user is null
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useGetProfileQuery(undefined, {
    skip: !authState.token || !!authState.user,
  });

  // Update user if profile data is fetched
  if (profileData?.data?.user && !authState.user) {
    dispatch(updateUser(profileData.data.user));
  }

  // Handle profile error (invalid token)
  if (profileError && authState.token && !authState.user) {
    dispatch(logoutAction());
  }

  // Set loading state while checking authentication
  const isLoading = authState.isLoading || (authState.token && !authState.user && isProfileLoading);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch(loginStart());
      const result = await loginMutation(credentials).unwrap();
      
      if (result.success) {
        dispatch(loginSuccess({
          user: result.data.user,
          token: result.data.token,
        }));
        toast.success('Login successful!');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || 'Login failed';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  }, [dispatch, loginMutation, navigate]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      dispatch(loginStart());
      const result = await registerMutation(userData).unwrap();
      
      if (result.success) {
        dispatch(loginSuccess({
          user: result.data.user,
          token: result.data.token,
        }));
        toast.success('Registration successful!');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || 'Registration failed';
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  }, [dispatch, registerMutation, navigate]);

  const logout = useCallback(() => {
    dispatch(logoutAction());
    toast.info('Logged out successfully');
    navigate(ROUTES.LOGIN);
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError: clearAuthError,
    updateUser,
    isAuthenticated: !!authState.token && !!authState.user,
    isLoading,
  };
};