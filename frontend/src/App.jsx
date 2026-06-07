import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { Package, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from 'react-ga4';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';


const TRACKING_ID = "G-1FKF92TWCE";
ReactGA.initialize(TRACKING_ID);


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
const HelpSupportPage = smartLazy(()=>import('./helpandSupport/HelpSupportPage'));

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
const RecentlyViewedPage = smartLazy(() => import('./components/RecentlyViewedPage'));

const CompleteProfilePopup = smartLazy(() => import('./components/CompleteProfilePopup'));

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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);


useEffect(() => {
  ReactGA.send({ 
    hitType: "pageview", 
    page: location.pathname + location.search,
    title: document.title 
  });
}, [location]);


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
      
      <Suspense fallback={null}>
        <CompleteProfilePopup user={user} setUser={setUser} />

        <PromoAlert user={user} setUser={setUser} />
        <IosInstallPopup />
      </Suspense>
      
      <main>
        <Suspense fallback={<PremiumLoader />}>
          {user && !isAiChatRoute && <FloatingAIAssistant user={user} />}
          <Routes>
            <Route path="/" element={
              user ? (
                <>
                  <Navbar user={user} onLogout={handleLogout} />
                  <HomePage user={user} setUser={setUser}/>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
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
            <Route path="/recently-viewed" element={<RecentlyViewedPage />} />
            
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
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <MainAppContent user={user} handleLogout={handleLogout} setUser={setUser} />
          </Router>
          <ToastContainer />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;