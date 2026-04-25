import fs from 'fs';
import path from 'path';

export interface AIVerificationResult {
  authentic: boolean;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  flags: string[];
}

export async function analyzeDocument(
  fileUrl: string,
  docType: string
): Promise<AIVerificationResult> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    return {
      authentic: true,
      confidence: 'low',
      summary: 'Análisis IA pendiente — configura ANTHROPIC_API_KEY para activarlo',
      flags: ['Verificación automática no activada'],
    };
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return fallbackResult('Archivo no encontrado para análisis');
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `PDF de tipo "${docType}" recibido. Responde SOLO en JSON sin markdown: {"authentic": true, "confidence": "low", "summary": "PDF recibido. Revisión manual requerida.", "flags": ["Verificación manual necesaria para PDF"]}`,
        }],
      });
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return JSON.parse(text.trim());
    }

    const mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Analiza este documento. Tipo declarado: ${docType}. ¿Es auténtico? ¿Hay signos de manipulación? Responde SOLO en JSON sin markdown: {"authentic": true/false, "confidence": "high"/"medium"/"low", "summary": "descripción breve en español", "flags": []}`,
          },
        ],
      }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text.trim());
    return {
      authentic: Boolean(parsed.authentic),
      confidence: parsed.confidence || 'medium',
      summary: parsed.summary || 'Análisis completado',
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return fallbackResult('Instala @anthropic-ai/sdk para activar la IA');
    }
    console.error('AI verification error:', err.message);
    return fallbackResult('Error en análisis automático');
  }
}

function fallbackResult(reason: string): AIVerificationResult {
  return { authentic: false, confidence: 'low', summary: reason, flags: ['Revisión manual requerida'] };
}
