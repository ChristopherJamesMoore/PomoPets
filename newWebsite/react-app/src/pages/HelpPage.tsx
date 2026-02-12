import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import './HelpPage.css';

export default function HelpPage() {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic placeholder
  };

  return (
    <>
      <div className="page-content">
        <h1>Help!</h1>
        <p>Please be patient and expect an email back soon!</p>
      </div>
      <div className="help-form-wrapper">
        <GlassCard className="help-form">
          <h2>Fill out the form below:</h2>
          <p>Create a support ticket!</p>
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <input
                type="email"
                placeholder="yourname@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="help-topic">I need help with:</label>
              <select
                id="help-topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              >
                <option value="">Select a service..</option>
                <option value="bug">A bug</option>
                <option value="general">General Help</option>
                <option value="transactions">Transactions</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn-submit">Contact Us</button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}
