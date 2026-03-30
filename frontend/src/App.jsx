import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { Home, Package, MessageSquare, User, LogIn, PlusCircle, Search, LogOut, ArrowLeft, Shield, UploadCloud, RefreshCw, Eye, X, AlertCircle, Phone, MapPin, Mail, Calendar, Coins, Wallet, Check, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import AdminPanel from './components/AdminPanel'; 
import ItemDetailPage from './components/ItemDetailPage';
import ChatPage from './components/ChatPage';
import WalletPage from './components/WalletPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage'; 
import SwapsPage from './components/SwapsPage'; 
// Changes made: Added the import for ForgotPasswordPage
import ForgotPasswordPage from './components/ForgotPasswordPage';

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

const Navbar = ({ user }) => {
  const location = useLocation();
  const [credits, setCredits] = useState(user?.account_credits || 0);

  useEffect(() => {
    const fetchFreshCredits = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (response.data.success) {
          const freshCredits = response.data.data.account_credits;
          setCredits(freshCredits);
          
          const storedUser = JSON.parse(localStorage.getItem('dealit_user'));
          if (storedUser) {
            storedUser.account_credits = freshCredits;
            localStorage.setItem('dealit_user', JSON.stringify(storedUser));
          }
        }
      } catch (error) {
        console.error('Error fetching fresh credits:', error);
      }
    };

    fetchFreshCredits();
  }, [user, location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
          Dealit.
        </Link>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search items to barter..." 
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
            <Home className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Feed</span>
          </Link>
          
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1">
                  <Shield className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Admin</span>
                </Link>
              )}
              
              <Link to="/wallet" className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-bold">{credits}</span>
              </Link>

              <Link to="/swaps" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
                <RefreshCw className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Swaps</span>
              </Link>
              <Link to="/messages" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
                <MessageSquare className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Chat</span>
              </Link>
              
              <Link to="/profile" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden sm:block text-sm font-bold ml-1">{user.full_name?.split(' ')[0]}</span>
              </Link>

              <Link to="/add-item" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-500/20">
                <PlusCircle className="w-4 h-4" /> Add Item
              </Link>
            </>
          ) : (
            <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const DashboardPage = ({ user }) => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/login" />;

  const fetchMyItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      setMyItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching my items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/items/${itemId}`, { withCredentials: true });
        setMyItems(myItems.filter(item => item._id !== itemId));
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Link to="/profile" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">My Dashboard</h1>
          <p className="text-gray-400">Manage all your listed items here.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 mt-20 animate-pulse font-medium">Loading your items...</div>
      ) : myItems.length === 0 ? (
        <div className="text-center bg-gray-800 rounded-3xl py-16 px-6 border border-gray-700 shadow-xl">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-6">You haven't listed any items yet.</p>
          <Link to="/add-item" className="inline-flex bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
            List Your First Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myItems.map(item => (
            <div key={item._id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col hover:border-gray-600 transition shadow-xl relative">
              
              <div className="absolute top-3 left-3 z-10 flex gap-2">
                <Link to={`/edit-item/${item._id}`} className="bg-blue-500/80 hover:bg-blue-500 text-white p-2 rounded-lg backdrop-blur-md transition shadow-lg border border-blue-500/50">
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(item._id)} className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-md transition shadow-lg border border-red-500/50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="h-48 bg-gray-900 relative">
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-600" /></div>
                )}
                
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                    item.status === 'active' ? 'bg-emerald-500/80 text-white border border-emerald-500/50' :
                    item.status === 'pending' ? 'bg-yellow-500/80 text-white border border-yellow-500/50' :
                    item.status === 'swapped' ? 'bg-blue-500/80 text-white border border-blue-500/50' :
                    'bg-red-500/80 text-white border border-red-500/50'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 truncate">{item.title}</h3>
                
                {item.status === 'rejected' && item.rejection_reason && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-400 mb-0.5">Rejected by Admin</p>
                      <p className="text-xs text-gray-300">{item.rejection_reason}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto grid grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-300 truncate">{item.category}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Item Value</p>
                    <p className="text-sm font-medium text-gray-300 truncate flex items-center gap-1">
                      <span className="text-yellow-500">🪙</span> {item.estimated_value} Credits
                    </p>
                  </div>
                </div>
                
                <Link to={`/item/${item._id}`} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white text-center py-2.5 rounded-xl text-sm font-bold transition">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
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

const AddItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    preferred_item: '',
    estimated_value: ''
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    setUploading(true);
    setError('');

    const uploadedUrls = [...images];

    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', 'salon_preset');

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dvoenforj/image/upload`,
          data
        );
        uploadedUrls.push(response.data.secure_url);
      }
      setImages(uploadedUrls);
    } catch (err) {
      console.error('Upload Error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (images.length < 3) {
      setError('Please upload at least 3 images of your item.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/items`,
        { ...formData, images },
        { withCredentials: true }
      );

      if (response.data.success) {
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-2">List an Item</h2>
        <p className="text-gray-400 mb-8">Add details and photos to offer your item for barter.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="What are you trading?" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none" placeholder="Describe the item in detail..."></textarea>
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
              <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="0" />
              <p className="text-xs text-emerald-500 mt-1"> 1 Rupee = 1 Credit. Enter a fair value!</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Item in Return</label>
              <input type="text" name="preferred_item" value={formData.preferred_item} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="What are you looking for?" />
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">Photos (Min 3, Max 5)</label>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-700">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-gray-900/80 p-1 rounded-full text-white hover:bg-red-500 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-gray-700/50 transition">
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              )}
            </div>
            {uploading && <p className="text-emerald-400 text-sm">Uploading images...</p>}
            <p className="text-xs text-gray-500">{images.length} / 5 photos uploaded</p>
          </div>

          <button type="submit" disabled={loading || uploading} className={`w-full font-bold rounded-xl px-4 py-4 transition mt-4 ${loading || uploading ? 'bg-emerald-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}>
            {loading ? 'Listing Item...' : 'List Item Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

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
        <Navbar user={user} onLogout={handleLogout} />
        
        {/* NAYA: Ye component globally check karega agar price 0 hai toh popup laayega */}
        <ZeroPriceAlert user={user} />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
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
            
            <Route path="*" element={<div className="text-white text-center mt-20 text-xl">404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;