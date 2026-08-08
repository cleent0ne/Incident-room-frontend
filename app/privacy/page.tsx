import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Incident Room',
  description:
    'How Incident Room collects, uses, protects, and gives you control over your personal data.',
};

const LAST_UPDATED = 'August 7, 2026';
const EFFECTIVE_DATE = 'August 7, 2026';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-collected', label: 'Data We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Data' },
  { id: 'cookies', label: 'Cookies & Sessions' },
  { id: 'sharing', label: 'Data Sharing' },
  { id: 'security', label: 'Security' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Policy Changes' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPage() {
  return (
    <main className="shell page">
      {/* Breadcrumb */}
      <nav className="legal-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="legal-breadcrumb__link">Home</Link>
        <span className="legal-breadcrumb__sep" aria-hidden="true">›</span>
        <span className="legal-breadcrumb__current">Privacy Policy</span>
      </nav>

      <div className="legal-layout">
        {/* Sticky Table of Contents */}
        <aside className="legal-toc" aria-label="Table of contents">
          <div className="legal-toc__inner">
            <p className="legal-toc__heading">On this page</p>
            <nav>
              <ul className="legal-toc__list">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="legal-toc__link">{s.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Document Body */}
        <article className="legal-doc">
          <div className="legal-doc__header">
            <div className="eyebrow">Legal</div>
            <h1>Privacy Policy</h1>
            <div className="legal-doc__meta">
              <span>Effective: <time dateTime="2026-08-07">{EFFECTIVE_DATE}</time></span>
              <span className="legal-doc__meta-sep">·</span>
              <span>Last updated: <time dateTime="2026-08-07">{LAST_UPDATED}</time></span>
            </div>
            <p className="lead" style={{ marginTop: 16 }}>
              Your privacy matters to us. This policy explains exactly what personal data we
              collect, why we collect it, how we protect it, and the controls you have over it.
            </p>
          </div>

          {/* 1 */}
          <section className="legal-section" id="overview">
            <h2>1. Overview &amp; Who We Are</h2>
            <p>
              Incident Room (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is an interactive learning platform for
              software engineers and site reliability engineers (SREs). We are committed to
              protecting your personal information and being transparent about what we collect
              and why.
            </p>
            <p>
              This Privacy Policy applies to all users of the Incident Room website and
              platform. It describes our practices under applicable data protection law,
              including the General Data Protection Regulation (GDPR) and the California
              Consumer Privacy Act (CCPA). By using the Service, you acknowledge that you have
              read and understood this policy.
            </p>
            <p>
              Our{' '}
              <Link href="/terms" className="site-footer__inline-link">Terms of Service</Link>{' '}
              govern your use of the platform and are incorporated into this policy by reference.
            </p>
          </section>

          {/* 2 */}
          <section className="legal-section" id="data-collected">
            <h2>2. Data We Collect</h2>

            <h3>2.1 Account Data (when you register)</h3>
            <ul>
              <li>
                <strong>Email address</strong> — used to identify your account, send
                transactional emails (email verification, password reset), and allow you to
                recover access. Never used for marketing without your explicit opt-in.
              </li>
              <li>
                <strong>Display name</strong> — a name you choose, shown publicly on your
                profile and the leaderboard. This does not need to be your real name.
              </li>
              <li>
                <strong>Password (hashed)</strong> — stored using BCrypt at strength 12.
                Your plaintext password is <strong>never</strong> stored or transmitted in
                readable form. We cannot recover your password — only reset it.
              </li>
            </ul>

            <h3>2.2 OAuth Sign-In Data (Google / GitHub)</h3>
            <p>
              If you sign in using Google or GitHub, we receive and store:
            </p>
            <ul>
              <li>Your <strong>provider name</strong> (e.g., &quot;google&quot; or &quot;github&quot;).</li>
              <li>
                A stable <strong>subject identifier</strong> from the provider — this is the
                provider&apos;s permanent, opaque user ID (not your email, which can change).
              </li>
              <li>Your <strong>email address</strong> and <strong>display name</strong> as provided by the OAuth provider, used to pre-fill your profile.</li>
            </ul>
            <p>
              We <strong>never</strong> store your OAuth access token or refresh token from
              the provider. We request only the minimum scopes necessary to identify you and
              retrieve your email.
            </p>

            <h3>2.3 Gameplay &amp; Performance Data</h3>
            <ul>
              <li>
                <strong>Attempt records</strong> — which scenarios you played, the sequence
                of diagnostic actions you took, elapsed time, your chosen remediation action,
                and the resulting score.
              </li>
              <li>
                <strong>Optional reflection text</strong> — a free-text hypothesis you may
                choose to write before committing to a remediation. This is private to you
                and is never shared publicly.
              </li>
              <li>
                <strong>Leaderboard entries</strong> — your best score per scenario (your
                display name and score are publicly visible on per-scenario leaderboards).
              </li>
              <li>
                <strong>Streak data</strong> — the date of your most recent completed attempt
                and your current consecutive daily-play streak counter.
              </li>
            </ul>

            <h3>2.4 Security &amp; Session Data</h3>
            <ul>
              <li>
                <strong>IP address</strong> — stored on session/refresh-token records for
                security purposes (e.g., detecting suspicious token reuse from distant
                geographic locations). Not used for analytics, profiling, or advertising.
              </li>
              <li>
                <strong>User-Agent string</strong> — stored alongside session records for
                the same security purposes. Not used for device fingerprinting.
              </li>
              <li>
                <strong>Verification tokens</strong> — time-limited tokens used for email
                verification and password reset flows. Stored in hashed form and expired
                after use.
              </li>
            </ul>

            <h3>2.5 Data We Do NOT Collect</h3>
            <ul>
              <li>We do <strong>not</strong> use advertising, analytics, or third-party tracking cookies.</li>
              <li>We do <strong>not</strong> sell, rent, or share your personal data with advertising networks.</li>
              <li>We do <strong>not</strong> collect your real name, phone number, address, or payment information (the Service is currently free).</li>
              <li>We do <strong>not</strong> use browser fingerprinting or any covert tracking technique.</li>
            </ul>
          </section>

          {/* 3 */}
          <section className="legal-section" id="how-we-use">
            <h2>3. How We Use Your Data</h2>

            <div className="legal-table-wrapper">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Purpose</th>
                    <th>Data Used</th>
                    <th>Legal Basis (GDPR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Account creation and authentication</td>
                    <td>Email, password hash, OAuth provider/ID</td>
                    <td>Contract performance (Art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td>Sending transactional emails (verification, password reset)</td>
                    <td>Email address</td>
                    <td>Contract performance (Art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td>Displaying your profile and attempt history</td>
                    <td>Display name, attempt records, streak data</td>
                    <td>Contract performance (Art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td>Leaderboard rankings (publicly visible)</td>
                    <td>Display name, score, elapsed time</td>
                    <td>Legitimate interests (Art. 6(1)(f))</td>
                  </tr>
                  <tr>
                    <td>Security monitoring and fraud prevention</td>
                    <td>IP address, User-Agent, session records</td>
                    <td>Legitimate interests (Art. 6(1)(f))</td>
                  </tr>
                  <tr>
                    <td>Compliance with legal obligations</td>
                    <td>Any required data</td>
                    <td>Legal obligation (Art. 6(1)(c))</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              We do not use your data for automated decision-making or profiling that produces
              legal or similarly significant effects.
            </p>
          </section>

          {/* 4 */}
          <section className="legal-section" id="cookies">
            <h2>4. Cookies &amp; Sessions</h2>
            <p>
              We use only <strong>strictly necessary cookies</strong> required for the
              platform to function. We do not use advertising cookies, analytics cookies, or
              any cookie that tracks you across third-party websites.
            </p>

            <div className="legal-table-wrapper">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>access-cookie</code></td>
                    <td>Short-lived JWT access token — authenticates your API requests.</td>
                    <td>15 minutes</td>
                    <td>HttpOnly, Secure, SameSite=Strict</td>
                  </tr>
                  <tr>
                    <td><code>refresh-cookie</code></td>
                    <td>Refresh token — used to issue a new access token when yours expires, so you stay logged in without re-entering your password.</td>
                    <td>30 days</td>
                    <td>HttpOnly, Secure, SameSite=Strict</td>
                  </tr>
                  <tr>
                    <td><code>csrf-cookie</code></td>
                    <td>CSRF protection token — prevents cross-site request forgery attacks on state-changing operations.</td>
                    <td>Session</td>
                    <td>SameSite=Strict (readable by JavaScript for header injection)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              All cookies are set with <code>Secure</code> in production (transmitted over
              HTTPS only) and scoped to the <code>incidentroom.io</code> domain. Because we
              use only strictly necessary cookies, no cookie consent banner is required under
              the PECR / ePrivacy Directive.
            </p>
          </section>

          {/* 5 */}
          <section className="legal-section" id="sharing">
            <h2>5. Data Sharing &amp; Third Parties</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We share your data only in
              the following limited circumstances:
            </p>
            <ul>
              <li>
                <strong>Resend (email delivery)</strong> — we use Resend to deliver
                transactional emails (verification codes, password resets). We transmit your
                email address and message content. Resend processes this data as a data
                processor under a Data Processing Agreement.
              </li>
              <li>
                <strong>OAuth providers</strong> — when you sign in with Google or GitHub,
                you interact directly with their authentication systems. We receive only the
                data described in Section 2.2. Each provider&apos;s own privacy policy governs
                how they handle your data.
              </li>
              <li>
                <strong>Hosting infrastructure</strong> — our server and database
                infrastructure providers process your data to deliver the Service. All
                infrastructure providers are bound by Data Processing Agreements.
              </li>
              <li>
                <strong>Legal compliance</strong> — we may disclose your data if required
                to do so by law, court order, or other governmental authority, or if we
                believe in good faith that such disclosure is necessary to protect our rights,
                your safety, or the safety of others.
              </li>
            </ul>
            <p>
              Public leaderboard data (display name, score, elapsed time, scenario name)
              is visible to all users of the Service. You can delete your leaderboard
              entries by deleting your account.
            </p>
          </section>

          {/* 6 */}
          <section className="legal-section" id="security">
            <h2>6. Security</h2>
            <p>
              We implement technical and organizational measures to protect your personal data
              against unauthorized access, alteration, disclosure, or destruction:
            </p>
            <ul>
              <li>All data transmitted between your browser and our servers is encrypted using TLS.</li>
              <li>Passwords are hashed with BCrypt (strength 12) before storage — we cannot read your password.</li>
              <li>Authentication cookies are <code>HttpOnly</code> and <code>Secure</code>, preventing JavaScript access and transmission over unencrypted connections.</li>
              <li>We implement rate limiting on authentication endpoints to mitigate brute-force attacks.</li>
              <li>Session tokens are rotated on each use and can be revoked immediately on logout.</li>
              <li>CSRF protection is applied to all state-changing API operations.</li>
            </ul>
            <p>
              Despite these measures, no internet transmission or electronic storage is 100%
              secure. If you believe your account has been compromised, please contact us
              immediately and change your password.
            </p>
          </section>

          {/* 7 */}
          <section className="legal-section" id="retention">
            <h2>7. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account exists and for a
              reasonable period afterward to comply with legal obligations, resolve disputes,
              and enforce our agreements. Specifically:
            </p>
            <ul>
              <li>
                <strong>Account data</strong> (email, display name, password hash) — retained
                while your account is active and deleted within 30 days of account deletion.
              </li>
              <li>
                <strong>Attempt records &amp; leaderboard entries</strong> — deleted immediately
                upon account deletion.
              </li>
              <li>
                <strong>Abandoned in-progress attempts</strong> (no account linked) — automatically
                deleted 24 hours after creation via a database TTL index.
              </li>
              <li>
                <strong>Session and refresh tokens</strong> — expire naturally (15 minutes and
                30 days respectively) and are deleted immediately on logout or account deletion.
              </li>
              <li>
                <strong>Email verification tokens</strong> — expire after 24 hours and are
                purged automatically.
              </li>
            </ul>
            <p>
              You can export all data we hold about you at any time, and permanently delete your
              account and all associated data from your{' '}
              <Link href="/profile" className="site-footer__inline-link">Profile</Link> page.
            </p>
          </section>

          {/* 8 */}
          <section className="legal-section" id="your-rights">
            <h2>8. Your Rights</h2>
            <p>
              Depending on your location, you may have the following rights with respect to your
              personal data. We support all of these rights directly through your account profile.
            </p>

            <h3>Under GDPR (EU/EEA/UK users)</h3>
            <ul>
              <li>
                <strong>Right of Access (Art. 15)</strong> — You have the right to receive a
                copy of all personal data we hold about you. Use the &quot;Export My Data&quot; feature
                on your{' '}
                <Link href="/profile" className="site-footer__inline-link">Profile</Link>{' '}
                page to download a machine-readable JSON file of your data at any time.
              </li>
              <li>
                <strong>Right to Erasure (Art. 17)</strong> — You have the right to request
                permanent deletion of your personal data. You can do this directly from your{' '}
                <Link href="/profile" className="site-footer__inline-link">Profile</Link>{' '}
                page. Deletion is immediate and irreversible.
              </li>
              <li>
                <strong>Right to Data Portability (Art. 20)</strong> — Your data export
                (available via your profile) is provided in structured, machine-readable JSON
                format, fulfilling this right.
              </li>
              <li>
                <strong>Right to Rectification (Art. 16)</strong> — You can update your display
                name at any time. To update your email address, contact us.
              </li>
              <li>
                <strong>Right to Restriction &amp; Objection (Arts. 18, 21)</strong> — You may
                request that we restrict processing of your data or object to processing based
                on legitimate interests. Contact us to exercise these rights.
              </li>
            </ul>

            <h3>Under CCPA (California users)</h3>
            <ul>
              <li>
                <strong>Right to Know</strong> — You have the right to know what personal
                information we collect, use, disclose, or sell. This policy and your data
                export together fulfill this right.
              </li>
              <li>
                <strong>Right to Delete</strong> — You have the right to request deletion of
                your personal information. Exercise this right from your{' '}
                <Link href="/profile" className="site-footer__inline-link">Profile</Link> page.
              </li>
              <li>
                <strong>Right to Non-Discrimination</strong> — We will not discriminate against
                you for exercising any of your privacy rights.
              </li>
              <li>
                <strong>Right to Opt-Out of Sale</strong> — We do not sell your personal
                information. There is nothing to opt out of.
              </li>
            </ul>

            <p>
              To exercise any right not available directly through the platform, contact us
              at{' '}
              <a href="mailto:privacy@incidentroom.io" className="site-footer__inline-link">
                privacy@incidentroom.io
              </a>. We will respond within 30 days (or the timeframe required by applicable law).
            </p>
          </section>

          {/* 9 */}
          <section className="legal-section" id="children">
            <h2>9. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under the age of 13, and we do not
              knowingly collect personal information from children under 13. If we learn that
              we have collected personal data from a child under 13, we will promptly delete
              that information. If you believe a child under 13 has provided personal data
              through our Service, please contact us at{' '}
              <a href="mailto:privacy@incidentroom.io" className="site-footer__inline-link">
                privacy@incidentroom.io
              </a>.
            </p>
          </section>

          {/* 10 */}
          <section className="legal-section" id="changes">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or for other operational, legal, or regulatory reasons. When we make
              material changes, we will update the &quot;Last Updated&quot; date at the top of this
              page and, where required by law, notify you by email or by posting a notice in
              the Service.
            </p>
            <p>
              We encourage you to review this policy periodically. Your continued use of the
              Service after any changes take effect constitutes your acceptance of the revised
              policy.
            </p>
          </section>

          {/* 11 */}
          <section className="legal-section" id="contact">
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, want to exercise a right not
              available through your profile, or have a privacy concern, please contact us:
            </p>
            <div className="legal-contact-block">
              <p><strong>Incident Room — Privacy Team</strong></p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@incidentroom.io" className="site-footer__inline-link">
                  privacy@incidentroom.io
                </a>
              </p>
            </div>
            <p style={{ marginTop: 16 }}>
              For fastest resolution of data access or deletion requests, please use the
              self-service tools on your{' '}
              <Link href="/profile" className="site-footer__inline-link">Profile</Link>{' '}
              page — these are instant and do not require waiting for an email response.
            </p>
          </section>

          <div className="legal-doc__footer">
            <Link href="/terms" className="site-footer__inline-link">Terms of Service</Link>
            <span className="legal-doc__meta-sep">·</span>
            <Link href="/" className="site-footer__inline-link">Back to home</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
