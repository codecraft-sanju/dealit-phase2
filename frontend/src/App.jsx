import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { Package, X, AlertCircle, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';


const smartLazy = (importFunc) => {
  return lazy(() =>
    importFunc().catch((error) => {
      console.error('Chunk load error, automatically refreshing page...', error);
      window.location.reload();
      return { default: () => <div className="text-center mt-20 text-white animate-pulse">Loading latest version...</div> };
    })
  );
};
const OffersPage = smartLazy(() => import('./offer/OffersPage'));
const PromoAlert = smartLazy(() => import('./popup/PromoAlert'));
const IosInstallPopup = smartLazy(() => import('./components/IosInstallPopup'));
const DesktopLandingPage = smartLazy(() => import('./Desktop/DesktopLandingPage'));
const PrivacyPage = smartLazy(() => import('./components/PrivacyPage'));

const TermsPage = smartLazy(() => import('./components/TermsPage'));
const RefundPolicyPage = smartLazy(() => import('./components/RefundPolicyPage'));
const CancellationPolicyPage = smartLazy(() => import('./components/CancellationPolicyPage'));
const HelpSupportPage=smartLazy(()=>import('./helpandSupport/HelpSupportPage'));

const AuraPage = smartLazy(() => import('./components/AuraPage'));
const AuraLeadershipPage = smartLazy(() => import('./components/AuraLeadershipPage'));
const AuthPage = smartLazy(() => import('./components/AuthPage'));
const SearchPage = smartLazy(() => import('./components/SearchPage'));
const AdminPanel = smartLazy(() => import('./components/AdminPanel'));
const ItemDetailPage = smartLazy(() => import('./components/ItemDetailPage'));
const ChatPage = smartLazy(() => import('./components/ChatPage'));
const WalletPage = smartLazy(() => import('./components/WalletPage'));
const HomePage = smartLazy(() => import('./components/HomePage'));
const ProfilePage = smartLazy(() => import('./components/ProfilePage'));
const SwapsPage = smartLazy(() => import('./components/SwapsPage'));
const ForgotPasswordPage = smartLazy(() => import('./components/ForgotPasswordPage'));
const AddItemPage = smartLazy(() => import('./components/AddItemPage'));
const ItemsPage = smartLazy(() => import('./components/ItemsPage'));
const DashboardPage = smartLazy(() => import('./components/DashboardPage'));
const DealDetailsPage = smartLazy(() => import('./components/DealDetailsPage'));
const WishlistPage = smartLazy(() => import('./components/WishlistPage'));
const CheckoutPage = smartLazy(() => import('./components/CheckoutPage'));
const OrdersPage = smartLazy(() => import('./components/OrdersPage'));

const OrderDetailsPage = smartLazy(() => import('./components/OrderDetailsPage'));

const DeleteAccountPage = smartLazy(() => import('./components/DeleteAccountPage'));
const NotificationsPage = smartLazy(() => import('./notification/NotificationsPage'));
const EditItemPage = smartLazy(() => import('./components/EditItemPage'));

const FloatingAIAssistant = smartLazy(() => import('./ai/FloatingAIAssistant'));
const AiChatPage = smartLazy(() => import('./ai/AiChatPage'));


const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, 
      retry: 1, 
    },
  },
});



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
  const navigate = useNavigate(); 
  const [hasZeroPriceIssue, setHasZeroPriceIssue] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch((err) => {
          console.error('ServiceWorker registration failed: ', err);
        });
    }
  }, []);
  

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        if (config.url && config.url.includes(API_BASE)) {
          const token = localStorage.getItem('dealit_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          await handleLogout();
          navigate('/login', { replace: true });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [navigate, handleLogout]);


  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // NEW: Catch native Expo Push Token from React Native WebView
  useEffect(() => {
    const handleMessage = async (event) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        if (data.type === 'EXPO_PUSH_TOKEN' && data.token && user) {
          console.log("Received Expo token from native app, saving to backend...");
          await axios.post(`${API_URL}/notifications/subscribe`, {
            endpoint: data.token,
            type: 'expo', 
            keys: null // Expo doesn't use p256dh/auth keys
          }, { withCredentials: true });
        }
      } catch (error) {
        // Ignore JSON parse errors from non-app messages
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // For some Android WebViews

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, [user]); // Re-run if user logs in to attach token to the correct user

  // NEW: Catch Route Changes from React Native (When notification is clicked)
  useEffect(() => {
    const handleRouteMessage = (event) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        if (data.type === 'ROUTE_CHANGE' && data.url) {
          console.log(`Native app requested route change to: ${data.url}`);
          navigate(data.url);
        }
      } catch (e) {
         // ignore
      }
    };

    window.addEventListener('message', handleRouteMessage);
    document.addEventListener('message', handleRouteMessage);
    
    return () => {
      window.removeEventListener('message', handleRouteMessage);
      document.removeEventListener('message', handleRouteMessage);
    }
  }, [navigate]);

  const isAiChatRoute = location.pathname.startsWith('/ai-chat');
  const hideNavbarRoutes = ['/login', '/signup', '/forgot-password'];
  const shouldShowBottomNav = !hideNavbarRoutes.includes(location.pathname) && !location.pathname.startsWith('/admin') && !isAiChatRoute;
  

  const publicDesktopRoutes = ['/login', '/privacy', '/terms', '/refund-policy', '/cancellation-policy'];

  if (isDesktop && !location.pathname.startsWith('/admin') && !publicDesktopRoutes.includes(location.pathname) && !isAiChatRoute) {
    return (
      <Suspense fallback={<PremiumLoader />}>
        {user && <FloatingAIAssistant user={user} />}
        <DesktopLandingPage user={user} />
      </Suspense>
    );
  }


  return (
    <div className={`min-h-screen bg-gray-900 font-sans selection:bg-emerald-500/30 ${shouldShowBottomNav ? 'pb-16 md:pb-0' : ''}`}> 
      <ZeroPriceAlert user={user} onCheckComplete={setHasZeroPriceIssue} />
      
      <Suspense fallback={null}>
        
        <PromoAlert user={user} setUser={setUser} hasZeroPriceIssue={hasZeroPriceIssue} />
        <IosInstallPopup />
      </Suspense>
      
      <main>
        <Suspense fallback={<PremiumLoader />}>
          
          {user && !isAiChatRoute && <FloatingAIAssistant user={user} />}
          
          
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
          
          
            <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
            
          
            <Route path="/dashboard" element={user ? <DashboardPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            
            <Route path="/edit-item/:id" element={user ? <EditItemPage /> : <Navigate to="/login" />} />
            <Route path="/wishlist" element={user ? <WishlistPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
    <Route path="/offers" element={user ? <OffersPage user={user} /> : <Navigate to="/login" />} /> 

          <Route 
  path="/admin" 
  element={
    <Suspense fallback={<PremiumLoader />}>
      <AdminPanel user={user} />
    </Suspense>
  } 
/>
            <Route path="/checkout/:itemId" element={user ? <CheckoutPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            
          
            <Route path="/orders" element={user ? <OrdersPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/order/:orderId" element={user ? <OrderDetailsPage user={user} /> : <Navigate to="/login" />} />
            
            
            <Route path="/add-item" element={user ? <AddItemPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/delete-account" element={user ? <DeleteAccountPage user={user} /> : <Navigate to="/login" />} />
            
            <Route path="/item/:id" element={
              <>
                <Navbar user={user} onLogout={handleLogout} />
                <ItemDetailPage user={user} />
              </>
            } />
            <Route path="/aura" element={user ? <AuraPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/aura-leadership" element={user ? <AuraLeadershipPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/swaps" element={user ? <SwapsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/chat/:barterId" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={user ? <WalletPage user={user} setUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/deal/:id" element={user ? <DealDetailsPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/login" />} />
            <Route path="/help-support" element={user ? <HelpSupportPage /> : <Navigate to="/login" />} />
            <Route path="/ai-chat" element={user ? <AiChatPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/ai-chat/:sessionId" element={user ? <AiChatPage user={user} /> : <Navigate to="/login" />} />
            
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

  
  const handleLogout = useCallback(async () => {
    try {
      
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            
            await axios.post(`${API_URL}/notifications/unsubscribe`, { endpoint: subscription.endpoint }, { withCredentials: true });
          
            await subscription.unsubscribe();
          }
        } catch (pushErr) {
          console.error('Error clearing push subscription on logout:', pushErr);
        }
      }
    

      await axios.post(`${API_URL}/users/logout`, {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem('dealit_user');
      localStorage.removeItem('dealit_token'); 
      
      queryClient.clear(); 
      
     
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT_REQUEST' }));
      }
    

    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <MainAppContent user={user} handleLogout={handleLogout} setUser={setUser} />
        </Router>
        <ToastContainer />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;