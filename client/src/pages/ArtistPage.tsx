import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Palette, BookOpen } from 'lucide-react';
import { getArtistById } from '../data/artists';
import SafeImage from '../components/SafeImage';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const artist = getArtistById(id || '');
  const [factIndex, setFactIndex] = useState(0);
  const [selectedPainting, setSelectedPainting] = useState<number | null>(null);

  if (!artist) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-dark/60">Художник не найден</p>
        <Link to="/" className="text-ochre font-medium mt-4 inline-block">На главную</Link>
      </div>
    );
  }

  const nextFact = () => setFactIndex((prev) => (prev + 1) % artist.facts.length);
  const prevFact = () => setFactIndex((prev) => (prev - 1 + artist.facts.length) % artist.facts.length);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-xl hover:bg-light transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-dark">{artist.name}</h1>
          <p className="text-terracotta font-medium">{artist.years} · {artist.country}</p>
        </div>
      </div>

      {/* Portrait & Facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1"
        >
          <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg">
            <SafeImage src={artist.portrait} alt={artist.name} className="w-full aspect-[3/4] object-cover" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Facts Carousel */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 text-ochre font-medium mb-4">
              <BookOpen className="w-5 h-5" />
              <span>Факты из жизни</span>
              <span className="text-dark/40 text-sm ml-auto">{factIndex + 1} / {artist.facts.length}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={factIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-lg text-dark/80 leading-relaxed min-h-[80px]"
              >
                {artist.facts[factIndex]}
              </motion.p>
            </AnimatePresence>

            <div className="flex gap-2 mt-4">
              <button
                onClick={prevFact}
                className="p-2 rounded-xl hover:bg-light transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 flex gap-1.5 items-center">
                {artist.facts.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === factIndex ? 'flex-1 bg-ochre' : 'w-3 bg-light'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextFact}
                className="p-2 rounded-xl hover:bg-light transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Style Features */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 text-terracotta font-medium mb-4">
              <Palette className="w-5 h-5" />
              <span>Ключевые черты стиля</span>
            </div>
            <div className="space-y-3">
              {artist.styleFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-ochre-light/50"
                >
                  <div className="w-6 h-6 rounded-full bg-ochre text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-dark/80">{feature}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gallery */}
      <div>
        <h2 className="text-xl font-bold text-dark mb-4">Галерея</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artist.paintings.map((painting, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedPainting(i)}
              className="group text-left bg-white rounded-2xl border border-border overflow-hidden hover:border-ochre/40 transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <SafeImage
                  src={painting.url}
                  alt={painting.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <p className="font-bold text-dark">{painting.title}</p>
                <p className="text-sm text-dark/50">{painting.year}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPainting !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPainting(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-light flex items-center justify-center">
                <SafeImage
                  src={artist.paintings[selectedPainting].url}
                  alt={artist.paintings[selectedPainting].title}
                  className="w-full max-h-[62vh] object-contain"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-dark">{artist.paintings[selectedPainting].title}</h3>
                <p className="text-terracotta font-medium">{artist.paintings[selectedPainting].year}</p>
                <p className="text-dark/70 mt-2">{artist.paintings[selectedPainting].description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz CTA */}
      <div className="flex justify-center pb-8">
        <Link
          to={`/quiz/${artist.id}`}
          className="inline-flex items-center gap-2 px-8 py-4 bg-ochre text-white rounded-2xl font-bold text-lg hover:bg-ochre/90 transition-colors shadow-lg"
        >
          Пройти тест
        </Link>
      </div>
    </div>
  );
}
