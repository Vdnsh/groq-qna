# Groq QnA Playground

A minimal, single-turn QnA interface powered by Groq's fast LLM API. Built with Next.js, TypeScript, and App Router.

## Features

- Single-turn Q&A interface (no chat history)
- Fast responses via Groq's LPU infrastructure
- Clean, dark-themed UI
- Comprehensive server-side logging for debugging

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- A Groq API key ([Get one here](https://console.groq.com/))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API key:**
   
   Create or edit `.env.local` in the root directory:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```
   
   Replace `your_groq_api_key_here` with your actual Groq API key from [Groq Console](https://console.groq.com/).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Inspecting Logs

All API requests and responses are logged to the terminal where you run `npm run dev`. You'll see:

- **GROQ REQUEST:** The user's question
- **GROQ API REQUEST BODY:** The full request payload sent to Groq
- **GROQ RAW RESPONSE:** The complete JSON response from Groq API

Example log output:
```
GROQ REQUEST: What is the capital of France?
GROQ RAW RESPONSE: {
  "id": "...",
  "choices": [...],
  ...
}
```

## Deployment to Vercel

1. **Push your code to GitHub** (make sure `.env.local` is in `.gitignore`)

2. **Import your repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add environment variable:**
   - In Vercel project settings, go to "Environment Variables"
   - Add `GROQ_API_KEY` with your API key value
   - Select all environments (Production, Preview, Development)

4. **Deploy:**
   - Vercel will automatically deploy on push to main
   - Or click "Deploy" manually

5. **View logs:**
   - In Vercel dashboard, go to your project → "Deployments" → Click a deployment → "Functions" tab
   - Click on the `/api/ask` function to see server logs

## Project Structure

```
groq-qna/
├── app/
│   ├── api/
│   │   └── ask/
│   │       └── route.ts      # API endpoint for Groq requests
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main QnA UI
├── .env.local                 # Environment variables (not committed)
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

## Model

This project uses `llama-3.1-8b-instant` by default. You can change the model in `app/api/ask/route.ts` if needed. Alternative models include `llama-3.1-70b-versatile` for more complex tasks.

## Troubleshooting

- **"API key not configured"**: Make sure `GROQ_API_KEY` is set in `.env.local`
- **CORS errors**: Should not occur as API calls are server-side
- **Empty responses**: Check server logs for Groq API errors
- **Build errors**: Ensure Node.js version is 18+ and all dependencies are installed

## License

Internal use only.

