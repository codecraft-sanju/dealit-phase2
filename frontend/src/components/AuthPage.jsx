import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // ⚡ ADDED Link
import axios from 'axios';
import { User, Lock, Mail, Phone, MapPin, CheckCircle, Gift } from 'lucide-react';
import './AuthPage.css'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

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

  useEffect(() => {
    setIsSignUpMode(defaultMode === 'signup');
    setError('');
    setShowOtp(false);
    
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/public-settings`);
        if(res.data.success) {
          setAppSettings(res.data.data);
        }
      } catch (error) {
        console.log("Using default settings");
      }
    };
    fetchSettings();

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
        if(response.data.token) {
          localStorage.setItem('dealit_token', response.data.token);
        }
        navigate('/');
      }
    } catch (err) {
      console.error("[DEBUG] Login Error Details:", err);
      // ⚡ NAYA LOGIC: iOS ke network errors ko pakadne ke liye
      if (err.response) {
        setError(err.response.data.message || 'Invalid email or password.');
      } else if (err.request) {
        setError('Network Error: Cannot reach server. Please check your internet or HTTP/HTTPS settings.');
      } else {
        setError('Error: ' + err.message);
      }
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
      console.error("[DEBUG] Signup Error Details:", err);
      if (err.response) {
        setError(err.response.data.message || 'Something went wrong during signup.');
      } else if (err.request) {
        setError('Network Error: Cannot reach server.');
      } else {
        setError('Error: ' + err.message);
      }
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
        localStorage.setItem('showWelcomeBonus', 'true');
        
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        if(response.data.token) {
          localStorage.setItem('dealit_token', response.data.token);
        }
        navigate('/');
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Invalid or expired OTP.');
      } else {
        setError('Network Error: Cannot reach server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isSignUpMode ? 'sign-up-mode' : ''}`}>
        
        <div className="auth-container__forms">
          <div className="auth-form">
            
            <form onSubmit={handleLogin} className="auth-form-wrap form__sign-in">
              <h2 className="form__title">Sign In</h2>
              {error && !isSignUpMode && <div className="error-message bg-red-100 text-red-600 p-3 rounded-lg text-xs mb-3 font-bold">{error}</div>}
              
              <div className="form__input-field">
                <Mail />
                {/* ⚡ iOS FIX: autoCapitalize aur autoCorrect band kiya */}
                <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} autoCapitalize="none" autoCorrect="off" />
              </div>
              
              <div className="form__input-field">
                <Lock />
                <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
              </div>
              
              <input type="submit" className="form__submit" value={loading ? "Signing In..." : "Sign In"} disabled={loading} />
              
              <p className="form__footer-text">
                {/* ⚡ FIXED: <a> tag removed, <Link> used to prevent page reload */}
                <Link to="/forgot-password">Forgot your password?</Link>
              </p>
            </form>

            <form onSubmit={showOtp ? handleVerifyOtp : handleSignup} className="auth-form-wrap form__sign-up">
              
              {!showOtp ? (
                <>
                  <h2 className="form__title">Sign Up</h2>
                  {error && isSignUpMode && <div className="error-message bg-red-100 text-red-600 p-3 rounded-lg text-xs mb-3 font-bold">{error}</div>}
                  
                  <div className="form__input-field">
                    <User />
                    <input type="text" name="full_name" placeholder="Full Name" required value={formData.full_name} onChange={handleChange} />
                  </div>
                  
                  <div className="form__input-field">
                    <Mail />
                    <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} autoCapitalize="none" autoCorrect="off" />
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

                  {appSettings.isReferralSystemEnabled && (
                    <div className="form__input-field">
                      <Gift />
                      <input type="text" name="referralCode" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={handleChange} style={{textTransform: 'uppercase'}} autoCapitalize="characters" />
                    </div>
                  )}

                  <input type="submit" className="form__submit" value={loading ? "Please wait..." : "Sign Up"} disabled={loading} />
                </>
              ) : (
                <>
                  <h2 className="form__title">Verify Email</h2>
                  <p className="form__text">
                    We sent a 6-digit code to <strong>{registeredEmail}</strong>
                  </p>
                  
                  {error && isSignUpMode && <div className="error-message bg-red-100 text-red-600 p-3 rounded-lg text-xs mb-3 font-bold">{error}</div>}
                  
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
                      inputMode="numeric"
                    />
                  </div>
                  
                  <input type="submit" className="form__submit" value={loading ? "Verifying..." : "Verify & Login"} disabled={loading || otp.length < 6} />
                  
                  <p className="form__footer-text">
                    Wrong email? <span onClick={() => setShowOtp(false)} className="go-back-btn" style={{cursor:'pointer', color:'#6B46C1', fontWeight:'bold'}}>Go back</span>
                  </p>
                </>
              )}
            </form>

          </div>
        </div>

        {/* ... Rest of the panels remain exactly the same ... */}
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