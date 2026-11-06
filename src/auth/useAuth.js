import { useContext } from 'react';
import { AuthContext } from './authContext';

// { user, booting, isAdmin, login, logout, loadMe }
export function useAuth() {
  return useContext(AuthContext);
}
