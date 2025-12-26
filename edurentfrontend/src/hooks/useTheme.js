import { useContext } from 'react';
import { ThemeContext } from '../context/ContextDefinitions';

export function useTheme() {
  return useContext(ThemeContext);
}
