import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/login`, 
        { email, password },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">Sign in to Dealit to manage your trades.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300">Forgot password?</Link>
            </div>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className={`w-full font-bold rounded-xl px-4 py-3 transition mt-4 ${loading ? 'bg-emerald-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account? <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;