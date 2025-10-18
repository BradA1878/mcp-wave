# Tools Reference

Complete reference for all SuperCollider MCP server tools.

## Overview

The SuperCollider MCP server provides 11 tools organized into 4 categories:

1. **Diagnostics** - Setup validation and health checks
2. **Server Management** - Boot, quit, and monitor the server
3. **Synthesis** - Create and control sounds
4. **Recording** - Capture audio output

---

## Diagnostics Tools

### `sc_health_check`

Validates that SuperCollider is installed and configured correctly.

**Parameters:** None

**Returns:**
- Success: SuperCollider installation path and confirmation
- Error: Platform-specific installation instructions

**Example:**
```json
{
  "tool": "sc_health_check"
}
```

**Response (Success):**
```
✅ SuperCollider is installed and ready!

Path: /Applications/SuperCollider.app/Contents/MacOS/sclang

You can now use sc_boot to start the audio server.
```

**Response (Error):**
```
❌ SuperCollider NOT found

macOS: Download from https://supercollider.github.io/downloads
       Drag SuperCollider.app to /Applications/

Or set: export SCLANG_PATH="/path/to/sclang"
```

**When to use:**
- First time setup
- After installing SuperCollider
- When experiencing boot issues
- On a new machine

---

## Server Management Tools

### `sc_boot`

Boots the SuperCollider audio server (scsynth). Must be called before any synthesis.

**Parameters:** None

**Returns:**
- Success: Confirmation message
- Error: Detailed error with instructions

**Example:**
```json
{
  "tool": "sc_boot"
}
```

**Response:**
```
SuperCollider server booted successfully. All synth definitions loaded.
```

**Side effects:**
- Spawns `sclang` process
- Initializes `scsynth` audio server
- Configures audio I/O (2 in, 2 out by default)
- May take 5-10 seconds

**Errors:**
- `SuperCollider not found` - Run `sc_health_check`
- `Server already running` - Call `sc_quit` first
- `Boot timeout` - Check SuperCollider installation

---

### `sc_quit`

Gracefully shuts down the SuperCollider server.

**Parameters:** None

**Returns:** Confirmation message

**Example:**
```json
{
  "tool": "sc_quit"
}
```

**Response:**
```
SuperCollider server quit successfully
```

**Side effects:**
- Stops all playing synths
- Terminates `scsynth` and `sclang` processes
- Cleans up audio resources

---

### `sc_status`

Queries the current status of the SuperCollider server.

**Parameters:** None

**Returns:** Server status object

**Example:**
```json
{
  "tool": "sc_status"
}
```

**Response:**
```json
{
  "running": true
}
```

**Note:** Currently simplified. Future versions will include CPU usage, active synths, etc.

---

### `sc_stop_all`

Immediately stops all currently playing synths.

**Parameters:** None

**Returns:** Confirmation message

**Example:**
```json
{
  "tool": "sc_stop_all"
}
```

**Response:**
```
All synths stopped
```

**Use cases:**
- Emergency stop
- Clearing hanging synths
- Resetting before new pattern

---

## Synthesis Tools

### `sc_play_synth`

**Primary synthesis tool.** Plays a sound based on natural language description.

**Parameters:**
- `description` (string, required) - Natural language description of the sound

**Supported descriptions:**
- **Synth types:** bell, kick, snare, hihat, sine, tone
- **Pitches:** Note names (C4, D#5, Bb3) or frequencies (440hz, 880hz)
- **Descriptive terms:**
  - Pitch: high, low, bright, deep
  - Duration: short, long, or "N seconds"
  - Volume: loud, quiet, soft, forte, piano
  - Position: left, right (panning)

**Examples:**
```json
{"tool": "sc_play_synth", "description": "play a bell sound at C5"}
{"tool": "sc_play_synth", "description": "play a low bass tone for 2 seconds"}
{"tool": "sc_play_synth", "description": "play a short kick drum"}
{"tool": "sc_play_synth", "description": "play a high pitched sine wave"}
{"tool": "sc_play_synth", "description": "play a quiet snare on the left"}
```

**Response:**
```
Playing bell synth: {"freq":523.25,"amp":0.3,"duration":1,"pan":0}
```

**Available synths:**
- `bell` - FM synthesis, metallic tone
- `kick` - Bass drum with frequency envelope
- `snare` - Noise + tone combination
- `hihat` - Filtered white noise
- `sine` - Pure tone (default)

**See also:** [Natural Language Guide](../guides/natural-language.md)

---

### `sc_play_synth_advanced`

Plays a specific synth with explicit parameters for precise control.

**Parameters:**
- `synthName` (string, required) - Name of synth: bell, kick, snare, hihat, sine
- `freq` (number, optional) - Frequency in Hz (default: 440)
- `amp` (number, optional) - Amplitude 0-1 (default: 0.3)
- `duration` (number, optional) - Duration in seconds (default: 1)
- `pan` (number, optional) - Pan position -1 (left) to 1 (right) (default: 0)

**Example:**
```json
{
  "tool": "sc_play_synth_advanced",
  "synthName": "bell",
  "freq": 523.25,
  "amp": 0.4,
  "duration": 2,
  "pan": 0.5
}
```

**Response:**
```
Playing bell synth with parameters: {"freq":523.25,"amp":0.4,"duration":2,"pan":0.5}
```

**Use when:**
- You need exact parameter values
- Building programmatic sequences
- Fine-tuning synthesis parameters

---

### `sc_play_pattern`

Plays a rhythmic pattern or sequence of notes.

**Parameters:**
- `pattern` (array, required) - Array of note events

**Event properties:**
- `synth` (string, required) - Synth name
- `delay` (number, required) - Delay in seconds before this event
- `freq` (number, optional) - Frequency in Hz
- `amp` (number, optional) - Amplitude 0-1
- `duration` (number, optional) - Duration in seconds

**Example - Drum beat:**
```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "kick", "delay": 0},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "snare", "delay": 0.25},
    {"synth": "hihat", "delay": 0.25, "amp": 0.2},
    {"synth": "kick", "delay": 0.25}
  ]
}
```

**Example - Melody:**
```json
{
  "tool": "sc_play_pattern",
  "pattern": [
    {"synth": "bell", "freq": 523.25, "delay": 0, "duration": 0.5},
    {"synth": "bell", "freq": 587.33, "delay": 0.5, "duration": 0.5},
    {"synth": "bell", "freq": 659.25, "delay": 0.5, "duration": 0.5},
    {"synth": "bell", "freq": 783.99, "delay": 0.5, "duration": 1}
  ]
}
```

**Response:**
```
Playing pattern with 4 events
```

**Notes:**
- Delays are cumulative (each event waits for its delay, then plays)
- Pattern executes as a SuperCollider Routine
- Maximum recommended length: ~100 events

---

### `sc_execute`

Executes raw SuperCollider code. For advanced users.

**Parameters:**
- `code` (string, required) - SuperCollider code to execute

**Example - Simple tone:**
```json
{
  "tool": "sc_execute",
  "code": "{ SinOsc.ar(440, 0, 0.3) }.play;"
}
```

**Example - Complex synthesis:**
```json
{
  "tool": "sc_execute",
  "code": "{ var sig = RLPF.ar(Saw.ar([100, 101]), MouseX.kr(100, 5000), 0.1); sig * 0.2 }.play;"
}
```

**Response:**
```
Code executed successfully
```

**Use cases:**
- Custom SynthDefs
- Advanced synthesis techniques
- Parameter modulation
- Live coding

**Limitations:**
- Single-line code only (or use semicolons)
- No multi-line SynthDef blocks
- 500ms timeout for response
- For complex defs, use inline function syntax

**See also:** [SuperCollider Documentation](https://doc.sccode.org/)

---

## Recording Tools

### `sc_record_start`

Starts recording audio output to a file.

**Parameters:**
- `filename` (string, required) - Output filename (saved in recordings/ directory)

**Example:**
```json
{
  "tool": "sc_record_start",
  "filename": "my-composition.wav"
}
```

**Response:**
```
Started recording to recordings/my-composition.wav
```

**Notes:**
- Creates `recordings/` directory if it doesn't exist
- Default format: WAV, 48kHz, stereo
- Records everything played after this command
- Must call `sc_record_stop` to finalize file

---

### `sc_record_stop`

Stops the current recording and finalizes the file.

**Parameters:** None

**Example:**
```json
{
  "tool": "sc_record_stop"
}
```

**Response:**
```
Recording stopped
```

**Workflow:**
```
1. sc_record_start with filename
2. Play sounds (sc_play_synth, sc_play_pattern, etc.)
3. sc_record_stop
4. File is saved to recordings/
```

---

## Tool Chaining Examples

### Complete workflow:
```
1. sc_health_check  // Verify installation
2. sc_boot          // Start server
3. sc_play_synth    // Make sound
4. sc_stop_all      // Clean up
5. sc_quit          // Shutdown
```

### Recording session:
```
1. sc_boot
2. sc_record_start with "session.wav"
3. sc_play_pattern with drum beat
4. sc_play_synth with melody
5. sc_record_stop
6. sc_quit
```

### Error recovery:
```
1. sc_play_synth fails
2. sc_health_check  // Diagnose
3. Fix issue (install SC, set path, etc.)
4. sc_boot
5. Try again
```

---

## Response Format

All tools return responses in this format:

**Success:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Success message here"
    }
  ]
}
```

**Error:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Description of what went wrong"
    }
  ],
  "isError": true
}
```

---

## Rate Limiting

No explicit rate limiting, but be aware:
- Each synthesis creates a new synth instance
- Too many simultaneous synths may cause audio glitches
- Use `sc_stop_all` to clear if needed
- Server has default limit of ~1024 simultaneous synths

---

## Best Practices

1. **Always start with `sc_health_check`** on new machines
2. **Boot once per session**, not before every sound
3. **Use `sc_play_synth`** for natural language, `sc_play_synth_advanced` for precision
4. **Stop sounds** with `sc_stop_all` if they hang
5. **Quit cleanly** with `sc_quit` when done
6. **Record interesting results** for later use

---

## See Also

- [Getting Started Guide](../guides/quickstart.md)
- [Natural Language Synthesis](../guides/natural-language.md)
- [Pattern Examples](../examples/drum-patterns.md)
- [Troubleshooting](../guides/troubleshooting.md)
