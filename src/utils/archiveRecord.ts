export function getArchiveRecord(content: string, fallback: string) {
  const lines = content.trimEnd().split(/\r?\n/);
  const lastLine = lines[lines.length - 1]?.trim() ?? '';
  return /^(?:সত্রূ|সূত্র)\s*[:：]\s*(?:জ\s*-?\s*)?[০-৯0-9\s]+$/u.test(lastLine)
    ? lastLine
    : `Archive ${fallback}`;
}
