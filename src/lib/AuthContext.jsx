import React, { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/api/authClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  async function loadCurrentUser() {
    const response = await authClient.me();
    return response.user;
  }

  async function checkAppState() {
    try {
      setIsLoadingAuth(true);
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      try {
        const currentUser = await loadCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        if (error.status === 401) {
          try {
            await authClient.refresh();
            const currentUser = await loadCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
          } catch (_refreshError) {
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({
              type: "auth_required",
              message: "Authentication required",
            });
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({
            type: "unknown",
            message: error.message || "Failed to load current user",
          });
        }
      }
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAppPublicSettings(null);
    }
  }

  async function logout() {
    await authClient.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({
      type: "auth_required",
      message: "Authentication required",
    });
    navigateToLogin("/");
  }

  function navigateToLogin(targetUrl = window.location.href) {
    const currentUrl = new URL(targetUrl, window.location.origin);

    if (currentUrl.pathname === "/login" || currentUrl.pathname === "/") {
      window.location.href = "/login";
      return;
    }

    const redirect = encodeURIComponent(targetUrl);
    window.location.href = `/login?redirect=${redirect}`;
  }

  const currentUser = user;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
