import { ArrowRight, Target, Zap, CheckCircle2 } from 'lucide-react';
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
      el.style.setProperty('--reveal-delay', `${i * 90}ms`);
      requestAnimationFrame(() => el.classList.add('iq-revealed'));
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
          <div className="iq-logo" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Beta Edition · 2026</span>
          <div className="iq-nav-links">
            <a href="#features" className="iq-nav-link">Features</a>
            <a href="#how-it-works" className="iq-nav-link">Process</a>

            {isSignedIn ? (
              <>
                <button
                  onClick={() => navigate('/optimize')}
                  className="iq-nav-cta"
                >
                  Analyse CV
                </button>
                <button
                  onClick={() => signOut()}
                  className="iq-btn-ghost"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/sign-in')}
                  className="iq-btn-ghost"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/sign-up')}
                  className="iq-nav-cta"
                >
                  Join waitlist
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="iq-thick-rule" />

      {/* Hero */}
      <section className="iq-hero">
        <div className="iq-hero-inner">
          <div className="iq-hero-left" data-reveal>
            <div className="iq-kicker"><span className="iq-kicker-line"/>AI · CV Intelligence · Free Beta</div>
            <h1 className="iq-headline">
              Your CV is<br/>getting rejected<br/>before a human<br/><em>reads it.</em>
            </h1>
            <p className="iq-deck">
              ATS systems filter out 75% of applications automatically.
              InternIQ tells you exactly why yours might be one of them — and precisely how to fix it.
            </p>
            <div className="iq-hero-actions">
              {isSignedIn ? (
                <button onClick={() => navigate('/optimize')} className="iq-btn-primary">
                  Analyse my CV <ArrowRight size={14}/>
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/sign-up')} className="iq-btn-primary">
                    Join the waitlist <ArrowRight size={14}/>
                  </button>
                  <button onClick={() => navigate('/sign-in')} className="iq-btn-ghost"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}>
                    Sign in
                  </button>
                </>
              )}
            </div>
            {isSignedIn && displayName && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--stone)',
                marginTop: '12px',
                letterSpacing: '0.06em',
              }}>
                Signed in as {displayName}
              </p>
            )}
          </div>

          <div className="iq-hero-right" data-reveal>
            <div className="iq-stat-block">
              <div className="iq-stat-block-label">Verified outcomes</div>
              <div className="iq-stat-row">
                {[['94%','ATS pass rate'],['3.2×','More interviews'],['2,841','On waitlist']].map(([n,l],i)=>(
                  <div key={i} className="iq-stat">
                    <span className="iq-stat-n">{n}</span>
                    <span className="iq-stat-l">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="iq-pull-quote">
              <span className="iq-pq-open">"</span>
              Most CVs get rejected in 6 seconds. Find out why yours might be one of them.
              <span className="iq-pq-close">"</span>
            </div>
            <div className="iq-tag-cloud">
              {['ATS Score','Keyword Gaps','Bullet Rewrites','Section Grades','Priority Fixes'].map(t=>(
                <span key={t} className="iq-tag">{t}</span>
              ))}
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
              { Icon: CheckCircle2, title: 'Bullet Rewrites', body: 'Your weakest bullet points rewritten with stronger verbs and quantified outcomes. Copy, paste, done.' },
              { Icon: Target, title: 'Section Scores', body: 'Every section of your CV scored and reviewed individually — Education, Experience, Skills, and more.' },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} className="iq-feature-card">
                <div className="iq-feature-icon"><Icon size={20}/></div>
                <div className="iq-feature-title">{title}</div>
                <div className="iq-feature-body">{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="iq-section-rule"/>

      {/* Process */}
      <section className="iq-process" id="how-it-works">
        <div className="iq-section-inner">
          <div className="iq-section-header">
            <span className="iq-section-num">02</span>
            <span className="iq-section-title">How it works</span>
          </div>
          <div className="iq-steps">
            {[
              { title: 'Upload your CV', body: 'Drag and drop your CV as a PDF. It is processed entirely in memory — never stored, never logged.' },
              { title: 'Paste the job description', body: 'Copy the full job listing from LinkedIn, Gradcracker, or wherever. The more detail, the better the analysis.' },
              { title: 'Get your analysis', body: 'In under 30 seconds, you get an ATS score, keyword gaps, bullet rewrites, and three priority fixes. Specific, actionable, honest.' },
            ].map(({ title, body }, i) => (
              <div key={i} className="iq-step">
                <div className="iq-step-num">0{i+1}</div>
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
          {[['30s','Average analysis time'],['5MB','Max CV size'],['100%','Privacy guaranteed'],['0','CVs stored']].map(([n,l],i)=>(
            <div key={i} className="iq-stats-bar-item">
              <span className="iq-stats-bar-n">{n}</span>
              <span className="iq-stats-bar-l">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="iq-cta-section">
        <div className="iq-cta-inner">
          <div className="iq-kicker"><span className="iq-kicker-line"/>Get started</div>
          <h2 className="iq-cta-headline">
            Stop guessing.<br/><em>Start getting</em><br/>interviews.
          </h2>
          <p className="iq-cta-sub">
            InternIQ is in closed beta. Join the waitlist and we will email
            you when your access is confirmed.
          </p>
          {isSignedIn ? (
            <button onClick={() => navigate('/optimize')} className="iq-btn-primary iq-btn-large">
              Analyse my CV <ArrowRight size={14}/>
            </button>
          ) : (
            <button onClick={() => navigate('/sign-up')} className="iq-btn-primary iq-btn-large">
              Join the waitlist <ArrowRight size={14}/>
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="iq-thick-rule"/>
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo">Intern<span className="iq-logo-accent">IQ</span></div>
          <p className="iq-footer-copy">© 2026 InternIQ</p>
          <div className="iq-footer-links">
            <a href="/privacy" className="iq-footer-link">Privacy</a>
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
      <div className="iq-top-rule"/>
    </div>
  );
}