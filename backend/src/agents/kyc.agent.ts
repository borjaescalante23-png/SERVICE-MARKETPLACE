import fs from 'fs';
import path from 'path';

export interface KYCAnalysisResult {
  documentAuthentic: boolean;
  faceMatch: boolean;
  faceMatchScore: number;
  overallResult: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasoning: string;
  flags: string[];
}

async function getAI() {
  const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function readImageAsBase64(filePath: string): { data: string; mediaType: string } {
  const ext = path.extname(filePath).toLowerCase();
  const mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return { data, mediaType };
}

export async function analyzeKYC(documentUrl: string, selfieUrl: string): Promise<KYCAnalysisResult> {
  const fallback = (reason: string): KYCAnalysisResult => ({
    documentAuthentic: false,
    faceMatch: false,
    faceMatchScore: 0,
    overallResult: 'MANUAL_REVIEW',
    reasoning: reason,
    flags: ['Revisión manual requerida'],
  });

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    return { ...fallback('API IA no configurada'), overallResult: 'MANUAL_REVIEW' };
  }

  try {
    const docPath = path.join(process.cwd(), documentUrl.replace(/^\//, ''));
    const selfiePath = path.join(process.cwd(), selfieUrl.replace(/^\//, ''));

    if (!fs.existsSync(docPath) || !fs.existsSync(selfiePath)) {
      return fallback('Archivos no encontrados');
    }

    const docExt = path.extname(docPath).toLowerCase();
    if (docExt === '.pdf') {
      return { ...fallback('Documento PDF: revisión manual necesaria'), overallResult: 'MANUAL_REVIEW' };
    }

    const doc = readImageAsBase64(docPath);
    const selfie = readImageAsBase64(selfiePath);

    const client = await getAI();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: doc.mediaType as any, data: doc.data },
          },
          {
            type: 'image',
            source: { type: 'base64', media_type: selfie.mediaType as any, data: selfie.data },
          },
          {
            type: 'text',
            text: `Eres un sistema KYC de verificación de identidad. La primera imagen es un documento de identidad oficial (DNI, NIE o pasaporte). La segunda imagen es un selfie de la persona que quiere verificarse.

Analiza:
1. Si el documento parece auténtico (sin manipulación visible)
2. Si la persona del selfie parece ser la misma que en el documento

Responde SOLO con JSON válido sin markdown:
{
  "documentAuthentic": true/false,
  "faceMatch": true/false,
  "faceMatchScore": 0.0-1.0,
  "reasoning": "explicación breve en español",
  "flags": ["lista de alertas si las hay"]
}

Sé conservador: si hay dudas, usa faceMatchScore bajo y añade flags.`,
          },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const score = Math.min(1, Math.max(0, Number(parsed.faceMatchScore) || 0));
    const docOk = Boolean(parsed.documentAuthentic);
    const faceOk = Boolean(parsed.faceMatch);

    let overallResult: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
    if (!docOk) {
      overallResult = 'REJECTED';
    } else if (faceOk && score >= 0.75) {
      overallResult = 'APPROVED';
    } else if (score >= 0.55) {
      overallResult = 'MANUAL_REVIEW';
    } else {
      overallResult = 'REJECTED';
    }

    return {
      documentAuthentic: docOk,
      faceMatch: faceOk,
      faceMatchScore: score,
      overallResult,
      reasoning: String(parsed.reasoning || ''),
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch (err: any) {
    console.error('KYC agent error:', err.message);
    return fallback('Error en análisis automático');
  }
}
