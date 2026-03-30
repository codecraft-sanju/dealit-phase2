import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ForgotPasswordPage = ({ setUser }) => {
  const navigate = useNavigate();
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl relative">
        <Link to="/login" className="absolute top-6 left-6 text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <h2 className="text-3xl font-bold text-white text-center mb-2 mt-4">Reset Password</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {step === 1 ? "Enter your email to receive an OTP." : "Enter OTP and your new password."}
        </p>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-center">{error}</div>}
        {message && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-4 text-center">{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} className={`w-full font-bold rounded-xl px-4 py-3 transition mt-4 ${loading ? 'bg-emerald-600 text-gray-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Enter OTP</label>
              <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-center tracking-widest font-bold" placeholder="123456" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className={`w-full font-bold rounded-xl px-4 py-3 transition mt-4 ${loading ? 'bg-emerald-600 text-gray-300' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
              {loading ? 'Resetting...' : 'Reset & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;