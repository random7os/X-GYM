import { createContext, useContext, useState } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('x_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('x_token'));

  const login = async (data, roleName = 'sales_agent') => {
    try {
      const response = await api.post('/auth/login', {
        username: data.username,
        password: data.password,
      });
      const { user: apiUser, token: apiToken } = response.data;
      localStorage.setItem('x_token', apiToken);
      localStorage.setItem('x_user', JSON.stringify(apiUser));
      setUser(apiUser);
      setToken(apiToken);
      return { user: apiUser, token: apiToken };
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
    }
    localStorage.removeItem('x_token');
    localStorage.removeItem('x_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
