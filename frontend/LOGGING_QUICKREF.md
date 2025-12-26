# 🎯 Quick Reference: Frontend Logging

## Import & Setup
```typescript
import { createLogger } from "@/lib/logger";
const logger = createLogger("ComponentName");
```

## Log Methods
```typescript
logger.debug("Message", { data });  // 🔵 Detailed debugging
logger.info("Message", { data });   // 🟢 General info
logger.warn("Message", { data });   // 🟡 Warnings
logger.error("Message", error);     // 🔴 Errors
```

## Environment Variables (`.env.local`)
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG              # DEBUG|INFO|WARN|ERROR
NEXT_PUBLIC_ENABLE_FILE_LOGGING=true    # true|false
NEXT_PUBLIC_LOG_DIR=logs                 # Directory name
```

## View Logs

### 1. VS Code Debug Console
- Press **F5** (Run & Debug)
- Select **"Next.js: Debug Server (Frontend)"**
- Open **Debug Console** panel

### 2. Browser Console
- Press **F12** → Console tab
- See colored logs in real-time

### 3. Log Files
- Location: `frontend/logs/app-YYYY-MM-DD.log`
- View: `code frontend/logs/app-*.log`
- Watch: `tail -f frontend/logs/app-*.log`

## Example Usage

### Component
```typescript
const logger = createLogger("CameraFeed");

const init = async () => {
  try {
    logger.info("Initializing camera");
    const stream = await getCamera();
    logger.info("Camera ready", { deviceId: stream.id });
  } catch (error) {
    logger.error("Camera failed", error);
  }
};
```

### Store
```typescript
const logger = createLogger("EmergencyStore");

startSession: (data) => {
  logger.info("Session started", { sessionId: data.session_id });
  set({ sessionId: data.session_id });
}
```

### API
```typescript
const logger = createLogger("API");

const fetchData = async () => {
  logger.debug("Fetching data");
  const res = await fetch("/api/data");
  logger.info("Data fetched", { status: res.status });
};
```

## Best Practices
✅ One logger per component/module  
✅ Use appropriate log levels  
✅ Include context data  
✅ Log errors with error object  
❌ Don't log sensitive data  
❌ Don't over-log in production  

## Keyboard Shortcuts
- **F5** - Start debugging
- **F12** - Open browser console
- **Ctrl+Shift+D** - Open Run & Debug panel
- **Ctrl+`** - Toggle terminal

---
📚 Full docs: [LOGGING.md](LOGGING.md)
