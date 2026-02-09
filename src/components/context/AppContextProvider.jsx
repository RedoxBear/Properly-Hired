import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    // Return default empty context instead of throwing error
    return {
      context: {},
      getContextSummary: () => "",
      updateContext: () => {}
    };
  }
  return context;
}

// Helper to extract page name from path
const getPageNameFromPath = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return "Home";

  // Convert path to readable page name
  const pageName = segments[segments.length - 1]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return pageName;
};

export function AppContextProvider({ children }) {
  const [context, setContext] = useState(() => ({
    currentPage: getPageNameFromPath(window.location.pathname),
    currentPath: window.location.pathname
  }));

  // Track page changes
  useEffect(() => {
    const updatePage = () => {
      setContext(prev => ({
        ...prev,
        currentPage: getPageNameFromPath(window.location.pathname),
        currentPath: window.location.pathname
      }));
    };

    // Listen for route changes (works with React Router and manual navigation)
    window.addEventListener('popstate', updatePage);

    // Periodically check for SPA route changes (fallback)
    const interval = setInterval(() => {
      const newPath = window.location.pathname;
      if (context.currentPath !== newPath) {
        updatePage();
      }
    }, 1000);

    return () => {
      window.removeEventListener('popstate', updatePage);
      clearInterval(interval);
    };
  }, [context.currentPath]);

  const updateContext = (updates) => {
    setContext(prev => ({
      ...prev,
      ...updates
    }));
  };

  const getContextSummary = () => {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }

    const summary = {
      page: context.currentPage,
      task: context.currentTask,
      ...context
    };

    return JSON.stringify(summary, null, 2);
  };

  return (
    <AppContext.Provider value={{ context, setContext, updateContext, getContextSummary }}>
      {children}
    </AppContext.Provider>
  );
}