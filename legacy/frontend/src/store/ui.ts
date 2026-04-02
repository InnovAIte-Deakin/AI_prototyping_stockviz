import { create } from 'zustand'

type UIState = {
  theme: 'light'|'dark'|'system'
  setTheme: (t: UIState['theme']) => void
}

export const useUI = create<UIState>((set) => ({
  theme: 'system',
  setTheme: (t) => set({ theme: t })
}))
