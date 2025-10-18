/**
 * Library of common SynthDefs for high-level sound synthesis
 * These are optimized for LLM-driven sound design
 */

export interface SynthParams {
  freq?: number;
  amp?: number;
  duration?: number;
  pan?: number;
  [key: string]: number | undefined;
}

export const SYNTH_DEFS = {
  // Simple sine wave tone
  sine: `
SynthDef(\\sine, { |freq=440, amp=0.3, pan=0, gate=1|
    var sig = SinOsc.ar(freq, 0, amp);
    var env = EnvGen.kr(Env.asr(0.01, 1, 0.1), gate, doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Plucked string sound
  pluck: `
SynthDef(\\pluck, { |freq=440, amp=0.3, pan=0, decay=2|
    var sig = Pluck.ar(
        WhiteNoise.ar(amp),
        Impulse.kr(0),
        freq.reciprocal,
        freq.reciprocal,
        decay,
        coef: 0.1
    );
    var env = EnvGen.kr(Env.linen(0, decay, 0), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Bell-like FM tone
  bell: `
SynthDef(\\bell, { |freq=440, amp=0.3, pan=0, duration=2|
    var modulator = SinOsc.ar(freq * 2.4, 0, freq * 0.8);
    var carrier = SinOsc.ar(freq + modulator, 0, amp);
    var env = EnvGen.kr(Env.perc(0.01, duration, 1, -4), doneAction: 2);
    Out.ar(0, Pan2.ar(carrier * env, pan));
}).add;
`,

  // Bass tone
  bass: `
SynthDef(\\bass, { |freq=110, amp=0.4, pan=0, duration=1, cutoff=1000|
    var sig = LPF.ar(Saw.ar(freq), cutoff);
    var env = EnvGen.kr(Env.perc(0.01, duration), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env * amp, pan));
}).add;
`,

  // Pad sound
  pad: `
SynthDef(\\pad, { |freq=220, amp=0.2, pan=0, gate=1, cutoff=2000|
    var sig = RLPF.ar(
        Saw.ar([freq, freq * 1.01], amp),
        cutoff,
        0.5
    );
    var env = EnvGen.kr(Env.asr(0.5, 1, 2), gate, doneAction: 2);
    Out.ar(0, Pan2.ar(Mix(sig) * env, pan));
}).add;
`,

  // Kick drum
  kick: `
SynthDef(\\kick, { |amp=0.5, pan=0|
    var freqEnv = EnvGen.kr(Env.perc(0.001, 0.3), 1, 60, 50);
    var sig = SinOsc.ar(freqEnv, 0, amp);
    var env = EnvGen.kr(Env.perc(0.001, 0.5), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Snare drum
  snare: `
SynthDef(\\snare, { |amp=0.3, pan=0|
    var sig = WhiteNoise.ar(amp) + SinOsc.ar(180, 0, amp);
    var env = EnvGen.kr(Env.perc(0.001, 0.2), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Hi-hat
  hihat: `
SynthDef(\\hihat, { |amp=0.2, pan=0|
    var sig = HPF.ar(WhiteNoise.ar(amp), 8000);
    var env = EnvGen.kr(Env.perc(0.001, 0.1), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Atmospheric noise
  atmosphere: `
SynthDef(\\atmosphere, { |amp=0.15, pan=0, gate=1, cutoff=3000|
    var sig = RHPF.ar(
        PinkNoise.ar(amp),
        LFNoise1.kr(0.5).range(cutoff * 0.5, cutoff),
        0.2
    );
    var env = EnvGen.kr(Env.asr(2, 1, 3), gate, doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,

  // Sweep/riser
  sweep: `
SynthDef(\\sweep, { |startFreq=100, endFreq=2000, amp=0.3, pan=0, duration=2|
    var freq = Line.kr(startFreq, endFreq, duration);
    var sig = Saw.ar(freq, amp);
    var env = EnvGen.kr(Env.linen(0.1, duration - 0.2, 0.1), doneAction: 2);
    Out.ar(0, Pan2.ar(sig * env, pan));
}).add;
`,
};

/**
 * Get the initialization code that loads all SynthDefs
 */
export function getSynthDefInitCode(): string {
  return Object.values(SYNTH_DEFS).join('\n\n');
}

/**
 * Map common descriptive terms to synth names and parameters
 */
export function parseSynthDescription(description: string): {
  synthName: string;
  params: SynthParams;
} {
  const lowerDesc = description.toLowerCase();

  // Default params
  const params: SynthParams = {
    freq: 440,
    amp: 0.3,
    duration: 1,
    pan: 0,
  };

  // Determine synth type
  let synthName = 'sine';

  if (lowerDesc.includes('bell') || lowerDesc.includes('chime')) {
    synthName = 'bell';
  } else if (lowerDesc.includes('pluck') || lowerDesc.includes('guitar') || lowerDesc.includes('string')) {
    synthName = 'pluck';
    params.decay = 2;
  } else if (lowerDesc.includes('bass') || lowerDesc.includes('low')) {
    synthName = 'bass';
    params.freq = 110;
    params.cutoff = 800;
  } else if (lowerDesc.includes('pad') || lowerDesc.includes('ambient') || lowerDesc.includes('warm')) {
    synthName = 'pad';
    params.freq = 220;
    params.cutoff = 2000;
  } else if (lowerDesc.includes('kick') || lowerDesc.includes('drum')) {
    synthName = 'kick';
  } else if (lowerDesc.includes('snare')) {
    synthName = 'snare';
  } else if (lowerDesc.includes('hihat') || lowerDesc.includes('hi-hat')) {
    synthName = 'hihat';
  } else if (lowerDesc.includes('atmosphere') || lowerDesc.includes('noise') || lowerDesc.includes('wind')) {
    synthName = 'atmosphere';
  } else if (lowerDesc.includes('sweep') || lowerDesc.includes('riser') || lowerDesc.includes('swell')) {
    synthName = 'sweep';
  }

  // Parse frequency/pitch
  const noteMatch = lowerDesc.match(/\b([a-g]#?)\s*(\d+)\b/i);
  if (noteMatch) {
    const note = noteMatch[1];
    const octave = parseInt(noteMatch[2]);
    params.freq = noteToFreq(note, octave);
  } else {
    // Look for frequency in Hz
    const freqMatch = lowerDesc.match(/(\d+)\s*hz/i);
    if (freqMatch) {
      params.freq = parseInt(freqMatch[1]);
    }
  }

  // Parse descriptive pitch terms
  if (lowerDesc.includes('high') || lowerDesc.includes('bright')) {
    params.freq = (params.freq || 440) * 2;
  } else if (lowerDesc.includes('low') || lowerDesc.includes('deep')) {
    params.freq = (params.freq || 440) / 2;
  }

  // Parse duration
  const durMatch = lowerDesc.match(/(\d+(?:\.\d+)?)\s*(?:second|sec|s)\b/i);
  if (durMatch) {
    params.duration = parseFloat(durMatch[1]);
  } else if (lowerDesc.includes('short')) {
    params.duration = 0.3;
  } else if (lowerDesc.includes('long')) {
    params.duration = 3;
  }

  // Parse amplitude/volume
  if (lowerDesc.includes('loud') || lowerDesc.includes('forte')) {
    params.amp = 0.6;
  } else if (lowerDesc.includes('quiet') || lowerDesc.includes('soft') || lowerDesc.includes('piano')) {
    params.amp = 0.15;
  }

  // Parse panning
  if (lowerDesc.includes('left')) {
    params.pan = -0.7;
  } else if (lowerDesc.includes('right')) {
    params.pan = 0.7;
  }

  return { synthName, params };
}

/**
 * Convert note name and octave to frequency
 */
function noteToFreq(note: string, octave: number): number {
  const noteMap: { [key: string]: number } = {
    'c': -9, 'c#': -8, 'db': -8,
    'd': -7, 'd#': -6, 'eb': -6,
    'e': -5,
    'f': -4, 'f#': -3, 'gb': -3,
    'g': -2, 'g#': -1, 'ab': -1,
    'a': 0, 'a#': 1, 'bb': 1,
    'b': 2,
  };

  const semitones = noteMap[note.toLowerCase()];
  const a4 = 440;
  const semitonesFromA4 = (octave - 4) * 12 + semitones;

  return a4 * Math.pow(2, semitonesFromA4 / 12);
}
