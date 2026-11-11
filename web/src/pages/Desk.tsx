import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { Address } from 'viem'
import { ByteCount, Empty, ErrorState, Loading, TxStatus } from '../components/bits'
import { StoryList } from '../components/StoryList'
import { chain, CONTRACT_ADDRESS } from '../config/chains'
import { LIMITS, quotaFor } from '../config/site'
import { fetchProfile, fetchStoriesOf, prepare } from '../lib/contract'
import type { MyStory } from '../lib/contract'
import { byteLength, cleanLine, sameAddress, shortAddress } from '../lib/format'
import { href } from '../lib/router'
import { rememberPenName } from '../lib/store'
import { useTx } from '../lib/tx'
import { useAsync } from '../lib/useAsync'
import { useWallet } from '../lib/wallet'

function PenNameForm({ account, current }: { account: Address; current: string }) {
  const tx = useTx()
  const [name, setName] = useState(current)
  const helpId = useId()

  const cleaned = cleanLine(name)
  const used = byteLength(cleaned)
  const valid = used <= LIMITS.penName
  const changed = cleaned !== current

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!valid || !changed || tx.busy) return
    const sent = await tx.run((from) => prepare.setPenName(from, cleaned))
    if (sent) rememberPenName(account, cleaned)
  }

  return (
    <form className="form form--inline" onSubmit={submit}>
      <div className="form__group">
        <div className="form__labelrow">
          <label htmlFor="pen-name">Pen name</label>
          <ByteCount used={used} max={LIMITS.penName} />
        </div>
        <input
          id="pen-name"
          className="field"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={shortAddress(account)}
          autoComplete="off"
          aria-describedby={helpId}
          aria-invalid={!valid}
          disabled={tx.busy}
        />
        <p id={helpId} className={valid ? 'hint' : 'hint hint--error'}>
          {valid
            ? 'Shown next to every line you write. Leave it empty to show your address instead.'
            : 'A pen name can be at most 32 bytes.'}
        </p>
      </div>
      <div className="form__actions">
        <button type="submit" className="btn btn--secondary" disabled={!valid || !changed || tx.busy}>
          Save pen name
        </button>
        <TxStatus state={tx.state} done="Pen name saved." />
      </div>
    </form>
  )
}

/** Whether this wallet may write the next line of a story right now. */
function canWrite({ story, myLines }: MyStory, account: Address): boolean {
  if (story.sealedAt !== 0) return false
  if (sameAddress(story.lastAuthor, account)) return false
  return myLines < quotaFor(story.maxLines)
}

export function Desk() {
  const wallet = useWallet()
  const account = wallet.active?.account
  const ready = !!account && !!CONTRACT_ADDRESS

  const profile = useAsync(ready ? `profile:${account}` : null, () => fetchProfile(account as Address))
  const mine = useAsync(ready ? `mine:${account}` : null, () => fetchStoriesOf(account as Address))

  if (!account) {
    return (
      <div className="wrap page page--narrow">
        <h1 className="page__title">My desk</h1>
        <p className="page__lead">Your pen name, your lines, and the stories you have a hand in.</p>
        <Empty title="Connect a wallet to see your desk.">
          <button type="button" className="btn btn--primary" onClick={wallet.openDialog}>
            Connect wallet
          </button>
        </Empty>
      </div>
    )
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="wrap page page--narrow">
        <h1 className="page__title">My desk</h1>
        <p className="page__lead">Your pen name, your lines, and the stories you have a hand in.</p>
        <Empty title={`Your desk opens once Sambung is live on ${chain.name}.`} />
      </div>
    )
  }

  const entries = (mine.data ?? []).filter((entry) => !entry.story.hidden)
  const stories = entries.map((entry) => entry.story)
  const yourTurn = entries.filter((entry) => canWrite(entry, account)).map((entry) => entry.story)
  const waiting = stories.filter((s) => s.sealedAt === 0 && !yourTurn.includes(s))
  const sealed = stories.filter((s) => s.sealedAt !== 0)

  return (
    <div className="wrap page">
      <h1 className="page__title">My desk</h1>
      <p className="page__lead">Your pen name, your lines, and the stories you have a hand in.</p>

      <div className="desk">
        <section className="desk__profile" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="minor-heading">
            Writer
          </h2>
          {profile.loading && !profile.data && <Loading />}
          {profile.error !== undefined && !profile.data && <ErrorState error={profile.error} onRetry={profile.reload} />}
          {profile.data && (
            <>
              <dl className="stats stats--compact">
                <div>
                  <dt>{profile.data.linesWritten === 1 ? 'line written' : 'lines written'}</dt>
                  <dd>{profile.data.linesWritten}</dd>
                </div>
                <div>
                  <dt>{profile.data.storiesStarted === 1 ? 'story opened' : 'stories opened'}</dt>
                  <dd>{profile.data.storiesStarted}</dd>
                </div>
                <div>
                  <dt>{profile.data.storiesJoined === 1 ? 'story joined' : 'stories joined'}</dt>
                  <dd>{profile.data.storiesJoined}</dd>
                </div>
              </dl>
              <PenNameForm key={account} account={account} current={profile.data.penName} />
            </>
          )}
        </section>

        <section className="desk__stories" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="minor-heading">
            Your stories
          </h2>
          {mine.loading && !mine.data && <Loading />}
          {mine.error !== undefined && !mine.data && <ErrorState error={mine.error} onRetry={mine.reload} />}
          {mine.data && stories.length === 0 && (
            <Empty title="You have not written a line yet.">
              <p>Open a story of your own, or pick up one that is waiting for its next line.</p>
              <div className="state__actions">
                <a className="btn btn--primary" href={href.newStory}>
                  Start a story
                </a>
                <a className="btn btn--secondary" href={href.home}>
                  Continue one
                </a>
              </div>
            </Empty>
          )}

          {yourTurn.length > 0 && (
            <div className="desk__block">
              <h3 className="desk__sub">Ready for another line from you</h3>
              <StoryList stories={yourTurn} />
            </div>
          )}
          {waiting.length > 0 && (
            <div className="desk__block">
              <h3 className="desk__sub">Waiting for someone else</h3>
              <StoryList stories={waiting} />
            </div>
          )}
          {sealed.length > 0 && (
            <div className="desk__block">
              <h3 className="desk__sub">Sealed</h3>
              <StoryList stories={sealed} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
