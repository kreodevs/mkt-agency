import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'mkt-advanced-nav';

interface CopilotUiState {
  advancedNav: boolean;
  setAdvancedNav: (value: boolean) => void;
  toggleAdvancedNav: () => void;
}

export const useCopilotUiStore = create<CopilotUiState>()(
  persist(
    (set, get) => ({
      advancedNav: false,
      setAdvancedNav: (value) => set({ advancedNav: value }),
      toggleAdvancedNav: () => set({ advancedNav: !get().advancedNav }),
    }),
    { name: STORAGE_KEY },
  ),
);

export function useAdvancedNav(): boolean {
  return useCopilotUiStore((s) => s.advancedNav);
}
