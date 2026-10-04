import React, { createContext, useContext, useEffect, useState } from 'react';

interface NavigationContextType {
  path: string;
  query: Record<string, string>;
  navigate: (to: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  path: '/',
  query: {},
  navigate: () => {},
});

function parseLocation() {
  const path = window.location.pathname || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const query: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    query[key] = val;
  });
  return { path, query };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState(parseLocation());

  useEffect(() => {
    const handlePopState = () => {
      setCurrent(parseLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to === current.path + (window.location.search || '')) return;
    window.history.pushState({}, '', to);
    setCurrent(parseLocation());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <NavigationContext.Provider value={{ path: current.path, query: current.query, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
