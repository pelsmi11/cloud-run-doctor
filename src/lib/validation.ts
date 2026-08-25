import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message must not be empty").max(4000, "Message must be at most 4000 characters"),
  locale: z.enum(["es", "en"]).optional().default("es"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type QueryClassification =
  | { kind: "request"; requestId: string }
  | { kind: "session"; sessionId: string }
  | { kind: "general" }
  | { kind: "invalid"; reason: "malformed-identifier" | "multiple-identifiers" | "mixed-identifier-types" };

const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
const requestLabelRegex = /\b(?:request\s*id|support\s*id)\b/gi;
const sessionLabelRegex = /\b(?:session\s*id|session)\b/gi;

function isValidUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

function findLabelPositions(text: string, regex: RegExp): number[] {
  const positions: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(regex.source, regex.flags);
  while ((m = re.exec(text)) !== null) {
    positions.push(m.index);
    // avoid infinite loop on zero-length
    if (m[0].length === 0) re.lastIndex++;
  }
  return positions;
}

interface Candidate {
  uuid: string;
  index: number;
  valid: boolean;
  raw: string;
}

function extractCandidates(message: string): Candidate[] {
  const candidates: Candidate[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(uuidRegex.source, uuidRegex.flags);
  while ((m = re.exec(message)) !== null) {
    const raw = m[0];
    candidates.push({
      uuid: raw.toLowerCase(),
      index: m.index,
      valid: isValidUuid(raw),
      raw,
    });
  }
  return candidates.filter((c) => c.valid);
}

function hasMalformedAfterLabel(message: string): boolean {
  // Check each label occurrence: if within 20 chars after label there's a token that looks like id but fails uuid
  const lines = message.split("\n");
  for (const line of lines) {
    const requestPositions = findLabelPositions(line, requestLabelRegex);
    const sessionPositions = findLabelPositions(line, sessionLabelRegex);
    const allLabels = [
      ...requestPositions.map((i) => ({ index: i, type: "request" as const })),
      ...sessionPositions.map((i) => ({ index: i, type: "session" as const })),
    ].sort((a, b) => a.index - b.index);

    for (const label of allLabels) {
      const labelRe = label.type === "request" ? requestLabelRegex : sessionLabelRegex;
      const re2 = new RegExp(labelRe.source, labelRe.flags);
      re2.lastIndex = label.index;
      const lm = re2.exec(line);
      if (!lm) continue;
      const labelEndPos = lm.index + lm[0].length;
      const afterLabel = line.slice(labelEndPos);
      const sepMatch = afterLabel.match(/^[\s:=#-]{0,20}/);
      const sepLen = sepMatch ? sepMatch[0].length : 0;
      if (sepLen > 20) continue;
      const tokenStart = labelEndPos + sepLen;
      const remaining = line.slice(tokenStart);
      const tokenMatch = remaining.match(/^[0-9a-zA-Z-]{5,}/);
      if (!tokenMatch) continue;
      const token = tokenMatch[0];
      // If token looks like uuid candidate but invalid, then malformed
      if (token.includes("-") && !isValidUuid(token)) {
        return true;
      }
      // Also check if token is uuid-like but not exact uuid regex but contains hyphens
      // If token is not valid uuid and contains hyphen, treat as malformed
    }
  }
  return false;
}

function findAssociatedLabels(message: string): { uuid: string; labelType: "request" | "session" | null; index: number }[] {
  const candidates = extractCandidates(message);
  const lines = message.split("\n");
  // Map line start indices
  const lineStarts: number[] = [];
  let pos = 0;
  for (const line of lines) {
    lineStarts.push(pos);
    pos += line.length + 1; // +1 for \n
  }

  return candidates.map((c) => {
    // Find which line this uuid is in
    let lineIdx = 0;
    for (let i = 0; i < lineStarts.length; i++) {
      if (c.index >= lineStarts[i] && c.index < lineStarts[i] + lines[i].length) {
        lineIdx = i;
        break;
      }
    }
    const line = lines[lineIdx];
    const lineStart = lineStarts[lineIdx];
    const uuidPosInLine = c.index - lineStart;

    // Find labels in same line before uuid within 20 chars separators
    let labelType: "request" | "session" | null = null;
    let closestDist = Infinity;

    const requestPositions = findLabelPositions(line, requestLabelRegex);
    const sessionPositions = findLabelPositions(line, sessionLabelRegex);

    for (const p of requestPositions) {
      if (p >= uuidPosInLine) continue;
      const labelRe = new RegExp(requestLabelRegex.source, requestLabelRegex.flags);
      labelRe.lastIndex = p;
      const m = labelRe.exec(line);
      if (!m) continue;
      const labelEnd = m.index + m[0].length;
      const between = line.slice(labelEnd, uuidPosInLine);
      if (between.length > 20) continue;
      if (!/^[\s:=#-]*$/.test(between)) continue;
      const dist = uuidPosInLine - p;
      if (dist < closestDist) {
        closestDist = dist;
        labelType = "request";
      }
    }
    for (const p of sessionPositions) {
      if (p >= uuidPosInLine) continue;
      const labelRe = new RegExp(sessionLabelRegex.source, sessionLabelRegex.flags);
      labelRe.lastIndex = p;
      const m = labelRe.exec(line);
      if (!m) continue;
      const labelEnd = m.index + m[0].length;
      const between = line.slice(labelEnd, uuidPosInLine);
      if (between.length > 20) continue;
      if (!/^[\s:=#-]*$/.test(between)) continue;
      const dist = uuidPosInLine - p;
      if (dist < closestDist) {
        closestDist = dist;
        labelType = "session";
      }
    }

    return { uuid: c.uuid, labelType, index: c.index };
  });
}

export function classifyQuery(message: string): QueryClassification {
  const trimmed = message.trim();
  if (!trimmed) {
    return { kind: "invalid", reason: "malformed-identifier" };
  }

  // Step 1: extract valid UUID candidates
  const validCandidates = extractCandidates(message);
  const uniqueValid = Array.from(new Set(validCandidates.map((c) => c.uuid)));

  // Step 2: check malformed after label
  if (hasMalformedAfterLabel(message)) {
    return { kind: "invalid", reason: "malformed-identifier" };
  }

  // Step 3: check mixed identifier types (labels both present)
  const requestLabels = findLabelPositions(message, requestLabelRegex);
  const sessionLabels = findLabelPositions(message, sessionLabelRegex);
  if (requestLabels.length > 0 && sessionLabels.length > 0) {
    return { kind: "invalid", reason: "mixed-identifier-types" };
  }

  // Step 4: multiple distinct valid UUIDs
  if (uniqueValid.length >= 2) {
    return { kind: "invalid", reason: "multiple-identifiers" };
  }

  // Deduplicate same UUID: already done via uniqueValid

  if (uniqueValid.length === 0) {
    return { kind: "general" };
  }

  // Exactly one distinct valid UUID
  const associated = findAssociatedLabels(message);
  // Filter to unique uuid (since same uuid may appear multiple times, deduplicate)
  const uuidToLabel = new Map<string, ("request" | "session" | null)[]>();
  for (const a of associated) {
    if (!uuidToLabel.has(a.uuid)) uuidToLabel.set(a.uuid, []);
    uuidToLabel.get(a.uuid)!.push(a.labelType);
  }
  const singleUuid = uniqueValid[0];
  const labelsForUuid = uuidToLabel.get(singleUuid) ?? [];
  // If any association is session, treat as session; else if request, request; else null
  const hasSessionAssoc = labelsForUuid.includes("session");
  const hasRequestAssoc = labelsForUuid.includes("request");

  if (hasSessionAssoc && !hasRequestAssoc) {
    return { kind: "session", sessionId: singleUuid };
  }
  if (hasRequestAssoc && !hasSessionAssoc) {
    return { kind: "request", requestId: singleUuid };
  }
  if (hasSessionAssoc && hasRequestAssoc) {
    // Should have been caught as mixed, but if same UUID has both labels, treat as mixed
    return { kind: "invalid", reason: "mixed-identifier-types" };
  }
  // No label association → isolated UUID → request
  return { kind: "request", requestId: singleUuid };
}

export function validateRequestId(value: string): boolean {
  return isValidUuid(value);
}

export function validateSessionId(value: string): boolean {
  return isValidUuid(value);
}
