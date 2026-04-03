import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';
import './AuthPage.css'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const AuthPage = ({ setUser, defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Controls the CSS animation class
  const [isSignUpMode, setIsSignUpMode] = useState(defaultMode === 'signup');
  
  // Form States
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', phone: '', city: '' });
  
  // OTP States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignUpMode(defaultMode === 'signup');
    setError('');
    setShowOtp(false);
  }, [defaultMode, location.pathname]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleModeSwitch = (mode) => {
    setIsSignUpMode(mode === 'signup');
    setError('');
    setShowOtp(false);
    navigate(mode === 'signup' ? '/signup' : '/login', { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/login`, 
        { email: formData.email, password: formData.password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        // NAYA: Token save kar rahe hain iOS ke liye
        if(response.data.token) {
          localStorage.setItem('dealit_token', response.data.token);
        }
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/register`, formData, { withCredentials: true });
      if (response.data.success) {
        if (response.data.requiresOtp) {
          setRegisteredEmail(response.data.email || formData.email);
          setShowOtp(true); 
        } else {
          // NAYA: Direct signup bypass hua toh welcome bonus trigger set karo
          localStorage.setItem('showWelcomeBonus', 'true');
          
          setUser(response.data.user);
          localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
          if(response.data.token) {
            localStorage.setItem('dealit_token', response.data.token);
          }
          navigate('/'); 
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/verify-otp`, 
        { email: registeredEmail, otp }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // NAYA: OTP verify hote hi welcome bonus trigger set karo
        localStorage.setItem('showWelcomeBonus', 'true');
        
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        if(response.data.token) {
          localStorage.setItem('dealit_token', response.data.token);
        }
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
        
        {/* Forms Container */}
        <div className="auth-container__forms">
          <div className="auth-form">
            
            {/* ---------------- LOGIN FORM ---------------- */}
            <form onSubmit={handleLogin} className="auth-form-wrap form__sign-in">
              <h2 className="form__title">Sign In</h2>
              {error && !isSignUpMode && <div className="error-message">{error}</div>}
              
              <div className="form__input-field">
                <Mail />
                <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} />
              </div>
              
              <div className="form__input-field">
                <Lock />
                <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
              </div>
              
              <input type="submit" className="form__submit" value={loading ? "Signing In..." : "Sign In"} disabled={loading} />
              
              <p style={{marginTop: '10px', fontSize: '0.9rem'}}>
                <a href="/forgot-password" style={{color: '#444', textDecoration: 'none', fontWeight: '500'}}>Forgot your password?</a>
              </p>
            </form>

            {/* ---------------- SIGNUP / OTP FORM ---------------- */}
            <form onSubmit={showOtp ? handleVerifyOtp : handleSignup} className="auth-form-wrap form__sign-up">
              
              {!showOtp ? (
                <>
                  <h2 className="form__title">Sign Up</h2>
                  {error && isSignUpMode && <div className="error-message">{error}</div>}
                  
                  <div className="form__input-field">
                    <User />
                    <input type="text" name="full_name" placeholder="Full Name" required value={formData.full_name} onChange={handleChange} />
                  </div>
                  
                  <div className="form__input-field">
                    <Mail />
                    <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} />
                  </div>
                  
                  <div className="form__input-field">
                    <Lock />
                    <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
                  </div>

                  <div className="form__input-field">
                    <Phone />
                    <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                  </div>

                  <div className="form__input-field">
                    <MapPin />
                    <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
                  </div>

                  <input type="submit" className="form__submit" value={loading ? "Please wait..." : "Sign Up"} disabled={loading} />
                </>
              ) : (
                <>
                  {/* OTP Verification UI */}
                  <h2 className="form__title">Verify Email</h2>
                  <p className="form__text">
                    We sent a 6-digit code to <strong>{registeredEmail}</strong>
                  </p>
                  
                  {error && isSignUpMode && <div className="error-message">{error}</div>}
                  
                  <div className="form__input-field" style={{ gridTemplateColumns: "15% 85%" }}>
                    <CheckCircle />
                    <input 
                      type="text" 
                      required 
                      maxLength="6"
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      placeholder="------" 
                      style={{ letterSpacing: '0.4em', fontWeight: 'bold' }}
                    />
                  </div>
                  
                  <input type="submit" className="form__submit" value={loading ? "Verifying..." : "Verify & Login"} disabled={loading || otp.length < 6} />
                  
                  <p style={{marginTop: '15px', fontSize: '0.9rem', color: '#444'}}>
                    Wrong email? <span onClick={() => setShowOtp(false)} style={{color: '#A388E1', cursor: 'pointer', fontWeight: 'bold'}}>Go back</span>
                  </p>
                </>
              )}
            </form>

          </div>
        </div>

        {/* Sliding Panels Container */}
        <div className="auth-container__panels">
          
          <div className="panel panel__left">
            <div className="panel__content">
              <h3 className="panel__title">New to Dealit?</h3>
              <p className="panel__paragraph">
                Join our community today! Trade unused items for things you actually want without spending money.
              </p>
              <button className="auth-btn-transparent" onClick={() => handleModeSwitch('signup')}>
                Sign Up
              </button>
            </div>
            <img className="panel__image" src="https://stories.freepiklabs.com/storage/11588/market-launch-amico-2628.png" alt="Sign up illustration" />
          </div>
          
          <div className="panel panel__right">
            <div className="panel__content">
              <h3 className="panel__title">One of us?</h3>
              <p className="panel__paragraph">
                If you already have an account, just sign in. We've missed you! Check your dashboard for new offers.
              </p>
              <button className="auth-btn-transparent" onClick={() => handleModeSwitch('login')}>
                Sign In
              </button>
            </div>
            <img className="panel__image" src="https://www.pngkey.com/png/full/444-4444270_ia-press-play-website.png" alt="Sign in illustration" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;