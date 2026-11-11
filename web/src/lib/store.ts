import { useEffect, useSyncExternalStore } from 'react'
import type { Address } from 'viem'
import { fetchPenNames } from './contract'
import { shortAddress } from './format'

// ───────────────────────────── Revision ─────────────────────────────
// Bumped after every confirmed transaction so on-screen data refetches.

let revision = 0
const revisionListeners = new Set<() => void>()

export function bumpRevision() {
  revision += 1
  revisionListeners.forEach((notify) => notify())
}

export function useRevision(): number {
  return useSyncExternalStore(
    (notify) => {
      revisionListeners.add(notify)
      return () => revisionListeners.delete(notify)
    },
    () => revision,
  )
}

// ───────────────────────────── Pen names ─────────────────────────────
// One shared cache. Names asked for in the same tick are fetched in a single call.

const names = new Map<string, string>() // lower-case address -> pen name ('' when none is set)
const pending = new Set<Address>()
const nameListeners = new Set<() => void>()
let namesVersion = 0
let flushScheduled = false

function notifyNames() {
  namesVersion += 1
  nameListeners.forEach((notify) => notify())
}

async function flush() {
  flushScheduled = false
  const wanted = [...pending]
  pending.clear()
  if (wanted.length === 0) return
  try {
    const result = await fetchPenNames(wanted)
    wanted.forEach((address, i) => names.set(address.toLowerCase(), result[i] ?? ''))
    notifyNames()
  } catch {
    // Names are a nicety. Without them the short address is shown; the next render retries.
  }
}

function requestName(address: Address) {
  if (names.has(address.toLowerCase()) || pending.has(address)) return
  pending.add(address)
  if (!flushScheduled) {
    flushScheduled = true
    setTimeout(flush, 0)
  }
}

export function rememberPenName(address: Address, penName: string) {
  names.set(address.toLowerCase(), penName)
  notifyNames()
}

/** The pen name for an address, or undefined when none is set or it is not loaded yet. */
export function usePenName(address: Address | undefined): string | undefined {
  useSyncExternalStore(
    (notify) => {
      nameListeners.add(notify)
      return () => nameListeners.delete(notify)
    },
    () => namesVersion,
  )
  useEffect(() => {
    if (address) requestName(address)
  })
  if (!address) return undefined
  return names.get(address.toLowerCase()) || undefined
}

export function displayName(address: Address, penName: string | undefined): string {
  return penName || shortAddress(address)
}
