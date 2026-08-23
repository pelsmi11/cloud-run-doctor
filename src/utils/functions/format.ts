/**
 * Returns singular or plural form based on count.
 */
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

/**
 * Formats a badge label with optional count.
 */
export const formatBadge = (label: string, count?: number): string => {
  if (count === undefined) return label;
  return `${label} (${count})`;
};
