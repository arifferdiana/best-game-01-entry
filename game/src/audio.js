// Every sound is synthesised with WebAudio: an oscillator and a gain envelope,
// no audio files. The context is created on the first user gesture, and M mutes.
export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let pad = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  // One note: an oscillator that slides from `from` to `to` Hz over `dur` seconds.
  function tone(from, to, dur, type, volume, delay = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    /** Call from a key or pointer handler so the context may start. */
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.5;
    },
    isMuted() {
      return muted;
    },
    jump() {
      tone(280, 620, 0.16, 'sine', 0.5);
    },
    doubleJump() {
      tone(420, 880, 0.14, 'triangle', 0.45);
    },
    land() {
      tone(160, 90, 0.08, 'sine', 0.25);
    },
    // The collect chime climbs a little with each orb in a row.
    collect(streak) {
      const base = 660 + Math.min(streak, 8) * 40;
      tone(base, base, 0.1, 'sine', 0.5);
      tone(base * 1.5, base * 1.5, 0.14, 'sine', 0.4, 0.06);
    },
    hurt() {
      tone(220, 70, 0.25, 'sawtooth', 0.4);
      tone(110, 55, 0.3, 'square', 0.25, 0.02);
    },
    portal() {
      tone(330, 660, 0.25, 'sine', 0.4);
      tone(495, 990, 0.3, 'sine', 0.35, 0.08);
      tone(660, 1320, 0.35, 'sine', 0.3, 0.16);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => tone(n, n, 0.22, 'triangle', 0.45, i * 0.11));
      tone(1319, 1319, 0.5, 'sine', 0.35, 0.5);
    },
    click() {
      tone(700, 700, 0.05, 'square', 0.2);
    },
    /** A soft warm drone under the game, started on the first gesture. */
    startPad() {
      if (!ensure() || pad) return;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      gain.connect(master);
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      a.type = 'sine';
      b.type = 'sine';
      a.frequency.value = 110;
      b.frequency.value = 164.81;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      a.connect(gain);
      b.connect(gain);
      a.start();
      b.start();
      lfo.start();
      pad = { a, b, lfo, gain };
    },
  };
}
