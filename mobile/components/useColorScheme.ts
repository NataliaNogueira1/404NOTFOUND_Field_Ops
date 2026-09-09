import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = (): 'light' | 'dark' =>
  useColorSchemeCore() === 'dark' ? 'dark' : 'light';
