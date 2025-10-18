# Architecture Overview

How the SuperCollider MCP Server works under the hood.

## System Architecture

```
┌─────────────────┐
│  Claude / User  │
└────────┬────────┘
         │ MCP Protocol
         │ (JSON-RPC over stdio)
         ▼
┌─────────────────────────────┐
│   MCP Server (Node.js)      │
│                             │
│  ┌──────────────────────┐   │
│  │  Tool Handlers       │   │
│  │  - sc_health_check   │   │
│  │  - sc_boot           │   │
│  │  - sc_play_synth     │   │
│  │  - sc_execute        │   │
│  │  - ...               │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │  SuperColliderServer │   │
│  │  - Process mgmt      │   │
│  │  - Code execution    │   │
│  └──────────┬───────────┘   │
│             │               │
│  ┌──────────▼───────────┐   │
│  │  Auto-Detection      │   │
│  │  - Find sclang       │   │
│  │  - Validate install  │   │
│  └──────────────────────┘   │
└─────────────┬───────────────┘
              │ spawn process
              ▼
┌──────────────────────────────┐
│  SuperCollider (sclang)      │
│                              │
│  ┌────────────────────────┐  │
│  │  Language Interpreter  │  │
│  └────────┬───────────────┘  │
│           │ boots & controls │
│  ┌────────▼───────────────┐  │
│  │  Audio Server (scsynth)│  │
│  │  - Synthesis engine    │  │
│  │  - Audio I/O           │  │
│  └────────┬───────────────┘  │
└───────────┼──────────────────┘
            │
            ▼
      ┌─────────────┐
      │  Audio Out  │ 🔊
      └─────────────┘
```

## Components

### 1. MCP Server Layer

**File:** `src/index.ts`

**Responsibilities:**
- Expose tools via MCP protocol
- Parse and validate tool arguments (using Zod)
- Route requests to appropriate handlers
- Format responses for Claude

**Key Exports:**
- `tools` - Array of tool definitions
- Request handlers for `tools/list` and `tools/call`

---

### 2. SuperCollider Server Manager

**File:** `src/supercollider.ts`

**Responsibilities:**
- Manage sclang process lifecycle
- Boot and quit the audio server
- Execute SuperCollider code
- Monitor server status
- Handle stdout/stderr streams

**Key Methods:**
```typescript
class SuperColliderServer extends EventEmitter {
  boot(): Promise<void>              // Start sclang & scsynth
  quit(): Promise<void>              // Gracefully shutdown
  executeCode(code: string): Promise<string>  // Send code to sclang
  getServerStatus(): Promise<object> // Query server state
  getBooted(): boolean               // Check if running
}
```

**Process Management:**
- Spawns `sclang` with `spawn()` from child_process
- Pipes stdin/stdout/stderr for communication
- Monitors boot sequence via stdout patterns
- Implements timeouts for safety

---

### 3. Auto-Detection System

**File:** `src/sc-paths.ts`

**Responsibilities:**
- Find SuperCollider installation
- Validate sclang is executable
- Provide platform-specific instructions

**Detection Strategy (in order):**
1. Check environment variables (`SCLANG_PATH`)
2. Search system PATH (`which sclang` / `where sclang`)
3. Check platform-specific common paths
4. Return null if not found

**Platform Paths:**
```typescript
const SC_PATHS = {
  darwin: ['/Applications/SuperCollider.app/...'],
  linux: ['/usr/bin/sclang', '/usr/local/bin/sclang'],
  win32: ['C:\\Program Files\\SuperCollider\\...']
};
```

---

### 4. Synth Library

**File:** `src/synth-library.ts`

**Responsibilities:**
- Define available synths
- Parse natural language descriptions
- Map descriptions to synth parameters

**Key Functions:**
```typescript
parseSynthDescription(description: string): {
  synthName: string;
  params: SynthParams;
}
```

**Natural Language Processing:**
- Pattern matching for synth types ("bell", "kick", etc.)
- Note name parsing (C4, D#5 → frequencies)
- Descriptive term mapping ("high" → freq * 2, "loud" → amp * 2)
- Duration extraction ("3 seconds" → duration: 3)

---

## Data Flow

### Boot Sequence

```
1. User calls sc_boot
2. MCP server validates request
3. SuperColliderServer.boot() called
4. Auto-detection finds sclang path
5. Validation checks sclang is executable
6. spawn('sclang', []) creates process
7. Monitor stdout for "Welcome to SuperCollider"
8. Send boot code: "s = Server.default; s.boot;"
9. Wait for "SuperCollider 3 server ready"
10. Resolve promise, mark as booted
11. Return success to user
```

### Sound Synthesis

```
1. User calls sc_play_synth with description
2. parseSynthDescription() analyzes text
3. Determines synth type & parameters
4. Builds inline SuperCollider code
5. executeCode() sends to sclang via stdin
6. sclang interprets and creates synth
7. scsynth generates audio
8. Audio routed to system output
9. Return success confirmation
```

### Code Execution

```
1. User calls sc_execute with code string
2. Validate sclang process exists
3. Write code + '\n' to stdin
4. Attach temporary stdout/stderr listeners
5. Wait 500ms for response
6. Remove listeners
7. Return captured output or error
```

---

## Communication Protocol

### MCP → Server

JSON-RPC 2.0 over stdio:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "sc_play_synth",
    "arguments": {
      "description": "play a bell sound"
    }
  }
}
```

### Server → SuperCollider

Plain text via stdin:

```supercollider
{ var sig = SinOsc.ar(440 + SinOsc.ar(1056, 0, 352), 0, 0.3) * EnvGen.kr(Env.perc(0.01, 1, 1, -4), doneAction: 2); Pan2.ar(sig, 0) }.play;
```

### SuperCollider → Server

Plain text via stdout/stderr:

```
-> Synth('temp__0' : 1000)
sc3>
```

---

## State Management

The server maintains minimal state:

```typescript
// Global state
const scServer = new SuperColliderServer();
let synthDefsLoaded = false;

// Per-instance state (in SuperColliderServer)
private sclangProcess: ChildProcess | null = null;
private isBooted = false;
private options: Required<SCServerOptions>;
```

**Why minimal state?**
- Each tool call is independent
- No session management needed
- SuperCollider manages its own state
- Stateless design is more robust

---

## Error Handling

### Levels of Error Handling

1. **Validation Layer** (MCP Server)
   - Zod schema validation
   - Check if server is booted
   - Validate required parameters

2. **Process Layer** (SuperColliderServer)
   - Check if sclang exists
   - Handle spawn errors
   - Timeout protection
   - Process crash detection

3. **Execution Layer** (Code Execution)
   - Parse stderr for SC errors
   - Timeout protection (500ms)
   - Graceful degradation

4. **Audio Layer** (SuperCollider)
   - SuperCollider's built-in error handling
   - Audio device errors
   - Synthesis errors

### Error Response Format

```typescript
{
  content: [{
    type: 'text',
    text: 'Error: <message>\n\n<instructions>'
  }],
  isError: true
}
```

Always includes helpful instructions for recovery.

---

## Performance Considerations

### Boot Time
- sclang compilation: ~200ms
- scsynth initialization: ~1-2s
- Total boot time: ~3-5s

### Synthesis Latency
- Code transmission: <1ms
- sclang parsing: ~5-10ms
- scsynth synth creation: ~5-10ms
- Audio buffer latency: ~10-20ms (depends on settings)
- **Total: ~30-50ms from call to sound**

### Resource Usage
- Memory: ~50MB (sclang) + ~30MB (scsynth)
- CPU: <5% idle, 10-30% during synthesis
- Each synth: ~1-10KB memory

### Scalability
- Max simultaneous synths: ~1024 (SC default)
- Recommended: <100 for stable performance
- Use `sc_stop_all` to clean up

---

## Security Considerations

### Code Execution
- **Risk:** User can execute arbitrary SuperCollider code
- **Mitigation:** SC runs in sandboxed audio context
- **Impact:** Limited to audio synthesis, no file system access by default

### Process Isolation
- sclang runs as child process
- Terminated when MCP server exits
- No persistent state between sessions

### Input Validation
- All inputs validated with Zod schemas
- Type checking enforced
- Parameter bounds not enforced (trust SuperCollider's limits)

---

## Extensibility

### Adding New Synths

1. Add synth code to `src/synth-library.ts`:
```typescript
export const SYNTH_DEFS = {
  // ...existing synths
  newsynth: `/* synth definition */`
};
```

2. Add to inline synth builder in `src/index.ts`:
```typescript
else if (synthName === 'newsynth') {
  code = `{ /* inline version */ }.play;`;
}
```

3. Update parser in `parseSynthDescription()` if needed

### Adding New Tools

1. Add tool definition to `tools` array:
```typescript
{
  name: 'sc_new_tool',
  description: '...',
  inputSchema: { /* zod schema */ }
}
```

2. Add case handler:
```typescript
case 'sc_new_tool': {
  // implementation
  return {
    content: [{ type: 'text', text: '...' }]
  };
}
```

### Platform Support

Add new platform to `src/sc-paths.ts`:
```typescript
const SC_PATHS = {
  // ...
  freebsd: ['/usr/local/bin/sclang']
};
```

---

## Design Decisions

### Why stdio transport?
- Standard MCP protocol
- Simple, reliable
- No network complexity
- Works with Claude Desktop

### Why inline synths vs. SynthDefs?
- SynthDef loading is complex (multi-line code)
- Inline is immediate and reliable
- Trade-off: slightly less efficient
- Decision: Prioritize reliability

### Why auto-detection?
- Better user experience
- Works out-of-box on most systems
- Fallback to env vars for flexibility
- Bomb-proof deployment

### Why minimal state?
- Easier to reason about
- No synchronization issues
- SuperCollider manages its own state
- Crashes don't corrupt state

---

## Future Enhancements

Potential improvements:

1. **OSC Communication**
   - Direct OSC to scsynth
   - Real-time parameter control
   - Lower latency

2. **SynthDef Management**
   - Proper multi-line SynthDef loading
   - SynthDef library
   - Custom UGen support

3. **Advanced Features**
   - MIDI I/O
   - Sample playback
   - Effects processing
   - Pattern scheduling

4. **Monitoring**
   - Real-time CPU monitoring
   - Active synth tracking
   - Audio level metering

5. **Multi-Server**
   - Multiple scsynth instances
   - supernova support
   - Load balancing

---

## See Also

- [Code Execution Details](execution.md)
- [Auto-Detection Algorithm](auto-detection.md)
- [Error Handling Strategy](errors.md)
