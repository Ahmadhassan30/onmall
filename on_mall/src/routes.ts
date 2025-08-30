// routes.ts

// Routes used for authentication (should redirect if already logged in)
export const authRoutes = ['/auth/sign-in'];

// Routes accessible without login (e.g. landing page or sign-in)
export const publicRoutes = [
  '/', 
  '/auth/sign-in', 
  '/auth/sign-up', 
  '/auth/error', 
  '/auth/unauthorized',
  '/about', 
  '/contact', 
  '/privacy', 
  '/terms'
];

// Sign-in redirect fallback
export const SIGN_IN_PAGE_PATH = '/auth/sign-in';

// Where to redirect after login
export const DEFAULT_LOGIN_REDIRECT = '/';
