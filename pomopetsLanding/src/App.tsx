import './App.css'


export default function App() {
  return (
    <div className="page">

      {/* ── First fold — exactly 100vh ── */}
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
            PomoPets turns your study sessions into adventures. Stay focused with the Pomodoro technique and watch your virtual pets grow with every session you complete!
          </p>
          <div className="hero-ctas">
            <button className="btn-primary">Get Started</button>
            <button className="btn-outline">See How It Works</button>
          </div>
        </section>

        {/* ── Banner — fully visible above the fold ── */}
        <div className="banner-reveal">
          <img src="/banner.png" alt="PomoPets characters" className="pet-banner" />
        </div>
      </div>

      {/* ── Below fold ── */}
      <div className="below-fold">
        {/* TODO: replace with scroll-triggered animation */}
        <div className="animation-placeholder">
          More content here... (scroll down to see the animation)
        </div>
      </div>

    </div>
  )
}
