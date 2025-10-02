import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Instant scroll to top - fastest possible without any delay
    window.scrollTo(0, 0);
  }, [location.pathname]);
}