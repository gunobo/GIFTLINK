import { createContext, useContext, useState } from "react";
import { clearToken, getToken, setToken } from "@/api/client";

type AuthContextValue = {
  isAuthed: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(!!getToken());

  const login = (token: string) => {
    setToken(token);
    setIsAuthed(true);
  };
  const logout = () => {
    clearToken();
    setIsAuthed(false);
  };

  return <AuthContext.Provider value={{ isAuthed, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
