import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import GoogleIcon from '../components/GoogleIcon';
import Button from '../components/Button';
import FormMessage from '../components/FormMessage';
import InputBox from '../components/InputBox';
import './LoginPage.css';

type FormView = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const { user, isProfileComplete, loading } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<FormView>('login');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(isProfileComplete ? '/' : '/profile-setup', { replace: true });
    }
  }, [loading, user, isProfileComplete, navigate]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setLoginError(error.message);
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
    });

    if (error) {
      setRegError(error.message);
      setRegSubmitting(false);
      return;
    }

    if (data.user && !data.session) {
      setRegSuccess('Check your email to confirm your account!');
      setRegSubmitting(false);
      return;
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim());

    if (error) {
      setForgotError(error.message);
    } else {
      setForgotSuccess('If that email exists, a reset link has been sent.');
    }
    setForgotSubmitting(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    });
  };

  return (
    <div className="login-page">
      <GlassCard className="wrapper">
        {/* Login Form */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            <h1>Login</h1>
            <FormMessage type="error" message={loginError} />
            <InputBox
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
            />
            <InputBox
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
            />
            <div className="remember-forget">
              <span></span>
              <a href="#" onClick={e => { e.preventDefault(); setView('forgot'); }}>Forgot Password?</a>
            </div>
            <Button type="submit" disabled={loginSubmitting}>
              {loginSubmitting ? 'Logging in...' : 'Login!'}
            </Button>
            <div className="divider"><span>or</span></div>
            <Button type="button" variant="google" onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </Button>
            <div className="register-link">
              <p>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setView('register'); }}>Register</a></p>
            </div>
          </form>
        )}

        {/* Register Form */}
        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h1>Register</h1>
            <FormMessage type="error" message={regError} />
            <FormMessage type="success" message={regSuccess} />
            <InputBox
              type="email"
              placeholder="Email"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
              required
            />
            <InputBox
              type="password"
              placeholder="Password"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              required
              minLength={6}
            />
            <InputBox
              type="password"
              placeholder="Confirm Password"
              value={regConfirm}
              onChange={e => setRegConfirm(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" disabled={regSubmitting}>
              {regSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
            <div className="register-link">
              <p>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setView('login'); }}>Login</a></p>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <h1>Reset Password</h1>
            <FormMessage type="error" message={forgotError} />
            <FormMessage type="success" message={forgotSuccess} />
            <InputBox
              type="email"
              placeholder="Email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={forgotSubmitting}>
              {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="register-link">
              <p>Remember your password? <a href="#" onClick={e => { e.preventDefault(); setView('login'); }}>Login</a></p>
            </div>
          </form>
        )}
      </GlassCard>
      <Link to="/" className="skip-link">Skip</Link>
    </div>
  );
}
