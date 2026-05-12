import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Swords, Trophy, Users } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ArtistPage from './pages/ArtistPage';
import QuizPage from './pages/QuizPage';
import DuelPage from './pages/DuelPage';
import ArchivePage from './pages/ArchivePage';
import { useUserStore, USERS } from './store/userStore';

function Header() {
  const location = useLocation();
  const { currentUser, setCurrentUser } = useUserStore();
  const user = USERS[currentUser];

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/archive', icon: Trophy, label: 'Архив' },
    { path: '/duel', icon: Swords, label: 'Дуэль' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-ochre font-bold text-xl">
          <BookOpen className="w-6 h-6" />
          <span className="hidden sm:inline">Художники</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-ochre text-white'
                    : 'text-dark hover:bg-ochre-light hover:text-ochre'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCurrentUser(currentUser === 'alexander' ? 'daria' : 'alexander')}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-light"
          style={{ color: user.color }}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{user.name}</span>
          <span className="text-lg">{user.avatar}</span>
        </button>
      </div>
    </header>
  );
}

function AnimatedLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh flex flex-col bg-cream">
        <Header />
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          <AnimatedLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route path="/duel" element={<DuelPage />} />
              <Route path="/archive" element={<ArchivePage />} />
            </Routes>
          </AnimatedLayout>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
