import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { Package, X, AlertCircle, ArrowLeft, Edit2, Trash2, Gift, Sparkles, Coins, Plus } from 'lucide-react';
import axios from 'axios';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <-- Import already added by you

import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import IosInstallPopup from './components/IosInstallPopup';

const DesktopLandingPage = lazy(() => import('./Desktop/DesktopLandingPage'));

const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const ItemDetailPage = lazy(() => import('./components/ItemDetailPage'));
const ChatPage = lazy(() => import('./components/ChatPage'));
const WalletPage = lazy(() => import('./components/WalletPage'));
const HomePage = lazy(() => import('./components/HomePage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const SwapsPage = lazy(() => import('./components/SwapsPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const AddItemPage = lazy(() => import('./components/AddItemPage'));
const ItemsPage = lazy(() => import('./components/ItemsPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const DealDetailsPage = lazy(() => import('./components/DealDetailsPage'));
const WishlistPage = lazy(() => import('./components/WishlistPage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const DeleteAccountPage = lazy(() => import('./components/DeleteAccountPage'));
const NotificationsPage = lazy(() => import('./notification/NotificationsPage'));

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// <-- NAYA CHANGE: Initialize QueryClient here outside the component -->
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Window focus karne par bar-bar refetch nahi karega
      retry: 1, // Fail hone par sirf 1 baar retry karega
    },
  },
});

axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.includes(API_BASE)) {
      const token = localStorage.getItem('dealit_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ZeroPriceAlert = ({ user, onCheckComplete }) => {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!user || hasChecked) return;

    const checkItems = async () => {
      try {
        const res = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
        const needsUpdate = res.data.data.some(item => !item.estimated_value || item.estimated_value === 0);
        
        if (needsUpdate) {
          setShow(true);
          onCheckComplete(true);
        } else {
          onCheckComplete(false);
        }
        setHasChecked(true); 
      } catch (error) {
        console.error('Error checking item prices:', error);
        onCheckComplete(false);
      }
    };
    
    if (!location.pathname.includes('/dashboard') && !location.pathname.includes('/edit-item')) {
       checkItems();
    } else {
       onCheckComplete(false);
    }
  }, [user, hasChecked, location.pathname, onCheckComplete]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'} duration-300`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-900 border border-purple-500/50 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(163,136,225,0.2)] relative overflow-hidden transform ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-8' : 'animate-in zoom-in-95 slide-in-from-bottom-8'} duration-300`}
      >
        
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[3rem] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[3rem] pointer-events-none"></div>

        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2.5 bg-gray-800 hover:bg-gray-700 rounded-full z-20"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20 shadow-[0_0_30px_rgba(163,136,225,0.3)] transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <AlertCircle className="w-10 h-10 text-purple-500" />
          </div>
          
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Action Required!</h3>
          
          <div className="text-gray-400 text-sm mb-8 space-y-4">
            <p>
              Some of your listed items have a value of <strong className="text-purple-400">0 Credits</strong>. Please update their prices so others can make fair trade offers.
            </p>
            
            <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700 text-left flex gap-3">
              <Package className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="text-emerald-400 font-bold tracking-wide uppercase">Tip:</span> Please also check your item <strong className="text-white">Categories</strong>. Selecting the correct category helps your item sell faster!
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              handleClose();
              setTimeout(() => navigate('/dashboard'), 300);
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-black text-lg py-4 px-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            <Edit2 className="w-5 h-5" /> Update My Items
          </button>
        </div>
      </div>
    </div>
  );
};

const PromoAlert = ({ user, hasZeroPriceIssue }) => {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkPromoEligibility = async () => {
      if (!user) return;
      if (hasZeroPriceIssue !== false) return; 
      if (location.pathname.includes('/login') || location.pathname.includes('/signup')) return;

      const promoShown = sessionStorage.getItem('promo_shown');
      if (promoShown === 'true') return;

      if ((user.listedProductsCount || 0) >= 2) return;

      try {
        const res = await axios.get(`${API_URL}/admin/public-settings`);
        
        let finalSettings = {
          isCreditSystemEnabled: true,
          creditsPerListing: 50,
          isReferralSystemEnabled: true,
          referralRewardCredits: 40
        };

        if (res.data.success && res.data.data) {
          const fetchedSettings = res.data.data;
          finalSettings = {
            isCreditSystemEnabled: fetchedSettings.isCreditSystemEnabled ?? true,
            creditsPerListing: fetchedSettings.creditsPerListing || 50,
            isReferralSystemEnabled: fetchedSettings.isReferralSystemEnabled ?? true,
            referralRewardCredits: fetchedSettings.referralRewardCredits || 40
          };
        }

        if (!finalSettings.isCreditSystemEnabled && !finalSettings.isReferralSystemEnabled) {
          return;
        }

        setSettings(finalSettings);
        setShow(true);
        sessionStorage.setItem('promo_shown', 'true'); 
      } catch (err) {
        console.error("Failed to load promo settings, using defaults");
        setSettings({
          isCreditSystemEnabled: true,
          creditsPerListing: 50,
          isReferralSystemEnabled: true,
          referralRewardCredits: 40
        });
        setShow(true);
        sessionStorage.setItem('promo_shown', 'true');
      }
    };

    if (hasZeroPriceIssue === false) {
      const timer = setTimeout(checkPromoEligibility, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasZeroPriceIssue, location.pathname]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
    }, 300);
  };

  if (!show || !settings) return null;
  if (!settings.isCreditSystemEnabled && !settings.isReferralSystemEnabled) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'} duration-300`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-gradient-to-b from-gray-800 to-gray-900 border border-emerald-500/30 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(16,185,129,0.2)] relative overflow-hidden transform ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-8' : 'animate-in zoom-in-95 slide-in-from-bottom-8'} duration-300`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[3rem] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[3rem] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full z-20 border border-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Gift className="w-10 h-10 text-white" />
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
          </div>

          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Earn Free Credits!</h3>
          <p className="text-gray-400 text-sm mb-6">Kickstart your trading journey on Dealit with these exclusive rewards.</p>

          <div className="space-y-3 mb-8">
            
            {settings.isCreditSystemEnabled && (
              <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex items-center gap-4 text-left shadow-inner">
                <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">List an Item</p>
                  <p className="text-gray-400 text-xs mt-0.5">Get <strong className="text-blue-400">{settings.creditsPerListing} credits</strong> when approved</p>
                </div>
              </div>
            )}

            {settings.isReferralSystemEnabled && (
              <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex items-center gap-4 text-left shadow-inner">
                <div className="bg-yellow-500/20 p-2.5 rounded-xl border border-yellow-500/30 shrink-0">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Refer Friends</p>
                  <p className="text-gray-400 text-xs mt-0.5">Earn <strong className="text-yellow-400">{settings.referralRewardCredits} credits</strong> per referral</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              handleClose();
              setTimeout(() => navigate('/add-item'), 300);
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg py-4 px-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" /> List First Item Now
          </button>
        </div>
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

const PremiumLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen pb-20 bg-[#090714]">
    <div className="relative flex items-center justify-center w-24 h-24 mb-6">
      <div className="absolute inset-0 border-4 border-[#A388E1]/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-[#A388E1] border-r-[#FFE28A] rounded-full animate-spin"></div>
      <div className="bg-gray-800 p-4 rounded-full shadow-[0_0_20px_rgba(163,136,225,0.3)] z-10">
        <Package className="w-8 h-8 text-[#A388E1] animate-pulse" />
      </div>
    </div>
    <h2 className="text-xl font-bold text-white tracking-wide mb-2">Dealit</h2>
  </div>
);

const MainAppContent = ({ user, handleLogout, setUser }) => {
  const location = useLocation();
  const [hasZeroPriceIssue, setHasZeroPriceIssue] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  // <-- SCREEN RESIZE LISTENER -->
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hideNavbarRoutes = ['/login', '/signup', '/forgot-password'];
  const shouldShowBottomNav = !hideNavbarRoutes.includes(location.pathname) && !location.pathname.startsWith('/admin');

  // <-- SMART ROUTING LOGIC: Desktop par Landing Page dikhao jab tak route admin ya login na ho -->
  if (isDesktop && !location.pathname.startsWith('/admin') && location.pathname !== '/login') {
    return (
      <Suspense fallback={<PremiumLoader />}>
        <DesktopLandingPage user={user} />
      </Suspense>
    );
  }

  // Mobile App or Desktop Admin/Login View
  return (
    <div className={`min-h-screen bg-gray-900 font-sans selection:bg-emerald-500/30 ${shouldShowBottomNav ? 'pb-16 md:pb-0' : ''}`}> 
      <ZeroPriceAlert user={user} onCheckComplete={setHasZeroPriceIssue} />
      <PromoAlert user={user} hasZeroPriceIssue={hasZeroPriceIssue} />
      <IosInstallPopup />
      
      <main>
        <Suspense fallback={<PremiumLoader />}>
          <Routes>
            <Route path="/" element={
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <HomePage user={user} setUser={setUser}/>
              </>
            } />
            
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage defaultMode="login" setUser={setUser} />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <AuthPage defaultMode="signup" setUser={setUser} />} />
            <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage setUser={setUser} />} />
          
            <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/edit-item/:id" element={user ? <EditItemPage /> : <Navigate to="/login" />} />
            <Route path="/wishlist" element={user ? <WishlistPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/admin" element={<AdminPanel user={user} />} />
            <Route path="/checkout/:itemId" element={user ? <CheckoutPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/orders" element={user ? <OrdersPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/add-item" element={user ? <AddItemPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/delete-account" element={user ? <DeleteAccountPage user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/item/:id" element={
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <ItemDetailPage user={user} />
              </>
            } />
            
            <Route path="/swaps" element={user ? <SwapsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/chat/:barterId" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={user ? <WalletPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/deal/:id" element={user ? <DealDetailsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<div className="text-white text-center mt-20 text-xl">404 - Page Not Found</div>} />
          </Routes>
        </Suspense>
      </main>
      {shouldShowBottomNav && <BottomNav user={user} />}
      
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
      localStorage.removeItem('dealit_token'); 
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    // <-- NAYA CHANGE: Wrapped the entire app in QueryClientProvider -->
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainAppContent user={user} handleLogout={handleLogout} setUser={setUser} />
      </Router>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;