export interface User {
  _id: string;
  id: string; // Alias for _id for compatibility
  email: string;
  firstName: string;
  lastName: string;
  username: string; // Add username property
  institution?: string;
  researchInterests: string[];
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  uploadedPapers?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  institution?: string;
  researchInterests?: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  institution?: string;
  researchInterests?: string[];
}