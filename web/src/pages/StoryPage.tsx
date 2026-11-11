import { useEffect, useId, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Address } from 'viem'
import { ArrowLeft, Check } from 'lucide-react'
import { AuthorName, ByteCount, CopyButton, Dot, ErrorState, Loading, ProgressKnots, TxStatus } from '../components/bits'
import { chain } from '../config/chains'
import { GENRES, LIMITS, quotaFor } from '../config/site'
import { fetchHasApplauded, fetchStory, prepare, StoryMissingError } from '../lib/contract'
import type { Line, Story } from '../lib/contract'
import { byteLength, cleanLine, formatDate, plural, sameAddress, timeAgo } from '../lib/format'
import { absoluteUrl, href } from '../lib/router'
import { useTx } from '../lib/tx'
import { useAsync, useInterval } from '../lib/useAsync'
import { useWallet } from '../lib/wallet'

function ShareBar({ story }: { story: Story }) {
  const url = absoluteUrl(href.story(story.id))
  const sealed = story.sealedAt !== 0
  const text = sealed
    ? `“${story.title}” — a story written by ${story.authorCount} people, one line at a time, on Sambung.`
    : `“${story.title}” needs its next line. Add yours on Sambung.`
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  return (
    <div className="share">
      <CopyButton text={url} label="Copy link" />
      <a className="btn btn--secondary btn--small" href={intent} target="_blank" rel="noreferrer">
        Share on X
      </a>
    </div>
  )
}

function Composer({ story, lines }: { story: Story; lines: Line[] }) {
  const wallet = useWallet()
  const tx = useTx()
  const [text, setText] = useState('')
  const helpId = useId()
  const countId = useId()

  const account = wallet.active?.account
  const quota = quotaFor(story.maxLines)
  const mine = account ? lines.filter((l) => sameAddress(l.author, account)).length : 0
  const nextNo = story.lineCount + 1
  const isLast = nextNo === story.maxLines

  const cleaned = cleanLine(text)
  const used = byteLength(cleaned)
  const valid = used >= 1 && used <= LIMITS.line

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || tx.busy) return
    const sent = await tx.run((from) => prepare.addLine(from, story.id, cleaned))
    if (sent) setText('')
  }

  let body
  if (!account) {
    body = (
      <div className="composer__blocked">
        <p>Connect a wallet to write this line.</p>
        <button type="button" className="btn btn--primary" onClick={wallet.openDialog}>
          Connect wallet
        </button>
      </div>
    )
  } else if (wallet.wrongChain) {
    body = (
      <div className="composer__blocked">
        <p>Your wallet is on another network.</p>
        <button type="button" className="btn btn--primary" onClick={() => void wallet.switchChain()}>
          Switch to {chain.name}
        </button>
      </div>
    )
  } else if (sameAddress(story.lastAuthor, account)) {
    body = (
      <div className="composer__blocked">
        <p>
          <strong>You wrote the last line.</strong> The thread is someone else’s now. Send them this story.
        </p>
        <ShareBar story={story} />
      </div>
    )
  } else if (mine >= quota) {
    body = (
      <div className="composer__blocked">
        <p>
          <strong>
            You have written {mine} of your {quota} lines.
          </strong>{' '}
          The rest of this story belongs to other people.
        </p>
        <ShareBar story={story} />
      </div>
    )
  } else {
    body = (
      <form className="composer__form" onSubmit={submit}>
        <label className="sr-only" htmlFor="next-line">
          Your line
        </label>
        <textarea
          id="next-line"
          className="field field--story"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isLast ? 'End the story…' : 'Carry the story on…'}
          aria-describedby={`${helpId} ${countId}`}
          aria-invalid={used > LIMITS.line}
          disabled={tx.busy}
        />
        <div className="composer__foot">
          <p id={helpId} className="hint">
            {isLast ? 'This line seals the story. ' : ''}Public and permanent once written. You have used {mine} of your{' '}
            {quota} lines.
          </p>
          <ByteCount id={countId} used={used} max={LIMITS.line} />
        </div>
        <div className="composer__actions">
          <button type="submit" className="btn btn--primary" disabled={!valid || tx.busy}>
            {isLast ? 'Write the last line' : 'Add your line'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <section className="composer" aria-labelledby="composer-heading">
      <span className="composer__knot" aria-hidden="true" />
      <h2 id="composer-heading" className="composer__label">
        Line {nextNo} of {story.maxLines}
        {isLast && (
          <>
            <Dot />
            the last one
          </>
        )}
      </h2>
      {body}
      {/* Outside the form on purpose: once a line lands the form gives way to "pass the thread",
          and the confirmation with its transaction link should still be on screen. */}
      <div className="composer__status">
        <TxStatus state={tx.state} done="Your line is on the thread." />
      </div>
    </section>
  )
}

function SealedPanel({ story, lines }: { story: Story; lines: Line[] }) {
  const wallet = useWallet()
  const tx = useTx()
  const account = wallet.active?.account
  const isAuthor = !!account && lines.some((l) => sameAddress(l.author, account))
  const applauded = useAsync(account && !isAuthor ? `applauded:${story.id}:${account}` : null, () =>
    fetchHasApplauded(story.id, account as Address),
  )

  const applaud = () => tx.run((from) => prepare.applaud(from, story.id))

  return (
    <section className="sealed" aria-labelledby="sealed-heading">
      <span className="sealed__seal" aria-hidden="true">
        <Check size={16} strokeWidth={3} />
      </span>
      <h2 id="sealed-heading" className="sealed__title">
        Sealed on {formatDate(story.sealedAt)}
      </h2>
      <p className="sealed__text">
        {plural(story.authorCount, 'author')} wrote this story, a line at a time. Nothing in it can be changed now.
      </p>

      <div className="applause">
        <p className="applause__count">
          <span className="applause__number">{story.applause}</span> applause
        </p>
        {isAuthor ? (
          <p className="hint">You helped write this one, so the applause is up to others.</p>
        ) : applauded.data ? (
          <p className="applause__done">
            <Check size={16} aria-hidden="true" /> You applauded this story.
          </p>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => void applaud()} disabled={tx.busy}>
            Applaud
          </button>
        )}
        {!applauded.data && <TxStatus state={tx.state} done="Applause recorded." />}
      </div>
    </section>
  )
}

function Authors({ lines, account }: { lines: Line[]; account: Address | undefined }) {
  const authors = useMemo(() => {
    const counts = new Map<Address, number>()
    for (const line of lines) counts.set(line.author, (counts.get(line.author) ?? 0) + 1)
    return [...counts.entries()]
  }, [lines])

  return (
    <section className="authors" aria-labelledby="authors-heading">
      <h2 id="authors-heading" className="minor-heading">
        Written by
      </h2>
      <ul className="authors__list">
        {authors.map(([address, count]) => (
          <li key={address}>
            <AuthorName address={address} you={sameAddress(address, account)} />
            <span className="authors__count">{plural(count, 'line')}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function StoryPage({ id }: { id: bigint }) {
  const wallet = useWallet()
  const account = wallet.active?.account
  const bundle = useAsync(`story:${id}`, () => fetchStory(id))
  const story = bundle.data?.story
  const lines = bundle.data?.lines

  // Other people may be writing: keep an open story fresh.
  const open = !!story && story.sealedAt === 0 && !story.hidden
  useInterval(bundle.reload, open ? 8000 : null)

  useEffect(() => {
    if (story) document.title = `${story.title} · Sambung`
  }, [story])

  // Lines that arrive after the story first loads are animated in. (The page is keyed by story id.)
  const [seenCount, setSeenCount] = useState<number | null>(null)
  if (lines && seenCount === null) setSeenCount(lines.length)

  if (!story || !lines) {
    return (
      <div className="wrap page">
        <a className="back" href={href.home}>
          <ArrowLeft size={16} aria-hidden="true" /> All stories
        </a>
        {bundle.error instanceof StoryMissingError ? (
          <div className="state state--empty">
            <h1 className="page__title">No such story</h1>
            <p>Story #{String(id)} has not been opened yet. Perhaps it is yours to start.</p>
            <a className="btn btn--primary" href={href.newStory}>
              Start a story
            </a>
          </div>
        ) : bundle.error !== undefined ? (
          <ErrorState error={bundle.error} onRetry={bundle.reload} />
        ) : (
          <Loading label="Unrolling the thread…" />
        )}
      </div>
    )
  }

  if (story.hidden) {
    return (
      <div className="wrap page">
        <a className="back" href={href.home}>
          <ArrowLeft size={16} aria-hidden="true" /> All stories
        </a>
        <div className="state state--empty">
          <h1 className="page__title">This story is hidden</h1>
          <p>A moderator has taken it out of Sambung. Its text remains on BOT Chain, but it is no longer shown here.</p>
        </div>
      </div>
    )
  }

  const sealed = story.sealedAt !== 0

  return (
    <article className="wrap page story">
      <a className="back" href={sealed ? href.library : href.home}>
        <ArrowLeft size={16} aria-hidden="true" /> {sealed ? 'Library' : 'All stories'}
      </a>

      <header className="story__head">
        <p className="story__kicker">
          <span className="tag">{GENRES[story.genre] ?? 'Open'}</span>
          <span className={sealed ? 'status status--sealed' : 'status'}>{sealed ? 'Sealed' : 'Being written'}</span>
        </p>
        <h1 className="story__title">{story.title}</h1>
        <p className="story__meta">
          Opened by <AuthorName address={story.starter} you={sameAddress(story.starter, account)} />
          <Dot />
          {timeAgo(story.createdAt)}
        </p>
        <div className="story__progress">
          <ProgressKnots written={story.lineCount} total={story.maxLines} />
          <span>
            {story.lineCount} of {story.maxLines} lines
            <Dot />
            {plural(story.authorCount, 'author')}
          </span>
        </div>
      </header>

      <ol className="thread thread--story">
        {lines.map((line, i) => {
          const mine = sameAddress(line.author, account)
          const classes = ['thread__item']
          if (mine) classes.push('is-mine')
          if (seenCount !== null && i >= seenCount) classes.push('is-new')
          return (
            <li key={i} className={classes.join(' ')}>
              <span className="thread__no" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="thread__knot" aria-hidden="true" />
              <p className="thread__text">{line.text}</p>
              <p className="thread__by">
                <AuthorName address={line.author} you={mine} />
                <Dot />
                {timeAgo(line.writtenAt)}
              </p>
            </li>
          )
        })}
      </ol>

      {sealed ? <SealedPanel story={story} lines={lines} /> : <Composer story={story} lines={lines} />}

      <footer className="story__foot">
        <Authors lines={lines} account={account} />
        <section aria-labelledby="share-heading">
          <h2 id="share-heading" className="minor-heading">
            {sealed ? 'Share this story' : 'Invite the next writer'}
          </h2>
          <ShareBar story={story} />
          <p className="hint">
            Story #{String(story.id)} on {chain.name}
          </p>
        </section>
      </footer>
    </article>
  )
}
