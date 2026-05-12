import confetti from 'canvas-confetti';

export function triggerConfetti() {
  const duration = 1000;
  const end = Date.now() + duration;

  const colors = ['#D97706', '#F59E0B', '#C2410C', '#10B981'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function triggerSmallConfetti() {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#D97706', '#F59E0B', '#10B981'],
    disableForReducedMotion: true,
  });
}
