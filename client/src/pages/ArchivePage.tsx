import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { artists } from '../data/artists';
import { useProgressStore } from '../store/progressStore';
import SafeImage from '../components/SafeImage';

const COUNTRY_FILTERS = ['all', 'Россия', 'Италия'] as const;

export default function ArchivePage() {
  const [filter, setFilter] = useState<'all' | 'Россия' | 'Италия'>('all');
  const { getUserProgress } = useProgressStore();
  const alexProgress = getUserProgress('alexander');
  const dariaProgress = getUserProgress('daria');

  const filteredArtists = useMemo(
    () => artists.filter((artist) => filter === 'all' || artist.country === filter),
    [filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark">Архив художников</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark/50" />
          {COUNTRY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-ochre text-white'
                  : 'bg-white text-dark/70 border border-border hover:border-ochre/40'
              }`}
            >
              {f === 'all' ? 'Все' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArtists.map((artist, i) => {
          const completedAlex = alexProgress.completedArtists.includes(artist.id);
          const completedDaria = dariaProgress.completedArtists.includes(artist.id);

          return (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/artist/${artist.id}`}
                className="group block bg-white rounded-2xl border border-border overflow-hidden hover:border-ochre/40 transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <SafeImage
                    src={artist.paintings[0]?.url || artist.portrait}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold">{artist.name}</p>
                    <p className="text-white/70 text-sm">{artist.years}</p>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1">
                    {completedAlex && (
                      <span className="w-6 h-6 bg-ochre rounded-full flex items-center justify-center text-xs" title="Александр">
                        👨‍🎨
                      </span>
                    )}
                    {completedDaria && (
                      <span className="w-6 h-6 bg-terracotta rounded-full flex items-center justify-center text-xs" title="Дарья">
                        👩‍🎨
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-dark/60">
                    <span className="px-2 py-0.5 rounded-md bg-light text-xs font-medium">{artist.country}</span>
                    <span>{artist.paintings.length} картин</span>
                    <span>·</span>
                    <span>{artist.facts.length} фактов</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
