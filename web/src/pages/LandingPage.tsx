import { useRef } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

export default function LandingPage() {
  const titleSectionRef = useRef<HTMLElement>(null)
  const bodySectionRef  = useRef<HTMLElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop
    const vh  = e.currentTarget.clientHeight
    if (top > 0)        titleSectionRef.current?.classList.add('animate')
    if (top > vh * 1.2) bodySectionRef.current?.classList.add('animate')
  }

  return (
    <div className="page" onScroll={handleScroll}>

      {/* ── Section 1: Hero ── */}
      <div className="fold">
        <nav className="navbar">
          <ul className="nav-links">
            <li><a href="#">Features</a></li>
            <li><a href="#">How It Works</a></li>
            <li><a href="#">Blog</a></li>
          </ul>

          <div className="nav-logo">
            <img src="/logo.png" alt="PomoPets logo" className="nav-logo-img" />
            <span className="nav-logo-text">PomoPets</span>
          </div>

          <ul className="nav-links">
            <li><a href="#">Download</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Contact</a></li>
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

      <section className="how-it-started">
        <div className="para">
          <p> I struggle with chronic conditions and neurodiversity; more specifically, I struggle to manage my own social battery with studying and taking care of myself.

            So  I designed something that combines my psychology degree, my love of animals, and coding and drawing.

            The idea bloomed from looking up to my dad, as a software developer and role model for many years.  Despite managing chronic conditions himself, he always pushed through and showed up with so much love and passion.

            This game is dedicated to my dad, but also to everyone out there like me who hasn't quite found a solution. Even if you aren't like me, I hope this game brings you enjoyment and helps you stay motivated!

          </p>
        </div>
      </section>

    </div>
  )
}
