import { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import FormField from '../components/FormField';
import './HelpPage.css';

export default function HelpPage() {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <FormField>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </FormField>
            <FormField>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </FormField>
            <FormField>
              <input
                type="email"
                placeholder="yourname@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </FormField>
            <FormField label="I need help with:" htmlFor="help-topic">
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
            </FormField>
            <Button type="submit" variant="submit">Contact Us</Button>
          </form>
        </GlassCard>
      </div>
    </>
  );
}
