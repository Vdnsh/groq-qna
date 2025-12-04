You are inside my Groq QnA / chat project (Next.js + TypeScript).  
I already have a basic text-to-speech feature in the chat, but right now it uses a very robotic male voice (most likely the browser SpeechSynthesis API or some placeholder TTS).  

I want you to REPLACE the current TTS with **Groq’s neural Text-to-Speech** using a **soothing female voice**, similar in vibe to ChatGPT’s voices.

Use the official Groq TTS endpoint and docs:

- Endpoint: https://api.groq.com/openai/v1/audio/speech
- Model: "playai-tts"
- Voices: Use one of the English voices from docs (e.g. Celeste-PlayAI, Quinn-PlayAI, Gail-PlayAI, Deedee-PlayAI, etc.)
- Default voice for me: **"Celeste-PlayAI"** (treat it as a calm, soothing female voice)
- Response format: use "wav" (the default) as per docs.

My Groq API key is already configured as:
  GROQ_API_KEY=... 
in .env.local (same variable we use for chat completions).

---------------------------------------------------
# 1. Find and remove the old TTS implementation
---------------------------------------------------

1. Search the codebase for the existing text-to-speech implementation:
   - Look for uses of `speechSynthesis`, `SpeechSynthesisUtterance`, `TextToSpeech`, `playTTS`, or any custom TTS helper.
   - This is likely wired to a “speaker” / “play” button in the chat message component.

2. Refactor so that:
   - The old browser-based TTS is no longer used.
   - All “play voice” / “speaker” clicks call a new function that will hit our `/api/tts` endpoint.

3. Clean up any now-unused TTS utilities or hooks.

---------------------------------------------------
# 2. Create a Groq TTS API route
---------------------------------------------------

Create a new API route:

- File: `app/api/tts/route.ts` (App Router)
- Method: POST
- Request body JSON:
    { text: string; voice?: string }
- Behaviour:
  - Validate that `text` is non-empty; otherwise return 400.
  - Read `process.env.GROQ_API_KEY`. If missing, return 500 with a clear JSON error.
  - Call Groq’s speech endpoint with fetch:

    POST https://api.groq.com/openai/v1/audio/speech
    Headers:
      Content-Type: application/json
      Authorization: Bearer ${process.env.GROQ_API_KEY}

    Body (JSON):
      {
        "model": "playai-tts",
        "voice": voiceFromRequestOrDefault,
        "input": text,
        "response_format": "wav"
      }

    - `voiceFromRequestOrDefault` should default to `"Celeste-PlayAI"` if the client does not send a voice.

  - Handle non-OK responses from Groq gracefully:
    - Log status + response text to the server console.
    - Return a JSON error with status 500.

  - On success:
    - Read the binary audio (arrayBuffer or Buffer).
    - Return a Response with:
        status: 200
        body: the audio bytes
        headers: 
          "Content-Type": "audio/wav"

  - Add server logs for debugging:
    - `console.log("GROQ TTS REQUEST", { textSnippet: text.slice(0, 120), voice: voice })`
    - `console.log("GROQ TTS STATUS", response.status)`

---------------------------------------------------
# 3. Frontend integration for the chat UI
---------------------------------------------------

1. Find the chat message component where I currently have the text-to-speech / speaker icon.

2. Implement a reusable hook or function, for example `useGroqTTS` or `playGroqTTS(text: string)`:

   - It should:
     - Accept the text to read.
     - Call `POST /api/tts` with `{ text }`.
     - Await the response as a Blob (`audio/wav`).
     - Create an object URL: `URL.createObjectURL(blob)`.
     - Play it using the browser `Audio` object:
         const audio = new Audio(url);
         audio.play();
     - Optionally clean up previous URLs to avoid memory leaks.

   - Handle loading and errors:
     - While the audio is being fetched, show a subtle loading state on the speaker icon (e.g. spinner or disabled state).
     - If the API returns an error, display a small toast or inline error near the chat message (e.g. “Could not play audio, please try again”).

3. Wire the speaker icon / TTS button:
   - On click, call the new `playGroqTTS(messageText)`.
   - Make sure it works for any assistant message, not just the last one.

4. UX details:
   - If a previous audio is still playing and the user taps the speaker on another message, pause/stop the previous audio and start the new one.
   - Optional: if a user clicks the same message again while it is playing, toggle between pause/resume.

---------------------------------------------------
# 4. Voice configuration (female / soothing)
---------------------------------------------------

1. Use `Celeste-PlayAI` as the default voice in the backend.

2. Add a small config object or enum somewhere (e.g. `config/tts.ts`) with the list of a few good voices:
   - "Celeste-PlayAI"  // default, soothing female
   - "Gail-PlayAI"
   - "Quinn-PlayAI"
   - "Deedee-PlayAI"

3. (Optional but nice) Build a minimal settings area in the UI where I can choose the voice from a dropdown:
   - Store the selected voice in localStorage (e.g. `groq_tts_voice`).
   - When calling `/api/tts`, send that voice in the request body.
   - Fallback to `"Celeste-PlayAI"` if anything is missing.

---------------------------------------------------
# 5. Error handling & graceful degradation
---------------------------------------------------

- If Groq’s TTS endpoint returns an error:
  - Do NOT crash the chat.
  - Show a clear user-facing message like:
    “Voice playback is temporarily unavailable.”
  - Log the detailed error on the server side only.

- If `GROQ_API_KEY` is not set:
  - Ensure `/api/tts` returns a JSON error with a helpful message.
  - From the frontend, render a silent failure with a small tooltip (for dev use).

---------------------------------------------------
# 6. Final verification & summary
---------------------------------------------------

After you’ve done all implementation:

1. List all files you created or changed:
   - app/api/tts/route.ts
   - any hooks / utils
   - chat UI components
   - any config files for voices

2. Explain briefly how to:
   - Trigger TTS from the chat UI.
   - Change the default voice.
   - Add a new voice later.

3. Confirm that:
   - The old robotic TTS method is no longer used anywhere.
   - All TTS now goes through Groq’s `playai-tts` model with a default of `Celeste-PlayAI`.
   - Audio playback works in modern browsers (Chrome, Edge, Safari).

Make all changes directly in this repo, following TypeScript best practices.
