import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Mail, Phone, MapPin, CheckCircle, Gift, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Lottie from 'lottie-react';
import './AuthPage.css';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

/* ── Workaround for Vite/Webpack default export issue ── */
const LottieComponent = Lottie && Lottie.default ? Lottie.default : Lottie;

const calculateStrength = (pass) => {
  let score = 0;
  if (!pass) return 0;
  if (pass.length > 5) score += 20;
  if (pass.length > 8) score += 20;
  if (/[A-Z]/.test(pass)) score += 20;
  if (/[0-9]/.test(pass)) score += 20;
  if (/[^A-Za-z0-9]/.test(pass)) score += 20;
  return score;
};

/* ── Floating-label input ── */
const FloatInput = ({ icon: Icon, label, name, type = 'text', value, onChange, required, maxLength, inputMode, autoCapitalize, autoCorrect, style }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const isActive = focused || value?.length > 0;

  return (
    <div className={`fi-wrap ${isActive ? 'active' : ''} ${focused ? 'focused' : ''}`}>
      <span className="fi-icon">{Icon && <Icon size={18} />}</span>
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
          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
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

/* ── Main Component ── */
const AuthPage = ({ setUser, defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUpMode, setIsSignUpMode] = useState(defaultMode === 'signup');
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', phone: '', city: '', referralCode: '' });
  const [appSettings, setAppSettings] = useState({ isReferralSystemEnabled: true });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [loginAnimData, setLoginAnimData] = useState(null);
  const [signupAnimData, setSignupAnimData] = useState(null);

  useEffect(() => {
    fetch('/Login.json').then(res => res.json()).then(setLoginAnimData).catch(() => {});
    fetch('/signup.json').then(res => res.json()).then(setSignupAnimData).catch(() => {});
  }, []);

  useEffect(() => {
    setIsSignUpMode(defaultMode === 'signup');
    setError('');
    setShowOtp(false);

    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/public-settings`);
        if (res.data.success) setAppSettings(res.data.data);
      } catch { }
    };
    fetchSettings();
  }, [defaultMode, location.pathname]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleModeSwitch = (mode) => {
    setIsSignUpMode(mode === 'signup');
    setError('');
    setShowOtp(false);
    navigate(mode === 'signup' ? '/signup' : '/login', { replace: true });
  };

  // CHANGE ADDED HERE
  const handleGeneratePassword = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const specials = '@#$*';
    
    let pass = '';
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += lower[Math.floor(Math.random() * lower.length)];
    pass += nums[Math.floor(Math.random() * nums.length)];
    pass += '@';
    
    const all = upper + lower + nums + specials;
    for (let i = 0; i < 6; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }
    
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, { email: formData.email, password: formData.password }, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(res.data.user));
        if (res.data.token) localStorage.setItem('dealit_token', res.data.token);
        navigate('/');
      }
    } catch (err) {
      if (err.response) setError(err.response.data.message || 'Invalid email or password.');
      else if (err.request) setError('Network Error: Cannot reach server.');
      else setError('Error: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/register`, formData, { withCredentials: true });
      if (res.data.success) {
        if (res.data.requiresOtp) {
          setRegisteredEmail(res.data.email || formData.email);
          setShowOtp(true);
        } else {
          localStorage.setItem('showWelcomeBonus', 'true');
          setUser(res.data.user);
          localStorage.setItem('dealit_user', JSON.stringify(res.data.user));
          if (res.data.token) localStorage.setItem('dealit_token', res.data.token);
          navigate('/');
        }
      }
    } catch (err) {
      if (err.response) setError(err.response.data.message || 'Something went wrong during signup.');
      else if (err.request) setError('Network Error: Cannot reach server.');
      else setError('Error: ' + err.message);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/verify-otp`, { email: registeredEmail, otp }, { withCredentials: true });
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
      <div className={`aw-desk ${isSignUpMode ? 'is-signup' : ''}`}>
        <div className="aw-card">
          <div className="aw-forms">

            {/* LOGIN */}
            <div className="aw-form-pane login-pane">
              <div className="aw-form-scroll admin-scroll">
                <div className="aw-brand">
                  <img src="/logo.png" alt="Dealit logo" className="brand-logo" />
                  <span>dealit</span>
                </div>
                <h1 className="aw-heading">Welcome back</h1>
                <p className="aw-sub">Sign in to your account</p>

                {error && !isSignUpMode && <div className="aw-error">{error}</div>}

                <form onSubmit={handleLogin} className="aw-form" noValidate>
                  <FloatInput icon={Mail} label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} required autoCapitalize="none" autoCorrect="off" />
                  <FloatInput icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />

                  <div className="aw-forgot-row">
                    <Link to="/forgot-password" className="aw-link">Forgot password?</Link>
                  </div>

                  <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? <span className="aw-spinner" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
                  </button>
                </form>

                <p className="aw-switch-txt">
                  Don't have an account?{' '}
                  <button className="aw-switch-btn" onClick={() => handleModeSwitch('signup')}>Sign Up</button>
                </p>
              </div>
            </div>

            {/* SIGNUP / OTP */}
            <div className="aw-form-pane signup-pane">
              <div className="aw-form-scroll admin-scroll">
                <div className="aw-brand">
                  <img src="/logo.png" alt="Dealit logo" className="brand-logo" />
                  <span>dealit</span>
                </div>

                {!showOtp ? (
                  <>
                    <h1 className="aw-heading">Create account</h1>
                    <p className="aw-sub">Join and start trading smarter</p>

                    {error && isSignUpMode && <div className="aw-error">{error}</div>}

                    <form onSubmit={handleSignup} className="aw-form" noValidate>
                      <FloatInput icon={User} label="Full name" name="full_name" value={formData.full_name} onChange={handleChange} required />
                      <FloatInput icon={Mail} label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} required autoCapitalize="none" autoCorrect="off" />
                      
                      <div className="pwd-wrap">
                        <FloatInput icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        
                        {/* CHANGE ADDED HERE */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                          <div className="pwd-strength-bar" style={{ flex: 1, marginRight: '1rem', marginTop: 0 }}>
                            <div 
                              className="pwd-strength-fill" 
                              style={{ 
                                width: `${calculateStrength(formData.password)}%`,
                                backgroundColor: `hsl(${calculateStrength(formData.password) * 1.2}, 100%, 45%)` 
                              }} 
                            />
                          </div>
                          <button type="button" onClick={handleGeneratePassword} style={{ background: 'none', border: 'none', color: '#6B46C1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Auto Generate
                          </button>
                        </div>
                      </div>

                      <FloatInput icon={Phone} label="Phone number" name="phone" value={formData.phone} onChange={handleChange} inputMode="tel" />
                      
                      <div className="aw-form-row">
                        <FloatInput icon={MapPin} label="City" name="city" value={formData.city} onChange={handleChange} />
                        {appSettings.isReferralSystemEnabled && (
                          <FloatInput icon={Gift} label="Refer code" name="referralCode" value={formData.referralCode} onChange={handleChange} autoCapitalize="characters" style={{ textTransform: 'uppercase' }} />
                        )}
                      </div>

                      <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                        {loading ? <span className="aw-spinner" /> : <><span>Create Account</span><ArrowRight size={18} /></>}
                      </button>
                    </form>

                    <p className="aw-switch-txt">
                      Already have an account?{' '}
                      <button className="aw-switch-btn" onClick={() => handleModeSwitch('login')}>Sign In</button>
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="aw-heading">Verify email</h1>
                    <p className="aw-sub">Enter the 6-digit code sent to<br /><strong>{registeredEmail}</strong></p>

                    {error && isSignUpMode && <div className="aw-error">{error}</div>}

                    <form onSubmit={handleVerifyOtp} className="aw-form" noValidate>
                      <OtpInput value={otp} onChange={setOtp} />

                      <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading || otp.length < 6}>
                        {loading ? <span className="aw-spinner" /> : <><span>Verify &amp; Login</span><CheckCircle size={18} /></>}
                      </button>
                    </form>

                    <p className="aw-switch-txt">
                      Wrong email?{' '}
                      <button className="aw-switch-btn" onClick={() => setShowOtp(false)}>Go back</button>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="aw-hero">
            <div className="hero-login-view">
              {signupAnimData && <LottieComponent animationData={signupAnimData} loop={true} className="hero-img" style={{ width: '350px', height: 'auto', marginBottom: '20px' }} />}
              <h2 className="hero-title">New here?</h2>
              <p className="hero-body">Trade what you have for what you need — no money required.</p>
              <button className="hero-btn" onClick={() => handleModeSwitch('signup')}>Create Account</button>
            </div>
            <div className="hero-signup-view">
              {loginAnimData && <LottieComponent animationData={loginAnimData} loop={true} className="hero-img" style={{ width: '350px', height: 'auto', marginBottom: '20px' }} />}
              <h2 className="hero-title">One of us?</h2>
              <p className="hero-body">Welcome back! Your dashboard is waiting with fresh offers.</p>
              <button className="hero-btn" onClick={() => handleModeSwitch('login')}>Sign In</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (bottom sheet style) ── */}
      <div className={`aw-mobile ${isSignUpMode ? 'is-signup' : ''}`}>
        <div className="mb-hero">
          <div className={`mb-hero-img-wrap ${!isSignUpMode ? 'active' : ''}`}>
            {loginAnimData && <LottieComponent animationData={loginAnimData} loop={true} className="mb-hero-img" />}
          </div>
          <div className={`mb-hero-img-wrap ${isSignUpMode ? 'active' : ''}`}>
            {signupAnimData && <LottieComponent animationData={signupAnimData} loop={true} className="mb-hero-img" />}
          </div>
          
          <div className="mb-brand">
            <img src="/logo.png" alt="Dealit logo" className="brand-logo" />
            <span>dealit</span>
          </div>
        </div>

        <div className="mb-sheet">
          <div className="mb-tabs">
            <button className={`mb-tab ${!isSignUpMode ? 'active' : ''}`} onClick={() => handleModeSwitch('login')}>Sign In</button>
            <button className={`mb-tab ${isSignUpMode ? 'active' : ''}`} onClick={() => handleModeSwitch('signup')}>Sign Up</button>
            <div className={`mb-tab-indicator ${isSignUpMode ? 'right' : 'left'}`} />
          </div>

          <div className="mb-form-area">
            <div className={`mb-slider ${isSignUpMode ? 'show-signup' : 'show-login'}`}>
              
              {/* LOGIN MOBILE SLIDE */}
              <div className="mb-slide custom-scrollbar">
                <h2 className="aw-heading" style={{ fontSize: '1.4rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>Welcome back!</h2>
                {error && !isSignUpMode && <div className="aw-error">{error}</div>}
                <form onSubmit={handleLogin} className="aw-form" noValidate>
                  <FloatInput icon={Mail} label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} required autoCapitalize="none" autoCorrect="off" />
                  <FloatInput icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                  <div className="aw-forgot-row">
                    <Link to="/forgot-password" className="aw-link">Forgot password?</Link>
                  </div>
                  <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? <span className="aw-spinner" /> : <><span>Sign In</span><ArrowRight size={18} /></>}
                  </button>
                </form>
              </div>

              {/* SIGNUP / OTP MOBILE SLIDE */}
              <div className="mb-slide custom-scrollbar">
                {!showOtp ? (
                  <>
                    <h2 className="aw-heading" style={{ fontSize: '1.4rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>Create account</h2>
                    {error && isSignUpMode && <div className="aw-error">{error}</div>}
                    <form onSubmit={handleSignup} className="aw-form" noValidate>
                      <FloatInput icon={User} label="Full name" name="full_name" value={formData.full_name} onChange={handleChange} required />
                      <FloatInput icon={Mail} label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} required autoCapitalize="none" autoCorrect="off" />
                      
                      <div className="pwd-wrap">
                        <FloatInput icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        
                        {/* CHANGE ADDED HERE */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                          <div className="pwd-strength-bar" style={{ flex: 1, marginRight: '1rem', marginTop: 0 }}>
                            <div 
                              className="pwd-strength-fill" 
                              style={{ 
                                width: `${calculateStrength(formData.password)}%`,
                                backgroundColor: `hsl(${calculateStrength(formData.password) * 1.2}, 100%, 45%)` 
                              }} 
                            />
                          </div>
                          <button type="button" onClick={handleGeneratePassword} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                            Auto Generate
                          </button>
                        </div>
                      </div>

                      <FloatInput icon={Phone} label="Phone number" name="phone" value={formData.phone} onChange={handleChange} inputMode="tel" />
                      
                      <div className="aw-form-row">
                        <FloatInput icon={MapPin} label="City" name="city" value={formData.city} onChange={handleChange} />
                        {appSettings.isReferralSystemEnabled && (
                          <FloatInput icon={Gift} label="Refer code" name="referralCode" value={formData.referralCode} onChange={handleChange} autoCapitalize="characters" style={{ textTransform: 'uppercase' }} />
                        )}
                      </div>

                      <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                        {loading ? <span className="aw-spinner" /> : <><span>Create Account</span><ArrowRight size={18} /></>}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="otp-fade-in">
                    <h2 className="aw-heading" style={{ fontSize: '1.4rem', marginTop: '0.5rem', marginBottom: '0.2rem' }}>Verify email</h2>
                    <p className="aw-sub" style={{ marginBottom: '1.5rem' }}>
                      Code sent to <strong>{registeredEmail}</strong>
                    </p>
                    {error && isSignUpMode && <div className="aw-error">{error}</div>}
                    <form onSubmit={handleVerifyOtp} className="aw-form" noValidate>
                      <OtpInput value={otp} onChange={setOtp} />
                      <button type="submit" className={`aw-btn ${loading ? 'loading' : ''}`} disabled={loading || otp.length < 6}>
                        {loading ? <span className="aw-spinner" /> : <><span>Verify &amp; Login</span><CheckCircle size={18} /></>}
                      </button>
                    </form>
                    <p className="aw-switch-txt">
                      Wrong email?{' '}
                      <button type="button" className="aw-switch-btn" onClick={() => setShowOtp(false)}>Go back</button>
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;