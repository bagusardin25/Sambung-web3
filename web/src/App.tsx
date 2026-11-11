import { useEffect, useRef } from 'react'
import { Footer, Header, Notices } from './components/Chrome'
import { WalletDialog } from './components/WalletDialog'
import { href, useRoute } from './lib/router'
import type { Route } from './lib/router'
import { WalletProvider } from './lib/wallet'
import { Desk } from './pages/Desk'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { NewStory } from './pages/NewStory'
import { StoryPage } from './pages/StoryPage'

const TITLES: Record<Route['name'], string> = {
  home: 'Sambung — stories written one line at a time, on BOT Chain',
  story: 'Story · Sambung',
  new: 'Start a story · Sambung',
  library: 'Library · Sambung',
  desk: 'My desk · Sambung',
  notfound: 'Page not found · Sambung',
}

function NotFound() {
  return (
    <div className="wrap page page--narrow">
      <div className="state state--empty">
        <h1 className="page__title">This page is a loose end</h1>
        <p>Nothing is written here. The stories are this way.</p>
        <a className="btn btn--primary" href={href.home}>
          Back to the stories
        </a>
      </div>
    </div>
  )
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'story':
      return <StoryPage key={String(route.id)} id={route.id} />
    case 'new':
      return <NewStory />
    case 'library':
      return <Library />
    case 'desk':
      return <Desk />
    case 'notfound':
      return <NotFound />
  }
}

export default function App() {
  const route = useRoute()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const routeKey = route.name === 'story' ? `story:${route.id}` : route.name

  // On navigation, start at the top and hand focus to the new page for keyboard and screen-reader users.
  useEffect(() => {
    document.title = TITLES[route.name]
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey])

  return (
    <WalletProvider>
      <a
        className="skip-link"
        href={href.home}
        onClick={(event) => {
          event.preventDefault()
          main.current?.focus()
        }}
      >
        Skip to content
      </a>
      <Header route={route} />
      <Notices />
      <main id="main" ref={main} tabIndex={-1}>
        <Page route={route} />
      </main>
      <Footer />
      <WalletDialog />
    </WalletProvider>
  )
}
