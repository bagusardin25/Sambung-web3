import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Address } from 'viem'
import { Check, Copy, RefreshCw } from 'lucide-react'
import { explorerTxUrl } from '../config/chains'
import { describeError } from '../lib/errors'
import { shortAddress } from '../lib/format'
import { usePenName } from '../lib/store'
import type { TxState } from '../lib/tx'

/** The Sambung mark: a thread with one knot. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M22 7.5c-9.5 0-13.5 1.5-13.5 5 0 3.5 4 3.5 7.5 3.5s7.5 0 7.5 3.5c0 3.5-4 5-13.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
    </svg>
  )
}

/** A writer's pen name, or their shortened address when they have not set one. */
export function AuthorName({ address, you = false }: { address: Address; you?: boolean }) {
  const penName = usePenName(address)
  return (
    <span className="author" title={address}>
      {penName ? <span className="author__pen">{penName}</span> : <span className="author__addr">{shortAddress(address)}</span>}
      {you && <span className="author__you">you</span>}
    </span>
  )
}

/** A middle dot between two facts, spaced by CSS because the UI font sets a narrow space. */
export function Dot() {
  return (
    <span className="dot" aria-hidden="true">
      ·
    </span>
  )
}

/** One knot per line of the story; filled knots are written. */
export function ProgressKnots({ written, total }: { written: number; total: number }) {
  return (
    <span className="knots" role="img" aria-label={`${written} of ${total} lines written`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < written ? 'knots__knot is-written' : 'knots__knot'} />
      ))}
    </span>
  )
}

export function Loading({ label = 'Reading from BOT Chain…' }: { label?: string }) {
  return (
    <p className="state state--loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p>{describeError(error)}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--small" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {children}
    </div>
  )
}

const PHASE_TEXT: Partial<Record<TxState['phase'], string>> = {
  preparing: 'Checking the rules with the contract…',
  wallet: 'Confirm in your wallet…',
  mining: 'Writing to BOT Chain…',
}

/** Live progress of a transaction, announced to screen readers. */
export function TxStatus({ state, done }: { state: TxState; done?: string }) {
  if (state.phase === 'idle') return null
  const txUrl = state.hash ? explorerTxUrl(state.hash) : undefined

  if (state.phase === 'error') {
    return (
      <p className="tx tx--error" role="alert">
        {state.error}
      </p>
    )
  }
  return (
    <p className={state.phase === 'done' ? 'tx tx--done' : 'tx'} role="status">
      {state.phase === 'done' ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <span className="spinner" aria-hidden="true" />
      )}
      <span>{state.phase === 'done' ? (done ?? 'Done.') : PHASE_TEXT[state.phase]}</span>
      {txUrl && (
        <a href={txUrl} target="_blank" rel="noreferrer">
          View transaction
        </a>
      )}
    </p>
  )
}

/** Copies text and confirms it for a moment. */
export function CopyButton({
  text,
  label,
  className = 'btn btn--secondary btn--small',
}: {
  text: string
  label: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this:', text)
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  )
}

/** Counts UTF-8 bytes against the contract's limit. */
export function ByteCount({ id, used, max }: { id?: string; used: number; max: number }) {
  const over = used > max
  return (
    <span id={id} className={over ? 'count is-over' : 'count'}>
      {used} / {max}
      {over && <span className="sr-only"> — too long</span>}
    </span>
  )
}
