import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("houserent_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("houserent_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, loginAs) => {
    const res = await api.post("/auth/login", { email, password, loginAs });
    // Account has more than one role and hasn't told us which one to use yet.
    if (res.data.needsRoleSelection) {
      return { needsRoleSelection: true, roles: res.data.roles };
    }
    localStorage.setItem("houserent_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  // Registration no longer signs the user in: the email must be verified first
  // (see EmailOtpStep) and the person then signs in with their new credentials.
  const register = async ({ name, email, password, userType, verificationToken }) => {
    const res = await api.post("/auth/register", { name, email, password, userType, verificationToken });
    return res.data; // { message, email }
  };

  const logout = () => {
    localStorage.removeItem("houserent_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
