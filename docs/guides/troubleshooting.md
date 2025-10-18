# Troubleshooting Guide

Solutions to common issues with the SuperCollider MCP server.

## Diagnostic Steps

### Always Start Here

1. **Run health check:**
   ```
   sc_health_check
   ```
   This will tell you exactly what's wrong.

2. **Check the debug log:**
   ```bash
   cat /tmp/sc-mcp-debug.log
   ```
   (macOS/Linux) or check `%TEMP%\sc-mcp-debug.log` (Windows)

3. **Verify SuperCollider works standalone:**
   ```bash
   sclang -v
   ```

---

## Installation Issues

### "SuperCollider not found"

**Symptoms:**
- `sc_health_check` returns error
- `sc_boot` fails with "not found" error

**Solutions:**

**Option 1: Install SuperCollider**
- macOS: Download from https://supercollider.github.io/downloads
- Linux: `sudo apt-get install supercollider`
- Windows: Run installer from website

**Option 2: Set SCLANG_PATH**
```bash
# Find where it's installed
find /Applications -name sclang 2>/dev/null  # macOS
which sclang  # Linux
where sclang  # Windows

# Set environment variable
export SCLANG_PATH="/path/to/sclang"  # macOS/Linux
set SCLANG_PATH=C:\path\to\sclang.exe  # Windows
```

**Option 3: Add to PATH**
```bash
# macOS
export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"

# Add to ~/.zshrc or ~/.bashrc to make permanent
echo 'export PATH="/Applications/SuperCollider.app/Contents/MacOS:$PATH"' >> ~/.zshrc
```

---

### "sclang found but failed to execute"

**Symptoms:**
- `sc_health_check` finds sclang but validation fails
- Permission errors

**Solutions:**

**Make executable (Linux/macOS):**
```bash
chmod +x /path/to/sclang
```

**Check dependencies (Linux):**
```bash
# Ubuntu/Debian
sudo apt-get install libjack-jackd2-0 libsndfile1 libfftw3-bin

# Arch
sudo pacman -S jack2 libsndfile fftw
```

**Run as administrator (Windows):**
- Right-click sclang.exe
- Properties → Compatibility
- Check "Run as administrator"

---

## Boot Issues

### "Server boot timeout"

**Symptoms:**
- `sc_boot` hangs for 30 seconds then fails
- Debug log shows "Spawning sclang..." but no "scsynth booted"

**Solutions:**

**1. Kill existing processes:**
```bash
killall sclang scsynth  # macOS/Linux
taskkill /IM sclang.exe /F  # Windows
taskkill /IM scsynth.exe /F  # Windows
```

**2. Check if another SuperCollider is running:**
- Close SuperCollider IDE if open
- Check Activity Monitor (Mac) / Task Manager (Windows) for sc processes

**3. Increase timeout (for slow machines):**
Edit `src/supercollider.ts`, change:
```typescript
bootTimeout = setTimeout(() => {
  reject(new Error('SuperCollider boot timeout...'));
}, 30000);  // Increase from 30000 to 60000
```

**4. Check audio permissions (macOS):**
- System Preferences → Security & Privacy → Privacy → Microphone
- Enable for Terminal or your app

---

### "Server 'localhost' running" but no sound

**Symptoms:**
- Server boots successfully
- `sc_play_synth` returns success
- No audio output

**Solutions:**

**1. Check system volume:**
- Not muted
- Output device is correct

**2. Verify audio device (macOS):**
```supercollider
// In SuperCollider IDE or via sc_execute:
ServerOptions.devices;  // List devices
Server.default.options.device = "MacBook Pro Speakers";  // Set device
```

**3. Test audio directly:**
```supercollider
// Use sc_execute with this code:
{ SinOsc.ar(440, 0, 0.5) }.play;
```
If you hear this, the issue is with the synth definitions.

**4. Check audio backend (Linux):**
```bash
# PulseAudio
pulseaudio --check
pulseaudio --start

# JACK
jack_control start
```

**5. Restart CoreAudio (macOS):**
```bash
sudo killall coreaudiod
```

---

## Claude Desktop Integration Issues

### "MCP server not found" in Claude

**Solutions:**

**1. Verify config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**2. Check JSON syntax:**
```json
{
  "mcpServers": {
    "supercollider": {
      "command": "node",
      "args": [
        "/absolute/path/to/dist/index.js"
      ]
    }
  }
}
```
- Must be absolute path, not relative
- Forward slashes on Windows: `C:/path/to/file.js`

**3. Verify file exists:**
```bash
ls /Users/bradanderson/Development/supercolider-mcp/dist/index.js
```

**4. Test manually:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node /path/to/dist/index.js
```
Should output tool list.

**5. Restart Claude Desktop:**
- Completely quit (not just close window)
- Reopen

**6. Check Claude logs:**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
Get-Content $env:APPDATA\Claude\Logs\mcp*.log -Tail 50 -Wait
```

---

### "Connection errors" or tools not appearing

**Solutions:**

**1. Rebuild the server:**
```bash
cd /Users/bradanderson/Development/supercolider-mcp
npm run build
```

**2. Check Node.js version:**
```bash
node --version  # Should be 18+
```

**3. Clear npm cache:**
```bash
npm clean-install
npm run build
```

**4. Test with inspector first:**
```bash
npm run inspector
```
If it works there but not in Claude, it's a Claude config issue.

---

## Synthesis Issues

### Synth plays but wrong sound

**Causes:**
- Natural language parsing picked wrong synth
- Parameters out of range

**Solutions:**

**Use `sc_play_synth_advanced` for precision:**
```json
{
  "synthName": "bell",
  "freq": 440,
  "amp": 0.3,
  "duration": 1
}
```

**Check parsed parameters:**
The tool returns what it parsed:
```
Playing bell synth: {"freq":523.25,"amp":0.3,"duration":1,"pan":0}
```

---

### Pattern doesn't play or cuts off

**Causes:**
- Pattern delays too short
- Too many simultaneous synths
- Missing required fields

**Solutions:**

**1. Check delay values:**
```json
{
  "pattern": [
    {"synth": "kick", "delay": 0},      // Plays immediately
    {"synth": "snare", "delay": 0.5},   // Waits 0.5s, then plays
    {"synth": "kick", "delay": 0.5}     // Waits another 0.5s, then plays
  ]
}
```

**2. Limit concurrent synths:**
- Call `sc_stop_all` between patterns
- Keep patterns under ~100 events

**3. Add duration to prevent overlap:**
```json
{"synth": "bell", "freq": 440, "duration": 0.3, "delay": 0.5}
```

---

## Recording Issues

### "Recording stopped" but no file

**Causes:**
- Recording never started
- Path doesn't exist
- Permissions issue

**Solutions:**

**1. Create recordings directory:**
```bash
mkdir -p recordings
```

**2. Check permissions:**
```bash
ls -la recordings/
```

**3. Use absolute path:**
Instead of `"session.wav"`, use `"/full/path/to/session.wav"`

**4. Check SuperCollider recording path:**
```supercollider
// Via sc_execute:
Platform.recordingsDir;  // Shows where SC saves recordings
```

---

## Performance Issues

### Audio glitches or dropouts

**Causes:**
- CPU overload
- Buffer size too small
- Too many synths

**Solutions:**

**1. Increase buffer size:**
```supercollider
// Via sc_execute before booting:
Server.default.options.blockSize = 256;  // Default is 64
Server.default.options.numBuffers = 2048;  // Default is 1024
```

**2. Stop unused synths:**
```
sc_stop_all
```

**3. Reduce synthesis complexity:**
- Use simpler synths
- Lower polyphony
- Reduce effects processing

---

## Platform-Specific Issues

### macOS: "Operation not permitted"

**Cause:** Sandboxing or permissions

**Solution:**
- System Preferences → Security & Privacy → Full Disk Access
- Add Terminal or your app

---

### Linux: "JACK server is not running"

**Solution:**
```bash
# Start JACK
jack_control start

# Or use PulseAudio
pulseaudio --start

# Configure SC to use PulseAudio
# In sc_execute:
Server.default.options.device = "default";
```

---

### Windows: "Audio device not found"

**Solutions:**

**1. Install ASIO4ALL:**
- Download from http://www.asio4all.org/
- Improves latency and stability

**2. Set audio device:**
```supercollider
// Via sc_execute:
ServerOptions.devices;  // List available devices
Server.default.options.device = "Primary Sound Driver";
```

---

## Getting More Help

### Debug Log Analysis

The debug log (`/tmp/sc-mcp-debug.log`) shows:
- When boot was called
- Full sclang output
- Any errors from SuperCollider
- Boot success/failure

Look for:
- `[STDERR]` lines - errors from SuperCollider
- `ERROR:` lines - SuperCollider syntax errors
- Last timestamp - when it stopped responding

### Reporting Issues

When asking for help, include:

1. **System info:**
   - OS and version
   - SuperCollider version: `sclang -v`
   - Node.js version: `node --version`

2. **Output from:**
   ```
   sc_health_check
   ```

3. **Debug log:**
   ```bash
   tail -50 /tmp/sc-mcp-debug.log
   ```

4. **What you tried:**
   - Exact command or tool call
   - Expected vs actual result
   - Any error messages

---

## Still Stuck?

1. Search existing issues on GitHub
2. Check SuperCollider forums for SC-specific issues
3. Open a new issue with all diagnostic info above
4. Join the MCP community Discord

---

## Quick Reference

| Issue | Command to diagnose |
|-------|---------------------|
| Is SC installed? | `sc_health_check` |
| Server won't boot | Check `/tmp/sc-mcp-debug.log` |
| No sound | Test with `{ SinOsc.ar(440, 0, 0.5) }.play;` via `sc_execute` |
| Claude can't connect | Check Claude logs in `~/Library/Logs/Claude/` |
| Synths hanging | `sc_stop_all` |
| Need to restart | `sc_quit` then `sc_boot` |
