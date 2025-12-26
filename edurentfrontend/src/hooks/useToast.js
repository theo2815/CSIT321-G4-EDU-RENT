import { useContext } from 'react';
import { ToastContext } from '../context/ContextDefinitions';

export const useToast = () => useContext(ToastContext);
