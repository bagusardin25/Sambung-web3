import { useState } from 'react'
import { Empty, ErrorState, Loading } from '../components/bits'
import { StoryList } from '../components/StoryList'
import { chain, CONTRACT_ADDRESS } from '../config/chains'
import { GENRES } from '../config/site'
import { fetchStories } from '../lib/contract'
import { plural } from '../lib/format'
import { href } from '../lib/router'
import { useAsync } from '../lib/useAsync'

type Sort = 'applause' | 'newest'

export function Library() {
  const stories = useAsync(CONTRACT_ADDRESS ? 'stories' : null, () => fetchStories())
  const [sort, setSort] = useState<Sort>('applause')
  const [genre, setGenre] = useState<number | 'all'>('all')

  const sealed = (stories.data ?? []).filter((s) => s.sealedAt !== 0)
  const genresInUse = GENRES.map((name, i) => ({ name, i })).filter(({ i }) => sealed.some((s) => s.genre === i))
  const shown = sealed
    .filter((s) => genre === 'all' || s.genre === genre)
    .sort((a, b) =>
      sort === 'applause' ? b.applause - a.applause || b.sealedAt - a.sealedAt : b.sealedAt - a.sealedAt,
    )

  return (
    <div className="wrap page">
      <h1 className="page__title">Library</h1>
      <p className="page__lead">
        Every story here is finished and sealed. Read them without a wallet; applaud the ones that earned it.
      </p>

      {!CONTRACT_ADDRESS && <Empty title={`The library opens once Sambung is live on ${chain.name}.`} />}
      {stories.loading && !stories.data && <Loading />}
      {stories.error !== undefined && !stories.data && <ErrorState error={stories.error} onRetry={stories.reload} />}

      {stories.data && sealed.length === 0 && (
        <Empty title="Nothing has been sealed yet.">
          <p>The first finished story is still being written. Add a line and help it get here.</p>
          <a className="btn btn--primary" href={href.home}>
            See stories being written
          </a>
        </Empty>
      )}

      {sealed.length > 0 && (
        <>
          <div className="toolbar">
            <fieldset className="toolbar__group">
              <legend>Genre</legend>
              <div className="chips">
                <label className="chip">
                  <input type="radio" name="genre" checked={genre === 'all'} onChange={() => setGenre('all')} />
                  <span>All</span>
                </label>
                {genresInUse.map(({ name, i }) => (
                  <label key={name} className="chip">
                    <input type="radio" name="genre" checked={genre === i} onChange={() => setGenre(i)} />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="toolbar__group">
              <label htmlFor="library-sort">Order</label>
              <select
                id="library-sort"
                className="field field--select"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
              >
                <option value="applause">Most applauded</option>
                <option value="newest">Most recently sealed</option>
              </select>
            </div>
          </div>

          <p className="result-count" role="status">
            {plural(shown.length, 'story', 'stories')}
          </p>
          {shown.length > 0 ? (
            <StoryList stories={shown} />
          ) : (
            <Empty title="No sealed stories in this genre yet." />
          )}
        </>
      )}
    </div>
  )
}
