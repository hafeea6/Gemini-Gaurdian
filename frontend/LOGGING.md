# Logging Guide - Gemini Guardian Frontend

This guide explains how to use the centralized logging system in the Next.js frontend.

## 🎯 Overview

The frontend logging system provides:

- ✅ **Structured logging** with levels (DEBUG, INFO, WARN, ERROR)
- ✅ **Console output** with color-coded messages
- ✅ **File logging** for persistent logs (optional)
- ✅ **VS Code debug console integration**
- ✅ **Type-safe** logging with TypeScript

## 🚀 Quick Start

### 1. Create a Logger Instance

```typescript
import { createLogger } from "@/lib/logger";

const logger = createLogger("MyComponent");
```

### 2. Use the Logger

```typescript
// Info level - general information
logger.info("User clicked button", { userId: "123" });

// Debug level - detailed debugging info
logger.debug("State updated", { oldValue: 1, newValue: 2 });

// Warning level - potential issues
logger.warn("API rate limit approaching", { remaining: 10 });

// Error level - errors and exceptions
logger.error("Failed to fetch data", error, { endpoint: "/api/data" });
```

## 📝 Log Levels

| Level   | Priority | Use Case                                     |
| ------- | -------- | -------------------------------------------- |
| `DEBUG` | Lowest   | Detailed debugging information               |
| `INFO`  | Normal   | General informational messages               |
| `WARN`  | Medium   | Warning messages for potential issues        |
| `ERROR` | Highest  | Error messages for failures and exceptions   |

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Minimum log level (DEBUG, INFO, WARN, ERROR)
NEXT_PUBLIC_LOG_LEVEL=DEBUG

# Enable file logging (true/false)
NEXT_PUBLIC_ENABLE_FILE_LOGGING=true

# Log directory (relative to project root)
NEXT_PUBLIC_LOG_DIR=logs
```

### Example `.env.local` for Development

```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG
NEXT_PUBLIC_ENABLE_FILE_LOGGING=true
NEXT_PUBLIC_LOG_DIR=logs
```

### Example `.env.local` for Production

```bash
NEXT_PUBLIC_LOG_LEVEL=WARN
NEXT_PUBLIC_ENABLE_FILE_LOGGING=false
```

## 🐛 VS Code Debugging

### Launch Configurations

The project includes VS Code launch configurations in [`.vscode/launch.json`](../.vscode/launch.json):

#### Debug Next.js Server
```
Debug > Next.js: Debug Server (Frontend)
```
Starts the Next.js dev server with debugging enabled. Logs appear in the integrated terminal.

#### Debug Browser Client
```
Debug > Next.js: Debug Client (Frontend)
```
Launches Chrome with debugging attached to the frontend.

#### Debug Full Stack
```
Debug > Full Stack: Debug Both
```
Starts both frontend and backend with debugging enabled.

### How to Debug

1. **Open VS Code**
2. **Go to Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select a configuration** from the dropdown
4. **Click the green play button** or press F5
5. **View logs** in the Debug Console panel

### Viewing Logs in VS Code

- **Debug Console**: View runtime logs while debugging
- **Terminal**: View server-side logs in the integrated terminal
- **Output Panel**: View extension and language server logs

## 📁 File Logging

### Enable File Logging

Set in `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_FILE_LOGGING=true
NEXT_PUBLIC_LOG_DIR=logs
```

### Log File Location

Logs are written to:
```
frontend/logs/app-YYYY-MM-DD.log
```

Example: `frontend/logs/app-2025-12-22.log`

### Log File Format

```
[2025-12-22T10:30:45.123Z] [INFO] [API] GET /api/health - 200 (45ms)
[2025-12-22T10:30:46.456Z] [ERROR] [MediaStore] Camera initialization failed
  Error: NotAllowedError: Permission denied
  Stack: Error: NotAllowedError: Permission denied
    at MediaStore.initCamera (mediaStore.ts:170)
```

### Viewing Log Files

#### In VS Code
```bash
# Open log file
code frontend/logs/app-2025-12-22.log
```

#### In Terminal
```bash
# View latest logs
cat frontend/logs/app-*.log | tail -n 50

# Watch logs in real-time
tail -f frontend/logs/app-*.log

# Search logs
grep "ERROR" frontend/logs/app-*.log
```

## 📚 Usage Examples

### Component Logger

```typescript
// components/features/CameraFeed.tsx
import { createLogger } from "@/lib/logger";

const logger = createLogger("CameraFeed");

export function CameraFeed() {
  const initializeCamera = async () => {
    try {
      logger.info("Initializing camera");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      logger.info("Camera initialized", { deviceId: stream.id });
    } catch (error) {
      logger.error("Camera initialization failed", error);
    }
  };
}
```

### Store Logger

```typescript
// stores/emergencyStore.ts
import { createLogger } from "@/lib/logger";

const logger = createLogger("EmergencyStore");

export const useEmergencyStore = create((set) => ({
  startSession: (sessionData) => {
    logger.info("Starting session", { sessionId: sessionData.session_id });
    set({ sessionId: sessionData.session_id });
  }
}));
```

### API Service Logger

```typescript
// services/api.ts
import { createLogger } from "@/lib/logger";

const logger = createLogger("API");

export async function fetchData() {
  try {
    logger.debug("Fetching data from API");
    const response = await fetch("/api/data");
    logger.info("Data fetched successfully", { status: response.status });
    return response.json();
  } catch (error) {
    logger.error("Failed to fetch data", error);
    throw error;
  }
}
```

### Child Loggers

Create sub-category loggers for better organization:

```typescript
const logger = createLogger("EmergencyController");
const sessionLogger = logger.child("Session");
const analysisLogger = logger.child("Analysis");

sessionLogger.info("Session started"); // [EmergencyController:Session] Session started
analysisLogger.info("Analysis complete"); // [EmergencyController:Analysis] Analysis complete
```

## 🎨 Console Output Format

Logs appear in the console with color coding:

```
[2025-12-22T10:30:45.123Z] [INFO] [API] Request sent
  Data: { endpoint: "/api/analyze" }

[2025-12-22T10:30:45.456Z] [ERROR] [MediaStore] Camera error
  Error: NotAllowedError: Permission denied
  Stack: ...
```

**Colors:**
- 🔵 `DEBUG` - Cyan
- 🟢 `INFO` - Green
- 🟡 `WARN` - Yellow
- 🔴 `ERROR` - Red

## 🔍 Filtering Logs

### By Log Level

Set minimum level in `.env.local`:
```bash
# Only show WARN and ERROR
NEXT_PUBLIC_LOG_LEVEL=WARN
```

### By Category

Search logs for specific categories:
```bash
# View only API logs
grep "[API]" logs/app-*.log

# View only MediaStore logs
grep "[MediaStore]" logs/app-*.log
```

## 🛠️ Best Practices

### ✅ DO

- Create one logger per module/component
- Use appropriate log levels
- Include relevant context data
- Log errors with the error object
- Use descriptive category names
- Log state changes in stores
- Log API requests and responses

### ❌ DON'T

- Log sensitive user data (passwords, tokens, PII)
- Over-log in production (set level to WARN or ERROR)
- Log large objects (summarize or sample data)
- Use console.log directly (use logger instead)
- Forget to handle errors

### Examples

```typescript
// ✅ GOOD
logger.info("User login successful", { userId: user.id });
logger.error("Payment failed", error, { orderId: order.id });

// ❌ BAD
logger.info("User login", user); // Contains password
console.log("Debug info"); // Use logger instead
```

## 🚨 Life-Critical Application Notes

Since Gemini Guardian is a **life-critical application**, logging is essential for:

1. **Debugging emergency scenarios** - Understand what happened during critical moments
2. **Performance monitoring** - Identify latency issues that could delay assistance
3. **Error tracking** - Quickly diagnose and fix issues
4. **Compliance** - Maintain audit trails for medical device compliance

**Always log:**
- Session start/end
- Emergency analysis results
- Camera/microphone initialization
- API errors
- User interactions with critical features

## 🔗 Related Files

- [`lib/logger.ts`](./lib/logger.ts) - Logger implementation
- [`services/api.ts`](./services/api.ts) - API service with logging
- [`stores/emergencyStore.ts`](./stores/emergencyStore.ts) - Emergency store with logging
- [`stores/mediaStore.ts`](./stores/mediaStore.ts) - Media store with logging
- [`.vscode/launch.json`](../.vscode/launch.json) - VS Code debug configurations
- [`.env.local.example`](./.env.local.example) - Example environment variables

## 📞 Troubleshooting

### Logs Not Appearing

1. Check log level: `NEXT_PUBLIC_LOG_LEVEL=DEBUG`
2. Check console is enabled in logger config
3. Restart Next.js dev server

### File Logging Not Working

1. Ensure `NEXT_PUBLIC_ENABLE_FILE_LOGGING=true`
2. Check write permissions on log directory
3. File logging only works on server-side (not in browser)

### VS Code Debug Console Empty

1. Start debugging session (F5)
2. Check Debug Console panel (not Terminal)
3. Ensure configuration is selected in dropdown

---

**Need help?** Check the [main README](../README.md) or create an issue.
