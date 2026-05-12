import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserId } from './userStore';

export interface WeekProgress {
  weekNumber: number;
  artistId: string;
  quizCompleted: number;
  totalQuiz: number;
  score: number;
}

export interface UserProgress {
  totalScore: number;
  completedArtists: string[];
  weekProgress: Record<number, WeekProgress>;
}

interface ProgressState {
  progress: Record<UserId, UserProgress>;
  addScore: (userId: UserId, artistId: string, weekNumber: number, points: number) => void;
  markQuizCompleted: (userId: UserId, artistId: string, weekNumber: number, totalQuiz: number) => void;
  getUserProgress: (userId: UserId) => UserProgress;
  getWeeklyScore: (userId: UserId, weekNumber: number) => number;
}

const defaultProgress: UserProgress = {
  totalScore: 0,
  completedArtists: [],
  weekProgress: {},
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {
        alexander: { ...defaultProgress },
        daria: { ...defaultProgress },
      },

      addScore: (userId, artistId, weekNumber, points) => {
        set((state) => {
          const userProgress = state.progress[userId] || { ...defaultProgress };
          const weekProg = userProgress.weekProgress[weekNumber] || {
            weekNumber,
            artistId,
            quizCompleted: 0,
            totalQuiz: 0,
            score: 0,
          };

          weekProg.score += points;
          userProgress.totalScore += points;

          if (!userProgress.completedArtists.includes(artistId)) {
            userProgress.completedArtists.push(artistId);
          }

          return {
            progress: {
              ...state.progress,
              [userId]: {
                ...userProgress,
                weekProgress: {
                  ...userProgress.weekProgress,
                  [weekNumber]: weekProg,
                },
              },
            },
          };
        });
      },

      markQuizCompleted: (userId, artistId, weekNumber, totalQuiz) => {
        set((state) => {
          const userProgress = state.progress[userId] || { ...defaultProgress };
          const weekProg = userProgress.weekProgress[weekNumber] || {
            weekNumber,
            artistId,
            quizCompleted: 0,
            totalQuiz,
            score: 0,
          };
          weekProg.quizCompleted += 1;
          weekProg.totalQuiz = totalQuiz;

          return {
            progress: {
              ...state.progress,
              [userId]: {
                ...userProgress,
                weekProgress: {
                  ...userProgress.weekProgress,
                  [weekNumber]: weekProg,
                },
              },
            },
          };
        });
      },

      getUserProgress: (userId) => {
        return get().progress[userId] || { ...defaultProgress };
      },

      getWeeklyScore: (userId, weekNumber) => {
        const userProgress = get().progress[userId] || { ...defaultProgress };
        return userProgress.weekProgress[weekNumber]?.score || 0;
      },
    }),
    { name: 'artist-quiz-progress' }
  )
);
