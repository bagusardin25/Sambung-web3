import { GENRES } from '../config/site'
import type { Story } from '../lib/contract'
import { formatDate, plural } from '../lib/format'
import { href } from '../lib/router'
import { Dot, ProgressKnots } from './bits'

function OpenMeta({ story }: { story: Story }) {
  const left = story.maxLines - story.lineCount
  return (
    <div className="story-row__meta">
      <ProgressKnots written={story.lineCount} total={story.maxLines} />
      <span>
        {story.lineCount} of {story.maxLines} lines
        <Dot />
        {plural(story.authorCount, 'author')}
      </span>
      <span className={left === 1 ? 'story-row__hint is-urgent' : 'story-row__hint'}>
        {left === 1 ? 'One line to go' : `${left} lines to go`}
      </span>
    </div>
  )
}

function SealedMeta({ story }: { story: Story }) {
  return (
    <div className="story-row__meta">
      <span>{plural(story.authorCount, 'author')}</span>
      <span>{story.applause === 0 ? 'No applause yet' : `${story.applause} applause`}</span>
      <span>Sealed {formatDate(story.sealedAt)}</span>
    </div>
  )
}

export function StoryList({ stories }: { stories: Story[] }) {
  return (
    <ul className="story-list">
      {stories.map((story) => {
        const sealed = story.sealedAt !== 0
        return (
          <li key={String(story.id)}>
            <a className="story-row" href={href.story(story.id)}>
              <div className="story-row__main">
                <span className="tag">{GENRES[story.genre] ?? 'Open'}</span>
                <h3 className="story-row__title">{story.title}</h3>
                <p className="story-row__excerpt">{sealed || story.lineCount === 1 ? story.opening : `… ${story.latest}`}</p>
              </div>
              {sealed ? <SealedMeta story={story} /> : <OpenMeta story={story} />}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
