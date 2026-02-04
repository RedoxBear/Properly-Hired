import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    // Return default empty context instead of throwing error
    return {
      context: {},
      getContextSummary: () => ""
    };
  }
  return context;
}

export function AppContextProvider({ children }) {
  const [context, setContext] = useState({});

  const getContextSummary = () => {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }
    return JSON.stringify(context);
  };

  return (
    <AppContext.Provider value={{ context, setContext, getContextSummary }}>
      {children}
    </AppContext.Provider>
  );
}