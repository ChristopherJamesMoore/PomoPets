import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import GoogleIcon from '../components/GoogleIcon';
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
    // Auth state change will trigger the redirect via useEffect
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

    // Email confirmation required
    if (data.user && !data.session) {
      setRegSuccess('Check your email to confirm your account!');
      setRegSubmitting(false);
      return;
    }

    // Auto-confirmed — auth state change will redirect
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
            {loginError && <div className="form-error">{loginError}</div>}
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <div className="remember-forget">
              <span></span>
              <a href="#" onClick={e => { e.preventDefault(); setView('forgot'); }}>Forgot Password?</a>
            </div>
            <button type="submit" className="btn-login" disabled={loginSubmitting}>
              {loginSubmitting ? 'Logging in...' : 'Login!'}
            </button>
            <div className="divider"><span>or</span></div>
            <button type="button" className="btn-login btn-google" onClick={handleGoogle}>
              <GoogleIcon />
              Continue with Google
            </button>
            <div className="register-link">
              <p>Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setView('register'); }}>Register</a></p>
            </div>
          </form>
        )}

        {/* Register Form */}
        {view === 'register' && (
          <form onSubmit={handleRegister}>
            <h1>Register</h1>
            {regError && <div className="form-error">{regError}</div>}
            {regSuccess && <div className="form-success">{regSuccess}</div>}
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="input-box">
              <input
                type="password"
                placeholder="Confirm Password"
                value={regConfirm}
                onChange={e => setRegConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn-login" disabled={regSubmitting}>
              {regSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
            <div className="register-link">
              <p>Already have an account? <a href="#" onClick={e => { e.preventDefault(); setView('login'); }}>Login</a></p>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <h1>Reset Password</h1>
            {forgotError && <div className="form-error">{forgotError}</div>}
            {forgotSuccess && <div className="form-success">{forgotSuccess}</div>}
            <div className="input-box">
              <input
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={forgotSubmitting}>
              {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
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
