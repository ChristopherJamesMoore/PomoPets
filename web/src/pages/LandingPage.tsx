import { useRef } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

export default function LandingPage() {
  const titleSectionRef    = useRef<HTMLElement>(null)
  const bodySectionRef     = useRef<HTMLElement>(null)
  const startedSectionRef  = useRef<HTMLElement>(null)
  const featuresSectionRef = useRef<HTMLElement>(null)
  const gallerySectionRef  = useRef<HTMLElement>(null)
  const socialsSectionRef  = useRef<HTMLElement>(null)

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    const vh  = e.currentTarget.clientHeight
    if (top > 0)        titleSectionRef.current?.classList.add('animate')
    if (top > vh * 1.2) bodySectionRef.current?.classList.add('animate')
    if (top > vh * 2.2) startedSectionRef.current?.classList.add('animate')
    if (top > vh * 3.2) featuresSectionRef.current?.classList.add('animate')
    if (top > vh * 4.2) gallerySectionRef.current?.classList.add('animate')
    if (top > vh * 5.2) socialsSectionRef.current?.classList.add('animate')
  }

  return (
    <div className="page" onScroll={handleScroll}>

      {/* ── Section 1: Hero ── */}
      <div className="fold">
        <nav className="navbar">
          <ul className="nav-links">
            <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo(featuresSectionRef) }}>Features</a></li>
            <li><a href="#gallery" onClick={e => { e.preventDefault(); scrollTo(gallerySectionRef) }}>Gallery</a></li>
            <li><a href="#socials" onClick={e => { e.preventDefault(); scrollTo(socialsSectionRef) }}>Socials</a></li>
          </ul>

          <div className="nav-logo">
            <img src="/logo.png" alt="PomoPets logo" className="nav-logo-img" />
            <span className="nav-logo-text">PomoPets</span>
          </div>

          <ul className="nav-links">
            <li><a href="#" className="nav-disabled" onClick={e => e.preventDefault()}>Download</a></li>
            <li><a href="#">Pricing</a></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>

        <section className="hero">
          <span className="hero-eyebrow">Pomodoro + Virtual Pets</span>
          <h1 className="hero-title">
            Study Smarter,<br />
            <span>Grow Your Pets</span>
          </h1>
          <p className="hero-subtitle">
            Take back control of your time and energy. Track those lost spoons and missed deadlines with PomoPets Now!
          </p>
          <div className="hero-ctas">
            <Link to="/waitlist" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Join the Waitlist
            </Link>
            <a href="https://discord.gg/zrdMJ4yngz" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord
            </a>
          </div>
        </section>

        <div className="banner-reveal">
          <img src="/banner.png" alt="PomoPets characters" className="pet-banner" />
        </div>
      </div>

      {/* ── Section 2: About title ── */}
      <section className="about-title-section" ref={titleSectionRef}>
        <h2 className="about-title">For the Chronic &amp; Neurospicy,<br /><span>By someone who gets it</span></h2>
      </section>

      {/* ── Section 3: About body ── */}
      <section className="about-body-section" ref={bodySectionRef}>
        <div className="about-image">
          <img src="/aboutUs.png" alt="About PomoPets" />
        </div>
        <div className="about-content">
          <span className="hero-eyebrow">Our Story!</span>
          <p className="about-body">
           PomoPets was forged through sleepless nights and missed breaks, driven by the desire to make self-care and studying feel less like a chore.

By combining our degrees in psychology and computer science, we crafted a game that uses both to help you finally take back control.

Every task, no matter how small, can help you achieve more and take care of yourself and your very own PomoPet!
          </p>
          <p className="about-body">
            Earn coins, hatch and grow your pet. Trade or decorate them to stay productive, whilst tracking your health!
          </p>
        </div>
      </section>

      {/* ── Section 4: How it started ── */}
      <section className="how-it-started" ref={startedSectionRef}>
        <span className="started-eyebrow">From the Heart</span>
        <div className="started-body">
          <p>
            I struggle with chronic conditions and neurodiversity; more specifically, I struggle to manage my own social battery with studying and taking care of myself.
          </p>
          <p>
            So I designed something that combines my psychology degree, my love of animals, and coding and drawing.
          </p>
          <p>
            The idea bloomed from looking up to my dad, as a software developer and role model for many years. Despite managing chronic conditions himself, he always pushed through and showed up with so much love and passion.
          </p>
          <p>
            This game is dedicated to my dad, but also to everyone out there like me who hasn't quite found a solution. Even if you aren't like me, I hope this game brings you enjoyment and helps you stay motivated!
          </p>
        </div>
      </section>

      {/* ── Section 5: Features ── */}
      <section className="features-section" ref={featuresSectionRef}>
        <span className="features-eyebrow">What You Get</span>
        <h2 className="features-title">Everything You Need to<br /><span>Stay on Track</span></h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🍅</span>
            <h3>Pomodoro Timer</h3>
            <p>Built-in focus timer with customisable sessions. Study in short bursts, take proper breaks, and earn rewards for every minute.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🥚</span>
            <h3>Hatch & Collect</h3>
            <p>Spend your earned coins on eggs in the shop. Hatch them to discover pets across six rarity tiers — from Common to Prismatic.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🐾</span>
            <h3>Grow Your Pets</h3>
            <p>Your pets level up as you study. Feed them, care for them, and watch them grow — your productivity directly shapes their world.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Track Your Progress</h3>
            <p>See your study streaks, session history, and personal stats. Understand your patterns and celebrate your wins.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎨</span>
            <h3>Hand-Drawn Art</h3>
            <p>Every pet and asset is hand-drawn with love. No generative AI — just authentic, original artwork crafted for this game.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>Cross-Platform</h3>
            <p>Available on Web, iOS, and Steam. Your progress syncs everywhere so you can study at your desk or on the go.</p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Gallery ── */}
      <section className="gallery-section" ref={gallerySectionRef}>
        <span className="gallery-eyebrow">Sneak Peek</span>
        <h2 className="gallery-title">Meet Some<br /><span>PomoPets</span></h2>
        <div className="gallery-grid">
          <div className="gallery-card">
            <img src="/gallery/Screenshot 2026-03-19 at 16.19.03.png" alt="Turtle pet" />
          </div>
          <div className="gallery-card">
            <img src="/gallery/Screenshot 2026-03-19 at 16.19.21.png" alt="Cow pet" />
          </div>
          <div className="gallery-card">
            <img src="/gallery/Screenshot 2026-03-19 at 16.19.30.png" alt="Bat pet" />
          </div>
          <div className="gallery-card">
            <img src="/gallery/Screenshot 2026-03-19 at 16.19.58.png" alt="Bat flying pet" />
          </div>
        </div>
      </section>

      {/* ── Section 7: Socials ── */}
      <section className="socials-section" ref={socialsSectionRef}>
        <span className="socials-eyebrow">Connect With Us</span>
        <h2 className="socials-title">Find Us<br /><span>Everywhere</span></h2>

        <div className="socials-content">
          {/* Co-founder Linktree QR */}
          <div className="socials-qr-card">
            <img src="/linktr.png" alt="Linktree QR code" className="socials-qr-img" />
            <p className="socials-qr-label">Scan for Linktree</p>
          </div>

          {/* Personal links */}
          <div className="socials-icons">
            <a href="https://github.com/ChristopherJamesMoore" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/chrismoore2608/" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
