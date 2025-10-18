# Setup Guide - Making it Work on Any Machine

This guide explains how the SuperCollider MCP server auto-detects installations and what to do if it doesn't work.

## How Auto-Detection Works

The server tries multiple methods to find SuperCollider:

1. **Environment Variables** (highest priority)
   - Checks `SCLANG_PATH` and `SCSYNTH_PATH`

2. **System PATH**
   - Runs `which sclang` (Linux/Mac) or `where sclang` (Windows)

3. **Common Installation Paths**
   - macOS: `/Applications/SuperCollider.app/Contents/MacOS/`
   - Linux: `/usr/bin/`, `/usr/local/bin/`, `/opt/supercollider/bin/`
   - Windows: `C:\Program Files\SuperCollider\`

## Testing Your Installation

### Step 1: Run Health Check

Before doing anything, run the health check:

```bash
# In MCP Inspector or Claude Desktop
sc_health_check
```

This will tell you:
- ✅ If SuperCollider is found and working
- ❌ If not found, with installation instructions for your platform
- ⚠️  If found but not working properly

### Step 2: If Health Check Fails

**Option A: Install SuperCollider**

Follow the platform-specific instructions from the health check output.

**Option B: Set Environment Variable**

If you have SuperCollider installed but it's not being detected:

**macOS/Linux**:
```bash
# Find where sclang is
find /Applications -name sclang 2>/dev/null
# or
which sclang

# Set the path
export SCLANG_PATH="/path/to/sclang"

# Add to your shell rc file to make it permanent
echo 'export SCLANG_PATH="/path/to/sclang"' >> ~/.zshrc  # or ~/.bashrc
```

**Windows (PowerShell)**:
```powershell
# Find sclang
Get-ChildItem -Path "C:\Program Files" -Filter "sclang.exe" -Recurse

# Set the path
$env:SCLANG_PATH = "C:\path\to\sclang.exe"

# Make it permanent (System Environment Variables)
[System.Environment]::SetEnvironmentVariable('SCLANG_PATH', 'C:\path\to\sclang.exe', 'User')
```

### Step 3: Restart

After setting environment variables:
1. Close and restart your terminal
2. Restart the MCP server (or Claude Desktop)
3. Run `sc_health_check` again

## Common Issues

### Issue: "SuperCollider not found"

**Solution**: Install SuperCollider or set `SCLANG_PATH`

### Issue: "sclang found but failed to execute"

**Possible causes**:
- Permissions issue (Linux): `chmod +x /path/to/sclang`
- Corrupted installation: Reinstall SuperCollider
- Missing dependencies (Linux): Install `libjack`, `libsndfile`, `libfftw3`

### Issue: "Server boots but no sound"

**On macOS**:
- Check System Preferences → Sound → Output Device
- Grant microphone permissions if prompted

**On Linux**:
- Check JACK/PulseAudio is running: `pulseaudio --check`
- Install JACK: `sudo apt-get install jackd2`

**On Windows**:
- Check audio device in Sound Settings
- Try different audio backend in SC Server options

### Issue: Works on your machine but not others

**Checklist**:
- [ ] Don't hardcode paths in code - use auto-detection
- [ ] Document required environment variables
- [ ] Test on clean VM or different machine
- [ ] Provide clear error messages with instructions

## For Developers

### Adding Support for New Platforms

Edit `src/sc-paths.ts` and add paths to `SC_PATHS` object:

```typescript
const SC_PATHS = {
  darwin: [/* macOS paths */],
  linux: [/* Linux paths */],
  win32: [/* Windows paths */],
  freebsd: [/* Add FreeBSD paths here */],
};
```

### Testing Auto-Detection

```typescript
import { findSuperCollider, validateInstallation } from './sc-paths.js';

const detected = findSuperCollider();
console.log('Found:', detected);

if (detected) {
  const validation = validateInstallation(detected.sclangPath);
  console.log('Valid:', validation.valid);
}
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SCLANG_PATH` | Path to sclang executable | `/Applications/SuperCollider.app/Contents/MacOS/sclang` |
| `SCSYNTH_PATH` | Path to scsynth executable (optional, auto-derived from sclang) | `/Applications/SuperCollider.app/Contents/MacOS/scsynth` |

## Platform-Specific Notes

### macOS
- App bundle structure: `SuperCollider.app/Contents/MacOS/sclang`
- May need to grant audio permissions first time
- Works with both Intel and Apple Silicon

### Linux
- Requires JACK or PulseAudio
- Package names vary by distro (supercollider, sc3-plugins, etc.)
- May need to add user to `audio` group

### Windows
- Installer typically puts it in `C:\Program Files\SuperCollider\`
- May need to run as administrator first time
- ASIO4ALL recommended for better latency

## Bomb-Proof Checklist

✅ Auto-detects common installation paths
✅ Supports environment variable overrides
✅ Validates installation before attempting to use it
✅ Provides platform-specific error messages
✅ Health check tool for troubleshooting
✅ Graceful error handling with helpful instructions
✅ Works on macOS, Linux, and Windows
✅ No hardcoded paths
✅ Clear documentation for all platforms

## Getting Help

If you're still having issues:

1. Run `sc_health_check` and share the output
2. Check `/tmp/sc-mcp-debug.log` (Mac/Linux) for detailed logs
3. Open an issue with:
   - Your OS and version
   - SuperCollider version
   - Output of `sc_health_check`
   - Any error messages
