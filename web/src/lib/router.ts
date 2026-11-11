import { useMemo, useSyncExternalStore } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'story'; id: bigint }
  | { name: 'new' }
  | { name: 'library' }
  | { name: 'desk' }
  | { name: 'notfound' }

/** Hash routes, so the app deploys as static files with no server rewrites. */
export const href = {
  home: '#/',
  story: (id: bigint | number) => `#/story/${id}`,
  newStory: '#/new',
  library: '#/library',
  desk: '#/desk',
} as const

function parse(hash: string): Route {
  const parts = hash.replace(/^#/, '').split('/').filter(Boolean)
  if (parts.length === 0) return { name: 'home' }
  const [head, arg] = parts
  if (head === 'story' && arg && /^\d{1,18}$/.test(arg) && parts.length === 2) return { name: 'story', id: BigInt(arg) }
  if (parts.length !== 1) return { name: 'notfound' }
  if (head === 'new') return { name: 'new' }
  if (head === 'library') return { name: 'library' }
  if (head === 'desk') return { name: 'desk' }
  return { name: 'notfound' }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return useMemo(() => parse(hash), [hash])
}

export function navigate(to: string) {
  window.location.hash = to
}

/** Absolute link to a route, for copying and sharing. */
export function absoluteUrl(to: string): string {
  return `${window.location.origin}${window.location.pathname}${to}`
}
