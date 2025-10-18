# Using SuperCollider MCP with Claude Desktop & Claude Code

## Option 1: Claude Desktop

### Step 1: Find Your Config File

The config file location depends on your OS:

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### Step 2: Edit the Config

Open the file in a text editor. If it doesn't exist, create it with this content:

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

**⚠️ IMPORTANT**: Replace `/Users/bradanderson/Development/supercolider-mcp/dist/index.js` with the **absolute path** to your project!

To get the absolute path:
```bash
cd /Users/bradanderson/Development/supercolider-mcp
pwd  # Copy this output
# Then append /dist/index.js
```

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop (not just close the window).

### Step 4: Verify It's Working

In a new conversation with Claude, ask:

> "Can you check if the SuperCollider MCP server is available? Run sc_health_check"

Claude should be able to:
- See the `sc_health_check` tool
- Run it and confirm SuperCollider is installed
- Boot the server with `sc_boot`
- Play sounds with `sc_play_synth`

### Step 5: Try It Out!

> "Boot SuperCollider and play a bell sound at C5"

You should hear a bell! 🔔

---

## Option 2: Claude Code (CLI)

Claude Code automatically discovers MCP servers in your project.

### Step 1: Add MCP Config to Your Project

Create a `.claude/mcp.json` file in your project root:

```bash
cd /Users/bradanderson/Development/supercolider-mcp
mkdir -p .claude
```

Create `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": ["./dist/index.js"]
    }
  }
}
```

### Step 2: Build the Project

```bash
npm run build
```

### Step 3: Start Claude Code in This Directory

```bash
cd /Users/bradanderson/Development/supercolider-mcp
claude
```

Claude Code will automatically discover and load the MCP server!

### Step 4: Test It

In Claude Code, try:

> "Run sc_health_check to verify SuperCollider is installed"

> "Boot SuperCollider and play a kick drum"

---

## Example Prompts to Try

Once connected, try these with Claude:

### Basic Sounds
- "Boot SuperCollider and play a bell sound"
- "Play a kick drum, then a snare"
- "Play a high-pitched sine wave at 880 Hz"

### Musical Phrases
- "Create a simple 4-beat drum pattern"
- "Play a melody using bell sounds: C4, E4, G4, C5"
- "Make an atmospheric soundscape"

### Advanced
- "Boot SuperCollider, play a sweep from 100Hz to 2000Hz, then stop all sounds"
- "Create a techno kick drum pattern with hi-hats"
- "Execute this SuperCollider code: { SinOsc.ar([440, 442], 0, 0.2) }.play;"

---

## Troubleshooting

### "MCP server not found" in Claude Desktop

1. Check the config file path is correct for your OS
2. Verify the absolute path to `dist/index.js` is correct
3. Make sure you **restarted** Claude Desktop (quit completely)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\Logs\mcp*.log`

### "Command failed" or connection errors

1. Verify Node.js is installed: `node --version`
2. Check the project built successfully: `ls dist/index.js`
3. Test the server manually:
   ```bash
   cd /Users/bradanderson/Development/supercolider-mcp
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
   ```
   Should output a list of tools.

### SuperCollider-specific issues

If Claude connects but can't boot SuperCollider:

1. Ask Claude to run: `sc_health_check`
2. Follow any instructions it provides
3. Check SuperCollider is installed: `which sclang` (Mac/Linux)

### Permission errors

On macOS, you might need to give Terminal/Claude Desktop microphone access:
- System Preferences → Security & Privacy → Privacy → Microphone
- Enable for Terminal and/or Claude

---

## Multiple MCP Servers

You can run multiple MCP servers at once! Your config can look like:

```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": ["/path/to/supercollider-mcp/dist/index.js"]
    },
    "midi": {
      "command": "node",
      "args": ["/path/to/midi-mcp/dist/index.js"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
    }
  }
}
```

---

## Development Workflow

For active development:

1. **Terminal 1**: Watch mode
   ```bash
   npm run dev
   ```

2. **Terminal 2**: Test with inspector
   ```bash
   npm run inspector
   ```

3. When ready, update Claude Desktop:
   ```bash
   npm run build
   # Restart Claude Desktop
   ```

---

## Environment Variables in Claude Desktop

If you need to set `SCLANG_PATH` for Claude Desktop to see it:

**macOS/Linux** - Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "SCLANG_PATH": "/custom/path/to/sclang"
      }
    }
  }
}
```

**Windows** - Same structure:
```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": ["C:\\path\\to\\dist\\index.js"],
      "env": {
        "SCLANG_PATH": "C:\\custom\\path\\to\\sclang.exe"
      }
    }
  }
}
```

---

## Next Steps

Once you have it working:

1. **Explore the tools**: Ask Claude "What SuperCollider tools do you have?"
2. **Make music**: Have Claude compose something creative
3. **Integrate with MXF**: Connect to your Model Exchange Framework
4. **Build more MCP servers**: MIDI, DAW control, etc.

Happy music making! 🎵
