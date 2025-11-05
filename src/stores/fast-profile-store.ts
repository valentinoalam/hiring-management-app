// store/fast-profile-store.ts
import { create } from 'zustand';

// Only store the very basic, frequently accessed data
interface FastProfileState {
  fullname: string | null;
  avatarUrl: string | null;
  setBasicProfile: (data: { fullname: string; avatarUrl: string }) => void;
}

export const useFastProfileStore = create<FastProfileState>((set) => ({
  fullname: null,
  avatarUrl: null,
  setBasicProfile: (data) => set(data),
}));