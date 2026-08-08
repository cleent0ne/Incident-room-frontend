import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Incident Room',
  description:
    'Terms and conditions governing your access to and use of the Incident Room platform.',
};

const LAST_UPDATED = 'August 7, 2026';
const EFFECTIVE_DATE = 'August 7, 2026';

const SECTIONS = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'description', label: 'The Service' },
  { id: 'accounts', label: 'Accounts & Security' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'prohibited', label: 'Prohibited Uses' },
  { id: 'user-content', label: 'User Content' },
  { id: 'termination', label: 'Termination' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  return (
    <main className="shell page">
      {/* Breadcrumb */}
      <nav className="legal-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="legal-breadcrumb__link">Home</Link>
        <span className="legal-breadcrumb__sep" aria-hidden="true">›</span>
        <span className="legal-breadcrumb__current">Terms of Service</span>
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
            <h1>Terms of Service</h1>
            <div className="legal-doc__meta">
              <span>Effective: <time dateTime="2026-08-07">{EFFECTIVE_DATE}</time></span>
              <span className="legal-doc__meta-sep">·</span>
              <span>Last updated: <time dateTime="2026-08-07">{LAST_UPDATED}</time></span>
            </div>
            <p className="lead" style={{ marginTop: 16 }}>
              Please read these Terms of Service carefully before using Incident Room.
              By accessing or using our platform, you agree to be bound by these terms.
            </p>
          </div>

          {/* 1 */}
          <section className="legal-section" id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) are a binding legal agreement between you and
              Incident Room (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of the
              Incident Room platform, website, and all associated services (collectively, the
              &quot;Service&quot;). By creating an account, clicking &quot;I agree,&quot; or simply using the
              Service, you confirm that you have read, understood, and agree to be bound by these
              Terms and our{' '}
              <Link href="/privacy" className="site-footer__inline-link">Privacy Policy</Link>,
              which is incorporated herein by reference.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Service. We
              reserve the right to modify these Terms at any time. Continued use of the Service
              after any modification constitutes your acceptance of the updated Terms. We will
              make reasonable efforts to notify you of material changes via email or an in-app
              notice.
            </p>
          </section>


          {/* 3 */}
          <section className="legal-section" id="description">
            <h2>3. The Service</h2>
            <p>
              Incident Room is an interactive learning platform designed for software engineers,
              site reliability engineers (SREs), and DevOps practitioners. The Service provides:
            </p>
            <ul>
              <li>Simulated on-call incident scenarios with realistic telemetry data (logs, metrics, traces).</li>
              <li>A scored remediation system that rewards fast, accurate root-cause identification.</li>
              <li>Personal attempt history, performance statistics, and daily streak tracking.</li>
              <li>Global and per-scenario leaderboards.</li>
              <li>A daily featured incident updated each UTC day.</li>
            </ul>
            <p>
              The Service is provided for <strong>educational and skill-development purposes only</strong>.
              All incident scenarios, telemetry data, service topologies, and system names depicted
              within the Service are entirely fictional. Any resemblance to real systems, companies,
              or events is coincidental.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at
              any time, with or without notice, and without liability to you.
            </p>
          </section>

          {/* 4 */}
          <section className="legal-section" id="accounts">
            <h2>4. Accounts &amp; Security</h2>
            <h3>4.1 Registration</h3>
            <p>
              To access certain features, you must register for an account. You agree to provide
              accurate, current, and complete information during registration and to keep that
              information up to date. You may register using a valid email address and password, or
              via a supported OAuth provider (currently Google and GitHub).
            </p>
            <h3>4.2 Account Security</h3>
            <p>
              You are solely responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account. You must:
            </p>
            <ul>
              <li>Choose a strong, unique password and keep it confidential.</li>
              <li>Not share your account with any other person.</li>
              <li>Not use another person&apos;s account without permission.</li>
              <li>Notify us immediately at the contact address below if you suspect unauthorized access to your account.</li>
            </ul>
            <p>
              We will not be liable for any loss or damage arising from your failure to comply with
              these security obligations.
            </p>
            <h3>4.3 Account Suspension &amp; Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account, at our sole discretion,
              if we believe you have violated these Terms, engaged in fraudulent activity, or
              otherwise acted in a manner harmful to the Service or other users. We will make
              reasonable efforts to notify you of any such action.
            </p>
          </section>

          {/* 5 */}
          <section className="legal-section" id="ip">
            <h2>5. Intellectual Property</h2>
            <h3>5.1 Our Property</h3>
            <p>
              The Service and its entire contents, features, and functionality — including but
              not limited to all text, graphics, incident scenarios, scoring algorithms, service
              topology designs, user interfaces, and software — are owned by Incident Room or its
              licensors and are protected by applicable intellectual property laws. These Terms do
              not grant you any right, title, or interest in or to the Service or its content,
              except for the limited license described below.
            </p>
            <h3>5.2 Limited License to You</h3>
            <p>
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable,
              revocable license to access and use the Service for your own personal,
              non-commercial, educational purposes. You may not:
            </p>
            <ul>
              <li>Copy, reproduce, modify, or create derivative works from any part of the Service.</li>
              <li>Distribute, sell, sublicense, or commercially exploit the Service or its content.</li>
              <li>Use automated tools (bots, spiders, scrapers) to access, monitor, or copy the Service.</li>
              <li>Reverse engineer, decompile, or attempt to extract source code from the Service.</li>
              <li>Use the Service or its content to train artificial intelligence or machine-learning models without our express written consent.</li>
            </ul>
          </section>

          {/* 6 */}
          <section className="legal-section" id="prohibited">
            <h2>6. Prohibited Uses</h2>
            <p>
              You agree to use the Service only for lawful purposes and in accordance with these
              Terms. You must not use the Service:
            </p>
            <ul>
              <li>In any way that violates applicable local, national, or international laws or regulations.</li>
              <li>To attempt to gain unauthorized access to any part of the Service, its servers, or any database connected to the Service.</li>
              <li>To transmit any unsolicited or unauthorized advertising, spam, or promotional material.</li>
              <li>To impersonate any person or entity, or to misrepresent your affiliation with any person or entity.</li>
              <li>To interfere with or disrupt the integrity or performance of the Service or the data contained therein.</li>
              <li>To introduce any viruses, trojan horses, worms, or other malicious or technologically harmful material.</li>
              <li>To harvest or collect email addresses or other contact information from the Service for the purpose of sending unsolicited communications.</li>
              <li>To engage in any conduct that restricts or inhibits any other user&apos;s use or enjoyment of the Service.</li>
            </ul>
          </section>

          {/* 7 */}
          <section className="legal-section" id="user-content">
            <h2>7. User Content</h2>
            <p>
              The Service may allow you to submit optional free-text content, such as hypothesis
              reflections entered during an incident attempt (&quot;User Content&quot;). You retain
              ownership of your User Content. By submitting User Content, you grant us a
              worldwide, non-exclusive, royalty-free license to store, display, and use your
              User Content solely in connection with providing the Service to you.
            </p>
            <p>
              You are solely responsible for your User Content. You represent and warrant that
              your User Content does not violate these Terms or any applicable law. We reserve the
              right to remove any User Content at any time, for any reason, without notice or
              liability.
            </p>
            <p>
              User Content you submit (e.g., reflection text) is private by default and is not
              shared with other users. Leaderboard display names are public. See our{' '}
              <Link href="/privacy" className="site-footer__inline-link">Privacy Policy</Link>{' '}
              for details on how User Content is stored and retained.
            </p>
          </section>

          {/* 8 */}
          <section className="legal-section" id="termination">
            <h2>8. Termination</h2>
            <p>
              You may delete your account at any time from your{' '}
              <Link href="/profile" className="site-footer__inline-link">Profile</Link>{' '}
              page. Upon deletion, all personal data associated with your account will be
              permanently erased, consistent with our obligations under the GDPR Right to Erasure
              (Art. 17) and the CCPA Right to Deletion.
            </p>
            <p>
              We may also terminate or suspend your access to the Service at any time, with or
              without cause, with or without notice, effective immediately. All provisions of
              these Terms which by their nature should survive termination shall survive, including
              intellectual property ownership provisions, warranty disclaimers, and limitations of
              liability.
            </p>
          </section>

          {/* 9 */}
          <section className="legal-section" id="disclaimers">
            <h2>9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED
              BY APPLICABLE LAW, WE EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED
              TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              NON-INFRINGEMENT, AND ACCURACY.
            </p>
            <p>
              We do not warrant that: (a) the Service will be uninterrupted, timely, secure, or
              error-free; (b) the results that may be obtained from the use of the Service will be
              accurate or reliable; (c) any errors in the Service will be corrected.
            </p>
            <p>
              The incident scenarios and educational content provided through the Service are for
              training purposes only. We make no representation that the information, scenarios,
              or techniques described will be effective or appropriate in real-world production
              environments.
            </p>
          </section>

          {/* 10 */}
          <section className="legal-section" id="liability">
            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL INCIDENT ROOM,
              ITS AFFILIATES, LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR
              DIRECTORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES — INCLUDING, WITHOUT LIMITATION, LOSS OF PROFITS, DATA, GOODWILL,
              OR OTHER INTANGIBLE LOSSES — ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF, OR
              INABILITY TO USE, THE SERVICE.
            </p>

          </section>



          {/* 13 */}
          <section className="legal-section" id="changes">
            <h2>13. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we make material changes, we will
              update the &quot;Last Updated&quot; date at the top of this page and, where appropriate,
              notify you by email or via a notice within the Service. Your continued use of the
              Service after the effective date of any changes constitutes your acceptance of the
              new Terms.
            </p>
            <p>
              We encourage you to review these Terms periodically to stay informed of any changes.
            </p>
          </section>

          {/* 14 */}
          <section className="legal-section" id="contact">
            <h2>14. Contact Us</h2>
            <p>
              If you have any questions, concerns, or feedback about these Terms of Service,
              please contact us:
            </p>
            <div className="legal-contact-block">
              <p><strong>Incident Room</strong></p>
              <p>
                Email:{' '}
                <a href="mailto:legal@incidentroom.io" className="site-footer__inline-link">
                  legal@incidentroom.io
                </a>
              </p>
            </div>
            <p style={{ marginTop: 16 }}>
              For privacy-specific requests (data access, erasure, portability), please visit
              your{' '}
              <Link href="/profile" className="site-footer__inline-link">Profile</Link>{' '}
              page or review our{' '}
              <Link href="/privacy" className="site-footer__inline-link">Privacy Policy</Link>.
            </p>
          </section>

          <div className="legal-doc__footer">
            <Link href="/privacy" className="site-footer__inline-link">Privacy Policy</Link>
            <span className="legal-doc__meta-sep">·</span>
            <Link href="/" className="site-footer__inline-link">Back to home</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
