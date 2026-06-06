import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Phone, MapPin, Loader2, Sparkles, Gift, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const CompleteProfilePopup = ({ user, setUser }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    referralCode: '' // Added Referral field
  });

  useEffect(() => {
    // Only show if user exists but lacks essential contact info
    if (user && !user.phone) {
      setFormData({
        full_name: user.full_name || '',
        phone: '',
        city: user.city || '',
        referralCode: ''
      });
      setShow(true);
    } else {
      setShow(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Using existing profile update API
      const res = await axios.put(`${API_URL}/users/profile`, formData, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('dealit_user', JSON.stringify(res.data.data));
        setShow(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#090714]/60 backdrop-blur-md"></div>
      
      {/* Premium Card Design */}
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden z-10">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#805ad5] to-[#6B46C1] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#6B46C1]/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-extrabold text-[#111827] tracking-tight">Setup Profile</h3>
          <p className="text-gray-500 text-sm mt-1">Almost there! Complete your details.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-[12px] font-bold p-3 rounded-2xl mb-5 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Input Fields with Premium Styling */}
          <div className="space-y-3">
            <div className="relative group">
              <User className="absolute left-4 top-4 w-5 h-5 text-[#6B46C1] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/5 outline-none transition-all"
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-[#6B46C1] opacity-50 group-focus-within:opacity-100 transition-opacity" />
              <input
                type="tel"
                placeholder="Phone (10 digits)"
                required
                maxLength="10"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/5 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative group flex-1">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-[#6B46C1] opacity-50 group-focus-within:opacity-100 transition-opacity" />
                <input
                  type="text"
                  placeholder="City"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/5 outline-none transition-all"
                />
              </div>
              <div className="relative group flex-1">
                <Gift className="absolute left-4 top-4 w-5 h-5 text-[#6B46C1] opacity-50 group-focus-within:opacity-100 transition-opacity" />
                <input
                  type="text"
                  placeholder="Refer Code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/5 outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-[#6B46C1]/20 flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfilePopup;