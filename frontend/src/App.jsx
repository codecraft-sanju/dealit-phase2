import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Home, Package, MessageSquare, User, LogIn, PlusCircle, Search, LogOut, ArrowLeft, Shield, UploadCloud, RefreshCw, Eye, X, AlertCircle, Phone, MapPin, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import AdminPanel from './components/AdminPanel'; // Make sure this path is correct based on your folder structure
import ItemDetailPage from './components/ItemDetailPage';

// CHANGES MADE HERE: Imported ChatPage component
import ChatPage from './components/ChatPage';

const API_URL = 'http://localhost:5000/api';

// --- COMPONENTS ---

const Navbar = ({ user }) => {
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
              <Link to="/swaps" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
                <RefreshCw className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Swaps</span>
              </Link>
              <Link to="/messages" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1">
                <MessageSquare className="w-5 h-5" /> <span className="hidden sm:block text-sm font-medium">Chat</span>
              </Link>
              
              {/* CHANGED: Dashboard ki jagah seedha Profile link */}
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

// NAYA: PROFILE PAGE COMPONENT
const ProfilePage = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400 text-lg">Manage your account and items here.</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold transition border border-red-500/20"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 animate-pulse py-10 font-medium">Loading profile details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Details Card */}
          <div className="md:col-span-2 bg-gray-800 rounded-3xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 h-24"></div>
            <div className="px-8 pb-8 relative">
              <div className="w-24 h-24 bg-gray-900 border-4 border-gray-800 rounded-full flex items-center justify-center absolute -top-12 shadow-lg">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="pt-16">
                <h2 className="text-2xl font-bold text-white">{profileData?.full_name}</h2>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-md mt-2 border border-emerald-500/20">
                  {profileData?.role}
                </span>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email Address</p>
                      <p className="font-medium">{profileData?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                      <p className="font-medium">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-medium capitalize">{profileData?.city || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Member Since</p>
                      <p className="font-medium">{new Date(profileData?.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="flex flex-col gap-6">
            <Link to="/dashboard" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-emerald-500/50 transition group flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition border border-emerald-500/20">
                <Package className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">My Items</h3>
              <p className="text-sm text-gray-400">View, edit, or check the status of your listed items.</p>
            </Link>
            
            <Link to="/swaps" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-[#f97316]/50 transition group flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition border border-[#f97316]/20">
                <RefreshCw className="w-8 h-8 text-[#f97316]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#f97316] transition">My Swaps</h3>
              <p className="text-sm text-gray-400">Check incoming requests and track your ongoing trades.</p>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_URL}/items`);
        setItems(response.data.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Latest on Dealit</h1>
        <p className="text-gray-400">Discover items up for trade in your community.</p>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 mt-20 animate-pulse font-medium">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 mt-20 bg-gray-800 py-10 rounded-xl border border-gray-700">
          No items available right now. Be the first to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition duration-300 group flex flex-col">
              <Link to={`/item/${item._id}`} className="block h-48 overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer">
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <Package className="w-12 h-12 text-gray-600" />
                )}
              </Link>
              <div className="p-5 flex-1 flex flex-col">
                <Link to={`/item/${item._id}`} className="flex justify-between items-start mb-2 hover:text-emerald-400 transition">
                  <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">{item.title}</h3>
                </Link>
                <div className="mt-auto">
                  <p className="text-xs text-gray-400 mb-3 inline-block bg-gray-700 px-2 py-1 rounded">Condition: {item.condition || 'Not specified'}</p>
                  <div className="pt-3 pb-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Looking for:</p>
                    <p className="text-sm font-medium text-emerald-400 truncate">{item.preferred_item || 'Open to offers'}</p>
                  </div>
                  <Link to={`/item/${item._id}`} className="w-full bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/50 transition py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Swap Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ user }) => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
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
    fetchMyItems();
  }, []);

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
            <div key={item._id} className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col hover:border-gray-600 transition shadow-xl">
              <div className="h-48 bg-gray-900 relative">
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-600" /></div>
                )}
                
                {/* STATUS BADGE */}
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
                
                {/* Rejection Reason */}
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
                    <p className="text-xs text-gray-500 mb-1">Est. Value</p>
                    <p className="text-sm font-medium text-gray-300 truncate">₹{item.estimated_value}</p>
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

const SwapsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/login" />;

 useEffect(() => {
    const fetchSwaps = async () => {
      setLoading(true);
      try {
        const endpoint = activeTab === 'received' ? `${API_URL}/barter/received` : `${API_URL}/barter/sent`;
        const response = await axios.get(endpoint, { withCredentials: true });
        setSwaps(response.data.data || []);
      } catch (error) {
        console.error('Error fetching swaps:', error);
        setSwaps([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSwaps();
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Swaps & DMs 💅</h1>
        <p className="text-gray-400 text-lg">Slide into these trades fr fr 🚀</p>
      </div>

      <div className="flex bg-gray-900 rounded-2xl p-1 mb-8 w-fit border border-gray-800">
        <button 
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'received' ? 'bg-[#f97316] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Vibes Received 📩 ({activeTab === 'received' ? swaps.length : '0'})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'sent' ? 'bg-[#f97316] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Vibes Sent 📤 ({activeTab === 'sent' ? swaps.length : '0'})
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-emerald-400 py-10 animate-pulse font-medium">Loading your vibes...</div>
        ) : swaps.length === 0 ? (
          <div className="text-center bg-gray-800 border border-gray-700 rounded-3xl py-16 px-6">
            <p className="text-gray-400 text-lg">No trades here yet. Go send some vibes! 🌬️</p>
          </div>
        ) : (
          swaps.map((swap) => (
            <div key={swap._id} className="bg-[#1f2125] border border-gray-800 rounded-2xl p-6">
              {/* CHANGES MADE HERE: Added flex layout to place the Chat button next to request info */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">Request #{swap._id.substring(0, 8)}</span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    swap.status === 'GHOSTING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                    swap.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {swap.status} {swap.status === 'GHOSTING' && '👻'}
                  </span>
                </div>
                
                {/* CHANGES MADE HERE: Added the Chat Button Link */}
                <Link to={`/chat/${swap._id}`} className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-emerald-500/30">
                  <MessageSquare className="w-4 h-4" /> Chat
                </Link>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full bg-[#181a1d] rounded-2xl p-5 border border-gray-800/50">
                  <p className="text-xs text-gray-500 font-bold tracking-widest mb-4">THEY HAVE</p>
                  <div className="flex items-center gap-4">
                    {swap.requestedItem?.images && swap.requestedItem.images.length > 0 && swap.requestedItem.images[0] ? (
                       <img src={swap.requestedItem.images[0]} alt="Item" className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
                    ) : (
                       <div className="w-20 h-20 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center"><Package className="w-8 h-8 text-gray-600"/></div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{swap.requestedItem?.title || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-400 mb-2">{swap.requestedItem?.condition || 'N/A'}</p>
                      <button className="text-[#f97316] text-sm font-medium flex items-center gap-1 hover:underline">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-shrink-0 items-center justify-center p-3 bg-gray-800 rounded-full border border-gray-700">
                  <RefreshCw className="w-6 h-6 text-gray-400" />
                </div>

                <div className="flex-1 w-full bg-[#181a1d] rounded-2xl p-5 border border-gray-800/50">
                  <p className="text-xs text-gray-500 font-bold tracking-widest mb-4">YOU OFFER</p>
                  <div className="flex items-center gap-4">
                    {swap.offeredItem?.images && swap.offeredItem.images.length > 0 && swap.offeredItem.images[0] ? (
                       <img src={swap.offeredItem.images[0]} alt="Item" className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
                    ) : (
                       <div className="w-20 h-20 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center"><Package className="w-8 h-8 text-gray-600"/></div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">{swap.offeredItem?.title || 'Unknown Item'}</h3>
                      <button className="text-[#f97316] text-sm font-medium flex items-center gap-1 hover:underline">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Value (₹)</label>
              <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="0" />
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
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />
            <Route path="/signup" element={<SignupPage setUser={setUser} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage setUser={setUser} />} />
            
            <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/add-item" element={user ? <AddItemPage /> : <Navigate to="/login" />} />
            <Route path="/item/:id" element={<ItemDetailPage user={user} />} />
            <Route path="/swaps" element={user ? <SwapsPage user={user} /> : <Navigate to="/login" />} />

            {/* CHANGES MADE HERE: Added ChatPage Route */}
            <Route path="/chat/:barterId" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<div className="text-white text-center mt-20 text-xl">404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;