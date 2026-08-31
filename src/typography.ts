export const FONT = {
  // Korean UI uses the iOS system family so Hangul never falls through from
  // Avenir Next with mismatched metrics. Avenir is reserved for large numbers,
  // while Menlo remains limited to short ASCII data labels.
  display: 'System',
  headline: 'System',
  body: 'System',
  data: 'Menlo',
  archival: 'System',
  metric: 'Avenir Next',
} as const;
