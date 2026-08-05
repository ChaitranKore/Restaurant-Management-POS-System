import { useEffect, useState } from 'react';

/**
 * Re-renders on an interval so elapsed-time displays keep counting without
 * every ticket owning its own timer. One interval drives the whole board.
 */
export function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

/**
 * A short two-tone chime for new kitchen tickets, synthesised rather than
 * shipped as an asset. Browsers block audio until the user has interacted with
 * the page, which is why the board makes sound opt-in behind a button.
 */
export function playNewOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();

    [880, 1320].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(context.destination);

      const startAt = context.currentTime + index * 0.14;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.24);
    });

    setTimeout(() => context.close(), 800);
  } catch {
    /* audio unavailable — the board still works silently */
  }
}
