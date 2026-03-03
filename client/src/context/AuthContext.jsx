import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('anaqa_admin_token'));
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('anaqa_admin_email'));

  function login(token, email) {
    localStorage.setItem('anaqa_admin_token', token);
    localStorage.setItem('anaqa_admin_email', email);
    setToken(token);
    setAdminEmail(email);
  }

  function logout() {
    localStorage.removeItem('anaqa_admin_token');
    localStorage.removeItem('anaqa_admin_email');
    setToken(null);
    setAdminEmail(null);
  }

  return (
    <AuthContext.Provider value={{ token, adminEmail, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
