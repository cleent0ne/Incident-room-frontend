import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="shell page" style={{ textAlign: 'center' }}>
      <div className="eyebrow">404</div>
      <h1 style={{ fontSize: 40 }}>This page doesn&rsquo;t exist.</h1>
      <p className="lead" style={{ margin: '0 auto 24px' }}>
        The link may be broken, or the page hasn&rsquo;t moved in yet.
      </p>
      <Link className="button primary" href="/">
        Back to home
      </Link>
    </main>
  );
}
