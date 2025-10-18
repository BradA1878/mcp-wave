import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { appendFileSync } from 'fs';
import { findSuperCollider, getInstallInstructions, validateInstallation } from './sc-paths.js';

function log(message: string) {
  try {
    appendFileSync('/tmp/sc-mcp-debug.log', `${new Date().toISOString()} - ${message}\n`);
  } catch (e) {
    // Ignore logging errors
  }
}

export interface SCServerOptions {
  sclangPath?: string;
  scsynthPath?: string;
  port?: number;
}

export class SuperColliderServer extends EventEmitter {
  private sclangProcess: ChildProcess | null = null;
  private isBooted = false;
  private options: Required<SCServerOptions>;

  constructor(options: SCServerOptions = {}) {
    super();

    // Auto-detect SuperCollider if paths not provided
    let sclangPath = options.sclangPath;
    let scsynthPath = options.scsynthPath;

    if (!sclangPath) {
      const detected = findSuperCollider();
      if (!detected) {
        const instructions = getInstallInstructions();
        log(`SuperCollider not found. ${instructions}`);
        // Store null paths - will fail gracefully on boot
        sclangPath = '';
        scsynthPath = '';
      } else {
        sclangPath = detected.sclangPath;
        scsynthPath = detected.scsynthPath;
        log(`Auto-detected SuperCollider at: ${sclangPath}`);
      }
    }

    this.options = {
      sclangPath: sclangPath || '',
      scsynthPath: scsynthPath || '',
      port: options.port || 57120,
    };
  }

  async boot(): Promise<void> {
    log('=== BOOT CALLED ===');
    if (this.isBooted) {
      throw new Error('SuperCollider server is already running');
    }

    // Validate installation before attempting to boot
    if (!this.options.sclangPath) {
      const instructions = getInstallInstructions();
      throw new Error(`SuperCollider not found.\n\n${instructions}`);
    }

    const validation = validateInstallation(this.options.sclangPath);
    if (!validation.valid) {
      const instructions = getInstallInstructions();
      throw new Error(`${validation.error}\n\n${instructions}`);
    }

    return new Promise((resolve, reject) => {
      log(`Spawning sclang at: ${this.options.sclangPath}`);
      // Start sclang process in interactive mode
      // Using no flags for stdin mode
      this.sclangProcess = spawn(this.options.sclangPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let bootTimeout: NodeJS.Timeout;
      const sclangReadyPattern = /Welcome to SuperCollider/;
      const scsynthBootedPattern = /SuperCollider 3 server ready|Server 'localhost' running/;
      let sclangReady = false;
      let scsynthBooted = false;

      this.sclangProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        this.emit('stdout', output);
        log(`[STDOUT] ${output}`);

        if (!sclangReady && sclangReadyPattern.test(output)) {
          sclangReady = true;
          log('sclang is ready, booting scsynth...');

          // Boot the default server with audio configuration
          setTimeout(() => {
            if (this.sclangProcess?.stdin) {
              const bootCode = 's = Server.default; s.options.numOutputBusChannels = 2; s.options.numInputBusChannels = 2; s.boot;\n';
              log(`Sending boot code: ${bootCode}`);
              this.sclangProcess.stdin.write(bootCode);
            }
          }, 500);
        }

        if (sclangReady && !scsynthBooted && (output.includes('server ready') || output.includes('Server \'localhost\' running'))) {
          scsynthBooted = true;
          this.isBooted = true;
          clearTimeout(bootTimeout);
          log('scsynth booted successfully!');
          setTimeout(() => resolve(), 1000);
        }
      });

      this.sclangProcess.stderr?.on('data', (data) => {
        const err = data.toString();
        this.emit('stderr', err);
        log(`[STDERR] ${err}`);
      });

      this.sclangProcess.on('error', (error) => {
        clearTimeout(bootTimeout);
        reject(new Error(`Failed to start sclang: ${error.message}`));
      });

      this.sclangProcess.on('exit', (code) => {
        this.isBooted = false;
        this.emit('exit', code);
      });

      // Timeout after 30 seconds
      bootTimeout = setTimeout(() => {
        reject(new Error('SuperCollider boot timeout - check terminal for debug output'));
      }, 30000);
    });
  }

  async quit(): Promise<void> {
    if (!this.isBooted || !this.sclangProcess) {
      throw new Error('SuperCollider server is not running');
    }

    return new Promise((resolve) => {
      // Gracefully quit the server first
      this.executeCode('Server.default.quit;').then(() => {
        setTimeout(() => {
          this.sclangProcess?.kill();
          this.isBooted = false;
          resolve();
        }, 500);
      });
    });
  }

  async executeCode(code: string): Promise<string> {
    if (!this.sclangProcess?.stdin) {
      throw new Error('SuperCollider sclang process is not running');
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      const stdoutHandler = (data: Buffer) => {
        output += data.toString();
      };

      const stderrHandler = (data: Buffer) => {
        errorOutput += data.toString();
      };

      this.sclangProcess!.stdout?.on('data', stdoutHandler);
      this.sclangProcess!.stderr?.on('data', stderrHandler);

      // Send the code
      this.sclangProcess!.stdin!.write(code + '\n');

      // Wait for output (this is a simple approach; a more robust solution would parse responses)
      setTimeout(() => {
        this.sclangProcess!.stdout?.removeListener('data', stdoutHandler);
        this.sclangProcess!.stderr?.removeListener('data', stderrHandler);

        if (errorOutput) {
          reject(new Error(errorOutput));
        } else {
          resolve(output);
        }
      }, 500);
    });
  }

  async getServerStatus(): Promise<{
    running: boolean;
    avgCPU?: number;
    peakCPU?: number;
    numUGens?: number;
    numSynths?: number;
    numGroups?: number;
    numSynthDefs?: number;
  }> {
    if (!this.isBooted) {
      return { running: false };
    }

    try {
      await this.executeCode('Server.default.queryAllNodes;');
      return {
        running: true,
        // Note: Getting real-time stats requires OSC monitoring
        // This is a simplified version
      };
    } catch (error) {
      return { running: false };
    }
  }

  getBooted(): boolean {
    return this.isBooted;
  }
}
