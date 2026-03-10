import { useRef } from 'react'
import './App.css'

export default function App() {
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
            <button className="btn-primary">Get Started</button>
            <button className="btn-outline">Discord!</button>
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

          <p className="about-body">
            Earn coins, hatch and grow your pet. Trade or decorate them to stay productive, whilst tracking your health!
          </p>
        </div>
      </section>

      <section className="how-it-started">
        <div> className="para">
          <p> I struggle with chronic conditions and neurodiversity; more specifically, I struggle to manage my own social battery with studying and taking care of myself.

            So  I designed something that combines my psychology degree, my love of animals, and coding and drawing. 

            The idea bloomed from looking up to my dad, as a software developer and role model for many years.  Despite managing chronic conditions himself, he always pushed through and showed up with so much love and passion. 

            This game is dedicated to my dad, but also to everyone out there like me who hasn’t quite found a solution. Even if you aren’t like me, I hope this game brings you enjoyment and helps you stay motivated!

          </p>
        </div>  
      </section>

    </div>
  )
}
