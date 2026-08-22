/**
 * Returns singular or plural form based on count.
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Formats a badge label with optional count.
 */
export function formatBadge(label: string, count?: number): string {
  if (count === undefined) return label;
  return `${label} (${count})`;
}

/**
 * Returns a severity label for diagnostic contexts.
 */
export function getSeverityLabel(code: string): string {
  switch (code) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    case "evidence":
      return "Evidence";
    case "recommended":
      return "Recommended";
    default:
      return "Unknown";
  }
}
