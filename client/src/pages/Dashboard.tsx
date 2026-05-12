import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Swords, ChevronRight, Sparkles } from 'lucide-react';
import { artists, getCurrentArtist, getWeekNumber } from '../data/artists';
import { useUserStore, USERS } from '../store/userStore';
import { useProgressStore } from '../store/progressStore';
import SafeImage from '../components/SafeImage';

export default function Dashboard() {
  const currentArtist = getCurrentArtist();
  const weekNumber = getWeekNumber();
  const { currentUser } = useUserStore();
  const { getUserProgress } = useProgressStore();

  const alexProgress = getUserProgress('alexander');
  const dariaProgress = getUserProgress('daria');
  const currentWeekProgressAlex = alexProgress.weekProgress[weekNumber];
  const currentWeekProgressDaria = dariaProgress.weekProgress[weekNumber];

  const completedCountAlex = currentWeekProgressAlex?.quizCompleted || 0;
  const completedCountDaria = currentWeekProgressDaria?.quizCompleted || 0;
  const totalQuiz = currentArtist.quiz.length;

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ochre-light to-cream border border-ochre/20 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-ochre/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-2 text-ochre font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Художник недели #{weekNumber}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <SafeImage
              src={currentArtist.portrait}
              alt={currentArtist.name}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover shadow-lg border-4 border-white"
            />
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-2">
                {currentArtist.name}
              </h1>
              <p className="text-terracotta font-medium mb-3">
                {currentArtist.years} · {currentArtist.country}
              </p>
              <p className="text-dark/70 mb-6 max-w-lg">
                {currentArtist.facts[0]}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/artist/${currentArtist.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Учить
                </Link>
                <Link
                  to={`/quiz/${currentArtist.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ochre border-2 border-ochre rounded-xl font-medium hover:bg-ochre-light transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Тестировать
                </Link>
                <Link
                  to="/duel"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors"
                >
                  <Swords className="w-4 h-4" />
                  Соревноваться
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['alexander', 'daria'] as const).map((userId) => {
          const user = USERS[userId];
          const progress = userId === 'alexander' ? alexProgress : dariaProgress;
          const completed = userId === 'alexander' ? completedCountAlex : completedCountDaria;
          const isActive = currentUser === userId;

          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-5 transition-shadow ${
                isActive ? 'border-ochre/40 shadow-md bg-white' : 'border-border bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.avatar}</span>
                  <div>
                    <p className="font-bold text-dark">{user.name}</p>
                    <p className="text-xs text-dark/50">
                      {isActive ? 'Сейчас играете' : 'Прогресс'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: user.color }}>
                    {progress.totalScore}
                  </p>
                  <p className="text-xs text-dark/50">очков</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark/70">Заданий на этой неделе</span>
                  <span className="font-medium">{completed} / {totalQuiz}</span>
                </div>
                <div className="h-3 bg-light rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalQuiz > 0 ? (completed / totalQuiz) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-dark/60">
                  Изучено художников: <span className="font-medium text-dark">{progress.completedArtists.length}</span> / {artists.length}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Archive Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark">Пройденные недели</h2>
          <Link to="/archive" className="text-sm text-ochre font-medium flex items-center gap-1 hover:underline">
            Весь архив <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {artists.slice(0, 5).map((artist) => {
            const isCompleted = alexProgress.completedArtists.includes(artist.id) || dariaProgress.completedArtists.includes(artist.id);
            return (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-white border border-border hover:border-ochre/40 transition-colors"
              >
                <SafeImage
                  src={artist.portrait}
                  alt={artist.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm leading-tight">{artist.name}</p>
                  <p className="text-white/70 text-xs">{artist.country}</p>
                </div>
                {isCompleted && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
