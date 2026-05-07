import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Zap,
  RefreshCw,
  Coins,
  Sparkles,
  Package,
  ShoppingBag,
  Info,
  Loader2,
  AlertCircle // <-- Pehle se imported hai, bas use karna hai
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

  // <-- 1. Fetching notifications with useInfiniteQuery -->
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

  // Flatten the pages array into a single continuous list of notifications
  const notifications = data?.pages.flatMap(page => page.data) || [];

  // <-- Intersection Observer to trigger fetchNextPage when scrolling to bottom -->
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

  // <-- 2. Mark Single as Read with Optimistic Update (Updated for Infinite Query structure) -->
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

  // <-- 3. Mark All as Read with Optimistic Update (Updated for Infinite Query structure) -->
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

  // Auto-mark notifications as read when the page loads
  useEffect(() => {
    if (!isLoading && notifications.length > 0) {
      const hasUnread = notifications.some(n => !n.isRead);
      if (hasUnread) {
        markAllAsReadMutation.mutate();
      }
    }
  }, [isLoading, notifications]);

  // MODIFIED: Added handleNotificationClick logic based on the schema
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
      // --> CHANGE START: Backend system alerts ke liye logic
      case 'SYSTEM_ALERT':
        if (refId) {
          navigate(`/order/${refId}`); 
        } else {
          navigate('/orders');
        }
        break;
      // --> CHANGE END

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
      // --> CHANGE START: Red alert icon SYSTEM_ALERT ke liye
      case 'SYSTEM_ALERT':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10' };
      // --> CHANGE END
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

            {/* Invisible element to trigger the Intersection Observer */}
            <div ref={observerTarget} className="h-10 w-full" />
            
            {/* Loading spinner for when fetching the next page */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-[#6B46C1] animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;