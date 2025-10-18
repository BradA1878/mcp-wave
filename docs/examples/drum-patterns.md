# Drum Pattern Examples

Examples of creating rhythmic patterns with the SuperCollider MCP server.

## Basic 4-Beat Pattern

Simple kick-snare pattern:

```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "kick", "delay": 0},
    {"synth": "snare", "delay": 0.5},
    {"synth": "kick", "delay": 0.5},
    {"synth": "snare", "delay": 0.5}
  ]
}
```

**Total duration:** 1.5 seconds

---

## Four-on-the-Floor with Hi-Hats

Classic house/techno beat:

```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "kick", "delay": 0},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "kick", "delay": 0.25},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "snare", "delay": 0},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "kick", "delay": 0.25},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "kick", "delay": 0.25},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "snare", "delay": 0},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2}
  ]
}
```

**Total duration:** 4 seconds (one bar at 120 BPM)

---

## Breakbeat

More complex syncopated rhythm:

```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "kick", "delay": 0},
    {"synth": "hihat", "delay": 0.167, "amp": 0.15},
    {"synth": "snare", "delay": 0.167, "amp": 0.25},
    {"synth": "hihat", "delay": 0.166, "amp": 0.2},
    {"synth": "kick", "delay": 0.167},
    {"synth": "hihat", "delay": 0.167, "amp": 0.15},
    {"synth": "kick", "delay": 0.166},
    {"synth": "snare", "delay": 0},
    {"synth": "hihat", "delay": 0.167, "amp": 0.18},
    {"synth": "kick", "delay": 0.167},
    {"synth": "hihat", "delay": 0.166, "amp": 0.15},
    {"synth": "snare", "delay": 0.167, "amp": 0.3}
  ]
}
```

---

## Minimal Techno

Sparse, hypnotic pattern:

```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "kick", "delay": 0, "amp": 0.5},
    {"synth": "hihat", "delay": 0.375, "amp": 0.15},
    {"synth": "hihat", "delay": 0.375, "amp": 0.12},
    {"synth": "kick", "delay": 0.25, "amp": 0.45},
    {"synth": "hihat", "delay": 0.375, "amp": 0.15},
    {"synth": "snare", "delay": 0.375, "amp": 0.25},
    {"synth": "kick", "delay": 0.25, "amp": 0.5},
    {"synth": "hihat", "delay": 0.25, "amp": 0.15},
    {"synth": "hihat", "delay": 0.125, "amp": 0.1},
    {"synth": "kick", "delay": 0.125, "amp": 0.4},
    {"synth": "hihat", "delay": 0.25, "amp": 0.15}
  ]
}
```

---

## Drum Fill

16th note fill:

```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "snare", "delay": 0, "amp": 0.2},
    {"synth": "snare", "delay": 0.125, "amp": 0.25},
    {"synth": "snare", "delay": 0.125, "amp": 0.3},
    {"synth": "snare", "delay": 0.125, "amp": 0.35},
    {"synth": "kick", "delay": 0.125, "amp": 0.5},
    {"synth": "snare", "delay": 0.125, "amp": 0.4},
    {"synth": "snare", "delay": 0.125, "amp": 0.45},
    {"synth": "kick", "delay": 0.125, "amp": 0.5},
    {"synth": "snare", "delay": 0.125, "amp": 0.5}
  ]
}
```

---

## Tips for Creating Patterns

### Timing

**Calculate delays for specific BPM:**
```
Beat duration = 60 / BPM
16th note = beat duration / 4
8th note = beat duration / 2
Quarter note = beat duration
```

**Example at 120 BPM:**
- Quarter note: 0.5s
- 8th note: 0.25s
- 16th note: 0.125s

### Dynamics

Vary amplitude for groove:
- Accented hits: `amp: 0.3-0.5`
- Normal hits: `amp: 0.2-0.3`
- Ghost notes: `amp: 0.1-0.15`

### Layering

Combine multiple synths at same time:
```json
{"synth": "kick", "delay": 0},
{"synth": "hihat", "delay": 0, "amp": 0.15}  // Play together
```

### Recording Patterns

```
1. sc_record_start with "my-beat.wav"
2. sc_play_pattern with your pattern
3. Wait for pattern to finish
4. sc_record_stop
```

---

## Advanced: Programmatic Pattern Generation

Use Claude to generate patterns:

> "Create a drum pattern in 7/8 time signature"

> "Make a jungle-style breakbeat with lots of hi-hats"

> "Generate a latin percussion pattern"

Claude can calculate delays and create complex patterns!

---

## See Also

- [Basic Sounds](basic-sounds.md)
- [Melodies](melodies.md)
- [Tools Reference](../api/tools.md)
