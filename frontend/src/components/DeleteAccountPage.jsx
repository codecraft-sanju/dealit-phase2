import React, { useState } from 'react';
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
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/profile" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-white">Account Deletion</h2>
      </div>

      <div className="bg-gray-800 rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl">
        {/* Warning Header */}
        <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex items-start gap-4">
          <div className="bg-red-500/20 p-3 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-500 font-bold text-lg">This action is permanent</h3>
            <p className="text-gray-400 text-sm mt-1">
              Once you delete your account, there is no way to recover your data or credits.
            </p>
          </div>
        </div>

        {/* Policy Details */}
        <div className="p-8 space-y-6">
          <section>
            <h4 className="flex items-center gap-2 text-white font-semibold mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Deletion Policy
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-emerald-400">•</span>
                All your listed items will be permanently removed from the marketplace.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">•</span>
                Your remaining wallet credits will be forfeited and cannot be refunded.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">•</span>
                Active swap requests and chat history will be deleted instantly.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400">•</span>
                Personal data like your phone number and email will be erased from our servers.
              </li>
            </ul>
          </section>

          <div className="h-px bg-gray-700/50"></div>

          <section>
            <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 mb-6">
              <div className="flex gap-3 text-xs text-gray-400 leading-relaxed">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <p>To confirm, please type <span className="text-white font-bold italic">DELETE</span> in the box below. We are sad to see you go!</p>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs mb-3 ml-1">{error}</p>}
            
            <input 
              type="text" 
              placeholder="Type DELETE here"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-500 transition-colors mb-4"
            />

            <button 
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all ${
                confirmText === 'DELETE' 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : <><Trash2 className="w-5 h-5" /> Delete My Data Permanently</>}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPage;