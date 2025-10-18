# Quick Start Guide

Get up and running with SuperCollider MCP in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- SuperCollider installed ([download here](https://supercollider.github.io/downloads))

## Step 1: Install SuperCollider

If you haven't already, install SuperCollider for your platform:

**macOS:**
1. Download from https://supercollider.github.io/downloads
2. Drag SuperCollider.app to /Applications/

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install supercollider
```

**Windows:**
1. Download installer from https://supercollider.github.io/downloads
2. Run the installer

## Step 2: Install the MCP Server

```bash
cd /Users/bradanderson/Development/supercolider-mcp
npm install
npm run build
```

## Step 3: Test with MCP Inspector

```bash
npm run inspector
```

This opens a web interface at http://localhost:6274

### In the Inspector:

1. Click **"List Tools"** to see all available tools
2. Click **`sc_health_check`**
3. Click **"Execute"**

You should see:
```
✅ SuperCollider is installed and ready!
```

If not, follow the instructions provided.

## Step 4: Boot SuperCollider

1. Click **`sc_boot`**
2. Wait ~5 seconds for it to boot
3. You should see: "SuperCollider server booted successfully"

## Step 5: Play Your First Sound

1. Click **`sc_play_synth`**
2. Enter this in the description field:
   ```json
   {"description": "play a bell sound at C5"}
   ```
3. Click **"Execute"**

**You should hear a bell sound!** 🔔

## Step 6: Try More Sounds

**Kick drum:**
```json
{"description": "play a kick drum"}
```

**High sine tone:**
```json
{"description": "play a high pitched sine wave"}
```

**Sweep:**
```json
{"description": "play a sweep from 100hz to 2000hz"}
```

## Step 7: Create a Pattern

1. Click **`sc_play_pattern`**
2. Enter:
   ```json
   {
     "pattern": [
       {"synth": "kick", "delay": 0},
       {"synth": "hihat", "delay": 0.25, "amp": 0.2},
       {"synth": "snare", "delay": 0.25},
       {"synth": "hihat", "delay": 0.25, "amp": 0.2}
     ]
   }
   ```
3. Execute

You should hear a simple drum beat!

## Step 8: Clean Up

1. Click **`sc_stop_all`** to stop all sounds
2. Click **`sc_quit`** to shutdown the server

## Next Steps

### Use with Claude Desktop

See [Claude Setup Guide](claude-setup.md) to connect this to Claude Desktop.

### Explore More

- [Natural Language Synthesis](natural-language.md) - Learn all the descriptive terms
- [Pattern Examples](../examples/drum-patterns.md) - More complex rhythms
- [API Reference](../api/tools.md) - Complete tool documentation

### Having Issues?

- Run `sc_health_check` first
- Check [Troubleshooting Guide](troubleshooting.md)
- Look at `/tmp/sc-mcp-debug.log` for detailed logs

## Common First-Time Issues

**"SuperCollider not found"**
- Make sure you installed SuperCollider
- Try: `which sclang` (should show a path)
- Set `SCLANG_PATH` if needed

**"No sound"**
- Check system volume
- Verify audio output device
- On macOS: Grant microphone permissions if prompted

**"Server won't boot"**
- Close any open SuperCollider applications
- Kill existing processes: `killall sclang scsynth`
- Try booting again

## Summary

You've successfully:
- ✅ Installed and tested SuperCollider
- ✅ Booted the audio server
- ✅ Played sounds using natural language
- ✅ Created a rhythmic pattern
- ✅ Cleaned up and quit

Ready to integrate with Claude or build something more complex!
