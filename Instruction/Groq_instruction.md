# Context
This repo is for a Groq (Groq.com) QnA playground. NOT xAI Grok.

Goal:
- Build a Next.js (TypeScript, App Router) single-turn QnA interface.
- Every question is sent to Groq’s LPU-fast API:
  https://api.groq.com/openai/v1/chat/completions
- Must use GROQ_API_KEY from .env.local
- Must log every request + the raw Groq response in the server console.

# What I want built
1. Initialize this empty folder as a Next.js project:
   - npx create-next-app@latest . --ts --app --eslint

2. Create backend route at `app/api/ask/route.ts`:
   - Accept { question }
   - Validate missing question
   - Use GROQ_API_KEY from environment
   - POST to https://api.groq.com/openai/v1/chat/completions
   - Recommended model: "llama3-70b-8192"
   - Return { answer }
   - Log everything:
       - "GROQ REQUEST:" <question>
       - "GROQ RAW RESPONSE:" <full raw JSON>

3. Create frontend UI in `app/page.tsx`:
   - Minimal single-turn interface
   - Textarea for question
   - “Ask Groq” button
   - Loading state
   - Error state
   - Answer box
   - No chat history

4. Add `.env.local` template:
   GROQ_API_KEY=

5. Add README for:
   - Running
   - Adding API key
   - Inspecting logs
   - Deploying to Vercel

# Design expectations
- Clean, dark UI (bluish/dark surface)
- Centered layout
- Modern button (hover/focus)
- Good spacing and readable typography
- No fancy styling required

# Functional expectations
- Fully working QnA flow
- Logs appear in the terminal running `npm run dev`
- Handle missing API key gracefully
- Handle Groq errors gracefully

# Deliverables
- Updated Next.js project
- Working `/api/ask` route
- Working `/` UI
- `.env.local` (not committed)
- Final file tree and necessary code blocks

Make all changes directly in the repo (no new subfolder).
