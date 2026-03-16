import { create } from 'zustand';

interface UserState {
  isAuthenticated: boolean;
  pulsePoints: number;
  setAuthenticated: (auth: boolean) => void;
  setPulsePoints: (points: number) => void;
  addPulsePoints: (points: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isAuthenticated: false,
  pulsePoints: 0,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setPulsePoints: (points) => set({ pulsePoints: points }),
  addPulsePoints: (points) => set((state) => ({ pulsePoints: state.pulsePoints + points })),
}));
