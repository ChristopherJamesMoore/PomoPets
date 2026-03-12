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
            <li>
              <Link to="/login" className="nav-login-btn">Login</Link>
            </li>
          </ul>
        </nav>

        <section className="hero">
          <span className="hero-eyebrow">Pomodoro + Virtual Pets</span>
          <h1 className="hero-title">
            Study Smarter,<br />
            <span>Grow Your Pets</span>
          </h1>
          <p className="hero-subtitle">
            PomoPets turns your study sessions into adventures. Stay focused with the Pomodoro technique and watch your virtual pets grow with every session you complete!
          </p>
          <div className="hero-ctas">
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              Get Started
            </Link>
            <button className="btn-outline">See How It Works</button>
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
          <span className="hero-eyebrow">Our Story</span>
          <p className="about-body">
            PomoPets was born from late nights, missed breaks, and the desire to make studying feel less like a chore. We combined the proven Pomodoro technique with the joy of virtual pets to create something that actually keeps you coming back to your desk.
          </p>
          <p className="about-body">
            Every focus session feeds your pet, every break helps it grow. Your productivity becomes their story.
          </p>
        </div>
      </section>

    </div>
  )
}
