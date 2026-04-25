export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string | null;
  cached: boolean;
}

const translationCache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.slice(0, 100)}`;
}

export async function translateMessage(
  text: string,
  fromLang: string,
  toLang: string
): Promise<TranslationResult> {
  if (fromLang === toLang) {
    return { translatedText: text, detectedLanguage: fromLang, cached: true };
  }

  const key = cacheKey(text, fromLang, toLang);
  const hit = translationCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return { translatedText: hit.text, detectedLanguage: fromLang, cached: true };
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    return { translatedText: text, detectedLanguage: fromLang, cached: false };
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Translate the following text from ${fromLang} to ${toLang}. Reply with ONLY the translated text, no explanations:\n\n${text}`,
      }],
    });

    const translated = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : text;

    translationCache.set(key, { text: translated, ts: Date.now() });
    return { translatedText: translated, detectedLanguage: fromLang, cached: false };
  } catch {
    return { translatedText: text, detectedLanguage: fromLang, cached: false };
  }
}

export async function detectLanguage(text: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    return 'es';
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Detect the language of this text and reply with ONLY the ISO 639-1 code (e.g. "es", "en", "fr"):\n\n${text.slice(0, 200)}`,
      }],
    });

    const code = response.content[0].type === 'text'
      ? response.content[0].text.trim().toLowerCase().slice(0, 5)
      : 'es';

    return /^[a-z]{2}(-[a-z]{2})?$/.test(code) ? code : 'es';
  } catch {
    return 'es';
  }
}
