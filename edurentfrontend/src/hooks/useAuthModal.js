import { useContext } from 'react';
import { AuthModalContext } from '../context/ContextDefinitions';

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
