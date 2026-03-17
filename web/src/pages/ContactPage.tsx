import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContactPage.css'

const CATEGORIES = ['query', 'issue', 'recommendation'] as const
type Category = typeof CATEGORIES[number]

export default function ContactPage() {
  const [email, setEmail]       = useState('')
  const [category, setCategory] = useState<Category>('query')
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')

  const canSubmit = email.trim() && subject.trim() && message.trim() && !sending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSending(true)
    setError('')

    const { error: err } = await supabase.from('support_tickets').insert({
      email: email.trim(),
      category,
      subject: subject.trim(),
      message: message.trim(),
    })

    if (err) {
      setError('Something went wrong. Please try again.')
      setSending(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="contact-page">
      <nav className="contact-nav">
        <Link to="/" className="contact-nav-back">← Back to Home</Link>
        <div className="contact-nav-logo">
          <img src="/logo.png" alt="PomoPets" className="contact-nav-logo-img" />
          <span className="contact-nav-logo-text">PomoPets</span>
        </div>
      </nav>

      <div className="contact-container">
        {sent ? (
          <div className="contact-card contact-success">
            <div className="contact-success-icon">✓</div>
            <h2 className="contact-success-title">Message Sent!</h2>
            <p className="contact-success-text">
              Thanks for reaching out. We'll get back to you as soon as possible.
            </p>
            <Link to="/" className="contact-back-btn">Back to Home</Link>
          </div>
        ) : (
          <form className="contact-card" onSubmit={handleSubmit}>
            <div className="contact-header">
              <h1 className="contact-title">Get in Touch</h1>
              <p className="contact-subtitle">
                Have a question, issue, or suggestion? We'd love to hear from you.
              </p>
            </div>

            {error && <p className="contact-error">{error}</p>}

            <div className="contact-field">
              <label className="contact-label">Email</label>
              <input
                className="contact-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="contact-field">
              <label className="contact-label">Category</label>
              <div className="contact-categories">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`contact-category ${category === c ? 'contact-category--active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c === 'query' && '💬 '}
                    {c === 'issue' && '🐛 '}
                    {c === 'recommendation' && '💡 '}
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="contact-field">
              <label className="contact-label">Subject</label>
              <input
                className="contact-input"
                type="text"
                placeholder="Brief summary of your message"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="contact-field">
              <label className="contact-label">Message</label>
              <textarea
                className="contact-textarea"
                placeholder="Tell us more…"
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="contact-submit"
              disabled={!canSubmit}
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
