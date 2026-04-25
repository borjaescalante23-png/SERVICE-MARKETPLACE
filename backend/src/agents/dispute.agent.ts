import prisma from '../utils/prisma';
import { releaseEscrow, refundEscrow } from '../services/escrow.service';

export type DisputeResolution = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RELEASE_PAYMENT';

export interface AIDisputeResult {
  resolution: DisputeResolution;
  confidence: number;
  reasoning: string;
  partialAmount?: number;
}

async function callAI(prompt: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk' as any);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}

export async function analyzeDispute(disputeId: string): Promise<AIDisputeResult> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          service: true,
          client: { select: { firstName: true, lastName: true } },
          professional: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          messages: { orderBy: { createdAt: 'asc' } },
          escrow: true,
        },
      },
    },
  });

  if (!dispute) throw new Error('Dispute not found');

  const b = dispute.booking;
  const pro = b.professional;

  const chatHistory = b.messages
    .slice(-30)
    .map(m => `[${m.senderId === b.clientId ? 'CLIENTE' : 'PROVEEDOR'}]: ${m.content}`)
    .join('\n');

  const context = `
DISPUTA EN MARKETPLACE DE SERVICIOS

Servicio: ${b.service?.name} (categoría: ${b.service?.category})
Importe total: ${b.totalAmount}€
Fecha programada: ${b.scheduledAt}

CLIENTE: ${b.client?.firstName} ${b.client?.lastName}
PROVEEDOR: ${pro?.user?.firstName} ${pro?.user?.lastName}
  - Nivel: ${pro?.level}
  - Valoración media: ${pro?.avgRating}/5 (${pro?.totalReviews} reseñas)
  - Trabajos completados: ${pro?.completedJobs}
  - Tasa de cancelación: ${Math.round((pro?.cancellationRate || 0) * 100)}%

MOTIVO DE LA DISPUTA: ${dispute.reason}
DESCRIPCIÓN DEL CLIENTE: ${dispute.description}

HISTORIAL DE CHAT (últimos 30 mensajes):
${chatHistory || '(sin mensajes)'}

EVIDENCIA DEL PROVEEDOR: ${b.providerEvidenceNote || '(ninguna)'}
`;

  const prompt = `${context}

Eres un árbitro imparcial de un marketplace de servicios. Analiza la disputa y responde SOLO con JSON válido sin markdown:

{
  "resolution": "FULL_REFUND | PARTIAL_REFUND | RELEASE_PAYMENT",
  "confidence": 0.0-1.0,
  "reasoning": "explicación en español en 2-3 frases",
  "partialAmount": null o número (importe a reembolsar al cliente si es PARTIAL_REFUND)
}

Criterios:
- FULL_REFUND: servicio claramente no prestado, proveedor sin historial o evidencia
- PARTIAL_REFUND: servicio parcialmente prestado o calidad discutible
- RELEASE_PAYMENT: evidencia de servicio prestado, cliente parece poco razonable, proveedor con buen historial

Sé objetivo y protege a ambas partes.`;

  let result: AIDisputeResult = {
    resolution: 'PARTIAL_REFUND',
    confidence: 0.5,
    reasoning: 'Análisis IA no disponible. Resolución por defecto aplicada.',
  };

  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')) {
    try {
      const text = await callAI(prompt);
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      result = {
        resolution: ['FULL_REFUND', 'PARTIAL_REFUND', 'RELEASE_PAYMENT'].includes(parsed.resolution)
          ? parsed.resolution
          : 'PARTIAL_REFUND',
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
        reasoning: String(parsed.reasoning || ''),
        partialAmount: parsed.partialAmount ? Number(parsed.partialAmount) : undefined,
      };
    } catch {
      // fallback already set
    }
  } else {
    // Heuristic fallback when AI not available
    result = heuristicResolution(b, pro, dispute);
  }

  return result;
}

function heuristicResolution(booking: any, pro: any, dispute: any): AIDisputeResult {
  const proScore = (pro?.avgRating || 0) * 0.4 + Math.min((pro?.completedJobs || 0) / 50, 1) * 0.4 + (1 - (pro?.cancellationRate || 0)) * 0.2;
  const hasEvidence = !!booking.providerEvidenceNote;
  const hasMessages = booking.messages?.length > 2;

  if (proScore > 0.7 && hasEvidence) {
    return { resolution: 'RELEASE_PAYMENT', confidence: 0.65, reasoning: `El profesional tiene buen historial (${pro?.avgRating?.toFixed(1)}★, ${pro?.completedJobs} trabajos) y ha aportado evidencia del trabajo realizado.` };
  }
  if (proScore < 0.3 || !hasMessages) {
    return { resolution: 'FULL_REFUND', confidence: 0.6, reasoning: 'El proveedor no tiene historial suficiente o no hay evidencia de comunicación para validar el servicio.' };
  }
  const partialAmount = Math.round(booking.totalAmount * 0.5 * 100) / 100;
  return { resolution: 'PARTIAL_REFUND', confidence: 0.55, reasoning: `Resolución equitativa: reembolso parcial del 50% al cliente (${partialAmount}€) dado el historial del proveedor y la información disponible.`, partialAmount };
}

export async function executeDisputeResolution(disputeId: string, result: AIDisputeResult): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { booking: { include: { escrow: true } } },
  });
  if (!dispute) return;

  const bookingId = dispute.bookingId;
  const escrow = dispute.booking.escrow;

  // Save analysis
  await prisma.disputeAIAnalysis.upsert({
    where: { disputeId },
    create: { disputeId, ...result, executedAt: new Date() },
    update: { ...result, executedAt: new Date() },
  }).catch(() => {});

  if (result.resolution === 'FULL_REFUND') {
    await refundEscrow(bookingId);
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });
  } else if (result.resolution === 'PARTIAL_REFUND' && escrow) {
    const refundAmt = result.partialAmount ?? Math.round(escrow.amount * 0.5 * 100) / 100;
    await prisma.escrowTransaction.update({
      where: { bookingId },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'COMPLETED',
        completedAt: new Date(),
        cancellationReason: `Reembolso parcial de ${refundAmt}€ al cliente`,
      },
    });
  } else {
    await releaseEscrow(bookingId);
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
  }

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: 'RESOLVED', resolution: result.resolution, resolvedAt: new Date(), resolvedBy: 'AI' },
  });
}
