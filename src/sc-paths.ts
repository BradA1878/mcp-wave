import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

/**
 * Platform-specific paths where SuperCollider might be installed
 */
const SC_PATHS = {
  darwin: [
    '/Applications/SuperCollider.app/Contents/MacOS/sclang',
    '/Applications/SuperCollider/SuperCollider.app/Contents/MacOS/sclang',
    '~/Applications/SuperCollider.app/Contents/MacOS/sclang',
    '/usr/local/bin/sclang',
  ],
  linux: [
    '/usr/bin/sclang',
    '/usr/local/bin/sclang',
    '~/.local/bin/sclang',
    '/opt/supercollider/bin/sclang',
  ],
  win32: [
    'C:\\Program Files\\SuperCollider\\sclang.exe',
    'C:\\Program Files (x86)\\SuperCollider\\sclang.exe',
    process.env.LOCALAPPDATA + '\\SuperCollider\\sclang.exe',
  ],
};

/**
 * Find SuperCollider installation on the system
 */
export function findSuperCollider(): { sclangPath: string; scsynthPath: string } | null {
  const os = platform();

  // 1. Check environment variables first
  if (process.env.SCLANG_PATH && existsSync(process.env.SCLANG_PATH)) {
    const scsynthPath = process.env.SCSYNTH_PATH ||
      process.env.SCLANG_PATH.replace('sclang', 'scsynth');

    return {
      sclangPath: process.env.SCLANG_PATH,
      scsynthPath,
    };
  }

  // 2. Try to find sclang in PATH
  try {
    const whichCommand = os === 'win32' ? 'where' : 'which';
    const sclangPath = execSync(`${whichCommand} sclang`, { encoding: 'utf-8' }).trim().split('\n')[0];

    if (sclangPath && existsSync(sclangPath)) {
      const scsynthPath = sclangPath.replace('sclang', 'scsynth');
      return { sclangPath, scsynthPath };
    }
  } catch (e) {
    // Not in PATH, continue searching
  }

  // 3. Check platform-specific common installation paths
  const paths = SC_PATHS[os as keyof typeof SC_PATHS] || [];

  for (const path of paths) {
    const expandedPath = path.replace('~', process.env.HOME || '');

    if (existsSync(expandedPath)) {
      const scsynthPath = expandedPath.replace('sclang', 'scsynth');
      return { sclangPath: expandedPath, scsynthPath };
    }
  }

  return null;
}

/**
 * Get helpful error message for missing SuperCollider
 */
export function getInstallInstructions(): string {
  const os = platform();

  const instructions: Record<string, string> = {
    darwin: `
SuperCollider not found. To install:

1. Download from: https://supercollider.github.io/downloads
2. Drag SuperCollider.app to /Applications/
3. Restart this MCP server

Or set SCLANG_PATH environment variable:
  export SCLANG_PATH="/path/to/SuperCollider.app/Contents/MacOS/sclang"
`,
    linux: `
SuperCollider not found. To install:

Ubuntu/Debian:
  sudo apt-get install supercollider

Arch:
  sudo pacman -S supercollider

Or set SCLANG_PATH environment variable:
  export SCLANG_PATH="/path/to/sclang"
`,
    win32: `
SuperCollider not found. To install:

1. Download from: https://supercollider.github.io/downloads
2. Run the installer
3. Restart this MCP server

Or set SCLANG_PATH environment variable:
  set SCLANG_PATH="C:\\path\\to\\sclang.exe"
`,
  };

  return instructions[os] || 'SuperCollider not found. Please install from https://supercollider.github.io/downloads';
}

/**
 * Validate SuperCollider installation
 */
export function validateInstallation(sclangPath: string): { valid: boolean; error?: string } {
  // Check if file exists
  if (!existsSync(sclangPath)) {
    return {
      valid: false,
      error: `sclang not found at: ${sclangPath}`,
    };
  }

  // Try to get version
  try {
    const version = execSync(`"${sclangPath}" -v`, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: `sclang found but failed to execute. Error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
