import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function computeCustodySignature(
  evidenceId: string,
  officerId: string,
  action: string,
  createdAt: Date,
): string {
  return sha256(`${evidenceId}|${officerId}|${action}|${createdAt.toISOString()}`);
}

export function computeAuditEntryHash(
  id: string,
  action: string,
  officerId: string | null,
  createdAt: Date,
  previousHash: string | null,
): string {
  return sha256(
    `${id}|${action}|${officerId ?? ''}|${createdAt.toISOString()}|${previousHash ?? 'GENESIS'}`,
  );
}
