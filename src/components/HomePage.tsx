import { ArrowRight, Target, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    els.forEach((el, i) => {
      el.style.setProperty('--reveal-delay', `${i * 90}ms`);
      requestAnimationFrame(() => el.classList.add('iq-revealed'));
    });
  }, []);

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
            <button onClick={() => navigate('/optimize')} className="iq-nav-cta">Analyse CV</button>
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
              <button onClick={() => navigate('/optimize')} className="iq-btn-primary">
                Analyse my CV <ArrowRight size={14}/>
              </button>
              <a href="#how-it-works" className="iq-btn-ghost">How it works</a>
            </div>
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

      <div className="iq-section-rule"/>

      {/* Features */}
      <section id="features" className="iq-features">
        <div className="iq-section-inner">
          <div className="iq-section-header" data-reveal>
            <span className="iq-section-num">01</span>
            <h2 className="iq-section-title">What InternIQ analyses</h2>
          </div>
          <div className="iq-features-grid">
            {[
              { icon:<Target size={18}/>, title:'ATS Compatibility', body:'See the exact score recruiters\' software gives your CV before a human ever reads it.' },
              { icon:<Zap size={18}/>, title:'Keyword Gap Analysis', body:'We cross-reference every keyword in the job description against your CV. Missing one critical term ends your application silently.' },
              { icon:<CheckCircle2 size={18}/>, title:'Bullet Point Rewrites', body:'"Responsible for tasks" gets you binned. We rewrite your weakest bullets with action verbs and quantified impact.' },
              { icon:<Target size={18}/>, title:'Section-by-Section Grades', body:'Education, experience, skills — every section scored individually so you know exactly where you\'re losing points.' },
            ].map((f,i)=>(
              <div key={i} className="iq-feature-card" data-reveal>
                <div className="iq-feature-icon">{f.icon}</div>
                <h3 className="iq-feature-title">{f.title}</h3>
                <p className="iq-feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="iq-section-rule"/>

      {/* Process */}
      <section id="how-it-works" className="iq-process">
        <div className="iq-section-inner">
          <div className="iq-section-header" data-reveal>
            <span className="iq-section-num">02</span>
            <h2 className="iq-section-title">The process</h2>
          </div>
          <div className="iq-steps">
            {[
              { n:'I',   title:'Upload your CV',           body:'Drop in your PDF. Processed in memory, never stored on our servers. Deleted immediately after analysis.' },
              { n:'II',  title:'Paste the job description', body:'Copy in the listing. Our AI reads it exactly the way the ATS does — role, requirements, keywords.' },
              { n:'III', title:'Receive your report',       body:'ATS score, gap analysis, rewritten bullets, and a ranked list of the three highest-impact fixes.' },
            ].map((s,i)=>(
              <div key={i} className="iq-step" data-reveal>
                <div className="iq-step-num">{s.n}</div>
                <div className="iq-step-content">
                  <h3 className="iq-step-title">{s.title}</h3>
                  <p className="iq-step-body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="iq-section-rule"/>

      {/* Stats bar */}
      <section className="iq-stats-bar" data-reveal>
        <div className="iq-stats-bar-inner">
          {[['94%','ATS pass rate'],['3.2×','More interviews'],['< 30s','Analysis time'],['Free','During beta']].map(([n,l],i)=>(
            <div key={i} className="iq-stats-bar-item">
              <span className="iq-stats-bar-n">{n}</span>
              <span className="iq-stats-bar-l">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="iq-section-rule"/>

      {/* CTA */}
      <section className="iq-cta-section" data-reveal>
        <div className="iq-cta-inner">
          <div className="iq-kicker"><span className="iq-kicker-line"/>Start now — free</div>
          <h2 className="iq-cta-headline">Stop guessing.<br/>Start getting <em>interviews.</em></h2>
          <p className="iq-cta-sub">Upload your CV and any job description. Your full analysis is ready in under 30 seconds.</p>
          <button onClick={() => navigate('/optimize')} className="iq-btn-primary iq-btn-large">
            Analyse my CV now <ArrowRight size={16}/>
          </button>
        </div>
      </section>

      {/* Footer */}
      <div className="iq-thick-rule"/>
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo">Intern<span className="iq-logo-accent">IQ</span></div>
          <p className="iq-footer-copy">© 2026 InternIQ. Built for ambitious applicants.</p>
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
