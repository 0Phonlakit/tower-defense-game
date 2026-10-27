// Generated sound (Web Audio, no files): effects, a looping background track and UI/notification
// sounds, each on its own volume channel from Settings (sfx, music, ui).
(function (root) {
  'use strict';
  const TD = root.TD;

  const CHANNELS = ['sfx', 'music', 'ui'];

  // name -> channel, minimum gap between plays (seconds) and the notes to play.
  // Each note: tone { wave, f, to, dur, vol, at } or noise { noise: cutoff Hz, dur, vol, at }.
  const SOUNDS = {
    gun:       { ch: 'sfx', gap: 0.05, notes: [{ wave: 'square', f: 900, to: 600, dur: 0.04, vol: 0.06 }] },
    cannon:    { ch: 'sfx', gap: 0.1,  notes: [{ noise: 400, dur: 0.25, vol: 0.3 }, { wave: 'sine', f: 120, to: 50, dur: 0.2, vol: 0.3 }] },
    frost:     { ch: 'sfx', gap: 0.08, notes: [{ wave: 'sine', f: 1400, to: 700, dur: 0.12, vol: 0.07 }] },
    sniper:    { ch: 'sfx', gap: 0.1,  notes: [{ wave: 'sawtooth', f: 1200, to: 200, dur: 0.15, vol: 0.1 }] },
    flame:     { ch: 'sfx', gap: 0.08, notes: [{ noise: 2500, dur: 0.12, vol: 0.08 }] },
    tesla:     { ch: 'sfx', gap: 0.1,  notes: [{ wave: 'sawtooth', f: 300, to: 1800, dur: 0.1, vol: 0.06 }, { wave: 'square', f: 2200, to: 400, dur: 0.08, vol: 0.04, at: 0.05 }] },
    tide:      { ch: 'sfx', gap: 0.1,  notes: [{ noise: 900, dur: 0.18, vol: 0.1 }] },
    poison:    { ch: 'sfx', gap: 0.08, notes: [{ wave: 'triangle', f: 500, to: 250, dur: 0.1, vol: 0.07 }] },
    kill:      { ch: 'sfx', gap: 0.04, notes: [{ wave: 'triangle', f: 600, to: 1200, dur: 0.06, vol: 0.07 }] },
    reaction:  { ch: 'sfx', gap: 0.1,  notes: [{ wave: 'sine', f: 880, dur: 0.12, vol: 0.12 }, { wave: 'sine', f: 1320, dur: 0.14, vol: 0.1, at: 0.06 }] },
    basehit:   { ch: 'sfx', gap: 0.15, notes: [{ wave: 'sine', f: 160, to: 60, dur: 0.3, vol: 0.4 }, { noise: 300, dur: 0.2, vol: 0.2 }] },
    click:     { ch: 'ui',  gap: 0.03, notes: [{ wave: 'sine', f: 700, dur: 0.04, vol: 0.12 }] },
    wavestart: { ch: 'ui',  gap: 0.3,  notes: [440, 554, 659].map((f, i) => ({ wave: 'triangle', f, dur: 0.12, vol: 0.15, at: i * 0.09 })) },
    waveclear: { ch: 'ui',  gap: 0.3,  notes: [523, 659, 784].map(f => ({ wave: 'sine', f, dur: 0.4, vol: 0.1 })) },
    routeopen: { ch: 'ui',  gap: 1,    notes: [660, 440, 660, 440].map((f, i) => ({ wave: 'square', f, dur: 0.12, vol: 0.08, at: i * 0.15 })) },
    skip:      { ch: 'ui',  gap: 0.2,  notes: [{ wave: 'sine', f: 500, to: 1000, dur: 0.12, vol: 0.15 }] },
    perk:      { ch: 'ui',  gap: 0.2,  notes: [{ wave: 'sine', f: 784, dur: 0.1, vol: 0.14 }, { wave: 'sine', f: 1046, dur: 0.16, vol: 0.14, at: 0.08 }] },
    gameover:  { ch: 'ui',  gap: 1,    notes: [{ wave: 'triangle', f: 440, to: 110, dur: 0.9, vol: 0.2 }, { wave: 'sine', f: 330, to: 82, dur: 1, vol: 0.12, at: 0.1 }] },
  };

  // Background loop: Am - F - C - G, 8 eighth notes per chord.
  const STEP = 0.3;
  const CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
  const ARP = [0, 1, 2, 1, 0, 2, 1, 2];

  class SoundSystem {
    constructor(settings) {
      this.settings = settings;
      this.ctx = null;
      this.buses = {};
      this.lastPlayed = {};
      this.musicTimer = null;
      this.step = 0;
      this.nextNote = 0;
    }

    // Browsers only allow audio after a user gesture, so the App calls this on the first click/key.
    unlock() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        for (const ch of CHANNELS) {
          this.buses[ch] = this.ctx.createGain();
          this.buses[ch].connect(this.ctx.destination);
        }
        this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.applyVolumes();
        this.startMusic();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    // Squared so the sliders feel even to the ear.
    applyVolumes() {
      if (!this.ctx) return;
      for (const ch of CHANNELS) this.buses[ch].gain.value = this.settings[ch] * this.settings[ch];
    }

    play(name) {
      const s = SOUNDS[name];
      if (!this.ctx || !s || !this.settings[s.ch]) return;
      const now = this.ctx.currentTime;
      if (now - (this.lastPlayed[name] ?? -1) < s.gap) return;
      this.lastPlayed[name] = now;
      for (const n of s.notes) this.note(s.ch, n, now + (n.at || 0));
    }

    note(ch, n, at) {
      const { ctx } = this;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(n.vol, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + n.dur);
      gain.connect(this.buses[ch]);
      let src;
      if (n.noise) {
        src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = n.noise;
        src.connect(filter);
        filter.connect(gain);
      } else {
        src = ctx.createOscillator();
        src.type = n.wave;
        src.frequency.setValueAtTime(n.f, at);
        if (n.to && n.to !== n.f) src.frequency.exponentialRampToValueAtTime(n.to, at + n.dur);
        src.connect(gain);
      }
      src.start(at);
      src.stop(at + n.dur + 0.02);
    }

    startMusic() {
      if (!this.ctx || this.musicTimer) return;
      this.nextNote = this.ctx.currentTime + 0.1;
      this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
    }

    // Queues the notes of the next ~0.4s so the loop keeps time even when frames are slow.
    scheduleMusic() {
      while (this.nextNote < this.ctx.currentTime + 0.4) {
        const chord = CHORDS[Math.floor(this.step / ARP.length) % CHORDS.length];
        const i = this.step % ARP.length;
        if (i % 2 === 0) this.note('music', { wave: 'triangle', f: chord[0] / 2, dur: STEP * 1.8, vol: 0.12 }, this.nextNote);
        this.note('music', { wave: 'sine', f: chord[ARP[i]] * 2, dur: STEP * 0.9, vol: 0.05 }, this.nextNote);
        this.nextNote += STEP;
        this.step = (this.step + 1) % (CHORDS.length * ARP.length);
      }
    }
  }

  TD.SoundSystem = SoundSystem;
  TD.SOUNDS = SOUNDS;
})(self);
