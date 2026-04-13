import React from 'react';
import { Link } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <-- NAYA: React Query imports

const API_URL = import.meta.env.VITE_BACKEND_API + '/api';

// <-- NAYA: Shimmer Loading Component specifically designed for Notifications -->
const NotificationsShimmer = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex gap-4 animate-pulse">
          {/* Icon Skeleton */}
          <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0"></div>
          
          {/* Text Skeleton */}
          <div className="flex-1 pr-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
            
            {/* Date/Metadata Skeleton */}
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

  // <-- 1. Fetching notifications with useQuery -->
  const { data: notifications = [], isLoading, isError, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/notifications`, { withCredentials: true });
      return response.data.success ? response.data.data : [];
    },
    staleTime: 1000 * 60, // Cache for 1 minute before refetching in background
  });

  // <-- 2. Mark Single as Read with Optimistic Update -->
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      return await axios.put(`${API_URL}/notifications/${id}/read`, {}, { withCredentials: true });
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['notifications']);
      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications']);
      // Optimistically update to the new value
      queryClient.setQueryData(['notifications'], old => 
        old?.map(notif => notif._id === id ? { ...notif, isRead: true } : notif)
      );
      // Return a context object with the snapshotted value
      return { previousNotifications };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, id, context) => {
      console.error("Failed to mark as read:", err);
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
  });

  // <-- 3. Mark All as Read with Optimistic Update -->
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await axios.put(`${API_URL}/notifications/read-all`, {}, { withCredentials: true });
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['notifications']);
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], old => 
        old?.map(notif => ({ ...notif, isRead: true }))
      );
      return { previousNotifications };
    },
    onError: (err, newTodo, context) => {
      console.error("Failed to mark all as read:", err);
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server sync
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Helper to get right icon and color based on notification type
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
      case 'SYSTEM':
        return { icon: Package, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default:
        return { icon: Info, color: 'text-gray-400', bg: 'bg-gray-800' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] font-sans relative overflow-x-hidden flex flex-col">
      
      {/* 1. HEADER (Fixed at top) */}
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
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={() => markAllAsReadMutation.mutate()} // <-- Trigger mark all mutation
              disabled={markAllAsReadMutation.isPending}
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-50"
            >
              {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN CONTENT (Added pt-24 to offset fixed header) */}
      <main className="flex-1 flex flex-col pt-24 pb-24 px-4 relative z-10 max-w-md mx-auto w-full">
        
        {/* <-- NAYA: Shimmer UI usage based on React Query isLoading state --> */}
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
                    onClick={() => {
                      if (!notif.isRead) markAsReadMutation.mutate(notif._id); // <-- Trigger mark read mutation
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden
                      ${notif.isRead 
                        ? 'bg-white border-gray-100 shadow-sm opacity-75 hover:opacity-100' 
                        : 'bg-white border-[#6B46C1]/30 shadow-md ring-1 ring-[#6B46C1]/10'}`}
                  >
                    {/* Unread dot indicator */}
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
                          
                          {/* Show metadata amount if exists */}
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
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;