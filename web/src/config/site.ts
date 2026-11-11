export const SITE = {
  name: 'Sambung',
  tagline: 'Stories written one line at a time',
  /** The project's X profile. Leave empty until the account exists; the footer hides the link. */
  xUrl: '',
  botchainUrl: 'https://botchain.ai',
  botchainScanUrl: 'https://scan.botchain.ai',
} as const

export const GENRES = ['Open', 'Mystery', 'Romance', 'Comedy', 'Horror', 'Sci-Fi', 'Folklore'] as const

export const LENGTHS = [
  { lines: 6, name: 'Short', blurb: 'Three people can finish it over coffee.' },
  { lines: 12, name: 'Classic', blurb: 'Room for a turn or two in the plot.' },
  { lines: 18, name: 'Long', blurb: 'For a story that wants to wander.' },
] as const

/** No wallet may write more than a third of a story. */
export const quotaFor = (maxLines: number): number => Math.floor(maxLines / 3)

export const LIMITS = { titleMin: 3, titleMax: 64, line: 280, penName: 32 } as const
