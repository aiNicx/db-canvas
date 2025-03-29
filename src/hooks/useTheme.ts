import { useContext } from 'react';
import { ThemeProviderState, ThemeProviderContext } from '../contexts/ThemeContextObject';

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}