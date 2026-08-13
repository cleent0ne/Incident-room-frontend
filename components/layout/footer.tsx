import Link from 'next/link';

/**
 * Site-wide footer — redesigned with high-contrast dark surface #121214,
 * Neon Lime brand highlights, operational status ping, and clean navigation layout.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer bg-[#121214] border-t border-neutral-800/80 pt-12 pb-8">
      <div className="shell site-footer__inner">

        {/* Brand + tagline */}
        <div className="site-footer__brand">
          <Link href="/" className="brand site-footer__logo text-white font-bold text-xl">
            Incident<b className="text-[#A3E635]">Room</b>
          </Link>
          <p className="site-footer__tagline text-neutral-400 text-sm mt-2">
            Learn real-world incident response by running the room.
          </p>
          <div className="site-footer__status inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#0A0A0A] border border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635] animate-pulse" />
            <span className="site-footer__status-text text-xs text-neutral-300 font-mono">All systems operational</span>
          </div>
        </div>

        {/* Navigation columns */}
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <div className="site-footer__col">
            <span className="site-footer__heading text-white font-semibold text-xs uppercase tracking-wider">Platform</span>
            <Link href="/scenarios" className="site-footer__link text-neutral-400 hover:text-[#A3E635] transition-colors">Browse Incidents</Link>
            <Link href="/play?daily=true" className="site-footer__link text-neutral-400 hover:text-[#A3E635] transition-colors">Daily Challenge</Link>
          </div>
          <div className="site-footer__col">
            <span className="site-footer__heading text-white font-semibold text-xs uppercase tracking-wider">Legal</span>
            <Link href="/privacy" className="site-footer__link text-neutral-400 hover:text-[#A3E635] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="site-footer__link text-neutral-400 hover:text-[#A3E635] transition-colors">Terms of Service</Link>
          </div>
          <div className="site-footer__col">
            <span className="site-footer__heading text-white font-semibold text-xs uppercase tracking-wider">Privacy</span>
            <span className="site-footer__note text-neutral-500 text-xs">Auth cookies only</span>
            <span className="site-footer__note text-neutral-500 text-xs">No tracking or analytics</span>
          </div>
        </nav>
      </div>

      {/* Bottom bar — centered */}
      <div className="shell site-footer__bottom border-t border-neutral-800/40 mt-8 pt-6">
        <span className="site-footer__copy mono text-xs text-neutral-500">
          © {year} IncidentRoom · Built for On-Call & Engineering Excellence
        </span>
      </div>
    </footer>
  );
}


