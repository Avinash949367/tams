import { create } from "zustand";

type SessionState = {
  teamId?: string;
  teamName?: string;
  venueId?: string;
  isAdmin?: boolean;
  setSession: (p: Partial<SessionState>) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  setSession: (p) => set((s) => ({ ...s, ...p })),
  clear: () => set({ teamId: undefined, teamName: undefined, venueId: undefined, isAdmin: undefined }),
}));


