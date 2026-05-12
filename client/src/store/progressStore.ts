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

const createDefaultProgress = (): UserProgress => ({
  totalScore: 0,
  completedArtists: [],
  weekProgress: {},
});

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {
        alexander: createDefaultProgress(),
        daria: createDefaultProgress(),
      },

      addScore: (userId, artistId, weekNumber, points) => {
        set((state) => {
          const userProgress = state.progress[userId] || createDefaultProgress();
          const weekProg = userProgress.weekProgress[weekNumber] || {
            weekNumber,
            artistId,
            quizCompleted: 0,
            totalQuiz: 0,
            score: 0,
          };
          const completedArtists = userProgress.completedArtists.includes(artistId)
            ? userProgress.completedArtists
            : [...userProgress.completedArtists, artistId];

          return {
            progress: {
              ...state.progress,
              [userId]: {
                ...userProgress,
                totalScore: userProgress.totalScore + points,
                completedArtists,
                weekProgress: {
                  ...userProgress.weekProgress,
                  [weekNumber]: {
                    ...weekProg,
                    score: weekProg.score + points,
                  },
                },
              },
            },
          };
        });
      },

      markQuizCompleted: (userId, artistId, weekNumber, totalQuiz) => {
        set((state) => {
          const userProgress = state.progress[userId] || createDefaultProgress();
          const weekProg = userProgress.weekProgress[weekNumber] || {
            weekNumber,
            artistId,
            quizCompleted: 0,
            totalQuiz,
            score: 0,
          };

          return {
            progress: {
              ...state.progress,
              [userId]: {
                ...userProgress,
                weekProgress: {
                  ...userProgress.weekProgress,
                  [weekNumber]: {
                    ...weekProg,
                    quizCompleted: weekProg.quizCompleted + 1,
                    totalQuiz,
                  },
                },
              },
            },
          };
        });
      },

      getUserProgress: (userId) => {
        return get().progress[userId] || createDefaultProgress();
      },

      getWeeklyScore: (userId, weekNumber) => {
        const userProgress = get().progress[userId] || createDefaultProgress();
        return userProgress.weekProgress[weekNumber]?.score || 0;
      },
    }),
    { name: 'artist-quiz-progress' }
  )
);
