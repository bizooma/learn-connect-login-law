import { lazy } from 'react';

// Preload critical routes for better performance
export const preloadRoute = (routeName: string) => {
  const routeLoaders: Record<string, () => Promise<any>> = {
    'courses': () => import('@/pages/Courses'),
    'student-dashboard': () => import('@/pages/StudentDashboard'),
    'owner-dashboard': () => import('@/pages/OwnerDashboard'),
    'team-leader-dashboard': () => import('@/pages/TeamLeaderDashboard'),
    'client-dashboard': () => import('@/pages/ClientDashboard'),
    'knowledge-base': () => import('@/pages/KnowledgeBase'),
    'lms-tree': () => import('@/pages/LMSTree'),
  };

  const loader = routeLoaders[routeName];
  if (loader) {
    // Preload on user interaction (hover, focus)
    loader().catch(error => {
      console.warn(`Failed to preload route ${routeName}:`, error);
    });
  }
};

// Preload on hover for better UX
export const useRoutePreloading = () => {
  const handleRouteHover = (routeName: string) => {
    preloadRoute(routeName);
  };

  const handleRouteMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href');
    if (href) {
      const routeName = href.replace('/', '');
      preloadRoute(routeName);
    }
  };

  return { handleRouteHover, handleRouteMouseEnter };
};

// Critical resource preloading
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical CSS and fonts
    const preloadLink = (href: string, as: string, type?: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      document.head.appendChild(link);
    };

    // Preload critical chunks based on user role detection
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (!isMobile) {
      // Preload heavier components for desktop users
      import('@/components/lazy/LazyFlowchartComponents').catch(() => {});
      import('@/components/lazy/LazyChartComponents').catch(() => {});
    }
  }
};