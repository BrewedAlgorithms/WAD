import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ROUTES } from './utils/constants/routes';

// Layout components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Protected pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import PapersPage from './pages/papers/PapersPage';
import PaperDetailPage from './pages/papers/PaperDetailPage';
import UploadPage from './pages/papers/UploadPage';
import MyPapersPage from './pages/papers/MyPapersPage';
import FavoritesPage from './pages/papers/FavoritesPage';
import EditPaperPage from './pages/papers/EditPaperPage';

// Chatbot pages
import ChatbotPage from './pages/chatbot/ChatbotPage';

// Error pages
import NotFoundPage from './pages/error/NotFoundPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useAuth();

  // Show loading while checking authentication
  if (isLoading || (token && !isAuthenticated)) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading || (token && !isAuthenticated)) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
  
  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Papers Routes */}
      <Route
        path={ROUTES.PAPERS.ALL}
        element={
          <ProtectedRoute>
            <MainLayout>
              <PapersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/papers/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PaperDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PAPERS.EDIT(':id' as unknown as string)}
        element={
          <ProtectedRoute>
            <MainLayout>
              <EditPaperPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PAPERS.UPLOAD}
        element={
          <ProtectedRoute>
            <MainLayout>
              <UploadPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PAPERS.MY_PAPERS}
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyPapersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.PAPERS.FAVORITES}
        element={
          <ProtectedRoute>
            <MainLayout>
              <FavoritesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Advanced Search removed */}
      
      {/* Chatbot Routes */}
      <Route
        path={ROUTES.CHATBOT}
        element={
          <ProtectedRoute>
            <MainLayout>
              <ChatbotPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      


      {/* Default redirect */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      
      {/* 404 */}
      <Route path="/*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;