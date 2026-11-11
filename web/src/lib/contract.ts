import type { Address } from 'viem'
import { sambungAbi } from '../config/abi'
import { CONTRACT_ADDRESS, chain } from '../config/chains'
import { publicClient } from './client'

export type Story = {
  id: bigint
  starter: Address
  lastAuthor: Address
  createdAt: number
  sealedAt: number
  applause: number
  genre: number
  maxLines: number
  lineCount: number
  authorCount: number
  hidden: boolean
  title: string
  opening: string
  latest: string
}

export type Line = { author: Address; writtenAt: number; text: string }

export type Stats = { stories: number; sealed: number; lines: number; authors: number; applause: number }

export type Profile = { penName: string; linesWritten: number; storiesStarted: number; storiesJoined: number }

export class NotDeployedError extends Error {
  constructor() {
    super(`Sambung has not been deployed on ${chain.name} yet.`)
    this.name = 'NotDeployedError'
  }
}

export class StoryMissingError extends Error {
  constructor() {
    super('That story does not exist.')
    this.name = 'StoryMissingError'
  }
}

function contract() {
  if (!CONTRACT_ADDRESS) throw new NotDeployedError()
  return { address: CONTRACT_ADDRESS, abi: sambungAbi } as const
}

const PAGE = 50n

// ───────────────────────────── Reads ─────────────────────────────

export async function fetchStats(): Promise<Stats> {
  const [stories, sealed, lines, authors, applause] = await publicClient.readContract({
    ...contract(),
    functionName: 'stats',
  })
  return {
    stories: Number(stories),
    sealed: Number(sealed),
    lines: Number(lines),
    authors: Number(authors),
    applause: Number(applause),
  }
}

/** Newest first, up to `max` stories. Hidden stories are left out. */
export async function fetchStories(max = 200): Promise<Story[]> {
  const out: Story[] = []
  let cursor = 0n
  do {
    const [page, next] = await publicClient.readContract({
      ...contract(),
      functionName: 'getStories',
      args: [cursor, PAGE],
    })
    out.push(...page)
    cursor = next
  } while (cursor !== 0n && out.length < max)
  return out.filter((s) => !s.hidden)
}

export async function fetchStory(id: bigint): Promise<{ story: Story; lines: Line[] }> {
  const c = contract()
  const count = await publicClient.readContract({ ...c, functionName: 'storyCount' })
  if (id < 1n || id > count) throw new StoryMissingError()
  const [story, lines] = await Promise.all([
    publicClient.readContract({ ...c, functionName: 'getStory', args: [id] }),
    publicClient.readContract({ ...c, functionName: 'getLines', args: [id] }),
  ])
  return { story, lines: [...lines] }
}

export async function fetchHasApplauded(id: bigint, wallet: Address): Promise<boolean> {
  return publicClient.readContract({ ...contract(), functionName: 'hasApplauded', args: [id, wallet] })
}

export async function fetchProfile(wallet: Address): Promise<Profile> {
  const [penName, linesWritten, storiesStarted, storiesJoined] = await publicClient.readContract({
    ...contract(),
    functionName: 'profileOf',
    args: [wallet],
  })
  return { penName, linesWritten, storiesStarted, storiesJoined }
}

export async function fetchPenNames(wallets: readonly Address[]): Promise<readonly string[]> {
  if (wallets.length === 0) return []
  return publicClient.readContract({ ...contract(), functionName: 'getPenNames', args: [wallets] })
}

export type MyStory = { story: Story; myLines: number }

/** Every story a wallet has written in, newest first, with how many lines it wrote in each. */
export async function fetchStoriesOf(wallet: Address): Promise<MyStory[]> {
  const c = contract()
  const ids = await publicClient.readContract({ ...c, functionName: 'storiesOf', args: [wallet] })
  const newestFirst = [...ids].reverse()
  const out: MyStory[] = []
  for (let i = 0; i < newestFirst.length; i += Number(PAGE)) {
    const chunk = newestFirst.slice(i, i + Number(PAGE))
    const [page, counts] = await Promise.all([
      publicClient.readContract({ ...c, functionName: 'getStoriesByIds', args: [chunk] }),
      publicClient.readContract({ ...c, functionName: 'linesByMany', args: [chunk, wallet] }),
    ])
    page.forEach((story, j) => out.push({ story, myLines: counts[j] ?? 0 }))
  }
  return out.filter((entry) => entry.story.id !== 0n)
}

// ───────────────────────────── Writes ─────────────────────────────
//
// Each function dry-runs the call first. A rule the contract would reject surfaces here as a
// readable error before the wallet is asked to sign anything.

export const prepare = {
  startStory: (account: Address, title: string, genre: number, maxLines: number, openingLine: string) =>
    publicClient.simulateContract({
      ...contract(),
      account,
      functionName: 'startStory',
      args: [title, genre, maxLines, openingLine],
    }),

  addLine: (account: Address, storyId: bigint, text: string) =>
    publicClient.simulateContract({ ...contract(), account, functionName: 'addLine', args: [storyId, text] }),

  applaud: (account: Address, storyId: bigint) =>
    publicClient.simulateContract({ ...contract(), account, functionName: 'applaud', args: [storyId] }),

  setPenName: (account: Address, penName: string) =>
    publicClient.simulateContract({ ...contract(), account, functionName: 'setPenName', args: [penName] }),
}
