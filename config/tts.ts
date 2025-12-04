export const GROQ_TTS_VOICES = {
  CELESTE: 'Celeste-PlayAI',
  GAIL: 'Gail-PlayAI',
  QUINN: 'Quinn-PlayAI',
  DEEDEE: 'Deedee-PlayAI',
} as const

export const DEFAULT_VOICE = GROQ_TTS_VOICES.CELESTE

export type GroqTTSVoice = typeof GROQ_TTS_VOICES[keyof typeof GROQ_TTS_VOICES]

export const VOICE_NAMES: Record<GroqTTSVoice, string> = {
  [GROQ_TTS_VOICES.CELESTE]: 'Celeste (Soothing Female)',
  [GROQ_TTS_VOICES.GAIL]: 'Gail',
  [GROQ_TTS_VOICES.QUINN]: 'Quinn',
  [GROQ_TTS_VOICES.DEEDEE]: 'Deedee',
}

