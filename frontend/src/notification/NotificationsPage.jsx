import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Zap,
  RefreshCw,
  Coins,
  Sparkles,
  Package,
  ShoppingBag,
  Info,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_BACKEND_API + '/api';

const NotificationsShimmer = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0"></div>
          <div className="flex-1 pr-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
            <div className="flex justify-between items-center">
              <div className="h-2.5 bg-gray-200 rounded w-1/4"></div>
              {i % 2 === 0 && <div className="h-4 bg-gray-200 rounded-md w-12"></div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const observerTarget = useRef(null);
  const navigate = useNavigate();

  // --> Push Notification Logic
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const showToast = (text, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const mobileToken = localStorage.getItem('dealit_mobile_token');
    if (mobileToken) {
      const isMobilePushEnabled = localStorage.getItem('dealit_push_enabled') === 'true';
      setIsPushEnabled(isMobilePushEnabled);
    } else if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsPushEnabled(!!subscription);
        });
      });
    }
    
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { 
      outputArray[i] = rawData.charCodeAt(i); 
    }
    return outputArray;
  };

  const handlePushToggle = async () => {
    const mobileToken = localStorage.getItem('dealit_mobile_token');
    const previousState = isPushEnabled;
    setIsPushEnabled(!previousState); 

    try {
      if (mobileToken) {
        if (previousState) {
          await axios.post(`${API_URL}/notifications/unsubscribe`, { type: 'expo', token: mobileToken }, { withCredentials: true });
          localStorage.setItem('dealit_push_enabled', 'false');
          showToast('Push Alerts Disabled', 'off');
        } else {
          await axios.post(`${API_URL}/notifications/subscribe`, { type: 'expo', token: mobileToken }, { withCredentials: true });
          localStorage.setItem('dealit_push_enabled', 'true');
          showToast('Push Alerts Enabled', 'on');
        }
        return; 
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('Not supported on this browser', 'error');
        setIsPushEnabled(previousState);
        return;
      }
      
      if (!publicVapidKey) {
        showToast('Configuration missing', 'error');
        console.error("VITE_VAPID_PUBLIC_KEY is not defined");
        setIsPushEnabled(previousState);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (previousState) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await axios.post(`${API_URL}/notifications/unsubscribe`, { type: 'web', endpoint: subscription.endpoint }, { withCredentials: true });
        }
        showToast('Push Alerts Disabled', 'off');
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          const subData = subscription.toJSON();
          await axios.post(`${API_URL}/notifications/subscribe`, { type: 'web', ...subData }, { withCredentials: true });
          showToast('Push Alerts Enabled', 'on');
        } else {
          showToast('Permission Denied', 'error');
          setIsPushEnabled(false);
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      showToast('Action Failed', 'error');
      setIsPushEnabled(previousState); 
    }
  };

  // <-- Fetching notifications -->
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(`${API_URL}/notifications?page=${pageParam}&limit=15`, { withCredentials: true });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60,
  });

  const notifications = data?.pages.flatMap(page => page.data) || [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      return await axios.put(`${API_URL}/notifications/${id}/read`, {}, { withCredentials: true });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries(['notifications']);
      const previousData = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            data: page.data.map(notif => notif._id === id ? { ...notif, isRead: true } : notif)
          }))
        };
      });
      return { previousData };
    },
    onError: (err, id, context) => {
      console.error("Failed to mark as read:", err);
      queryClient.setQueryData(['notifications'], context.previousData);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await axios.put(`${API_URL}/notifications/read-all`, {}, { withCredentials: true });
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['notifications']);
      const previousData = queryClient.getQueryData(['notifications']);
      
      queryClient.setQueryData(['notifications'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            data: page.data.map(notif => ({ ...notif, isRead: true }))
          }))
        };
      });
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      console.error("Failed to mark all as read:", err);
      queryClient.setQueryData(['notifications'], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  useEffect(() => {
    if (!isLoading && notifications.length > 0) {
      const hasUnread = notifications.some(n => !n.isRead);
      if (hasUnread) {
        markAllAsReadMutation.mutate();
      }
    }
  }, [isLoading, notifications]);

  const handleNotificationClick = (notif) => {
    const refId = notif.metadata?.referenceId;

    switch (notif.type) {
      case 'CREDIT_ADDED':
      case 'CREDIT_DEDUCTED':
        navigate('/wallet');
        break;
      
      case 'TRADE_ALERT':
        if (refId) {
          navigate(`/deal/${refId}`);
        } else {
          navigate('/swaps');
        }
        break;

      case 'ORDER_UPDATE':
      case 'SYSTEM_ALERT':
        if (refId) {
          navigate(`/order/${refId}`); 
        } else {
          navigate('/orders');
        }
        break;

      case 'AURA_UPDATE':
        navigate('/aura');
        break;

      case 'SYSTEM':
        navigate('/dashboard');
        break;

      default:
        navigate('/');
        break;
    }
  };

  const getIconData = (type) => {
    switch (type) {
      case 'CREDIT_ADDED':
        return { icon: Coins, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'CREDIT_DEDUCTED':
        return { icon: Zap, color: 'text-red-500', bg: 'bg-red-500/10' };
      case 'TRADE_ALERT':
        return { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'ORDER_UPDATE':
        return { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'AURA_UPDATE': 
        return { icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'SYSTEM_ALERT':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10' };
      case 'SYSTEM':
        return { icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default:
        return { icon: Info, color: 'text-gray-400', bg: 'bg-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] font-sans relative overflow-x-hidden flex flex-col">
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] shadow-lg py-4">
        <div className="max-w-md mx-auto md:max-w-7xl px-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
              Notifications
            </h1>
          </div>
          
          <button
            onClick={handlePushToggle}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center relative"
            title={isPushEnabled ? "Disable Push Notifications" : "Enable Push Notifications"}
          >
            {isPushEnabled ? (
              <Bell className="w-5 h-5 text-emerald-300" />
            ) : (
              <BellOff className="w-5 h-5 text-white/70" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-24 pb-24 px-4 relative z-10 max-w-md mx-auto w-full">
        
        {isLoading ? (
          <NotificationsShimmer />
        ) : isError ? (
          <div className="text-center mt-10 text-red-500 bg-red-100 p-4 rounded-xl border border-red-200 shadow-sm">
            {error?.message || "Failed to load notifications."}
          </div>
        ) : notifications.length === 0 ? (
           <div className="flex flex-col items-center justify-center mt-20 text-center">
             <div className="w-24 h-24 bg-[#EBE5F7] rounded-full flex items-center justify-center mb-5 shadow-inner">
               <Bell className="w-12 h-12 text-[#A388E1]" />
             </div>
             <h3 className="text-2xl font-extrabold text-gray-800 mb-2">All caught up!</h3>
             <p className="text-gray-500 font-medium text-sm">You have no new notifications right now.</p>
           </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notif) => {
                const { icon: Icon, color, bg } = getIconData(notif.type);
                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNotificationClick(notif)} 
                    className={`p-4 rounded-2xl border transition-all relative overflow-hidden cursor-pointer hover:shadow-md 
                      ${notif.isRead 
                        ? 'bg-white border-gray-100 shadow-sm' 
                        : 'bg-white border-[#6B46C1]/30 shadow-md ring-1 ring-[#6B46C1]/10'}`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#6B46C1] shadow-[0_0_8px_rgba(107,70,193,0.6)]"></div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      
                      <div className="flex-1 pr-4">
                        <h4 className={`font-bold text-sm mb-1 ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-gray-600 text-xs leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-medium text-gray-400">
                             {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                          </span>
                          
                          {notif.metadata?.amount > 0 && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${notif.type === 'CREDIT_ADDED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {notif.type === 'CREDIT_ADDED' ? '+' : '-'}{notif.metadata.amount} 🪙
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div ref={observerTarget} className="h-10 w-full" />
            
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-[#6B46C1] animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Animated Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-24 left-1/2 z-[100] flex items-center gap-3 bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/10 whitespace-nowrap"
          >
            {toast.type === 'on' ? (
              <Bell className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            ) : toast.type === 'off' ? (
              <BellOff className="w-5 h-5 text-gray-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="font-semibold text-sm tracking-wide">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default NotificationsPage;