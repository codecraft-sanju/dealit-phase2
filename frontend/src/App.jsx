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






















// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { RefreshCcw, ShoppingCart, Wallet, ShieldCheck, Menu, X, ArrowRight, Check } from "lucide-react";

// export default function App() {
//   const [timeLeft, setTimeLeft] = useState({
//     days: 0,
//     hours: 0,
//     minutes: 0,
//     seconds: 0,
//   });
  
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [email, setEmail] = useState("");
//   const [isSubscribed, setIsSubscribed] = useState(false);

//   useEffect(() => {
//     const targetDate = new Date("2026-06-01T12:00:00+05:30").getTime();

//     const interval = setInterval(() => {
//       const now = new Date().getTime();
//       const distance = targetDate - now;

//       if (distance > 0) {
//         setTimeLeft({
//           days: Math.floor(distance / (1000 * 60 * 60 * 24)),
//           hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
//           minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
//           seconds: Math.floor((distance % (1000 * 60)) / 1000),
//         });
//       } else {
//         clearInterval(interval);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   const scrollToSection = (id) => {
//     setIsMenuOpen(false);
//     setTimeout(() => {
//       const element = document.getElementById(id);
//       if (element) {
//         element.scrollIntoView({ behavior: 'smooth' });
//       }
//     }, 150);
//   };

//   const handleSubscribe = (e) => {
//     e.preventDefault();
//     if (email) {
//       setIsSubscribed(true);
//       setEmail("");
//     }
//   };

//   return (
//     <div className="relative min-h-screen w-full bg-[#0a0514] overflow-x-hidden font-sans text-white selection:bg-purple-500 selection:text-white scroll-smooth">
      
//       <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-700/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-0" />
//       <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-700/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none z-0" />

//       <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0514]/80 backdrop-blur-xl border-b border-white/10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-20">
//             <motion.div 
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               className="flex items-center gap-2 cursor-pointer"
//               onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//             >
//               <img src="/logo.png" alt="Dealit Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
//               <span className="text-2xl font-extrabold tracking-tight text-white">Dealit</span>
//             </motion.div>

//             <div className="hidden md:flex items-center gap-8">
//               <motion.button whileHover={{ scale: 1.05, color: "#fff" }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-300 transition-colors">Features</motion.button>
//               <motion.button whileHover={{ scale: 1.05, color: "#fff" }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-300 transition-colors">How it Works</motion.button>
//               <motion.button whileHover={{ scale: 1.05, color: "#fff" }} whileTap={{ scale: 0.95 }} onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-300 transition-colors">Contact</motion.button>
//               <motion.a 
//                 whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
//                 whileTap={{ scale: 0.95 }}
//                 href="mailto:dealit.info@gmail.com" 
//                 className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold transition-colors"
//               >
//                 Partner with us
//               </motion.a>
//             </div>

//             <div className="md:hidden flex items-center">
//               <motion.button 
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//                 className="text-gray-300 hover:text-white p-2 focus:outline-none"
//               >
//                 {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//               </motion.button>
//             </div>
//           </div>
//         </div>

//         <AnimatePresence>
//           {isMenuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               className="md:hidden bg-[#0a0514] border-b border-white/10 overflow-hidden"
//             >
//               <div className="px-4 pt-2 pb-6 flex flex-col gap-4">
//                 <button onClick={() => scrollToSection('features')} className="text-base font-medium text-gray-300 text-left py-2">Features</button>
//                 <button onClick={() => scrollToSection('how-it-works')} className="text-base font-medium text-gray-300 text-left py-2">How it Works</button>
//                 <button onClick={() => scrollToSection('contact')} className="text-base font-medium text-gray-300 text-left py-2">Contact</button>
//                 <a href="mailto:dealit.info@gmail.com" className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-sm font-semibold text-center block">
//                   Partner with us
//                 </a>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </nav>

//       <main className="relative z-10 pt-32 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           whileHover={{ scale: 1.05, y: -2 }}
//           transition={{ duration: 0.4 }}
//           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-purple-500/30 mb-8 cursor-pointer hover:bg-white/10 transition-colors"
//         >
//           <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
//           <span className="text-xs sm:text-sm font-medium text-purple-200">Phase 2 Launching Soon</span>
//         </motion.div>

//         <motion.h1 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, delay: 0.1 }}
//           className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1]"
//         >
//           India's Smartest <br />
//           <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-blue-400">
//             Exchange Marketplace
//           </span>
//         </motion.h1>

//         <motion.p 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.7, delay: 0.2 }}
//           className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl"
//         >
//           Barter. Order. Save. All in One Wallet. Join the revolution of smart exchanging and get free credits when we go live.
//         </motion.p>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 w-full max-w-4xl">
//           {Object.entries(timeLeft).map(([unit, value], index) => (
//             <motion.div
//               key={unit}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               whileHover={{ y: -8, scale: 1.02, borderColor: "rgba(168,85,247,0.5)" }}
//               transition={{ 
//                 delay: 0.4 + index * 0.1, 
//                 duration: 0.5,
//                 whileHover: { duration: 0.2 } 
//               }}
//               className="flex flex-col items-center justify-center bg-[#150a28]/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-colors cursor-default"
//             >
//               <span className="text-5xl md:text-7xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300">
//                 {value.toString().padStart(2, "0")}
//               </span>
//               <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-purple-300 mt-3 font-semibold">
//                 {unit}
//               </span>
//             </motion.div>
//           ))}
//         </div>

//         <motion.div
//           id="contact"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.8, duration: 0.5 }}
//           className="w-full max-w-md mx-auto mb-20 scroll-mt-32"
//         >
//           {isSubscribed ? (
//             <motion.div 
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               className="flex items-center justify-center gap-3 px-6 py-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-300 font-medium"
//             >
//               <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
//                 <Check size={18} className="text-purple-400" />
//               </div>
//               Awesome! We'll notify you on launch.
//             </motion.div>
//           ) : (
//             <form onSubmit={handleSubscribe} className="relative flex items-center w-full group">
//               <input 
//                 type="email" 
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Enter your email address" 
//                 required
//                 className="w-full bg-[#150a28]/60 backdrop-blur-md border border-white/10 text-white placeholder-gray-400 px-6 py-4 rounded-full outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all pr-40"
//               />
//               <motion.button 
//                 type="submit" 
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="absolute right-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-2"
//               >
//                 Notify Me
//                 <motion.div
//                   initial={{ x: 0 }}
//                   whileHover={{ x: 3 }}
//                   transition={{ type: "spring", stiffness: 400 }}
//                 >
//                   <ArrowRight size={16} />
//                 </motion.div>
//               </motion.button>
//             </form>
//           )}
//         </motion.div>

//         <motion.div 
//           id="how-it-works"
//           initial={{ opacity: 0 }}
//           whileInView={{ opacity: 1 }}
//           viewport={{ once: true, margin: "-100px" }}
//           transition={{ duration: 0.8 }}
//           className="w-full max-w-5xl mb-20 scroll-mt-24"
//         >
//           <div className="flex flex-col items-center mb-12">
//             <span className="text-purple-400 font-semibold tracking-wider uppercase text-sm mb-2">Process</span>
//             <h2 className="text-3xl md:text-4xl font-bold text-white/90">How Dealit Works</h2>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
//             <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -translate-y-1/2 z-0" />
            
//             {[
//               { num: 1, title: "List an Item", desc: "Upload details of unused products you want to exchange or sell.", color: "purple" },
//               { num: 2, title: "Find a Match", desc: "Browse categories or use smart matching to find exactly what you need.", color: "blue" },
//               { num: 3, title: "Barter or Buy", desc: "Exchange directly or use Dealit wallet credits to complete the order securely.", color: "purple" }
//             ].map((step, index) => (
//               <motion.div 
//                 key={index}
//                 whileHover={{ y: -5 }}
//                 className="relative z-10 flex flex-col items-center p-6 bg-[#0a0514] rounded-2xl group cursor-default"
//               >
//                 <motion.div 
//                   className={`w-16 h-16 bg-[#150a28] border ${step.color === 'purple' ? 'border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]'} rounded-full flex items-center justify-center text-2xl font-black mb-6 transition-colors`}
//                   whileHover={{ scale: 1.1, rotate: 5 }}
//                 >
//                   {step.num}
//                 </motion.div>
//                 <h3 className="text-xl font-bold mb-3">{step.title}</h3>
//                 <p className="text-sm text-gray-400 text-center">{step.desc}</p>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>

//         <motion.div 
//           id="features"
//           initial={{ opacity: 0 }}
//           whileInView={{ opacity: 1 }}
//           viewport={{ once: true, margin: "-100px" }}
//           transition={{ duration: 0.8 }}
//           className="w-full max-w-6xl scroll-mt-24"
//         >
//           <div className="flex flex-col items-center mb-12">
//             <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm mb-2">Features</span>
//             <h2 className="text-3xl md:text-4xl font-bold text-white/90">Everything you need in one app</h2>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
//             <motion.div 
//               whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.08)" }}
//               className="bg-white/5 border border-white/10 p-6 rounded-3xl transition-colors group cursor-default"
//             >
//               <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
//                 <RefreshCcw size={24} className="text-purple-400" />
//               </div>
//               <h3 className="text-xl font-bold mb-3">Barter System</h3>
//               <p className="text-sm text-gray-400 leading-relaxed">Exchange your unused items directly with other users. Smart matching makes finding the right deal effortless.</p>
//             </motion.div>

//             <motion.div 
//               whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.08)" }}
//               className="bg-white/5 border border-white/10 p-6 rounded-3xl transition-colors group cursor-default"
//             >
//               <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
//                 <ShoppingCart size={24} className="text-blue-400" />
//               </div>
//               <h3 className="text-xl font-bold mb-3">Order with Credits</h3>
//               <p className="text-sm text-gray-400 leading-relaxed">Don't have an item to exchange? Use your Dealit credits to buy what you want instantly.</p>
//             </motion.div>

//             <motion.div 
//               whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.08)" }}
//               className="bg-white/5 border border-white/10 p-6 rounded-3xl transition-colors group cursor-default"
//             >
//               <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
//                 <Wallet size={24} className="text-purple-400" />
//               </div>
//               <h3 className="text-xl font-bold mb-3">Secure Wallet</h3>
//               <p className="text-sm text-gray-400 leading-relaxed">Manage your credits and transactions safely. Every new user gets free credits to start their journey.</p>
//             </motion.div>

//             <motion.div 
//               whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.08)" }}
//               className="bg-white/5 border border-white/10 p-6 rounded-3xl transition-colors group cursor-default"
//             >
//               <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
//                 <ShieldCheck size={24} className="text-blue-400" />
//               </div>
//               <h3 className="text-xl font-bold mb-3">100% Secure</h3>
//               <p className="text-sm text-gray-400 leading-relaxed">Verified profiles, safe pickups, and secure payments ensure your peace of mind on every transaction.</p>
//             </motion.div>
//           </div>
//         </motion.div>

//       </main>

//       <footer className="relative z-10 border-t border-white/10 bg-[#0a0514]/50 py-8 text-center mt-10 flex flex-col items-center">
//         <motion.img 
//           whileHover={{ opacity: 0.8, scale: 1.1 }}
//           src="/logo.png" 
//           alt="Dealit Logo" 
//           className="w-8 h-8 opacity-50 mb-4 grayscale hover:grayscale-0 transition-all cursor-pointer" 
//         />
//         <p className="text-sm text-gray-500">© 2026 Dealit. All rights reserved. Launching in India.</p>
//       </footer>
      
//     </div>
//   );
// }