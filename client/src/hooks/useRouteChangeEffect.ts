import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook that scrolls to top when route changes, respecting user motion preferences
 */
export function useRouteChangeEffect() {
  const [location] = useLocation();

  useEffect(() => {
    // Get user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Scroll to top with appropriate behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    // Also reset focus to body for screen readers
    if (document.body) {
      document.body.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    // Announce route change to screen readers
    const routeName = location === '/' ? 'Home' : 
                     location.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Create or update aria-live region for route announcements
    let announcer = document.getElementById('route-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'route-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only-enhanced';
      document.body.appendChild(announcer);
    }
    
    // Announce the page change with a slight delay to ensure it's picked up
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = `Navigated to ${routeName} page`;
      }
    }, 100);

  }, [location]);
}