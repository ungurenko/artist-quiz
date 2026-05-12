import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Swords, Copy, CheckCircle2, XCircle, Trophy, Users } from 'lucide-react';
import { useUserStore, USERS } from '../store/userStore';
import { playCorrectSound, playWrongSound, playWinSound } from '../utils/sound';
import { triggerConfetti } from '../utils/confetti';
import SafeImage from '../components/SafeImage';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface DuelQuestion {
  type: string;
  image?: string;
  question?: string;
  options?: string[];
  correct: number;
}

interface PlayerInfo {
  id: string;
  name: string;
}

export default function DuelPage() {
  const { currentUser } = useUserStore();
  const user = USERS[currentUser];

  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'lobby' | 'playing' | 'result'>('menu');
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { answer: number; correct: boolean }>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setError('');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'created') {
        setCode(msg.code);
        setMode('lobby');
      }

      if (msg.type === 'joined') {
        setCode(msg.code);
        setMode('lobby');
      }

      if (msg.type === 'error') {
        setError(msg.message);
      }

      if (msg.type === 'playerJoined' || msg.type === 'playerLeft') {
        setPlayers(msg.players);
      }

      if (msg.type === 'gameStart') {
        setQuestions(msg.questions);
        setCurrentQ(0);
        setScores({});
        setSelectedAnswer(null);
        setShowResult(false);
        setAnswers({});
        setMode('playing');
      }

      if (msg.type === 'questionResult') {
        setAnswers(msg.answers);
        setScores(msg.scores);
        setShowResult(true);
      }

      if (msg.type === 'nextQuestion') {
        setCurrentQ(msg.questionIndex);
        setSelectedAnswer(null);
        setShowResult(false);
        setAnswers({});
      }

      if (msg.type === 'gameOver') {
        setScores(msg.scores);
        setWinner(msg.winner);
        setPlayers(msg.players);
        setMode('result');
        if (msg.winner === currentUser) {
          playWinSound();
          triggerConfetti();
        }
      }
    };

    ws.onclose = () => {
      // Auto reconnect not implemented for simplicity
    };
  }, [currentUser]);

  const createGame = () => {
    connect();
    setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: 'create',
          playerId: currentUser,
          playerName: user.name,
        })
      );
    }, 300);
  };

  const joinGame = () => {
    if (!inputCode.match(/^\d{4}$/)) {
      setError('Введите 4-значный код');
      return;
    }
    connect();
    setTimeout(() => {
      wsRef.current?.send(
        JSON.stringify({
          type: 'join',
          code: inputCode,
          playerId: currentUser,
          playerName: user.name,
        })
      );
    }, 300);
  };

  const startGame = () => {
    wsRef.current?.send(JSON.stringify({ type: 'start' }));
  };

  const sendAnswer = (answer: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const q = questions[currentQ];
    if (answer === q.correct) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    wsRef.current?.send(
      JSON.stringify({
        type: 'answer',
        answer,
        time: Date.now(),
      })
    );
  };

  const nextQuestion = () => {
    wsRef.current?.send(JSON.stringify({ type: 'nextQuestion' }));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const q = questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 rounded-xl hover:bg-light transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark" />
        </Link>
        <h1 className="text-2xl font-bold text-dark">Дуэль</h1>
      </div>

      <AnimatePresence mode="wait">
        {/* Menu */}
        {mode === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <Swords className="w-16 h-16 text-ochre mx-auto mb-4" />
              <h2 className="text-xl font-bold text-dark mb-2">Соревнуйтесь в реальном времени</h2>
              <p className="text-dark/60 mb-6">Создайте комнату и позовите второго игрока. Отвечайте на вопросы одновременно — кто быстрее и точнее!</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setMode('create')}
                  className="px-6 py-3 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
                >
                  Создать дуэль
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="px-6 py-3 bg-white text-ochre border-2 border-ochre rounded-xl font-medium hover:bg-ochre-light transition-colors"
                >
                  Присоединиться
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create */}
        {mode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-border p-8 text-center"
          >
            <p className="text-dark/60 mb-4">Нажмите кнопку, чтобы создать комнату</p>
            <button
              onClick={createGame}
              className="px-6 py-3 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
            >
              Создать комнату
            </button>
          </motion.div>
        )}

        {/* Join */}
        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-border p-8"
          >
            <p className="text-dark/60 mb-4 text-center">Введите 4-значный код комнаты</p>
            <div className="flex gap-3 justify-center">
              <input
                type="text"
                maxLength={4}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                className="w-32 text-center text-2xl font-bold tracking-widest px-4 py-3 rounded-xl border-2 border-border focus:border-ochre focus:outline-none"
                placeholder="0000"
              />
              <button
                onClick={joinGame}
                className="px-6 py-3 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
              >
                Войти
              </button>
            </div>
            {error && <p className="text-crimson text-sm mt-3 text-center">{error}</p>}
          </motion.div>
        )}

        {/* Lobby */}
        {mode === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-border p-8"
          >
            <div className="text-center mb-6">
              <p className="text-dark/60 mb-2">Код комнаты</p>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 text-3xl font-bold text-ochre hover:opacity-80 transition-opacity"
              >
                {code}
                {copied ? <CheckCircle2 className="w-6 h-6 text-emerald" /> : <Copy className="w-6 h-6" />}
              </button>
              <p className="text-xs text-dark/40 mt-1">Нажмите, чтобы скопировать</p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-dark/70">Игроки в комнате:</p>
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-light">
                  <span className="text-xl">{p.id === 'alexander' ? '👨‍🎨' : '👩‍🎨'}</span>
                  <span className="font-medium">{p.name}</span>
                  {p.id === currentUser && <span className="text-xs text-ochre ml-auto">вы</span>}
                </div>
              ))}
              {players.length < 2 && (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border text-dark/40">
                  <Users className="w-5 h-5" />
                  <span>Ожидание второго игрока...</span>
                </div>
              )}
            </div>

            {players.length === 2 && (
              <button
                onClick={startGame}
                className="w-full py-3 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
              >
                Начать дуэль!
              </button>
            )}
          </motion.div>
        )}

        {/* Playing */}
        {mode === 'playing' && q && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-dark/60">Вопрос {currentQ + 1} из {questions.length}</span>
              <div className="flex gap-4 text-sm">
                {players.map((p) => (
                  <span key={p.id} className="font-medium">
                    {p.name}: {scores[p.id] || 0}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6">
              {q.image && (
                <div className="mb-4 rounded-xl overflow-hidden border border-border">
                  <SafeImage src={q.image} alt="Вопрос" className="w-full aspect-video object-cover" />
                </div>
              )}
              <p className="text-lg font-medium text-dark mb-4">{q.question || 'Какой художник?'}</p>

              <div className="space-y-3">
                {q.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => sendAnswer(i)}
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
                      {showResult && i === q.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald shrink-0" />
                      ) : showResult && selectedAnswer === i && i !== q.correct ? (
                        <XCircle className="w-5 h-5 text-crimson shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current shrink-0 flex items-center justify-center text-xs">
                          {String.fromCharCode(65 + i)}
                        </div>
                      )}
                      {opt}
                    </div>
                  </button>
                ))}
                {q.type === 'trueFalse' && (
                  <>
                    <button
                      onClick={() => sendAnswer(1)}
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
                        {showResult && q.correct === 1 ? <CheckCircle2 className="w-5 h-5 text-emerald" /> : showResult && selectedAnswer === 1 ? <XCircle className="w-5 h-5 text-crimson" /> : <div className="w-5 h-5 rounded-full border-2" />}
                        Верно
                      </div>
                    </button>
                    <button
                      onClick={() => sendAnswer(0)}
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
                        {showResult && q.correct === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald" /> : showResult && selectedAnswer === 0 ? <XCircle className="w-5 h-5 text-crimson" /> : <div className="w-5 h-5 rounded-full border-2" />}
                        Неверно
                      </div>
                    </button>
                  </>
                )}
              </div>

              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center"
                >
                  <p className="text-sm text-dark/60 mb-2">
                    {players.map((p) => {
                      const ans = answers[p.id];
                      return (
                        <span key={p.id} className="mx-2">
                          {p.name}: {ans?.correct ? '✅' : '❌'}
                        </span>
                      );
                    })}
                  </p>
                  <button
                    onClick={nextQuestion}
                    className="px-6 py-2.5 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
                  >
                    {currentQ < questions.length - 1 ? 'Следующий вопрос' : 'Результаты'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Result */}
        {mode === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-border p-8 text-center"
          >
            <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark mb-4">Дуэль окончена!</h2>

            <div className="space-y-3 mb-6">
              {players.map((p) => {
                const isWinner = p.id === winner;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      isWinner ? 'bg-gold/10 border-2 border-gold' : 'bg-light'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.id === 'alexander' ? '👨‍🎨' : '👩‍🎨'}</span>
                      <span className="font-bold">{p.name}</span>
                      {isWinner && <span className="text-gold text-sm font-bold">🏆 Победитель</span>}
                    </div>
                    <span className="text-xl font-bold">{scores[p.id] || 0}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  wsRef.current?.close();
                  setMode('menu');
                  setError('');
                }}
                className="px-6 py-2.5 bg-ochre text-white rounded-xl font-medium hover:bg-ochre/90 transition-colors"
              >
                Новая игра
              </button>
              <Link
                to="/"
                className="px-6 py-2.5 bg-light text-dark rounded-xl font-medium hover:bg-border transition-colors"
              >
                На главную
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
