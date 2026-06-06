import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, ArrowRight, Shield, Users, Tag, ShoppingBag, Zap } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

import './AuthPage.css';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const isWebView = typeof window !== 'undefined' && window.ReactNativeWebView;

// Fallback dummy faces just in case the API fails or user doesn't have a profile pic
const FALLBACK_AVATARS = [
  'https://i.pravatar.cc/100?img=47',
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=32',
  'https://i.pravatar.cc/100?img=16'
];

const OtpInput = ({ value, onChange }) => {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleKey = (e, idx) => {
    const { key } = e;
    if (key === 'Backspace') {
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0) e.target.previousElementSibling?.focus();
      return;
    }
    if (/^\d$/.test(key)) {
      const next = value.slice(0, idx) + key + value.slice(idx + 1);
      onChange(next.slice(0, 6));
      if (idx < 5) e.target.nextElementSibling?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    e.preventDefault();
  };

  return (
    <div className="otp-grid">
      {digits.map((d, i) => (
        <input
          key={i}
          className={`otp-box ${d ? 'filled' : ''}`}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};

const TrustBadges = () => (
  <div className="trust-badges">
    <div className="badge-item">
      <div className="badge-icon"><Shield size={18} /></div>
      <h4>100% Free</h4>
      <p>No hidden fees</p>
    </div>
    <div className="badge-item">
      <div className="badge-icon"><CheckCircle size={18} /></div>
      <h4>Safe & Secure</h4>
      <p>Your data is protected</p>
    </div>
    <div className="badge-item">
      <div className="badge-icon"><Users size={18} /></div>
      <h4>For Everyone</h4>
      <p>Buy, sell & save more</p>
    </div>
  </div>
);

const AuthPage = ({ setUser, defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUpMode, setIsSignUpMode] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    setIsSignUpMode(defaultMode === 'signup');
    setError('');
    setShowOtp(false);
  }, [defaultMode, location.pathname]);

  // Fetch real user avatars from backend on load
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/random-avatars`);
        if (res.data.success && res.data.data) {
          // We only need 4 avatars for the Auth UI
          setAvatars(res.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch avatars, using fallbacks');
      }
    };
    fetchAvatars();
  }, []);

  useEffect(() => {
    const handleNativeMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'GOOGLE_LOGIN_SUCCESS') {
          handleGoogleLoginSuccess({ credential: data.token });
        } else if (data.type === 'GOOGLE_LOGIN_ERROR') {
          setError(data.message || 'Google Sign-In failed in app.');
          setLoading(false);
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleNativeMessage);
    document.addEventListener('message', handleNativeMessage); 

    return () => {
      window.removeEventListener('message', handleNativeMessage);
      document.removeEventListener('message', handleNativeMessage);
    };
  }, []);

  const triggerNativeGoogleLogin = () => {
    if (isWebView) {
      setLoading(true);
      setError('');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_GOOGLE_LOGIN' }));
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      handleGoogleLoginSuccess({ credential: tokenResponse.access_token });
    },
    onError: () => {
      setError('Google Sign-In failed.');
      setLoading(false);
    }
  });

  const handleModeSwitch = (mode) => {
    setIsSignUpMode(mode === 'signup');
    setError('');
    setShowOtp(false);
    navigate(mode === 'signup' ? '/signup' : '/login', { replace: true });
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/google-login`, {
        token: credentialResponse.credential
      }, { withCredentials: true });

      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(res.data.user));
        if (res.data.token) localStorage.setItem('dealit_token', res.data.token);
        navigate('/');
      }
    } catch (err) {
      if (err.response) setError(err.response.data.message || 'Google Authentication failed.');
      else setError('Network Error: Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    
    const endpoint = isSignUpMode ? `${API_URL}/users/register` : `${API_URL}/users/login`;
    
    try {
      const res = await axios.post(endpoint, { email }, { withCredentials: true });
      
      if (res.data.success) {
        setShowOtp(true);
      }
    } catch (err) {
      if (err.response) setError(err.response.data.message || 'Something went wrong.');
      else if (err.request) setError('Network Error: Cannot reach server.');
      else setError('Error: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/verify-otp`, { email, otp }, { withCredentials: true });
      if (res.data.success) {
        localStorage.setItem('showWelcomeBonus', 'true');
        setUser(res.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(res.data.user));
        if (res.data.token) localStorage.setItem('dealit_token', res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally { setLoading(false); }
  };

  // Prepare images to display (use fetched if available, else fallback)
  const displayAvatars = avatars.length === 4 ? avatars : FALLBACK_AVATARS;

  return (
    <div className="aw-root">
      
      {/* HERO SECTION */}
      <div className="new-hero-section">
        <div className="new-hero-header">
          <div className="mb-brand">
            <img src="/logo.png" alt="Dealit logo" className="brand-logo" />
            <span>dealit</span>
          </div>
          <button className="top-toggle-btn" onClick={() => handleModeSwitch(isSignUpMode ? 'login' : 'signup')}>
            {isSignUpMode ? 'Login' : 'Sign Up'}
          </button>
        </div>

        <div className="new-hero-content">
          <h1 className="hero-main-title">
            {isSignUpMode ? (
              <>Join Dealit & <br /><span className="text-yellow">Get 100 Credits</span> <br />Instantly!</>
            ) : (
              <>Welcome Back to <br /><span className="text-yellow">Dealit</span></>
            )}
          </h1>
          <ul className="hero-benefits">
            <li><Tag size={14} /> {isSignUpMode ? 'List items, earn credits' : 'Check new offers'}</li>
            <li><ShoppingBag size={14} /> {isSignUpMode ? 'Buy anything with credits' : 'Spend your credits'}</li>
            <li><Zap size={14} /> {isSignUpMode ? 'No hidden charges' : 'Complete your trades'}</li>
          </ul>
        </div>
      </div>

     
      <div className="stats-banner-wrap">
        <div className="stats-banner">
          <div className="avatars">
            {displayAvatars.map((src, i) => {
              // If the backend sends an initial-based ui-avatar, replace it with a dummy face for better UI
              const finalSrc = src.includes('ui-avatars.com') ? FALLBACK_AVATARS[i] : src;
              return (
                <img 
                  key={i} 
                  src={finalSrc} 
                  alt={`User ${i + 1}`} 
                  className="avatar" 
                  onError={(e) => { e.target.src = FALLBACK_AVATARS[i]; }} 
                />
              );
            })}
          </div>
          <span><strong>5000+</strong> happy users already earning & saving</span>
        </div>
      </div>

 
      <div className="mb-sheet">
        <div className="sheet-content">
          
          {!showOtp ? (
         
            <div className="form-step">
              <div className="form-header">
                <h2 className="aw-heading">{isSignUpMode ? 'Create your account' : 'Welcome back'}</h2>
                <p className="aw-sub">{isSignUpMode ? 'It takes less than 10 seconds!' : 'Sign in to continue'}</p>
                {error && <div className="aw-error">{error}</div>}
              </div>

              <form onSubmit={handleAuthSubmit} className="aw-form" noValidate>
                <div className="email-input-wrapper">
                  <div className="email-icon-box">
                    <Mail size={20} color="#6B46C1" />
                  </div>
                  <input 
                    type="email" 
                    className="email-input" 
                    placeholder="Enter your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    autoCapitalize="none" 
                    autoCorrect="off"
                  />
                </div>
                
                <div className="verify-badge">
                  <Shield size={14} /> We'll send you an OTP to verify
                </div>

                <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading || !email}>
                  {loading ? <span className="aw-spinner" /> : <><span>Continue</span><ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="divider-section">
                <div className="google-divider"><span>OR CONTINUE WITH</span></div>
                {isWebView ? (
                  <button type="button" onClick={triggerNativeGoogleLogin} className="google-outlined-btn" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                    <span>Continue with Google</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => loginWithGoogle()} className="google-outlined-btn" disabled={loading}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>

              <TrustBadges />
              
              <div className="footer-terms">
                By continuing, you agree to Dealit's <br/>
                <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </div>
            </div>
          ) : (
            // OTP SCREEN
            <div className="form-step">
              <div className="form-header">
                <h2 className="aw-heading">Verify email</h2>
                <p className="aw-sub" style={{ color: '#4b5563' }}>
                  Code sent to <br/><strong>{email}</strong>
                </p>
                {error && <div className="aw-error">{error}</div>}
              </div>

              <form onSubmit={handleVerifyOtp} className="aw-form" noValidate>
                <OtpInput value={otp} onChange={setOtp} />
                <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading || otp.length < 6}>
                  {loading ? <span className="aw-spinner" /> : <><span>Verify & Login</span><CheckCircle size={18} /></>}
                </button>
              </form>
              
              <div className="back-btn-container">
                <button type="button" className="aw-switch-btn" onClick={() => setShowOtp(false)}>
                  Wrong email? Go back
                </button>
              </div>
              
              <div style={{ flex: 1 }}></div> {/* Filler to push UI up */}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;