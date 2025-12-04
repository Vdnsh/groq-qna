You are inside my Groq chat/QnA project (Next.js + TypeScript, App Router).  
I have a basic TTS feature using a robotic male browser voice, and I also need complete performance logging for both text and voice.

Replace ALL of this with the following:

===============================================================
# PART 1 — REMOVE OLD TTS + USE GROQ NEURAL FEMALE VOICE
===============================================================

1. Find and REMOVE any old TTS system:
   - Any use of `speechSynthesis` or `SpeechSynthesisUtterance`
   - Any custom TTS utilities
   - Any placeholder voice code

2. Replace it with **Groq neural Text-to-Speech** using:
   Endpoint:
      POST https://api.groq.com/openai/v1/audio/speech
   Model:
      "playai-tts"
   Default voice:
      "Celeste-PlayAI" (female, calm/soothing)

3. Create a new API route:
   File: `app/api/tts/route.ts`
   POST body:
      { text: string; voice?: string }
   Steps:
   - Validate `text`
   - Use process.env.GROQ_API_KEY
   - POST to Groq TTS with body:
       {
         "model": "playai-tts",
         "voice": voiceFromRequestOrDefault("Celeste-PlayAI"),
         "input": text,
         "response_format": "wav"
       }
   - On success: return audio bytes as binary
     with Content-Type: audio/wav
   - On error: return JSON error (500)

4. On the frontend:
   - Add a function `playGroqTTS(text: string, voice?: string)`
   - It should:
     - POST to `/api/tts`
     - Receive Blob (wav)
     - Convert to URL with `URL.createObjectURL()`
     - Play using `new Audio(url)`

5. Update all “play/speaker” buttons in the chat UI so they call `playGroqTTS(messageText)`.


===============================================================
# PART 2 — USE SUPPORTED GROQ MODEL FOR TEXT (/api/ask)
===============================================================

Update /api/ask/route.ts:

1. Replace deprecated model:
      "llama3-70b-8192"
   with the current recommended model:
      "llama-3.1-8b-instant"

2. Ensure request body looks like:
   {
     model: "llama-3.1-8b-instant",
     messages: [
       { role: "system", content: "You are a helpful assistant." },
       { role: "user", content: question }
     ]
   }

3. Parse Groq’s response for:
   - answer text
   - usage (tokens)
   - status codes


===============================================================
# PART 3 — CREATE UNIFIED LOGGING SYSTEM (TEXT + TTS)
===============================================================

Create a helper in `lib/log.ts`:

- `startTimer()` — returns `
