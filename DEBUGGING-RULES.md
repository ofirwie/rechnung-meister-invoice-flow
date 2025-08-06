# 🐛 DEBUGGING RULES FOR THIS PROJECT

## **THE GOLDEN RULES**

### 1. **NEVER LOCALHOST** 🚫
- This project ONLY uses deployed environments
- NEVER suggest `npm run dev` or `localhost` for testing
- ALL debugging must work on production/deployed sites

### 2. **ALWAYS CREATE DEBUG SCREENS** ✅
- When there's a problem, CREATE a debug component
- Make the problem VISIBLE in the UI
- Add console logs that work in production
- Show real-time data and state changes

### 3. **DEBUG-FIRST APPROACH** 🔍
```
Problem Found → Create Debug Screen → Deploy → Analyze → Fix
```

### 4. **NEVER ASK USERS TO CHECK CONSOLE** 🚫
- Debug info must be visible in UI, not console
- Add copy buttons for easy sharing
- Use clear, non-technical language  
- Make debug self-contained for end users
- NO "Press F12" or console references in UI

## **EXAMPLE DEBUG TOOLS ALREADY IN PROJECT:**
- `SimpleRenderTracker` - Shows render counts visually
- `useRenderDebugger` - Console logging for re-renders  
- `GlobalDebugPanel` - Production-ready debug panel
- Debug screens in `/pages/` for various issues

## **WHEN SOLVING PROBLEMS:**
1. ✅ Create a debug component/screen
2. ✅ Add visual indicators (red boxes, counters, etc.)
3. ✅ Add console.log statements
4. ✅ Deploy and test on live environment
5. ✅ Use debug data to identify root cause
6. ✅ Implement fix based on visible evidence

## **NEVER DO:**
- ❌ Guess what might be wrong
- ❌ Suggest localhost testing
- ❌ Provide solutions without debug data
- ❌ Say "try this" without creating debug tools

---
**REMEMBER: MAKE PROBLEMS VISIBLE, THEN FIX THEM**
