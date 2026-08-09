import Link from 'next/link';

/**
 * Site-wide footer — redesigned with a three-column layout,
 * operational status ping, and terminal aesthetic.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">

        {/* Brand + tagline */}
        <div className="site-footer__brand">
          <Link href="/" className="brand site-footer__logo">
            Incident<b>Room</b>
          </Link>
          <p className="site-footer__tagline">
            Learn incident response by running the room.
          </p>
          <div className="site-footer__status">
            <span className="site-footer__status-dot" />
            <span className="site-footer__status-text">All systems operational</span>
          </div>
        </div>

        {/* Navigation columns */}
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <div className="site-footer__col">
            <span className="site-footer__heading">Platform</span>
            <Link href="/scenarios" className="site-footer__link">Browse Incidents</Link>
            <Link href="/play?daily=true" className="site-footer__link">Daily Challenge</Link>
          </div>
          <div className="site-footer__col">
            <span className="site-footer__heading">Legal</span>
            <Link href="/privacy" className="site-footer__link">Privacy Policy</Link>
            <Link href="/terms" className="site-footer__link">Terms of Service</Link>
          </div>
          <div className="site-footer__col">
            <span className="site-footer__heading">Privacy</span>
            <span className="site-footer__note">Auth cookies only</span>
            <span className="site-footer__note">No tracking or analytics</span>
          </div>
        </nav>
      </div>

      {/* Bottom bar — centered */}
      <div className="shell site-footer__bottom">
        <span className="site-footer__copy mono">
          © {year} IncidentRoom
        </span>
      </div>
    </footer>
  );
}

