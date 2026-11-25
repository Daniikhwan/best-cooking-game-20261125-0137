// All sound is synthesised with WebAudio: no audio files, nothing fetched.
// Chops, sizzles, dings and coins are short envelopes over oscillators and
// filtered noise; the music is a light pentatonic loop that hurries in a rush.

const MELODY = [0, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, -2];
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let melodyStep = 0;
  let rush = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, at, dur, type, vol, slideTo) {
    if (!context) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function noise(at, dur, vol, filterFreq) {
    if (!context) return;
    const len = Math.max(1, Math.floor(context.sampleRate * dur));
    const buffer = context.createBuffer(1, len, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const src = context.createBufferSource();
    src.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = context.createGain();
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(at);
    src.stop(at + dur);
  }

  function now() {
    return context ? context.currentTime : 0;
  }

  return {
    /** Call on the first user gesture so the browser unlocks audio. */
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = value ? 0 : 0.5;
    },
    isMuted() {
      return muted;
    },
    /** The rush flag quickens the music loop. */
    setRush(value) {
      rush = value;
    },
    chop() {
      if (!ensure()) return;
      const t = now();
      noise(t, 0.07, 0.5, 1800);
      tone(180, t, 0.08, 'triangle', 0.35, 90);
    },
    sizzleStart() {
      if (!ensure()) return;
      noise(now(), 0.5, 0.12, 5200);
    },
    ding() {
      if (!ensure()) return;
      const t = now();
      tone(1318.5, t, 0.5, 'sine', 0.3);
      tone(1975.5, t + 0.02, 0.45, 'sine', 0.18);
    },
    coin() {
      if (!ensure()) return;
      const t = now();
      tone(987.77, t, 0.09, 'square', 0.12);
      tone(1318.5, t + 0.09, 0.16, 'square', 0.12);
    },
    error() {
      if (!ensure()) return;
      tone(160, now(), 0.16, 'sawtooth', 0.14, 110);
    },
    pop() {
      if (!ensure()) return;
      tone(520, now(), 0.07, 'sine', 0.22, 780);
    },
    startMusic() {
      if (!ensure() || musicTimer !== null) return;
      const beat = () => {
        if (!context) return;
        const step = MELODY[melodyStep % MELODY.length];
        melodyStep += 1;
        const idx = ((step % SCALE.length) + SCALE.length) % SCALE.length;
        const octave = step >= SCALE.length ? 2 : 1;
        tone(SCALE[idx] * octave, now(), 0.34, 'triangle', 0.07);
        if (melodyStep % 4 === 1) tone(130.81, now(), 0.5, 'sine', 0.1);
        musicTimer = window.setTimeout(beat, rush ? 210 : 300);
      };
      beat();
    },
    stopMusic() {
      if (musicTimer !== null) {
        window.clearTimeout(musicTimer);
        musicTimer = null;
      }
    },
  };
}

// A short celebratory arpeggio for a served order with a big tip.
export function celebrate(audio) {
  // Kept tiny on purpose: the coin + ding pair already says "served".
  audio.coin();
  audio.ding();
}
