import { ArrowRight } from 'lucide-react'
import { AuthorName, Empty, ErrorState, Loading } from '../components/bits'
import { StoryList } from '../components/StoryList'
import { chain, CONTRACT_ADDRESS } from '../config/chains'
import { GENRES } from '../config/site'
import { fetchStats, fetchStories } from '../lib/contract'
import type { Story } from '../lib/contract'
import { plural } from '../lib/format'
import { href } from '../lib/router'
import { useAsync } from '../lib/useAsync'

const STEPS = [
  { title: 'Open', text: 'Give a story a title and its first line. That is all you owe it.' },
  { title: 'Pass', text: 'Someone else writes the next line. Nobody may write twice in a row.' },
  { title: 'Share', text: 'No wallet may write more than a third, so every story needs at least three authors.' },
  { title: 'Seal', text: 'The last line closes the story for good. From then on, readers can applaud it.' },
]

/** The open story closest to being finished, so the specimen always shows a real invitation. */
function pickFeatured(open: Story[]): Story | undefined {
  return [...open]
    .filter((s) => s.lineCount >= 2)
    .sort((a, b) => a.maxLines - a.lineCount - (b.maxLines - b.lineCount) || Number(b.id - a.id))[0]
}

function Specimen({ story }: { story: Story | undefined }) {
  if (!story) {
    return (
      <aside className="specimen" aria-label="An example of a story being written">
        <p className="specimen__label">Example</p>
        <p className="specimen__title">The lamp on the pier</p>
        <ol className="thread thread--compact">
          <li className="thread__item">
            <span className="thread__knot" aria-hidden="true" />
            <p className="thread__text">The lamp at the end of the pier went out at nine, the way it never had.</p>
          </li>
          <li className="thread__item">
            <span className="thread__knot" aria-hidden="true" />
            <p className="thread__text">Nobody admitted to touching it, though the ladder was still warm.</p>
          </li>
          <li className="thread__item thread__item--next">
            <span className="thread__knot" aria-hidden="true" />
            <p className="thread__next">The next line is someone else’s.</p>
          </li>
        </ol>
      </aside>
    )
  }

  const next = story.lineCount + 1
  return (
    <aside className="specimen" aria-label="A story being written right now">
      <p className="specimen__label">
        Being written · {GENRES[story.genre]} · line {next} of {story.maxLines}
      </p>
      <p className="specimen__title">{story.title}</p>
      <ol className="thread thread--compact">
        <li className="thread__item">
          <span className="thread__knot" aria-hidden="true" />
          <p className="thread__text">{story.opening}</p>
        </li>
        {story.lineCount > 2 && (
          <li className="thread__item thread__item--gap">
            <p className="thread__gap">{plural(story.lineCount - 2, 'more line')}</p>
          </li>
        )}
        <li className="thread__item">
          <span className="thread__knot" aria-hidden="true" />
          <p className="thread__text">{story.latest}</p>
          <p className="thread__by">
            <AuthorName address={story.lastAuthor} />
          </p>
        </li>
        <li className="thread__item thread__item--next">
          <span className="thread__knot" aria-hidden="true" />
          <a className="thread__next" href={href.story(story.id)}>
            {next === story.maxLines ? 'Write the last line' : 'Write the next line'}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </li>
      </ol>
    </aside>
  )
}

export function Home() {
  const stories = useAsync(CONTRACT_ADDRESS ? 'stories' : null, () => fetchStories())
  const stats = useAsync(CONTRACT_ADDRESS ? 'stats' : null, fetchStats)

  const all = stories.data ?? []
  const open = all
    .filter((s) => s.sealedAt === 0)
    .sort((a, b) => a.maxLines - a.lineCount - (b.maxLines - b.lineCount) || Number(b.id - a.id))
  const sealed = all.filter((s) => s.sealedAt !== 0).sort((a, b) => b.sealedAt - a.sealedAt)

  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">A writing game on BOT Chain</p>
            <h1 className="hero__title">
              Write one line.
              <br />
              <em>Pass the thread.</em>
            </h1>
            <p className="hero__lead">
              Sambung is where strangers finish each other’s stories. Open one with a single line, let other wallets
              carry it on, and when the last line lands the story is sealed on BOT Chain for good.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href={href.newStory}>
                Start a story
              </a>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => document.getElementById('being-written')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Continue one
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <Specimen story={pickFeatured(open)} />
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="wrap">
          <h2 id="how-heading" className="section__title">
            How a story gets written
          </h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="steps__item">
                <span className="steps__no" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="steps__title">{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {stats.data && stats.data.stories > 0 && (
        <section className="section section--tight" aria-label="Sambung in numbers">
          <div className="wrap">
            <dl className="stats">
              <div>
                <dt>{stats.data.stories === 1 ? 'story opened' : 'stories opened'}</dt>
                <dd>{stats.data.stories}</dd>
              </div>
              <div>
                <dt>sealed for good</dt>
                <dd>{stats.data.sealed}</dd>
              </div>
              <div>
                <dt>{stats.data.lines === 1 ? 'line written' : 'lines written'}</dt>
                <dd>{stats.data.lines}</dd>
              </div>
              <div>
                <dt>{stats.data.authors === 1 ? 'author' : 'authors'}</dt>
                <dd>{stats.data.authors}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <section id="being-written" className="section" aria-labelledby="open-heading">
        <div className="wrap">
          <div className="section__head">
            <h2 id="open-heading" className="section__title">
              Being written
            </h2>
            <p className="section__note">Closest to the end first. Pick one and add a line.</p>
          </div>

          {!CONTRACT_ADDRESS && <Empty title={`Stories will appear here once Sambung is live on ${chain.name}.`} />}
          {stories.loading && !stories.data && <Loading />}
          {stories.error !== undefined && !stories.data && <ErrorState error={stories.error} onRetry={stories.reload} />}
          {stories.data && open.length === 0 && (
            <Empty title="No story is waiting for a line right now.">
              <p>Open one and send the link to two friends. Three people can finish a short story in minutes.</p>
              <a className="btn btn--primary" href={href.newStory}>
                Start a story
              </a>
            </Empty>
          )}
          {open.length > 0 && <StoryList stories={open} />}
        </div>
      </section>

      {sealed.length > 0 && (
        <section className="section" aria-labelledby="sealed-heading">
          <div className="wrap">
            <div className="section__head">
              <h2 id="sealed-heading" className="section__title">
                Freshly sealed
              </h2>
              <a className="section__more" href={href.library}>
                Whole library
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <StoryList stories={sealed.slice(0, 3)} />
          </div>
        </section>
      )}
    </>
  )
}
