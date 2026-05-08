import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, AlertTriangle, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const DeleteAccountPage = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_URL}/users/profile`, { withCredentials: true });
      if (response.data.success) {
        localStorage.removeItem('dealit_user');
        localStorage.removeItem('dealit_token');
        window.location.href = '/login'; 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative">
      
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] px-5 py-4 shadow-md flex items-center gap-4">
        <Link 
          to="/profile" 
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold tracking-wide text-white leading-tight">Account Deletion</h1>
      </header>

      {/* Decorative curved background */}
      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-24 relative z-20">
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-xl">
          
          {/* Warning Header */}
          <div className="bg-red-50 p-6 md:p-8 border-b border-red-100 flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-2xl shrink-0 border border-red-200 shadow-sm">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-700 font-black text-xl mb-1">This action is permanent</h3>
              <p className="text-red-900/80 text-sm font-medium leading-relaxed">
                Once you delete your account, there is no way to recover your data, listings, or wallet credits.
              </p>
            </div>
          </div>

          {/* Policy Details */}
          <div className="p-6 md:p-8 space-y-8">
            <section>
              <h4 className="flex items-center gap-2 text-gray-900 font-bold mb-4 text-lg">
                <ShieldCheck className="w-5 h-5 text-[#6B46C1]" /> Deletion Policy
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li className="flex gap-3 bg-[#fcfbff] p-3 rounded-xl border border-[#f0eaff]">
                  <span className="text-[#6B46C1] font-bold">•</span>
                  All your listed items will be permanently removed from the marketplace.
                </li>
                <li className="flex gap-3 bg-[#fcfbff] p-3 rounded-xl border border-[#f0eaff]">
                  <span className="text-[#6B46C1] font-bold">•</span>
                  Your remaining wallet credits will be forfeited and cannot be refunded.
                </li>
                <li className="flex gap-3 bg-[#fcfbff] p-3 rounded-xl border border-[#f0eaff]">
                  <span className="text-[#6B46C1] font-bold">•</span>
                  Active swap requests and chat history will be deleted instantly.
                </li>
                <li className="flex gap-3 bg-[#fcfbff] p-3 rounded-xl border border-[#f0eaff]">
                  <span className="text-[#6B46C1] font-bold">•</span>
                  Personal data like your phone number and email will be erased from our servers.
                </li>
              </ul>
            </section>

            <div className="h-px bg-gray-100"></div>

            <section>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6 shadow-inner">
                <div className="flex gap-3 text-sm text-gray-600 font-medium">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p>To confirm, please type <span className="text-red-600 font-black tracking-wider mx-1">DELETE</span> in the box below. We are sad to see you go!</p>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm font-bold mb-3 bg-red-50 p-3 rounded-xl border border-red-100">
                  {error}
                </p>
              )}
              
              <input 
                type="text" 
                placeholder="Type DELETE here"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-[#f8f6ff] border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold tracking-wide focus:outline-none focus:border-red-500 focus:bg-white transition-colors mb-5 shadow-sm placeholder:font-medium placeholder:tracking-normal"
              />

              <button 
                onClick={handleDelete}
                disabled={loading || confirmText !== 'DELETE'}
                className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all duration-300 ${
                  confirmText === 'DELETE' 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:-translate-y-0.5' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Processing...' : <><Trash2 className="w-5 h-5" /> Delete My Data Permanently</>}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;