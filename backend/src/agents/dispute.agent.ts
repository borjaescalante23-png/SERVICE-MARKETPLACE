import prisma from '../utils/prisma';
import { releaseEscrow, refundEscrow, partialRefundEscrow } from '../services/escrow.service';

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

type DisputeWithContext = Awaited<ReturnType<typeof loadDisputeWithContext>>;

async function loadDisputeWithContext(disputeId: string) {
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
  if (!dispute) throw new Error(`Dispute ${disputeId} not found`);
  return dispute;
}

function buildAnalysisPrompt(dispute: DisputeWithContext): string {
  const b = dispute.booking;
  const pro = b.professional;
  const chatHistory = b.messages
    .slice(-30)
    .map(m => `[${m.senderId === b.clientId ? 'CLIENTE' : 'PROVEEDOR'}]: ${m.content}`)
    .join('\n');

  return `DISPUTA EN MARKETPLACE DE SERVICIOS

Servicio: ${b.service?.name} (categoria: ${b.service?.category})
Importe total: ${b.totalAmount}EUR
Fecha programada: ${b.scheduledAt}

CLIENTE: ${b.client?.firstName} ${b.client?.lastName}
PROVEEDOR: ${pro?.user?.firstName} ${pro?.user?.lastName}
  - Nivel: ${pro?.level}
  - Valoracion media: ${pro?.avgRating}/5 (${pro?.totalReviews} resenas)
  - Trabajos completados: ${pro?.completedJobs}
  - Tasa de cancelacion: ${Math.round((pro?.cancellationRate || 0) * 100)}%

MOTIVO DE LA DISPUTA: ${dispute.reason}
DESCRIPCION DEL CLIENTE: ${dispute.description}

HISTORIAL DE CHAT (ultimos 30 mensajes):
${chatHistory || '(sin mensajes)'}

EVIDENCIA DEL PROVEEDOR: ${b.providerEvidenceNote || '(ninguna)'}

Eres un arbitro imparcial de un marketplace de servicios. Analiza la disputa y responde SOLO con JSON valido sin markdown:

{
  "resolution": "FULL_REFUND | PARTIAL_REFUND | RELEASE_PAYMENT",
  "confidence": 0.0-1.0,
  "reasoning": "explicacion en espanol en 2-3 frases",
  "partialAmount": null o numero (importe a reembolsar al cliente si es PARTIAL_REFUND)
}

Criterios:
- FULL_REFUND: servicio claramente no prestado, proveedor sin historial o evidencia
- PARTIAL_REFUND: servicio parcialmente prestado o calidad discutible
- RELEASE_PAYMENT: evidencia de servicio prestado, cliente parece poco razonable, proveedor con buen historial

Se objetivo y protege a ambas partes.`;
}

function applyHeuristic(dispute: DisputeWithContext): AIDisputeResult {
  const b = dispute.booking;
  const pro = b.professional;

  const proScore =
    (pro?.avgRating || 0) * 0.4 +
    Math.min((pro?.completedJobs || 0) / 50, 1) * 0.4 +
    (1 - (pro?.cancellationRate || 0)) * 0.2;
  const hasEvidence = !!b.providerEvidenceNote;
  const hasMessages = b.messages?.length > 2;

  if (proScore > 0.7 && hasEvidence) {
    return {
      resolution: 'RELEASE_PAYMENT',
      confidence: 0.65,
      reasoning: `El profesional tiene buen historial (${pro?.avgRating?.toFixed(1)} puntos, ${pro?.completedJobs} trabajos completados) y ha aportado evidencia del trabajo realizado.`,
    };
  }
  if (proScore < 0.3 || !hasMessages) {
    return {
      resolution: 'FULL_REFUND',
      confidence: 0.6,
      reasoning: 'El proveedor no tiene historial suficiente o no hay evidencia de comunicacion para validar la prestacion del servicio.',
    };
  }
  const partialAmount = Math.round(b.totalAmount * 0.5 * 100) / 100;
  return {
    resolution: 'PARTIAL_REFUND',
    confidence: 0.55,
    reasoning: `Resolucion equitativa: reembolso parcial del 50% al cliente (${partialAmount}EUR) dado el historial del proveedor y la informacion disponible.`,
    partialAmount,
  };
}

/**
 * Analyzes a dispute using the AI model.
 *
 * - If ANTHROPIC_API_KEY is not configured: falls back to heuristic (does NOT throw).
 * - If AI call fails or returns invalid JSON: THROWS so the caller can retry.
 */
export async function analyzeDispute(disputeId: string): Promise<AIDisputeResult> {
  if (
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-REEMPLAZA')
  ) {
    const dispute = await loadDisputeWithContext(disputeId);
    return applyHeuristic(dispute);
  }

  const dispute = await loadDisputeWithContext(disputeId);
  const prompt = buildAnalysisPrompt(dispute);

  // callAI throws on network/API errors — let the caller handle retries
  const text = await callAI(prompt);
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned); // throws if response is not valid JSON

  const validResolutions: DisputeResolution[] = ['FULL_REFUND', 'PARTIAL_REFUND', 'RELEASE_PAYMENT'];
  return {
    resolution: validResolutions.includes(parsed.resolution) ? parsed.resolution : 'PARTIAL_REFUND',
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    reasoning: String(parsed.reasoning || ''),
    partialAmount: parsed.partialAmount ? Number(parsed.partialAmount) : undefined,
  };
}

/**
 * Applies the deterministic heuristic resolution without calling the AI.
 * Used as a last resort after all AI retries are exhausted.
 * Never throws unless the DB is unavailable.
 */
export async function analyzeDisputeHeuristic(disputeId: string): Promise<AIDisputeResult> {
  const dispute = await loadDisputeWithContext(disputeId);
  return applyHeuristic(dispute);
}

/**
 * Persists the dispute resolution result and executes the corresponding escrow action.
 * The analysis record is written BEFORE the escrow action so the audit trail always exists.
 * The final booking + dispute status update is wrapped in $transaction.
 */
export async function executeDisputeResolution(
  disputeId: string,
  result: AIDisputeResult,
): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { booking: { include: { escrow: true } } },
  });
  if (!dispute) throw new Error(`Dispute ${disputeId} not found during resolution`);

  const bookingId = dispute.bookingId;
  const escrow = dispute.booking.escrow;

  // Write audit record first — the result must be persisted regardless of what follows
  await prisma.disputeAIAnalysis.upsert({
    where: { disputeId },
    create: {
      disputeId,
      resolution: result.resolution,
      confidence: result.confidence,
      reasoning: result.reasoning,
      partialAmount: result.partialAmount,
      executedAt: new Date(),
    },
    update: {
      resolution: result.resolution,
      confidence: result.confidence,
      reasoning: result.reasoning,
      partialAmount: result.partialAmount,
      executedAt: new Date(),
    },
  });

  // Execute escrow action (each service function manages its own DB atomicity)
  if (result.resolution === 'FULL_REFUND') {
    await refundEscrow(bookingId);
  } else if (result.resolution === 'PARTIAL_REFUND' && escrow) {
    const refundAmt = result.partialAmount ?? Math.round(escrow.amount * 0.5 * 100) / 100;
    await partialRefundEscrow(bookingId, refundAmt);
  } else {
    await releaseEscrow(bookingId);
  }

  // Update booking and dispute status atomically
  const bookingStatus: string = result.resolution === 'FULL_REFUND' ? 'CANCELLED' : 'COMPLETED';

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: bookingStatus,
        completedAt: bookingStatus === 'COMPLETED' ? new Date() : undefined,
        cancellationReason:
          result.resolution === 'PARTIAL_REFUND'
            ? `Reembolso parcial de ${(result.partialAmount ?? 0).toFixed(2)}EUR al cliente tras resolucion de disputa`
            : undefined,
      },
    }),
    prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution: result.resolution,
        resolvedAt: new Date(),
        resolvedBy: 'AI',
      },
    }),
  ]);
}
