import { createContext } from 'react';

export const AuthContext = createContext();
export const AuthModalContext = createContext();
export const ConfirmationContext = createContext();
export const ListingCacheContext = createContext();
export const ThemeContext = createContext({ theme: 'light', setTheme: () => {} });
export const ToastContext = createContext();
