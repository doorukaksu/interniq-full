import { ArrowRight, Target, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    els.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${i * 100}ms`);
      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add('iq-revealed'), 10);
      });
    });
  }, []);

  const displayName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    null;

  return (
    <div className="iq-root">
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate('/')}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Beta · 2026</span>
          <div className="iq-nav-links">
            <a href="#features" className="iq-nav-link">Features</a>
            <a href="#how-it-works" className="iq-nav-link">How it works</a>
            <a onClick={() => navigate('/pricing')} className="iq-nav-link" style={{ cursor: 'pointer' }}>Pricing</a>
            {isSignedIn ? (
              <>
                <button onClick={() => navigate('/optimize')} className="iq-nav-cta">
                  Analyse CV
                </button>
                <button
                  onClick={() => signOut()}
                  className="iq-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/sign-in')}
                  className="iq-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  Sign in
                </button>
                <button onClick={() => navigate('/sign-up')} className="iq-nav-cta">
                  Join waitlist
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="iq-hero">
        <div className="iq-hero-inner">
          <div className="iq-hero-left" data-reveal>
            <div className="iq-kicker">
              <span className="iq-kicker-line" />
              AI-powered · UK internship market · Beta
            </div>
            <h1 className="iq-headline">
              Your CV is failing<br />before anyone<br /><em>reads it.</em>
            </h1>
            <p className="iq-deck">
              ATS systems reject 75% of applications automatically.
              InternIQ tells you exactly why yours is one of them — and how to fix it in minutes.
            </p>
            <div className="iq-hero-actions">
              {isSignedIn ? (
                <button onClick={() => navigate('/optimize')} className="iq-btn-primary iq-btn-large">
                  Analyse my CV <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/sign-up')} className="iq-btn-primary iq-btn-large">
                    Join the waitlist <ArrowRight size={16} />
                  </button>
                  <button onClick={() => navigate('/sign-in')} className="iq-btn-ghost">
                    Sign in
                  </button>
                </>
              )}
            </div>
            {isSignedIn && displayName && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--ink-4)',
                marginTop: '16px',
              }}>
                Signed in as {displayName}
              </p>
            )}
          </div>

          {/* Hero right — product preview */}
          <div className="iq-hero-right" data-reveal>
            <div className="iq-score-card">
              <div className="iq-score-card-label">ATS Analysis — Example output</div>
              <div className="iq-score-card-row">
                <div className="iq-score-big">78</div>
                <div className="iq-score-grade">B+</div>
              </div>
              <div className="iq-score-bar-wrap">
                <div className="iq-score-bar-fill" />
              </div>
              <p style={{
                fontFamily: 'var(--font)',
                fontSize: '12px',
                color: 'var(--ink-3)',
                marginTop: '10px',
                lineHeight: 1.55,
              }}>
                Strong keyword alignment. Missing 4 critical terms from the job description.
              </p>
              <div className="iq-chip-row" style={{ marginTop: '14px' }}>
                {['Python', 'Data Analysis', 'Excel'].map(k => (
                  <span key={k} className="iq-chip iq-chip-matched">{k}</span>
                ))}
                {['SQL', 'Stakeholder mgmt'].map(k => (
                  <span key={k} className="iq-chip iq-chip-missing">{k}</span>
                ))}
              </div>
            </div>

            <div className="iq-stat-block">
              <div className="iq-stat-row">
                {[['94%', 'ATS pass rate'], ['3.2×', 'More interviews'], ['2,841', 'On waitlist']].map(([n, l], i) => (
                  <div key={i} className="iq-stat">
                    <span className="iq-stat-n">{n}</span>
                    <span className="iq-stat-l">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="iq-thick-rule" />

      {/* Features */}
      <section className="iq-features" id="features">
        <div className="iq-section-inner">
          <div className="iq-section-header">
            <span className="iq-section-num">01</span>
            <span className="iq-section-title">What InternIQ analyses</span>
          </div>
          <div className="iq-features-grid">
            {[
              { Icon: Target, title: 'ATS Score', body: 'Scored 0–100 with a letter grade. Understand exactly where your CV stands against the algorithm before a human ever sees it.' },
              { Icon: Zap, title: 'Keyword Gaps', body: 'See which keywords from the job description are missing, matched, or recommended. Fix the gaps that cost you interviews.' },
              { Icon: CheckCircle2, title: 'Bullet Rewrites', body: 'Your weakest bullet points rewritten with stronger verbs and quantified outcomes — copy, paste, done.' },
              { Icon: TrendingUp, title: 'Section Scores', body: 'Every section scored individually with specific, actionable feedback. Education, Experience, Skills — all covered.' },
            ].map(({ Icon, title, body }, i) => (
              <div
                key={i}
                className="iq-feature-card"
                data-reveal
                style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              >
                <div className="iq-feature-icon"><Icon size={18} /></div>
                <div className="iq-feature-title">{title}</div>
                <div className="iq-feature-body">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="iq-thick-rule" />

      {/* Process */}
      <section className="iq-process" id="how-it-works">
        <div className="iq-section-inner">
          <div className="iq-section-header">
            <span className="iq-section-num">02</span>
            <span className="iq-section-title">How it works</span>
          </div>
          <div className="iq-steps">
            {[
              { title: 'Upload your CV', body: 'Drag and drop your CV as a PDF. Processed entirely in memory — never stored, never logged. Deleted the moment your analysis is complete.' },
              { title: 'Paste the job description', body: 'Copy the full job listing from LinkedIn, Gradcracker, or wherever you found it. The more detail, the sharper the analysis.' },
              { title: 'Get your full report', body: 'In under 30 seconds: ATS score, keyword gaps, bullet rewrites, section scores, and three priority fixes. Specific, actionable, honest.' },
            ].map(({ title, body }, i) => (
              <div
                key={i}
                className="iq-step"
                data-reveal
                style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}
              >
                <div className="iq-step-num">0{i + 1}</div>
                <div className="iq-step-content">
                  <div className="iq-step-title">{title}</div>
                  <div className="iq-step-body">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="iq-stats-bar">
        <div className="iq-stats-bar-inner">
          {[['30s', 'Average analysis'], ['5MB', 'Max CV size'], ['100%', 'Privacy guaranteed'], ['0', 'CVs stored']].map(([n, l], i) => (
            <div key={i} className="iq-stats-bar-item">
              <span className="iq-stats-bar-n">{n}</span>
              <span className="iq-stats-bar-l">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="iq-cta-section">
        <div className="iq-cta-inner" data-reveal>
          <div className="iq-kicker" style={{ justifyContent: 'center' }}>
            <span className="iq-kicker-line" />
            Closed beta · Rolling access
          </div>
          <h2 className="iq-cta-headline">
            Stop guessing.<br />Start getting <em>interviews.</em>
          </h2>
          <p className="iq-cta-sub">
            InternIQ is in closed beta. Join the waitlist and we will email
            you when your access is confirmed.
          </p>
          {isSignedIn ? (
            <button onClick={() => navigate('/optimize')} className="iq-btn-primary iq-btn-large">
              Analyse my CV <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={() => navigate('/sign-up')} className="iq-btn-primary iq-btn-large">
              Join the waitlist <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo" style={{ cursor: 'default', fontSize: '16px' }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <p className="iq-footer-copy">© 2026 InternIQ</p>
          <div className="iq-footer-links">
            <a href="/pricing" className="iq-footer-link">Pricing</a>
            <a href="/privacy" className="iq-footer-link">Privacy</a>
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}