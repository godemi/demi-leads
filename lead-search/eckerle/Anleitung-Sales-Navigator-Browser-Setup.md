# Step-by-step: Get Sales Navigator working with Cursor’s browser

So the AI can read **full LinkedIn profiles** (About, Experience, etc.) in Sales Navigator, it must use the **same browser** where you are logged in. Follow these steps once.

---

## 1. Check your Cursor version

- **Menu:** `Help` → `About` (or `Cursor` → `About Cursor` on Mac).
- Note the version (e.g. 0.45.x or 2.x).  
  The built-in browser works in Cursor 2.0+; older versions may use an external Chrome window.

---

## 2. Make sure the Cursor browser is enabled

- Open **Cursor Settings** (gear icon or `File` → `Preferences` → `Settings`).
- Search for **MCP** or open **Features** → **MCP**.
- Find **cursor-ide-browser** and ensure it is **enabled** (`true`).
- If you changed anything, **restart Cursor** completely.

---

## 3. Open the browser that Cursor uses

You need to get the **browser window/tab** that Cursor’s Agent controls on screen so you can log in.

**Option A – Cursor 2.0 with embedded browser**

- Start an **Agent** chat (e.g. Agent mode in the composer).
- In the chat, ask: *“Open the browser and go to https://www.linkedin.com/sales/”*  
  (or I can do that for you in this chat).
- A **browser panel or window** should appear inside Cursor or next to it showing LinkedIn.
- That is the browser you must use for the next step.

**Option B – External Chrome/Chromium**

- If Cursor uses an **external Chrome** window (e.g. older setup or “use Chrome” setting), that window will open when the Agent runs a browser action (e.g. “navigate to linkedin.com/sales”).
- When I (the Agent) run the first navigation, **watch for a new Chrome window** and use that for logging in.

---

## 4. Log in to Sales Navigator in that same browser

- In **that same** browser window/tab that Cursor opened (from step 3):
  - Go to: **https://www.linkedin.com/sales/**
  - Log in with your **LinkedIn account** that has **Sales Navigator**.
- Complete login (and 2FA if asked) until you see the Sales Navigator interface (e.g. search, filters).
- Leave this tab/window **open**. Do not close the browser or log out.

---

## 5. Tell the Agent you’re ready

- Back in the **Cursor chat**, write something like: *“I’m logged in to Sales Navigator in the Cursor browser; you can run the test.”*
- I will then:
  - Use the same browser (same session),
  - Open a profile or run a search,
  - Scroll and read the page content (About, Experience),
  - Report whether I can see the full profile text.

If I can read the full profile, we can run the full lead-search process (company → keywords → open each profile → evaluate → Excel) in that browser.

---

## Quick checklist

| Step | What you do |
|------|-----------------------------|
| 1 | Check Cursor version (`Help` → `About`). |
| 2 | Enable **cursor-ide-browser** in Settings → MCP; restart Cursor if needed. |
| 3 | Open the Cursor browser (ask Agent to “open browser and go to linkedin.com/sales” or run a test – watch where the browser appears). |
| 4 | In **that** browser: go to linkedin.com/sales and **log in** to Sales Navigator; leave it open. |
| 5 | Tell the Agent “logged in, you can test” so I can try reading a full profile. |

---

## If the browser doesn’t appear or you can’t log in

- **No browser at all:** In Agent chat, say: *“Navigate to https://www.linkedin.com/sales/”* and see if a window or panel appears. If not, check Cursor’s docs for your version (“built-in browser” or “MCP browser”).  
- **Different browser than the one you use daily:** Cursor’s Agent uses its **own** browser instance (embedded or a separate Chrome). You must log in **in that instance**, not in your normal Chrome/Firefox.  
- **Session lost after closing:** Log in again in the Cursor-controlled browser and leave it open while we work.

Once you’ve done steps 1–5, reply here with “done” or “logged in, you can test” and we’ll run the test.
