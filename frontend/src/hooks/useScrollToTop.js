import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Better scroll to top that works on all devices
    const scrollToTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        // Fallback for older browsers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch (e) {
        // Ultimate fallback
        window.scrollTo(0, 0);
      }
    };
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToTop, 0);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
}