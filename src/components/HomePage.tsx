import { ArrowRight, FileText, Target, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <FileText className="w-6 h-6" />
            <span className="text-xl tracking-tight">CVOptimize</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <button
              onClick={() => navigate('/optimize')}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm text-secondary-foreground">AI-Powered CV Optimization</span>
          </div>
          <h1 className="text-5xl tracking-tight mb-6 leading-tight">
            Land Your Dream Internship in Finance & Tech
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Transform your CV into a competitive advantage. Our AI analyzes and optimizes your resume specifically for top-tier finance and tech internship applications.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/optimize')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Optimize Your CV
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition-colors">
              View Examples
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-secondary/30 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl mb-4">Engineered for Success</h2>
            <p className="text-muted-foreground">
              Purpose-built for the competitive finance and tech recruitment landscape.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-3">Industry-Specific Analysis</h3>
              <p className="text-muted-foreground">
                Tailored optimization for finance and tech sectors. Our AI understands what Goldman Sachs, McKinsey, Google, and other top firms look for.
              </p>
            </div>
            <div className="p-8 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-3">ATS Optimization</h3>
              <p className="text-muted-foreground">
                Ensure your CV passes Applicant Tracking Systems with proper formatting, keywords, and structure that recruiters expect.
              </p>
            </div>
            <div className="p-8 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-3">Real-Time Feedback</h3>
              <p className="text-muted-foreground">
                Get instant, actionable suggestions on content, formatting, and impact. Know exactly what to improve and why.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl mb-4">Simple, Effective Process</h2>
            <p className="text-muted-foreground">
              Three steps to a competitive CV that stands out.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6">
                1
              </div>
              <h3 className="mb-3">Upload Your CV</h3>
              <p className="text-muted-foreground">
                Upload your current resume in PDF or Word format. Your data is processed securely and confidentially.
              </p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6">
                2
              </div>
              <h3 className="mb-3">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our AI analyzes content, structure, keywords, and impact statements against industry benchmarks.
              </p>
            </div>
            <div className="relative">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-6">
                3
              </div>
              <h3 className="mb-3">Implement & Apply</h3>
              <p className="text-muted-foreground">
                Receive detailed recommendations and download your optimized CV, ready for top-tier applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl mb-2 tracking-tight">94%</div>
              <p className="text-primary-foreground/80">ATS Pass Rate</p>
            </div>
            <div>
              <div className="text-5xl mb-2 tracking-tight">3.2x</div>
              <p className="text-primary-foreground/80">More Interviews</p>
            </div>
            <div>
              <div className="text-5xl mb-2 tracking-tight">15k+</div>
              <p className="text-primary-foreground/80">CVs Optimized</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl mb-6">Ready to Stand Out?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of successful candidates who landed competitive internships with an optimized CV.
          </p>
          <button
            onClick={() => navigate('/optimize')}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
          >
            Start Optimizing Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="tracking-tight">CVOptimize</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CVOptimize. Designed for ambitious professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
