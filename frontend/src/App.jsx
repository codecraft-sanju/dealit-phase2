import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { Package, X, AlertCircle, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

import SearchPage from './components/SearchPage';
import AdminPanel from './components/AdminPanel'; 
import ItemDetailPage from './components/ItemDetailPage';
import ChatPage from './components/ChatPage';
import WalletPage from './components/WalletPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage'; 
import SwapsPage from './components/SwapsPage'; 
import ForgotPasswordPage from './components/ForgotPasswordPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Navbar from './components/Navbar'; // NAYA IMPORT
import AddItemPage from './components/AddItemPage'; // NAYA IMPORT ADDITEMPAGE KE LIYE
import ItemsPage from './components/ItemsPage';
import DashboardPage from './components/DashboardPage';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// NAYA: ZeroPriceAlert Component - Jo popup dikhayega
const ZeroPriceAlert = ({ user }) => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Agar user logged in nahi hai ya humne pehle hi check kar liya hai, toh wapas jao
    if (!user || hasChecked) return;

    const checkItems = async () => {
      try {
        const res = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
        // Check if any item has 0 or missing estimated_value
        const needsUpdate = res.data.data.some(item => !item.estimated_value || item.estimated_value === 0);
        
        if (needsUpdate) {
          setShow(true);
        }
        setHasChecked(true); // Ek session me ek hi baar check karega
      } catch (error) {
        console.error('Error checking item prices:', error);
      }
    };
    
    // Agar user already dashboard ya edit page par hai, toh waha popup mat dikhao
    if (!location.pathname.includes('/dashboard') && !location.pathname.includes('/edit-item')) {
       checkItems();
    }
  }, [user, hasChecked, location.pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 transition-opacity duration-300">
      <div className="bg-gray-800 border border-yellow-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative transform scale-100 transition-transform">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition p-1 bg-gray-900 rounded-full">
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Update Missing Prices!</h3>
        <p className="text-gray-400 text-sm mb-6">
          Some of your listed items have a value of <strong className="text-yellow-500">0 Credits</strong>. Please update them so others can make fair trade offers!
        </p>
        
        <button 
          onClick={() => {
            setShow(false);
            navigate('/dashboard');
          }}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" /> Go to Dashboard
        </button>
      </div>
    </div>
  );
};

const EditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    preferred_item: '',
    estimated_value: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/items/${id}`);
        if (response.data.success) {
          const item = response.data.data;
          setFormData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || '',
            condition: item.condition || '',
            preferred_item: item.preferred_item || '',
            estimated_value: item.estimated_value || ''
          });
        }
      } catch (err) {
        setError('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await axios.put(
        `${API_URL}/items/${id}`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-emerald-400 mt-20 animate-pulse font-medium">Loading details...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-3xl font-bold text-white">Edit Item</h2>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home">Home & Garden</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
              <select name="condition" required value={formData.condition} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                <option value="">Select Condition</option>
                <option value="New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used - Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                Item Value (Credits <span className="text-yellow-500">🪙</span>)
              </label>
              <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Item in Return</label>
              <input type="text" name="preferred_item" value={formData.preferred_item} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
          </div>

          <button type="submit" disabled={saving} className={`w-full font-bold rounded-xl px-4 py-4 transition mt-4 ${saving ? 'bg-blue-600 text-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dealit_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/users/logout`, {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem('dealit_user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-sans selection:bg-emerald-500/30">
        <ZeroPriceAlert user={user} />
        
        <main>
          <Routes>
           
            <Route path="/" element={
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <HomePage />
              </>
            } />
            
            <Route path="/login" element={<LoginPage setUser={setUser} />} />
            <Route path="/signup" element={<SignupPage setUser={setUser} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage setUser={setUser} />} />
            
            <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/edit-item/:id" element={user ? <EditItemPage /> : <Navigate to="/login" />} />
            
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/add-item" element={user ? <AddItemPage /> : <Navigate to="/login" />} />
            <Route path="/item/:id" element={<ItemDetailPage user={user} />} />
            <Route path="/swaps" element={user ? <SwapsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/chat/:barterId" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={user ? <WalletPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/items" element={<ItemsPage />} />
            
            <Route path="*" element={<div className="text-white text-center mt-20 text-xl">404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;