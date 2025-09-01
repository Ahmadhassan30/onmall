import Loader from '@/components/loader';

// Root route segment loading fallback. Automatically shown during route transitions
// that trigger suspense (Next.js app router) and initial page streaming.
export default function RootLoading() {
  return <Loader fullscreen label="Loading content" />;
}
