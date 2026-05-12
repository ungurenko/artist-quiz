import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    // Extract artist/painting name
    const words = alt.split(' ').slice(0, 3);
    const displayText = words.join(' ');
    const initials = alt.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
      <div
        className={`bg-gradient-to-br from-ochre/20 to-terracotta/20 flex flex-col items-center justify-center text-center p-4 ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-ochre/30 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-ochre">{initials}</span>
        </div>
        <p className="text-sm font-medium text-dark/70 leading-tight">{displayText}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
