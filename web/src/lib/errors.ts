import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from 'viem'
import { chain } from '../config/chains'
import { NotDeployedError, StoryMissingError } from './contract'

/** What each contract rejection means, in words a writer can act on. */
const REVERTS: Record<string, string> = {
  NotYourTurn: 'You wrote the last line. Someone else has to write the next one.',
  QuotaReached: 'You have already written your share of this story.',
  StoryIsSealed: 'Someone just wrote the last line. This story is sealed.',
  StoryNotFound: 'That story does not exist.',
  StoryIsHidden: 'This story has been hidden and can no longer be changed.',
  StoryStillOpen: 'Applause opens once the story is sealed.',
  AuthorsCannotApplaud: 'Authors cannot applaud their own story.',
  AlreadyApplauded: 'You have already applauded this story.',
  InvalidTitle: 'The title must be between 3 and 64 bytes.',
  InvalidGenre: 'Pick one of the listed genres.',
  InvalidLength: 'Pick one of the three story lengths.',
  InvalidLine: 'A line must be between 1 and 280 bytes.',
  InvalidPenName: 'A pen name can be at most 32 bytes.',
  NotOwner: 'Only the contract owner can do that.',
}

const CANCELLED = 'You cancelled the request in your wallet.'
const FALLBACK = 'Something went wrong. Please try again.'

export function describeError(err: unknown): string {
  if (err instanceof NotDeployedError || err instanceof StoryMissingError) return err.message

  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) return CANCELLED

    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName
      if (name && REVERTS[name]) return REVERTS[name]
    }

    const text = `${err.shortMessage} ${err.message}`.toLowerCase()
    if (text.includes('insufficient funds')) return 'This wallet does not hold enough BOT to pay for gas.'
    if (text.includes('does not match the target chain') || text.includes('chain mismatch')) {
      return `Your wallet is on another network. Switch it to ${chain.name} and try again.`
    }
    if (text.includes('http request failed') || text.includes('failed to fetch') || text.includes('timed out')) {
      return `Could not reach ${chain.name}. Check your connection and try again.`
    }
    return err.shortMessage || FALLBACK
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 4001) {
    return CANCELLED
  }
  if (err instanceof Error && err.message) return err.message
  return FALLBACK
}
