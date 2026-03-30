import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const SignupPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', phone: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/register`, formData, { withCredentials: true });
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('dealit_user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Create Account</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">Join Dealit to start trading items.</p>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Mumbai" />
            </div>
          </div>
          <button type="submit" disabled={loading} className={`w-full font-bold rounded-xl px-4 py-3 transition mt-2 ${loading ? 'bg-emerald-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;