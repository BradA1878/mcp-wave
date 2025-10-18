# Basic Sound Examples

Simple examples to get you started with synthesis.

## Simple Tones

### Single Sine Wave

```json
{
  "tool": "sc_play_synth",
  "description": "play a sine wave at 440hz"
}
```

### Different Frequencies

```json
{"description": "play a low tone at 100hz"}
{"description": "play a high tone at 2000hz"}
{"description": "play a middle C"}  // C4 = 261.63 Hz
```

### Named Notes

```json
{"description": "play a bell at C4"}
{"description": "play a bell at D#5"}
{"description": "play a bell at Bb3"}
```

---

## Drums and Percussion

### Individual Drums

```json
{"description": "play a kick drum"}
{"description": "play a snare"}
{"description": "play a hihat"}
```

### With Variations

```json
{"description": "play a loud kick"}
{"description": "play a quiet snare"}
{"description": "play a short hihat"}
```

---

## Duration Control

### Short Sounds

```json
{"description": "play a short bell"}
{"description": "play a bell for 0.3 seconds"}
```

### Long Sounds

```json
{"description": "play a long sine tone"}
{"description": "play a bell for 3 seconds"}
```

---

## Volume Control

```json
{"description": "play a loud kick drum"}
{"description": "play a quiet bell"}
{"description": "play a soft sine wave"}
```

---

## Spatial Positioning

```json
{"description": "play a bell on the left"}
{"description": "play a kick on the right"}
{"description": "play a centered sine tone"}
```

---

## Advanced: Precise Control

When you need exact parameters, use `sc_play_synth_advanced`:

### Exact Frequency and Volume

```json
{
  "tool": "sc_play_synth_advanced",
  "synthName": "sine",
  "freq": 432,
  "amp": 0.25,
  "duration": 2,
  "pan": 0
}
```

### Bell with Specific Parameters

```json
{
  "tool": "sc_play_synth_advanced",
  "synthName": "bell",
  "freq": 523.25,
  "amp": 0.4,
  "duration": 1.5,
  "pan": -0.3
}
```

---

## Raw SuperCollider Code

For complete control, use `sc_execute`:

### Simple Oscillator

```json
{
  "tool": "sc_execute",
  "code": "{ SinOsc.ar(440, 0, 0.3) }.play;"
}
```

### Detuned Oscillators

```json
{
  "tool": "sc_execute",
  "code": "{ SinOsc.ar([440, 442], 0, 0.2) }.play;"
}
```

### Filtered Noise

```json
{
  "tool": "sc_execute",
  "code": "{ LPF.ar(WhiteNoise.ar(0.5), 1000) }.play;"
}
```

---

## Combining Multiple Sounds

Play sounds in sequence by calling multiple times:

```
1. sc_play_synth: "play a kick"
2. Wait 0.5 seconds
3. sc_play_synth: "play a snare"
```

Or use patterns for precise timing (see [Drum Patterns](drum-patterns.md)).

---

## Stopping Sounds

### Stop Everything

```json
{
  "tool": "sc_stop_all"
}
```

### Individual Control

Sounds with finite duration stop automatically. For infinite sounds (like sustained tones), use `sc_stop_all`.

---

## Recording

### Record a Single Sound

```
1. sc_record_start: "single-bell.wav"
2. sc_play_synth: "play a bell at C5"
3. Wait 2 seconds
4. sc_record_stop
```

### Record Multiple Sounds

```
1. sc_record_start: "sequence.wav"
2. sc_play_synth: "play a kick"
3. (wait)
4. sc_play_synth: "play a snare"
5. (wait)
6. sc_play_synth: "play a bell"
7. sc_record_stop
```

---

## Next Steps

- [Drum Patterns](drum-patterns.md) - Create rhythmic sequences
- [Melodies](melodies.md) - Musical note sequences
- [API Reference](../api/tools.md) - Complete tool documentation
