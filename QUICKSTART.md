# Quick Start Guide

## Test the Server

1. **Build the project** (already done):
   ```bash
   npm run build
   ```

2. **Test with MCP Inspector**:
   ```bash
   npm run inspector
   ```

   This opens a web interface where you can test all the tools interactively.

3. **Add to Claude Desktop**:

   Edit your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "supercollider": {
         "command": "node",
         "args": [
           "/Users/bradanderson/Development/supercolider-mcp/dist/index.js"
         ]
       }
     }
   }
   ```

   **Important**: Replace the path with your actual absolute path!

4. **Restart Claude Desktop**

## First Commands

Once connected, try these in Claude Desktop:

**Boot the server:**
> "Boot the SuperCollider server"

**Play a sound:**
> "Play a bell sound at C5"

**Create a rhythm:**
> "Play a kick drum pattern with a snare on the offbeat"

**Custom synthesis:**
> "Play a sweep from 100hz to 2000hz over 3 seconds"

**Stop everything:**
> "Stop all synths"

**Quit when done:**
> "Quit the SuperCollider server"

## Example Session

```
You: Boot SuperCollider and play me some sounds

Claude: [Boots server]
Let me play a few different sounds for you:
[Plays bell]
[Plays bass]
[Plays atmospheric pad]

You: Now create a simple beat

Claude: [Creates pattern with kick, snare, hihat]

You: Make it more complex

Claude: [Adds variations and fills]

You: Record this

Claude: [Starts recording]
[Plays pattern]
[Stops recording]
Recording saved to recordings/beat.wav
```

## Available Synths

- **sine** - Pure tone
- **pluck** - Guitar/string
- **bell** - Metallic chime
- **bass** - Deep low-end
- **pad** - Warm ambient
- **kick** - Bass drum
- **snare** - Snare drum
- **hihat** - Hi-hat cymbal
- **atmosphere** - Ambient noise
- **sweep** - Frequency riser

## Tips for AI Interaction

When working with Claude:

1. **Always boot first**: "Boot SuperCollider"
2. **Use natural language**: "Play a dreamy bell sound"
3. **Be specific about timing**: "Play for 3 seconds"
4. **Mention pitch**: "Play at A4" or "Play a high tone"
5. **Create patterns**: "Play kick, snare, kick, snare with 0.5 second delays"
6. **Record your work**: "Start recording as beat.wav"
7. **Clean up**: "Stop all sounds" and "Quit SuperCollider"

## Troubleshooting

**Can't find sclang:**
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"
```

**Server won't boot:**
- Close any open SuperCollider applications
- Check Activity Monitor for stray scsynth processes
- Try running `sclang` directly in terminal to verify it works

**No sound:**
- Check system volume
- Verify SuperCollider audio device is correct
- Test with: `{ SinOsc.ar(440, 0, 0.2) }.play;` in sclang

**MCP connection issues:**
- Verify the path in config is absolute, not relative
- Check Claude Desktop logs: `tail -f ~/Library/Logs/Claude/mcp*.log`
- Restart Claude Desktop after config changes

## Next Steps

1. Try all the example sounds
2. Experiment with pattern creation
3. Record some compositions
4. Write custom SuperCollider code with `sc_execute`
5. Integrate with your MXF system for multi-agent music
6. Add MIDI MCP server for external control

Enjoy making music with AI!
