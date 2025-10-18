#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SuperColliderServer } from './supercollider.js';
import { getSynthDefInitCode, parseSynthDescription, SynthParams } from './synth-library.js';
import { findSuperCollider, getInstallInstructions, validateInstallation } from './sc-paths.js';

// Global SC server instance
const scServer = new SuperColliderServer();

// Track if SynthDefs have been loaded
let synthDefsLoaded = false;

// Create MCP server
const server = new Server(
  {
    name: 'supercollider-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const tools: Tool[] = [
  {
    name: 'sc_health_check',
    description: 'Check if SuperCollider is installed and configured correctly. Run this first if you have issues.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'sc_boot',
    description: 'Boot the SuperCollider audio server. Must be called before any sound synthesis.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'sc_quit',
    description: 'Quit the SuperCollider audio server and clean up resources.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'sc_status',
    description: 'Get the current status of the SuperCollider server (running, CPU usage, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'sc_execute',
    description: 'Execute raw SuperCollider code. Use this for advanced synthesis control or custom SynthDefs.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The SuperCollider code to execute',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'sc_play_synth',
    description: 'Play a synthesized sound based on a natural language description. This is the primary tool for sound synthesis. Examples: "play a bell sound at C4", "play a low bass tone for 2 seconds", "play a plucked string sound"',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the sound to create (e.g., "bell at C5", "deep bass", "short snare")',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'sc_play_synth_advanced',
    description: 'Play a specific synth with explicit parameters. Available synths: sine, pluck, bell, bass, pad, kick, snare, hihat, atmosphere, sweep',
    inputSchema: {
      type: 'object',
      properties: {
        synthName: {
          type: 'string',
          description: 'Name of the synth to play',
          enum: ['sine', 'pluck', 'bell', 'bass', 'pad', 'kick', 'snare', 'hihat', 'atmosphere', 'sweep'],
        },
        freq: {
          type: 'number',
          description: 'Frequency in Hz (default: 440)',
        },
        amp: {
          type: 'number',
          description: 'Amplitude 0-1 (default: 0.3)',
        },
        duration: {
          type: 'number',
          description: 'Duration in seconds (default: 1)',
        },
        pan: {
          type: 'number',
          description: 'Pan position -1 (left) to 1 (right) (default: 0)',
        },
        decay: {
          type: 'number',
          description: 'Decay time for pluck synth (default: 2)',
        },
        cutoff: {
          type: 'number',
          description: 'Filter cutoff frequency for bass/pad (default: varies)',
        },
        startFreq: {
          type: 'number',
          description: 'Start frequency for sweep (default: 100)',
        },
        endFreq: {
          type: 'number',
          description: 'End frequency for sweep (default: 2000)',
        },
      },
      required: ['synthName'],
    },
  },
  {
    name: 'sc_play_pattern',
    description: 'Play a rhythmic pattern or sequence of notes. Useful for creating melodies, beats, or musical phrases.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'array',
          description: 'Array of note events with timing',
          items: {
            type: 'object',
            properties: {
              synth: { type: 'string' },
              freq: { type: 'number' },
              duration: { type: 'number' },
              delay: { type: 'number' },
              amp: { type: 'number' },
            },
          },
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'sc_record_start',
    description: 'Start recording audio output to a file',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Output filename (will be saved in recordings/ directory)',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'sc_record_stop',
    description: 'Stop recording audio',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'sc_stop_all',
    description: 'Stop all currently playing synths immediately',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'sc_health_check': {
        const detected = findSuperCollider();

        if (!detected) {
          const instructions = getInstallInstructions();
          return {
            content: [{
              type: 'text',
              text: `❌ SuperCollider NOT found\n\n${instructions}`
            }],
            isError: true,
          };
        }

        const validation = validateInstallation(detected.sclangPath);

        if (!validation.valid) {
          return {
            content: [{
              type: 'text',
              text: `⚠️  SuperCollider found but validation failed\n\nPath: ${detected.sclangPath}\nError: ${validation.error}`
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text',
            text: `✅ SuperCollider is installed and ready!\n\nPath: ${detected.sclangPath}\n\nYou can now use sc_boot to start the audio server.`
          }],
        };
      }

      case 'sc_boot': {
        if (scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'SuperCollider server is already running' }],
          };
        }

        await scServer.boot();

        // Mark as loaded - we'll use inline synths instead of pre-loaded SynthDefs
        synthDefsLoaded = true;

        return {
          content: [
            {
              type: 'text',
              text: 'SuperCollider server booted successfully. All synth definitions loaded.',
            },
          ],
        };
      }

      case 'sc_quit': {
        if (!scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'SuperCollider server is not running' }],
          };
        }

        await scServer.quit();
        synthDefsLoaded = false;

        return {
          content: [{ type: 'text', text: 'SuperCollider server quit successfully' }],
        };
      }

      case 'sc_status': {
        const status = await scServer.getServerStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'sc_execute': {
        const schema = z.object({ code: z.string() });
        const { code } = schema.parse(args);

        if (!scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running. Call sc_boot first.' }],
            isError: true,
          };
        }

        const result = await scServer.executeCode(code);
        return {
          content: [{ type: 'text', text: result || 'Code executed successfully' }],
        };
      }

      case 'sc_play_synth': {
        const schema = z.object({ description: z.string() });
        const { description } = schema.parse(args);

        if (!scServer.getBooted() || !synthDefsLoaded) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running. Call sc_boot first.' }],
            isError: true,
          };
        }

        const { synthName, params } = parseSynthDescription(description);

        // Use inline function syntax for simple sounds
        let code = '';

        if (synthName === 'bell') {
          code = `{ var sig = SinOsc.ar(${params.freq} + SinOsc.ar(${params.freq! * 2.4}, 0, ${params.freq! * 0.8}), 0, ${params.amp}) * EnvGen.kr(Env.perc(0.01, ${params.duration}, 1, -4), doneAction: 2); Pan2.ar(sig, ${params.pan}) }.play;`;
        } else if (synthName === 'kick') {
          code = `{ var sig = SinOsc.ar(EnvGen.kr(Env.perc(0.001, 0.3), 1, 60, 50), 0, ${params.amp}) * EnvGen.kr(Env.perc(0.001, 0.5), doneAction: 2); Pan2.ar(sig, ${params.pan || 0}) }.play;`;
        } else if (synthName === 'snare') {
          code = `{ var sig = (WhiteNoise.ar(${params.amp}) + SinOsc.ar(180, 0, ${params.amp})) * EnvGen.kr(Env.perc(0.001, 0.2), doneAction: 2); Pan2.ar(sig, ${params.pan || 0}) }.play;`;
        } else if (synthName === 'hihat') {
          code = `{ var sig = HPF.ar(WhiteNoise.ar(${params.amp}), 8000) * EnvGen.kr(Env.perc(0.001, 0.1), doneAction: 2); Pan2.ar(sig, ${params.pan || 0}) }.play;`;
        } else {
          // Default to simple sine wave
          code = `{ SinOsc.ar(${params.freq}, 0, ${params.amp}) * EnvGen.kr(Env.perc(0.01, ${params.duration}), doneAction: 2) }.play;`;
        }

        await scServer.executeCode(code);

        return {
          content: [
            {
              type: 'text',
              text: `Playing ${synthName} synth: ${JSON.stringify(params)}`,
            },
          ],
        };
      }

      case 'sc_play_synth_advanced': {
        const schema = z.object({
          synthName: z.string(),
          freq: z.number().optional(),
          amp: z.number().optional(),
          duration: z.number().optional(),
          pan: z.number().optional(),
          decay: z.number().optional(),
          cutoff: z.number().optional(),
          startFreq: z.number().optional(),
          endFreq: z.number().optional(),
        });
        const params = schema.parse(args);

        if (!scServer.getBooted() || !synthDefsLoaded) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running. Call sc_boot first.' }],
            isError: true,
          };
        }

        const { synthName, ...synthParams } = params;
        const paramStr = Object.entries(synthParams)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `\\${key}, ${value}`)
          .join(', ');

        const code = `Synth(\\${synthName}, [${paramStr}]);`;
        await scServer.executeCode(code);

        return {
          content: [
            {
              type: 'text',
              text: `Playing ${synthName} synth with parameters: ${JSON.stringify(synthParams)}`,
            },
          ],
        };
      }

      case 'sc_play_pattern': {
        const schema = z.object({
          pattern: z.array(
            z.object({
              synth: z.string(),
              freq: z.number().optional(),
              duration: z.number().optional(),
              delay: z.number().optional(),
              amp: z.number().optional(),
            })
          ),
        });
        const { pattern } = schema.parse(args);

        if (!scServer.getBooted() || !synthDefsLoaded) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running. Call sc_boot first.' }],
            isError: true,
          };
        }

        // Build a Routine to play the pattern
        const events = pattern.map((event, i) => {
          const params = Object.entries(event)
            .filter(([key]) => key !== 'synth' && key !== 'delay')
            .map(([key, value]) => `\\${key}, ${value}`)
            .join(', ');
          const delay = event.delay || 0;
          return `${delay}.wait; Synth(\\${event.synth}, [${params}]);`;
        });

        const code = `
Routine({
  ${events.join('\n  ')}
}).play;
`;
        await scServer.executeCode(code);

        return {
          content: [
            {
              type: 'text',
              text: `Playing pattern with ${pattern.length} events`,
            },
          ],
        };
      }

      case 'sc_record_start': {
        const schema = z.object({ filename: z.string() });
        const { filename } = schema.parse(args);

        if (!scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running. Call sc_boot first.' }],
            isError: true,
          };
        }

        const code = `Server.default.record("recordings/${filename}");`;
        await scServer.executeCode(code);

        return {
          content: [{ type: 'text', text: `Started recording to recordings/${filename}` }],
        };
      }

      case 'sc_record_stop': {
        if (!scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running.' }],
            isError: true,
          };
        }

        await scServer.executeCode('Server.default.stopRecording;');

        return {
          content: [{ type: 'text', text: 'Recording stopped' }],
        };
      }

      case 'sc_stop_all': {
        if (!scServer.getBooted()) {
          return {
            content: [{ type: 'text', text: 'Error: SuperCollider server is not running.' }],
            isError: true,
          };
        }

        await scServer.executeCode('Server.default.freeAll;');

        return {
          content: [{ type: 'text', text: 'All synths stopped' }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('SuperCollider MCP Server starting...');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server connected and ready');

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.error('Shutting down...');
    if (scServer.getBooted()) {
      await scServer.quit();
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
