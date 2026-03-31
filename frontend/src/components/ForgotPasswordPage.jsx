import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import './AuthPage.css'; // Wahi premium CSS file import kar rahe hain

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ForgotPasswordPage = ({ setUser }) => {
  const navigate = useNavigate();
  
  // Step 1: Enter Email | Step 2: Enter OTP & New Password
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/forgotpassword`, { email });
      if (response.data.success) {
        setMessage('OTP sent to your email!');
        // Step 2 me jate hi CSS class trigger hogi aur smooth slide hoga
        setStep(2); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
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
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or failed to reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Jab step 2 hoga, toh 'sign-up-mode' class add hogi aur panel slide karega */}
      <div className={`auth-container ${step === 2 ? 'sign-up-mode' : ''}`}>
        
        <div className="auth-container__forms">
          <div className="auth-form">
            
            {/* ---------------- STEP 1: REQUEST OTP FORM ---------------- */}
            <form onSubmit={handleSendOtp} className="auth-form-wrap form__sign-in">
              <h2 className="form__title">Reset Password</h2>
              <p className="form__text">Don't worry! It happens. Please enter the email associated with your account.</p>
              
              {error && step === 1 && <div className="error-message">{error}</div>}
              
              <div className="form__input-field">
                <Mail />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email Address" 
                />
              </div>
              
              <input 
                type="submit" 
                className="form__submit" 
                value={loading ? "Sending..." : "Send OTP"} 
                disabled={loading} 
              />
              
              <p style={{marginTop: '20px', fontSize: '0.9rem'}}>
                <Link to="/login" style={{color: '#A388E1', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </p>
            </form>

            {/* ---------------- STEP 2: VERIFY OTP & NEW PASSWORD FORM ---------------- */}
            <form onSubmit={handleResetPassword} className="auth-form-wrap form__sign-up">
              <h2 className="form__title">Secure Account</h2>
              <p className="form__text">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              
              {error && step === 2 && <div className="error-message">{error}</div>}
              {message && step === 2 && (
                <div style={{color: '#10b981', background: '#d1fae5', padding: '10px', borderRadius: '10px', fontSize: '0.9rem', textAlign: 'center', marginBottom: '10px', width: '100%', maxWidth: '380px'}}>
                  {message}
                </div>
              )}

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
              
              <div className="form__input-field">
                <Lock />
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="New Password" 
                />
              </div>

              <input 
                type="submit" 
                className="form__submit" 
                value={loading ? "Resetting..." : "Reset & Login"} 
                disabled={loading || otp.length < 6 || !newPassword} 
              />
              
              <p style={{marginTop: '15px', fontSize: '0.9rem', color: '#444'}}>
                Wrong email? <span onClick={() => {setStep(1); setError(''); setMessage('');}} style={{color: '#A388E1', cursor: 'pointer', fontWeight: 'bold'}}>Go back</span>
              </p>
            </form>

          </div>
        </div>

        {/* Sliding Panels Container */}
        <div className="auth-container__panels">
          
          {/* Left Panel (Shows when Step 2 is active) */}
          <div className="panel panel__left">
            <div className="panel__content">
              <h3 className="panel__title">Check your inbox!</h3>
              <p className="panel__paragraph">
                We've sent a verification code to your email. Enter it here along with your new password to regain access.
              </p>
              <button className="auth-btn-transparent" onClick={() => {setStep(1); setError(''); setMessage('');}}>
                Change Email
              </button>
            </div>
            <img className="panel__image" src="https://stories.freepiklabs.com/storage/11588/market-launch-amico-2628.png" alt="Secure account" />
          </div>
          
          {/* Right Panel (Shows when Step 1 is active) */}
          <div className="panel panel__right">
            <div className="panel__content">
              <h3 className="panel__title">Forgot it?</h3>
              <p className="panel__paragraph">
                Enter your registered email address and we'll help you get back into your account safely.
              </p>
              <Link to="/login">
                <button className="auth-btn-transparent mt-4">
                  Log In Instead
                </button>
              </Link>
            </div>
            <img className="panel__image" src="https://www.pngkey.com/png/full/444-4444270_ia-press-play-website.png" alt="Forgot password" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;