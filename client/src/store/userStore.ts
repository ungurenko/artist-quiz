import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserId = 'alexander' | 'daria';

export interface User {
  id: UserId;
  name: string;
  avatar: string;
  color: string;
}

export const USERS: Record<UserId, User> = {
  alexander: {
    id: 'alexander',
    name: 'Александр',
    avatar: '👨‍🎨',
    color: '#D97706',
  },
  daria: {
    id: 'daria',
    name: 'Дарья',
    avatar: '👩‍🎨',
    color: '#C2410C',
  },
};

interface UserState {
  currentUser: UserId;
  setCurrentUser: (user: UserId) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: 'alexander',
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    { name: 'artist-quiz-user' }
  )
);
