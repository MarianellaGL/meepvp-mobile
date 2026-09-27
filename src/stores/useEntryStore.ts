import { create } from 'zustand';

type EntryState = { entered: boolean; continueAsGuest: () => void };

// The welcome choice lasts for this app launch. Guests see it again next time.
export const useEntryStore = create<EntryState>((set) => ({
  entered: false,
  continueAsGuest: () => set({ entered: true }),
}));
