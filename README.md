# SuperCollider MCP Server

A Model Context Protocol (MCP) server for controlling SuperCollider audio synthesis. This server enables AI assistants like Claude to generate and control real-time audio synthesis through natural language descriptions.

<a href="https://glama.ai/mcp/servers/@BradA1878/mcp-wave">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@BradA1878/mcp-wave/badge" alt="SuperCollider Server MCP server" />
</a>

## Features

- **Natural Language Sound Synthesis**: Describe sounds in plain English and have them synthesized in real-time
- **10 Built-in Synth Types**: sine, pluck, bell, bass, pad, kick, snare, hihat, atmosphere, sweep
- **Server Lifecycle Management**: Boot, quit, and monitor SuperCollider server status
- **Pattern Sequencing**: Create rhythmic patterns and melodic sequences
- **Audio Recording**: Record synthesis output to files
- **Raw Code Execution**: Execute custom SuperCollider code for advanced control
- **TypeScript & Type-Safe**: Fully typed with Zod schema validation

## Prerequisites

- Node.js 18+
- SuperCollider installed locally ([download here](https://supercollider.github.io/downloads))

### Installing SuperCollider

**macOS**:
1. Download from https://supercollider.github.io/downloads
2. Drag `SuperCollider.app` to `/Applications/`
3. The MCP server will auto-detect it

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install supercollider
```

**Linux (Arch)**:
```bash
sudo pacman -S supercollider
```

**Windows**:
1. Download installer from https://supercollider.github.io/downloads
2. Run the installer
3. The MCP server will auto-detect it

### Custom Installation Path

If SuperCollider is installed in a non-standard location, set the environment variable:

```bash
export SCLANG_PATH="/path/to/sclang"
# Optional: export SCSYNTH_PATH="/path/to/scsynth"
```

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": ["/absolute/path/to/supercollider-mcp/dist/index.js"]
    }
  }
}
```

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop after updating the config.

### With MCP Inspector (for testing)

```bash
npm run inspector
```

### Standalone Development

```bash
npm run dev
```

## Available Tools

### Setup & Diagnostics

#### `sc_health_check`
Check if SuperCollider is installed and configured correctly. **Run this first** if you have any issues.

```typescript
// No parameters required
sc_health_check()
```

Returns:
- ✅ Success: SuperCollider path and confirmation
- ❌ Error: Installation instructions for your platform

---

### Core Server Management

#### `sc_boot`
Boot the SuperCollider audio server. Must be called before any sound synthesis.

```typescript
// No parameters required
sc_boot()
```

#### `sc_quit`
Quit the SuperCollider server and clean up resources.

#### `sc_status`
Get current server status including CPU usage and running synths.

---

### Sound Synthesis

#### `sc_play_synth` (Recommended for AI)
Play a synthesized sound based on a natural language description. This is the primary tool for sound generation.

**Examples:**
- "play a bell sound at C4"
- "play a low bass tone for 2 seconds"
- "play a bright plucked string"
- "play a soft atmospheric pad"
- "play a short snare"
- "play a sweep from 100hz to 2000hz over 3 seconds"

```json
{
  "description": "play a bell sound at C5 for 2 seconds"
}
```

The parser understands:
- **Note names**: C4, D#5, Bb3, etc.
- **Frequencies**: 440hz, 880hz, etc.
- **Descriptive terms**: high, low, bright, deep, soft, loud, short, long
- **Synth types**: bell, bass, pad, pluck, kick, snare, hihat, sweep, atmosphere
- **Spatial terms**: left, right (for panning)

#### `sc_play_synth_advanced`
Play a specific synth with explicit parameters for precise control.

**Available synths**: sine, pluck, bell, bass, pad, kick, snare, hihat, atmosphere, sweep

```json
{
  "synthName": "bell",
  "freq": 523.25,
  "amp": 0.4,
  "duration": 2,
  "pan": 0.5
}
```

**Parameters:**
- `freq`: Frequency in Hz (default: 440)
- `amp`: Amplitude 0-1 (default: 0.3)
- `duration`: Duration in seconds (default: 1)
- `pan`: Pan position -1 (left) to 1 (right) (default: 0)
- `decay`: Decay time for pluck synth (default: 2)
- `cutoff`: Filter cutoff frequency for bass/pad
- `startFreq`, `endFreq`: For sweep synth

#### `sc_play_pattern`
Play a rhythmic pattern or sequence of notes.

```json
{
  "pattern": [
    { "synth": "kick", "delay": 0 },
    { "synth": "snare", "delay": 0.5 },
    { "synth": "hihat", "delay": 0.25, "amp": 0.2 },
    { "synth": "hihat", "delay": 0.25, "amp": 0.2 },
    { "synth": "kick", "delay": 0.5 }
  ]
}
```

#### `sc_stop_all`
Stop all currently playing synths immediately.

---

### Advanced Control

#### `sc_execute`
Execute raw SuperCollider code for custom synthesis and advanced control.

```json
{
  "code": "{ SinOsc.ar([440, 442], 0, 0.2) }.play;"
}
```

---

### Recording

#### `sc_record_start`
Start recording audio output to a file.

```json
{
  "filename": "my-composition.wav"
}
```

Files are saved to the `recordings/` directory.

#### `sc_record_stop`
Stop the current recording.

---

## Example Conversation Flow

**User**: "I want to hear a dreamy bell sound"

**Claude**:
```
Using sc_boot to start SuperCollider server...
Using sc_play_synth with description "bell sound at C5"...
```

The server will synthesize a bell-like tone using FM synthesis.

**User**: "Now play a bass line"

**Claude**:
```
Using sc_play_pattern with:
- Low bass notes
- Rhythmic timing
```

---

## Synth Descriptions

### sine
Pure sine wave tone. Clean and simple.

### pluck
Plucked string simulation using the Karplus-Strong algorithm. Good for guitar-like sounds.

### bell
Bell-like FM synthesis. Bright and metallic.

### bass
Filtered sawtooth wave. Deep bass tones.

### pad
Warm, detuned sawtooth pad. Good for ambient backgrounds.

### kick
Kick drum with frequency envelope.

### snare
Snare drum with noise and tone components.

### hihat
Hi-hat cymbal using filtered noise.

### atmosphere
Atmospheric noise with slow filter modulation. Good for ambient textures.

### sweep
Frequency sweep/riser. Goes from startFreq to endFreq over duration.

---

## Architecture

```
src/
├── index.ts           # MCP server implementation
├── supercollider.ts   # SuperCollider process management
└── synth-library.ts   # Synth definitions and NLP parser
```

**Key Components:**
- **SuperColliderServer**: Manages sclang process lifecycle and code execution
- **Synth Library**: Pre-defined SynthDefs for common sound types
- **NLP Parser**: Converts natural language to synth parameters
- **MCP Tools**: Exposed functions for AI interaction

---

## Integration with MXF

This server is designed to work with the [Model Exchange Framework (MXF)](https://brada1878.github.io/model-exchange-framework/) for multi-agent music composition. Future enhancements will include:

- Event-driven synthesis triggered by MXF events
- Shared memory for musical context (key, tempo, style)
- Coordination with MIDI MCP server for external control
- Agent collaboration on compositional tasks

---

## Development

### Build
```bash
npm run build
```

### Watch mode (for development)
```bash
npm run dev
```

### Type checking
```bash
npx tsc --noEmit
```

---

## Troubleshooting

### "sclang not found"
Make sure SuperCollider is installed and `sclang` is in your PATH:
```bash
which sclang  # Should show the path to sclang
```

On macOS, you may need to add to your PATH:
```bash
export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"
```

### Server won't boot
- Check that no other SuperCollider instances are running
- Verify SuperCollider works standalone: `sclang`
- Check server output in the MCP logs

### No sound output
- Verify your system audio is working
- Check SuperCollider audio device settings
- Try `Server.default.options.device = "your-device-name";` via `sc_execute`

---

## Future Enhancements

- [ ] Real-time parameter modulation
- [ ] MIDI input/output integration
- [ ] Sample playback and manipulation
- [ ] Effects processing (reverb, delay, filters)
- [ ] Visual waveform/spectrum display
- [ ] Multi-server support (supernova)
- [ ] Preset management
- [ ] MXF event bus integration
- [ ] Collaborative composition with multiple agents

---

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.