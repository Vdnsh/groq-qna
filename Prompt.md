
You are inside an existing Next.js (App Router) + TypeScript repo (the “grog/groq qna” project). The current UI looks like a single centered card (“Groq QnA Playground”). This is NOT acceptable.

Your task: Convert the entire UI into a ChatGPT lookalike in LIGHT THEME, matching the ChatGPT structure and behavior:

- Left sidebar (chat history + new chat + search + sections)
- Main area (home/empty state like ChatGPT + chat thread)
- Composer at bottom (ChatGPT-style pill input)
- Multi-chat local history (localStorage)
- Text-to-speech accessible like ChatGPT (speaker/play for assistant messages + voice controls)
- Keep existing Groq QnA + Groq TTS backend endpoints working (/api/ask and /api/tts). Do not break current env usage.

NON-NEGOTIABLE RULES

1) LIGHT THEME ONLY. The final UI must look like ChatGPT light mode (white main background, light sidebar background, subtle borders).
2) DO NOT add UI frameworks (no Tailwind, no shadcn, no MUI). Use plain CSS in app/globals.css + CSS modules if needed.
3) Pixel discipline: do not invent random layouts. Use ChatGPT-like spacing: clean, minimal, consistent.
4) Preserve existing functionality:
   - QnA must still work
   - TTS must still work
   - Performance logs (if present) must still exist (you can move them to a header icon/modal)
5) Must compile and run with `npm run dev` without manual fixes.

PHASE 0 — AUDIT CURRENT PROJECT

- Inspect current UI entry (app/page.tsx or similar).
- Inspect API routes:
  - app/api/ask/route.ts (Groq chat completions)
  - app/api/tts/route.ts (Groq TTS)
- Identify any existing voice list/constants, log utilities, and how current UI calls APIs.

PHASE 1 — TARGET INFORMATION ARCHITECTURE (CHATGPT-LIKE)
Create this component + lib structure (adjust filenames if repo differs, but keep it clean):

/app
  /chat
    page.tsx                 (main ChatGPT-like screen)
  page.tsx                   (redirect to /chat or render `<ChatApp/>`)
  globals.css
/components
  AppShell.tsx               (sidebar + main)
  Sidebar.tsx
  TopBar.tsx
  HomeEmptyState.tsx         (big center text + composer)
  ChatThread.tsx
  MessageList.tsx
  MessageItem.tsx
  Composer.tsx
  PerformanceModal.tsx       (optional, if perf logs exist)
/lib
  types.ts                   (Chat, Message, TTSState types)
  storage.ts                 (localStorage CRUD)
  api.ts                     (fetch wrappers for /api/ask and /api/tts)
  ttsPlayer.ts               (single audio controller)
  title.ts                   (generate chat title)
  ids.ts                     (stable id helpers)

PHASE 2 — UI SPEC (MUST MATCH CHATGPT BEHAVIOR)
A) AppShell layout

- Full height
- Left Sidebar: fixed width ~280px, background #f7f7f8-ish, border-right #e5e7eb-ish
- Main: white background

B) Sidebar content (ChatGPT-like)

- “New chat” button at top
- Search row (“Search chats”)
- Sections (optional but nice): “GPTs”, “Projects”, “Your chats”
- Your chats list: shows titles, active highlight, hover state
- Bottom profile chip: user name + plan label (can be static)

Minimum required:

- New chat button
- Search input/row
- Your chats list (click to open)
- Delete chat action (simple icon or context menu)
- Active chat highlight

C) Main area: Home / Empty state
When no messages in active chat:

- Center headline: “What’s on your mind today?”
- Under it: a wide rounded composer pill
  - left plus icon
  - placeholder “Ask anything”
  - right mic icon
  - rightmost: a dark circular button with waveform icon (voice)
    This must feel like ChatGPT home.

D) Main area: Chat thread view
When messages exist:

- Show stacked messages (user + assistant)
- Keep layout readable (max-width container ~720px centered)
- Composer pinned bottom (same pill style)
- Show “Thinking…” while waiting for response

PHASE 3 — DATA MODEL + LOCAL PERSISTENCE
Implement local chats like ChatGPT.

Types:

- Chat:
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
- Message:
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: number
  tts?: { status: "idle"|"loading"|"ready"|"error", voice?: string, audioUrl?: string }

LocalStorage keys:

- "groq.chat.v1" -> Chat[]
- "groq.chat.activeId.v1" -> string
- "groq.chat.voice.v1" -> selected voice string

Behavior:

- New chat creates empty chat and sets active
- First user message auto-generates chat title (first 5–7 words)
- Update updatedAt on changes
- Persist after every message append

PHASE 4 — API INTEGRATION (MULTI-TURN)
Update /api/ask to accept BOTH:
A) legacy: { question: string }
B) new: { messages: { role: string, content: string }[] }

Do NOT break old payloads.
If new payload is provided:

- Send messages array to Groq completion (multi-turn context)
- Return assistant text

Frontend sending rule:

- Send last N messages (e.g., last 20) to control prompt size.

PHASE 5 — TTS LIKE CHATGPT
Goal: TTS accessible “like ChatGPT”.

Requirements:

1) Per-assistant-message “Read aloud” button (speaker icon). Clicking:
   - calls /api/tts with { text, voice } (use selected voice)
   - shows loading state
   - plays audio when ready
2) Composer has a voice/action button (waveform) like ChatGPT:
   - It can be a “Voice mode” placeholder if full speech-to-text is not implemented
   - But it MUST at least open a small menu for voice selection and “Read last assistant message”
3) One global voice selector (in TopBar menu/popover) controlling which voice is used.
4) Single shared audio player:
   - if a new TTS starts, stop previous audio
   - cleanup object URLs
5) Store selected voice in localStorage

PHASE 6 — PERFORMANCE LOGS (IF PRESENT)
If the repo already has performance logs/timers:

- keep them
- move access to a small icon button in TopBar
- show logs in a modal/drawer that matches the new light design

PHASE 7 — STYLING (LIGHT THEME, CHATGPT FEEL)
Use CSS variables in app/globals.css:

- --bg: #ffffff
- --sidebar: #f7f7f8
- --border: #e5e7eb
- --text: #111827
- --muted: #6b7280
- --hover: #f3f4f6
- --shadow: subtle (rgba 0,0,0,0.06)

Typography:

- system font stack, 14–16px base
  Spacing:
- consistent 8/12/16 rhythm
  Buttons:
- rounded 10–12px
  Composer:
- fully rounded (999px), light border, subtle shadow

UX requirements:

- Enter to send, Shift+Enter newline
- Auto-scroll to bottom on new messages (don’t yank if user scrolled up; show “scroll to bottom” button when away)
- Error message near composer with retry

IMPLEMENTATION ORDER (DO NOT SKIP)

1) Build AppShell + Sidebar + TopBar static layout in LIGHT theme
2) Build HomeEmptyState with the centered headline + composer pill
3) Implement storage.ts (create/read/update/delete chats)
4) Wire Composer -> send message -> /api/ask -> render ChatThread
5) Upgrade /api/ask to support messages[] multi-turn
6) Add chat switching + new chat + delete chat in Sidebar
7) Add TTS per assistant message + global voice selection
8) Integrate performance modal (if available)
9) Final CSS polish until it feels like ChatGPT light UI

DELIVERABLES

- Make code changes directly.
- Ensure `npm run dev` works.
- Provide a concise summary:
  - files changed/added
  - what to run
  - what features are implemented

Start now and implement fully.
