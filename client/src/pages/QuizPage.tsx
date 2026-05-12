import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { getArtistById, artists, getWeekNumber } from '../data/artists';
import type { QuizQuestion } from '../data/artists';
import { useUserStore } from '../store/userStore';
import { useProgressStore } from '../store/progressStore';
import { playCorrectSound, playWrongSound } from '../utils/sound';
import { triggerSmallConfetti } from '../utils/confetti';
import SafeImage from '../components/SafeImage';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuizForArtist(artistId: string): QuizQuestion[] {
  const artist = getArtistById(artistId);
  if (!artist) return [];

  const questions: QuizQuestion[] = [];

  // Type 1: Guess artist by painting
  artist.paintings.forEach((_painting, idx) => {
    const otherArtists = artists.filter((a) => a.id !== artistId).slice(0, 3);
    const options = shuffleArray([artist.name, ...otherArtists.map((a) => a.name)]);
    questions.push({
      type: 'guessArtistByPainting',
      paintingId: idx,
      options,
      correct: options.indexOf(artist.name),
    });
  });

  // Type 2: True / False from facts
  artist.facts.slice(0, 3).forEach((fact) => {
    questions.push({
      type: 'trueFalse',
      question: fact,
      correct: 1, // true
    });
  });

  // Type 3: Guess artist by style
  artist.styleFeatures.forEach((feature) => {
    const otherArtists = artists.filter((a) => a.id !== artistId).slice(0, 3);
    const options = shuffleArray([artist.name, ...otherArtists.map((a) => a.name)]);
    questions.push({
      type: 'guessArtistByStyle',
      question: `Какому художнику принадлежит черта стиля: «${feature}»?`,
      options,
      correct: options.indexOf(artist.name),
    });
  });

  return shuffleArray(questions).slice(0, 5);
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const artist = getArtistById(id || '');
  const { currentUser } = useUserStore();
  const { addScore, markQuizCompleted } = useProgressStore();
  const weekNumber = getWeekNumber();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (artist) {
      setQuestions(generateQuizForArtist(artist.id));
    }
  }, [artist]);

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null || !questions[currentIndex]) return;

      const q = questions[currentIndex];
      const correct = answerIndex === q.correct;
      setSelectedAnswer(answerIndex);
      setIsCorrect(correct);
      setShowResult(true);

      if (correct) {
        setScore((s) => {
          const newScore = s + 10;
          scoreRef.current = newScore;
          return newScore;
        });
        playCorrectSound();
        triggerSmallConfetti();
      } else {
        playWrongSound();
      }
    },
    [currentIndex, questions, selectedAnswer]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      setFinished(true);
      if (artist) {
        addScore(currentUser, artist.id, weekNumber, scoreRef.current);
        markQuizCompleted(currentUser, artist.id, weekNumber, questions.length);
      }
    }
  }, [currentIndex, questions.length, artist, currentUser, weekNumber, score, isCorrect, addScore, markQuizCompleted]);

  const handleRestart = useCallback(() => {
    if (artist) {
      setQuestions(generateQuizForArtist(artist.id));
    }
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    scoreRef.current = 0;
    setFinished(false);
  }, [artist]);

  if (!artist) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-dark/60">Художник не найден</p>
        <Link to="/" className="text-ochre font-medium mt-4 inline-block">На главную</Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center py-20 text-dark/60">Загрузка вопросов...</div>;
  }

  if (finished) {
    const totalPossible = questions.length * 10;
    const percentage = Math.round((score / totalPossible) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="bg-white rounded-3xl border border-border p-8 shadow-lg">
          <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-dark mb-2">Тест завершён!</h2>
          <p className="text-dark/60 mb-6">
            Вы ответили правильно на вопросы и заработали очки
          </p>

          <div className="text-5xl font-bold text-ochre mb-2">{score}</div>
          <p className="text-sm text-dark/50 mb-6">из {totalPossible} возможных</p>

          <div className="h-3 bg-light rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${percentage >= 70 ? 'bg-emerald' : percentage >= 40 ? 'bg-gold' : 'bg-terracotta'}`}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Ещё раз
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-light text-dark rounded-xl font-medium hover:bg-border transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/artist/${artist.id}`} className="p-2 rounded-xl hover:bg-light transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark" />
        </Link>
        <div className="flex-1">
          <div className="flex justify-between text-sm text-dark/60 mb-1">
            <span>Вопрос {currentIndex + 1} из {questions.length}</span>
            <span>{score} очков</span>
          </div>
          <div className="h-2 bg-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-ochre rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border border-border p-6 sm:p-8"
        >
          {/* Question content */}
          {q.type === 'guessArtistByPainting' && q.paintingId !== undefined && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-dark">Какой художник написал эту картину?</p>
              <div className="rounded-xl overflow-hidden border border-border">
                <SafeImage
                  src={artist.paintings[q.paintingId].url}
                  alt="Картина"
                  className="w-full aspect-video object-cover"
                />
              </div>
            </div>
          )}

          {q.type === 'trueFalse' && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-dark">Верно ли следующее утверждение?</p>
              <div className="p-4 bg-ochre-light/50 rounded-xl text-dark/80 italic">
                «{q.question}»
              </div>
            </div>
          )}

          {q.type === 'guessArtistByStyle' && (
            <div className="space-y-4">
              <p className="text-lg font-medium text-dark">{q.question}</p>
            </div>
          )}

          {/* Options */}
          <div className="mt-6 space-y-3">
            {q.type === 'trueFalse' ? (
              <>
                <button
                  onClick={() => handleAnswer(1)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    selectedAnswer === null
                      ? 'border-border hover:border-ochre hover:bg-ochre-light'
                      : selectedAnswer === 1
                      ? q.correct === 1
                        ? 'border-emerald bg-emerald-light'
                        : 'border-crimson bg-terracotta-light'
                      : q.correct === 1
                      ? 'border-emerald bg-emerald-light'
                      : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedAnswer !== null && q.correct === 1 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
                    ) : selectedAnswer === 1 && q.correct !== 1 ? (
                      <XCircle className="w-5 h-5 text-crimson shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current shrink-0" />
                    )}
                    Верно
                  </div>
                </button>
                <button
                  onClick={() => handleAnswer(0)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    selectedAnswer === null
                      ? 'border-border hover:border-ochre hover:bg-ochre-light'
                      : selectedAnswer === 0
                      ? q.correct === 0
                        ? 'border-emerald bg-emerald-light'
                        : 'border-crimson bg-terracotta-light'
                      : q.correct === 0
                      ? 'border-emerald bg-emerald-light'
                      : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedAnswer !== null && q.correct === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
                    ) : selectedAnswer === 0 && q.correct !== 0 ? (
                      <XCircle className="w-5 h-5 text-crimson shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current shrink-0" />
                    )}
                    Неверно
                  </div>
                </button>
              </>
            ) : (
              q.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                    selectedAnswer === null
                      ? 'border-border hover:border-ochre hover:bg-ochre-light'
                      : selectedAnswer === i
                      ? i === q.correct
                        ? 'border-emerald bg-emerald-light'
                        : 'border-crimson bg-terracotta-light'
                      : i === q.correct
                      ? 'border-emerald bg-emerald-light'
                      : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedAnswer !== null && i === q.correct ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
                    ) : selectedAnswer === i && i !== q.correct ? (
                      <XCircle className="w-5 h-5 text-crimson shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current shrink-0 flex items-center justify-center text-xs">
                        {String.fromCharCode(65 + i)}
                      </div>
                    )}
                    {option}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Result & Next */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl ${
                  isCorrect ? 'bg-emerald-light text-emerald' : 'bg-terracotta-light text-terracotta'
                }`}
              >
                <p className="font-bold">
                  {isCorrect ? 'Правильно! +10 очков' : 'Не совсем так'}
                </p>
                {!isCorrect && q.type === 'guessArtistByPainting' && q.paintingId !== undefined && (
                  <p className="text-sm mt-1 opacity-80">
                    Это «{artist.paintings[q.paintingId].title}» — {artist.name}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex justify-end"
            >
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
              >
                {currentIndex < questions.length - 1 ? 'Дальше' : 'Результаты'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
