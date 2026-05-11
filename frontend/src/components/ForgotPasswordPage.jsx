import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, CheckCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import Lottie from 'lottie-react';
import './ForgotPassword.css';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

/* ── Workaround for Vite/Webpack default export issue ── */
const LottieComponent = Lottie && Lottie.default ? Lottie.default : Lottie;

/* ── Floating-label input ── */
const FloatInput = ({ icon: Icon, label, name, type = 'text', value, onChange, required, maxLength, inputMode, autoCapitalize, autoCorrect, style }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const isActive = focused || value?.length > 0;

  return (
    <div className={`fi-wrap ${isActive ? 'active' : ''} ${focused ? 'focused' : ''}`}>
      <span className="fi-icon">{Icon && <Icon size={16} />}</span>
      <div className="fi-inner">
        <label className="fi-label">{label}</label>
        <input
          className="fi-input"
          type={isPassword ? (showPass ? 'text' : 'password') : type}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={style}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {isPassword && (
        <button type="button" className="fi-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
};

/* ── OTP Input (6 boxes) ── */
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
          pattern="[0-9]*"
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

/* ── Main Component ── */
const ForgotPasswordPage = ({ setUser }) => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotAnimData, setForgotAnimData] = useState(null);

  useEffect(() => {
    fetch('/forgotpassword.json')
      .then(res => res.json())
      .then(setForgotAnimData)
      .catch(() => {});
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/forgotpassword`, { email });
      if (response.data.success) {
        setMessage('OTP sent to your email!');
        setStep(2); 
      }
    } catch (err) {
      console.error("[DEBUG] Send OTP Error:", err);
      if (err.response) setError(err.response.data.message || 'Failed to send OTP.');
      else if (err.request) setError('Network Error: Cannot reach server. Please check internet connection.');
      else setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/resetpassword`, 
        { email, otp, newPassword },
        { withCredentials: true } 
      );
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        if(response.data.token) {
          localStorage.setItem('dealit_token', response.data.token);
        }
        navigate('/');
      }
    } catch (err) {
      console.error("[DEBUG] Reset Password Error:", err);
      if (err.response) setError(err.response.data.message || 'Invalid OTP or Password.');
      else if (err.request) setError('Network Error: Cannot reach server (Blocked by Apple Security).');
      else setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setError('');
    setMessage('');
    setOtp('');
  };

  return (
    <div className="aw-root">
      {/* Animated background orbs */}
      <div className="aw-bg">
        <div className="aw-orb aw-orb1" />
        <div className="aw-orb aw-orb2" />
        <div className="aw-orb aw-orb3" />
        <div className="aw-noise" />
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className={`aw-desk ${step === 2 ? 'is-step2' : ''}`}>
        <div className="aw-card">
          <div className="aw-forms">

            {/* STEP 1: REQUEST OTP */}
            <div className="aw-form-pane step1-pane">
              <div className="aw-form-scroll">
                <div className="aw-brand">
                  <Sparkles size={20} className="brand-spark" />
                  <span>dealit</span>
                </div>
                <h1 className="aw-heading">Reset Password</h1>
                <p className="aw-sub">Enter the email associated with your account</p>

                {error && step === 1 && <div className="aw-error">{error}</div>}

                <form onSubmit={handleSendOtp} className="aw-form" noValidate>
                  <FloatInput 
                    icon={Mail} 
                    label="Email address" 
                    name="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    autoCapitalize="none" 
                    autoCorrect="off" 
                  />

                  <button type="submit" className="aw-btn" disabled={loading}>
                    {loading ? <span className="aw-spinner" /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
                  </button>

                  <Link to="/login" className="aw-link" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Back to Login
                  </Link>
                </form>
              </div>
            </div>

            {/* STEP 2: VERIFY OTP & NEW PASSWORD */}
            <div className="aw-form-pane step2-pane">
              <div className="aw-form-scroll">
                <div className="aw-brand">
                  <Sparkles size={20} className="brand-spark" />
                  <span>dealit</span>
                </div>
                
                <h1 className="aw-heading">Secure Account</h1>
                <p className="aw-sub">We sent a 6-digit code to<br /><strong>{email}</strong></p>

                {error && step === 2 && <div className="aw-error">{error}</div>}
                {message && step === 2 && <div className="aw-success">{message}</div>}

                <form onSubmit={handleResetPassword} className="aw-form" noValidate>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <OtpInput value={otp} onChange={setOtp} />
                  </div>
                  
                  <FloatInput 
                    icon={Lock} 
                    label="New Password" 
                    name="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />

                  <button type="submit" className="aw-btn" disabled={loading || otp.length < 6 || !newPassword}>
                    {loading ? <span className="aw-spinner" /> : <><span>Reset & Login</span><CheckCircle size={16} /></>}
                  </button>
                </form>

                <p className="aw-switch-txt">
                  Wrong email?{' '}
                  <button type="button" className="aw-switch-btn" onClick={handleGoBack}>Go back</button>
                </p>
              </div>
            </div>

          </div>

          {/* Sliding hero panel */}
          <div className="aw-hero">
            <div className="hero-step1-view">
              {forgotAnimData && <LottieComponent animationData={forgotAnimData} loop={true} className="hero-img" />}
              <h2 className="hero-title">Forgot it?</h2>
              <p className="hero-body">No worries, we will help you get back into your account safely.</p>
            </div>
            <div className="hero-step2-view">
              {forgotAnimData && <LottieComponent animationData={forgotAnimData} loop={true} className="hero-img" />}
              <h2 className="hero-title">Check your inbox!</h2>
              <p className="hero-body">Enter the verification code to set your new password and regain access.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (bottom sheet style) ── */}
      <div className={`aw-mobile ${step === 2 ? 'is-step2' : ''}`}>
        <div className="mb-hero">
          {forgotAnimData && <LottieComponent animationData={forgotAnimData} loop={true} className="mb-hero-img" />}
          <div className="mb-brand">
            <Sparkles size={18} className="brand-spark" />
            <span>dealit</span>
          </div>
        </div>

        <div className="mb-sheet">
          <div className="mb-form-area">
            {step === 1 ? (
              <div className="mb-form-content">
                <h1 className="aw-heading" style={{ fontSize: '1.8rem', textAlign: 'center' }}>Reset Password</h1>
                <p className="aw-sub" style={{ textAlign: 'center' }}>Enter your registered email address</p>
                
                {error && step === 1 && <div className="aw-error">{error}</div>}

                <form onSubmit={handleSendOtp} className="aw-form" noValidate style={{ marginTop: '1.5rem' }}>
                  <FloatInput icon={Mail} label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoCapitalize="none" autoCorrect="off" />
                  <button type="submit" className="aw-btn" disabled={loading}>
                    {loading ? <span className="aw-spinner" /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
                  </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <Link to="/login" className="aw-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mb-form-content">
                <h1 className="aw-heading" style={{ fontSize: '1.8rem', textAlign: 'center' }}>Secure Account</h1>
                <p className="aw-sub" style={{ textAlign: 'center' }}>
                  Code sent to<br /><strong>{email}</strong>
                </p>

                {error && step === 2 && <div className="aw-error">{error}</div>}
                {message && step === 2 && <div className="aw-success">{message}</div>}

                <form onSubmit={handleResetPassword} className="aw-form" noValidate>
                  <OtpInput value={otp} onChange={setOtp} />
                  <FloatInput icon={Lock} label="New Password" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  
                  <button type="submit" className="aw-btn" disabled={loading || otp.length < 6 || !newPassword}>
                    {loading ? <span className="aw-spinner" /> : <><span>Reset & Login</span><CheckCircle size={16} /></>}
                  </button>
                </form>

                <p className="aw-switch-txt">
                  Wrong email?{' '}
                  <button type="button" className="aw-switch-btn" onClick={handleGoBack}>Go back</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;