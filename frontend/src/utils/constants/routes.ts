export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  
  // Papers
  PAPERS: {
    ALL: '/papers',
    DETAIL: (id: string) => `/papers/${id}`,
    UPLOAD: '/papers/upload',
    EDIT: (id: string) => `/papers/${id}/edit`,
    MY_PAPERS: '/papers/my',
    FAVORITES: '/papers/favorites',
  },
  
  // Search (removed advanced page)
  
  // Chatbot
  CHATBOT: '/chatbot',
  

  
  // Error pages
  NOT_FOUND: '/404',
  ERROR: '/error',
} as const;

export const BREADCRUMB_LABELS = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.PAPERS.ALL]: 'Papers',
  [ROUTES.PAPERS.UPLOAD]: 'Upload Paper',
  [ROUTES.PAPERS.MY_PAPERS]: 'My Papers',
  [ROUTES.PAPERS.FAVORITES]: 'Favorites',
  [ROUTES.CHATBOT]: 'AI Assistant',
} as const;