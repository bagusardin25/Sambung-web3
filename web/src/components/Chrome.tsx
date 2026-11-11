import { Wallet } from 'lucide-react'
import { chain, CONTRACT_ADDRESS, explorerAddressUrl, NETWORK } from '../config/chains'
import { SITE } from '../config/site'
import { shortAddress } from '../lib/format'
import { href } from '../lib/router'
import type { Route } from '../lib/router'
import { usePenName } from '../lib/store'
import { useWallet } from '../lib/wallet'
import { Dot, Mark } from './bits'

const NAV = [
  { label: 'Stories', to: href.home, match: ['home', 'story', 'new'] },
  { label: 'Library', to: href.library, match: ['library'] },
  { label: 'My desk', to: href.desk, match: ['desk'] },
]

function WalletButton() {
  const wallet = useWallet()
  const penName = usePenName(wallet.active?.account)

  if (!wallet.active) {
    return (
      <button type="button" className="btn btn--secondary btn--small" onClick={wallet.openDialog}>
        <Wallet size={16} aria-hidden="true" />
        Connect wallet
      </button>
    )
  }
  return (
    <button
      type="button"
      className="btn btn--secondary btn--small wallet-chip"
      onClick={wallet.openDialog}
      aria-label={`Wallet ${wallet.active.account}${wallet.wrongChain ? ', wrong network' : ''}. Open wallet details.`}
    >
      <span className={wallet.wrongChain ? 'wallet-chip__dot is-warn' : 'wallet-chip__dot'} aria-hidden="true" />
      <span className="wallet-chip__name">{penName ?? shortAddress(wallet.active.account)}</span>
    </button>
  )
}

export function Header({ route }: { route: Route }) {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <a className="brand" href={href.home} aria-label="Sambung, home">
          <Mark />
          <span className="brand__name">Sambung</span>
        </a>
        <nav className="site-nav" aria-label="Main">
          {NAV.map((item) => (
            <a key={item.to} href={item.to} aria-current={item.match.includes(route.name) ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <WalletButton />
      </div>
    </header>
  )
}

/** Banners for the two situations that stop the app from working. */
export function Notices() {
  const wallet = useWallet()
  return (
    <>
      {!CONTRACT_ADDRESS && (
        <div className="banner" role="status">
          <div className="wrap">
            Sambung has not been deployed on {chain.name} yet. Stories will appear here once the contract is live.
          </div>
        </div>
      )}
      {wallet.wrongChain && (
        <div className="banner banner--warn" role="status">
          <div className="wrap banner__row">
            <span>Your wallet is on another network. Sambung lives on {chain.name}.</span>
            <button type="button" className="btn btn--ink btn--small" onClick={() => void wallet.switchChain()}>
              Switch to {chain.name}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function Footer() {
  const contractUrl = CONTRACT_ADDRESS ? explorerAddressUrl(CONTRACT_ADDRESS) : undefined
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        <div className="site-footer__about">
          <a className="brand" href={href.home} aria-label="Sambung, home">
            <Mark size={24} />
            <span className="brand__name">Sambung</span>
          </a>
          <p>
            <i>Sambung</i> is Indonesian for “to continue”. Every finished story here was written by at least three
            people who never planned it together.
          </p>
        </div>

        <div>
          <h2 className="footer-heading">Built on BOT Chain</h2>
          <ul className="footer-links">
            <li>
              <a href={SITE.botchainUrl} target="_blank" rel="noreferrer">
                botchain.ai
              </a>
            </li>
            <li>
              <a href={SITE.botchainScanUrl} target="_blank" rel="noreferrer">
                scan.botchain.ai
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="footer-heading">Contract</h2>
          <ul className="footer-links">
            <li>
              {CONTRACT_ADDRESS ? (
                contractUrl ? (
                  <a className="mono" href={contractUrl} target="_blank" rel="noreferrer" title={CONTRACT_ADDRESS}>
                    {shortAddress(CONTRACT_ADDRESS)}
                  </a>
                ) : (
                  <span className="mono" title={CONTRACT_ADDRESS}>
                    {shortAddress(CONTRACT_ADDRESS)}
                  </span>
                )
              ) : (
                <span>Not deployed yet</span>
              )}
            </li>
            <li>
              {chain.name}
              {NETWORK !== 'local' && (
                <>
                  <Dot />
                  chain ID {chain.id}
                </>
              )}
            </li>
          </ul>
        </div>

        {SITE.xUrl && (
          <div>
            <h2 className="footer-heading">Follow</h2>
            <ul className="footer-links">
              <li>
                <a href={SITE.xUrl} target="_blank" rel="noreferrer">
                  Sambung on X
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
      <div className="wrap">
        <p className="colophon">
          No token and no fees beyond gas. Everything written here is public and permanent.
        </p>
      </div>
    </footer>
  )
}
