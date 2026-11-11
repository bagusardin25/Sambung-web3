import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ByteCount, Dot, TxStatus } from '../components/bits'
import { chain } from '../config/chains'
import { GENRES, LENGTHS, LIMITS, quotaFor } from '../config/site'
import { prepare } from '../lib/contract'
import { byteLength, cleanLine } from '../lib/format'
import { href, navigate } from '../lib/router'
import { useTx } from '../lib/tx'
import { useWallet } from '../lib/wallet'

export function NewStory() {
  const wallet = useWallet()
  const tx = useTx()
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState(0)
  const [maxLines, setMaxLines] = useState<number>(LENGTHS[0].lines)
  const [opening, setOpening] = useState('')
  const [touched, setTouched] = useState(false)
  const titleHelp = useId()
  const openingHelp = useId()

  const cleanTitle = cleanLine(title)
  const cleanOpening = cleanLine(opening)
  const titleBytes = byteLength(cleanTitle)
  const openingBytes = byteLength(cleanOpening)

  const titleError =
    titleBytes < LIMITS.titleMin
      ? 'Give the story a title of at least three letters.'
      : titleBytes > LIMITS.titleMax
        ? 'That title is too long.'
        : undefined
  const openingError =
    openingBytes < 1 ? 'Write the opening line.' : openingBytes > LIMITS.line ? 'That line is too long.' : undefined
  const valid = !titleError && !openingError

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (!valid) {
      // Take the writer straight to the first field that needs fixing.
      document.getElementById(titleError ? 'story-title' : 'story-opening')?.focus()
      return
    }
    if (tx.busy) return
    const sent = await tx.run((from) => prepare.startStory(from, cleanTitle, genre, maxLines, cleanOpening))
    if (sent) navigate(href.story(sent.result))
  }

  const account = wallet.active?.account

  return (
    <div className="wrap page page--narrow">
      <a className="back" href={href.home}>
        <ArrowLeft size={16} aria-hidden="true" /> All stories
      </a>
      <h1 className="page__title">Start a story</h1>
      <p className="page__lead">
        You write the title and the first line. After that the story belongs to whoever picks up the thread.
      </p>

      <form className="form" onSubmit={submit} noValidate>
        <div className="form__group">
          <div className="form__labelrow">
            <label htmlFor="story-title">Title</label>
            <ByteCount used={titleBytes} max={LIMITS.titleMax} />
          </div>
          <input
            id="story-title"
            className="field"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The lamp on the pier"
            autoComplete="off"
            aria-describedby={titleHelp}
            aria-invalid={touched && !!titleError}
            disabled={tx.busy}
          />
          <p id={titleHelp} className={touched && titleError ? 'hint hint--error' : 'hint'}>
            {touched && titleError ? titleError : 'Three to 64 bytes. Accented letters and emoji use more than one.'}
          </p>
        </div>

        <fieldset className="form__group">
          <legend>Genre</legend>
          <div className="chips">
            {GENRES.map((name, i) => (
              <label key={name} className="chip">
                <input
                  type="radio"
                  name="genre"
                  value={i}
                  checked={genre === i}
                  onChange={() => setGenre(i)}
                  disabled={tx.busy}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form__group">
          <legend>Length</legend>
          <div className="options">
            {LENGTHS.map((option) => (
              <label key={option.lines} className="option">
                <input
                  type="radio"
                  name="length"
                  value={option.lines}
                  checked={maxLines === option.lines}
                  onChange={() => setMaxLines(option.lines)}
                  disabled={tx.busy}
                />
                <span className="option__body">
                  <span className="option__name">{option.name}</span>
                  <span className="option__fact">
                    {option.lines} lines
                    <Dot />
                    up to {quotaFor(option.lines)} each
                  </span>
                  <span className="option__blurb">{option.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form__group">
          <div className="form__labelrow">
            <label htmlFor="story-opening">Opening line</label>
            <ByteCount used={openingBytes} max={LIMITS.line} />
          </div>
          <textarea
            id="story-opening"
            className="field field--story"
            rows={3}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            placeholder="The lamp at the end of the pier went out at nine, the way it never had."
            aria-describedby={openingHelp}
            aria-invalid={touched && !!openingError}
            disabled={tx.busy}
          />
          <p id={openingHelp} className={touched && openingError ? 'hint hint--error' : 'hint'}>
            {touched && openingError
              ? openingError
              : 'One line, up to 280 bytes. It counts as the first of your lines in this story.'}
          </p>
        </div>

        <div className="note">
          <p>
            <strong>This is written to {chain.name} and cannot be edited or deleted.</strong> Keep private details out of
            it.
          </p>
        </div>

        <div className="form__actions">
          {!account ? (
            <button type="button" className="btn btn--primary" onClick={wallet.openDialog}>
              Connect wallet to open the story
            </button>
          ) : (
            <button type="submit" className="btn btn--primary" disabled={tx.busy}>
              Open the story
            </button>
          )}
          <TxStatus state={tx.state} done="Story opened." />
        </div>
      </form>
    </div>
  )
}
