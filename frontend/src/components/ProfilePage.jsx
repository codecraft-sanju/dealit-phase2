import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  LogOut, User, Mail, Phone, MapPin, Calendar, Package, RefreshCw,
  Camera, Loader2, Coins, ChevronRight, ClipboardList, Archive, Tag,
  Heart, Wallet, Bell, HelpCircle, Edit2, X, Home, Hash, Truck,
  Shield, Star, Trash2, Settings, LayoutList, ShoppingBag,
  ArrowLeftRight, Trophy, Headset, CheckCircle2, AlertCircle, Info,
  CreditCard
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;


const GLOBAL_STYLES = `
  :root {
    --r-sm: 12px;
    --r-md: 18px;
    --r-lg: 28px;
    --r-xl: 36px;
    --color-brand: #6B46C1;
    --color-brand-dark: #5a3aa3;
    --color-brand-light: #f3f0ff;
    --shadow-card: 0 2px 20px rgba(0,0,0,0.04);
    --shadow-elevated: 0 8px 32px rgba(107,70,193,0.12);
    --transition-smooth: all 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  @keyframes shimmer {
    from { background-position: -400px 0; }
    to   { background-position: 400px 0; }
  }

  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      rgba(0,0,0,0.04) 25%,
      rgba(0,0,0,0.09) 50%,
      rgba(0,0,0,0.04) 75%
    );
    background-size: 800px 100%;
    animation: shimmer 1.6s ease-in-out infinite;
    border-radius: var(--r-sm);
  }

  #toast-root {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
    width: max-content;
    max-width: calc(100vw - 32px);
  }

  .toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(30,22,50,0.94);
    color: #fff;
    padding: 10px 16px;
    border-radius: 100px;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: -0.01em;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
    white-space: nowrap;
    animation: toastIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }

  .toast-item.toast-exit {
    animation: toastOut 0.22s ease-in forwards;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }

  @keyframes toastOut {
    from { opacity: 1; transform: translateY(0)   scale(1); }
    to   { opacity: 0; transform: translateY(-8px) scale(0.94); }
  }

  .pb-safe-area {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
`;


let _toastSetters = null;

const ToastProvider = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _toastSetters = setToasts;
    return () => { _toastSetters = null; };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  return (
    <div id="toast-root">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-item${t.exiting ? ' toast-exit' : ''}`}
          onClick={() => removeToast(t.id)}
        >
          {t.type === 'success' && <CheckCircle2 style={{ width: 15, height: 15, color: '#4ade80', flexShrink: 0 }} />}
          {t.type === 'error'   && <AlertCircle  style={{ width: 15, height: 15, color: '#f87171', flexShrink: 0 }} />}
          {t.type === 'info'    && <Info          style={{ width: 15, height: 15, color: '#93c5fd', flexShrink: 0 }} />}
          {t.message}
        </div>
      ))}
    </div>
  );
};

const toast = {
  _show(type, message, duration = 3200) {
    if (!_toastSetters) return;
    const id = Date.now() + Math.random();
    _toastSetters(prev => [...prev, { id, type, message, exiting: false }]);
    setTimeout(() => {
      if (!_toastSetters) return;
      _toastSetters(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => _toastSetters(prev => prev.filter(t => t.id !== id)), 220);
    }, duration);
  },
  success: (msg, d) => toast._show('success', msg, d),
  error:   (msg, d) => toast._show('error',   msg, d),
  info:    (msg, d) => toast._show('info',     msg, d),
};


const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 26 }
  }
};


const Sk = ({ w = '100%', h = 16, style = {} }) => (
  <div
    className="skeleton-shimmer"
    style={{ width: w, height: h, borderRadius: 'var(--r-sm)', ...style }}
  />
);


const ProfilePage = ({ user, setUser, onLogout }) => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localPreview, setLocalPreview] = useState(null); 

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    pickupAddress: {
      houseNo: '',
      areaStreet: '',
      landmark: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const id = 'profile-global-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = GLOBAL_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isScrolled = scrollY > 30;

  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
      return res.data.data;
    },
    onError: (err) => toast.error(`Could not load profile. ${err.response?.status || ''}`),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/stats`, { withCredentials: true });
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (profileData && setUser) {
      setUser(profileData);
      localStorage.setItem('dealit_user', JSON.stringify(profileData));
    }
  }, [profileData, setUser]);

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      const uploadedUrl = cloudRes.data.secure_url;

      const res = await axios.put(
        `${API_URL}/users/profile-pic`,
        { profilePic: uploadedUrl },
        { withCredentials: true }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setLocalPreview(null);
      toast.success('Profile photo updated!');
    },
    onError: (err) => {
      setLocalPreview(null);
      toast.error(`Photo upload failed. Please try again.`);
      console.error(err);
    },
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    uploadImageMutation.mutate(file);
  };


  const openEditModal = () => {
    setEditForm({
      full_name: profileData?.full_name || '',
      phone: profileData?.phone || '',
      city: profileData?.city || '',
      pickupAddress: {
        houseNo:    profileData?.pickupAddress?.houseNo    || '',
        areaStreet: profileData?.pickupAddress?.areaStreet || '',
        landmark:   profileData?.pickupAddress?.landmark   || '',
        city:       profileData?.pickupAddress?.city       || '',
        state:      profileData?.pickupAddress?.state      || '',
        pincode:    profileData?.pickupAddress?.pincode    || '',
      }
    });
    setIsEditModalOpen(true);
  };

  const editProfileMutation = useMutation({
    mutationFn: async (data) =>
      axios.put(`${API_URL}/users/profile`, data, { withCredentials: true }),
    onSuccess: async () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditModalOpen(false);
      toast.success('Profile saved successfully!');
      try {
        const res = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (res.data.success && setUser) {
          setUser(res.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(res.data.data));
        }
      } catch (e) {
        console.error('Failed to sync global user state', e);
      }
    },
    onError: () => toast.error('Failed to save profile. Please try again.'),
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editForm.pickupAddress.houseNo && !/\d/.test(editForm.pickupAddress.houseNo)) {
      toast.error('House No. must include at least one number (e.g., Flat 4B)');
      return;
    }
    editProfileMutation.mutate(editForm);
  };

  if (!user) return <Navigate to="/login" />;

  const swapsBadge = userStats?.swapsActive > 0 ? `${userStats.swapsActive} Active` : null;
  let swapsSubtitle = 'Your Trade Offers';
  if (userStats?.receivedSwaps > 0 || userStats?.sentSwaps > 0) {
    const parts = [
      userStats.receivedSwaps > 0 ? `${userStats.receivedSwaps} Received` : '',
      userStats.sentSwaps      > 0 ? `${userStats.sentSwaps} Sent`        : '',
    ].filter(Boolean);
    swapsSubtitle = parts.join(' · ');
  }
  const ordersBadge = userStats?.activeOrders > 0 ? `${userStats.activeOrders} Active` : null;

  /* --- MODIFIED: Added Saved Payments route to Menu Groups --- */
  const menuGroups = [
    {
      title: 'My Activity',
      items: [
        { to: '/dashboard',    icon: LayoutList,    title: 'My Listings', subtitle: 'Manage your items',      badge: 'Active',     color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/orders',       icon: ShoppingBag,   title: 'My Orders',   subtitle: 'Past transactions',      badge: ordersBadge,  color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/swaps',        icon: ArrowLeftRight, title: 'My Swaps',   subtitle: swapsSubtitle,            badge: swapsBadge,   color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/wishlist',     icon: Heart,         title: 'Wishlist',    subtitle: 'Saved Items',                                 color: 'bg-[#f3f0ff] text-[#6B46C1]' },
      ]
    },
    {
      title: 'Rewards & Payments',
      items: [
        { to: '/offers',          icon: Trophy,      title: 'Play & Earn',       subtitle: 'Complete events for credits', color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/wallet',          icon: Wallet,      title: 'My Wallet',         subtitle: 'Credit Balance & Purchases',  color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/saved-payments',  icon: CreditCard,  title: 'Saved Cards & UPI', subtitle: 'Manage payment methods',      color: 'bg-[#f3f0ff] text-[#6B46C1]' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { to: '/notifications', icon: Bell,    title: 'Notifications', subtitle: 'Alert Settings',  color: 'bg-[#f3f0ff] text-[#6B46C1]' },
        { to: '/help-support',  icon: Headset, title: 'Help & Support', subtitle: 'Get Assistance', color: 'bg-[#f3f0ff] text-[#6B46C1]' },
      ]
    }
  ];

  const avatarSrc = localPreview || profileData?.profilePic;

  const inputCls =
    'w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 ' +
    'focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 ' +
    'outline-none transition-all text-sm font-semibold text-gray-800 placeholder:text-gray-400';

  const inputClsNoIcon =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 ' +
    'focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 ' +
    'outline-none transition-all text-sm font-semibold text-gray-800 placeholder:text-gray-400';


  return (
    <>
      
      <ToastProvider />

      <div className="min-h-screen bg-[#f2f2f7] pb-2 font-sans relative overflow-x-hidden selection:bg-[#6B46C1]/20">

      
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#6B46C1] via-[#7c52d6] to-transparent z-0 pointer-events-none" />
        <div className="absolute top-10 -left-20 w-80 h-80 bg-[#805ad5] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 z-0 pointer-events-none" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-[#d53f8c] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 z-0 pointer-events-none" />

      
        <header
          style={{ transition: 'var(--transition-smooth)' }}
          className={`fixed top-0 left-0 right-0 z-50 ${
            isScrolled
              ? 'py-3.5 bg-[#6B46C1]/96 backdrop-blur-xl shadow-sm border-b border-white/10'
              : 'py-5 bg-transparent'
          }`}
        >
          <div className="max-w-md mx-auto md:max-w-7xl px-5 md:px-8 flex justify-between items-center text-white">
            <h1
              style={{ transition: 'var(--transition-smooth)' }}
              className={`font-bold tracking-wide ${isScrolled ? 'text-[17px]' : 'text-[24px]'}`}
            >
              Profile
            </h1>
            <button
              onClick={onLogout}
              style={{ WebkitTapHighlightColor: 'transparent', transition: 'var(--transition-smooth)' }}
              className={`flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full font-semibold border border-white/20 hover:bg-white/20 active:scale-90 ${
                isScrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="max-w-md mx-auto md:max-w-7xl px-4 md:px-8 pt-28 relative z-20">
          <AnimatePresence mode="wait">

            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-white/85 rounded-[var(--r-lg)] p-6 flex flex-col items-center border border-white/60">
                  <Sk w={96} h={96} style={{ borderRadius: '50%', marginBottom: 16 }} />
                  <Sk w={160} h={22} style={{ marginBottom: 10 }} />
                  <Sk w={200} h={15} style={{ marginBottom: 24 }} />
                  <Sk w={120} h={36} style={{ borderRadius: 100, marginBottom: 24 }} />
                  <div className="flex w-full gap-3">
                    <Sk style={{ flex: 1, height: 68, borderRadius: 'var(--r-md)' }} />
                    <Sk style={{ flex: 1, height: 68, borderRadius: 'var(--r-md)' }} />
                  </div>
                </div>
                <Sk h={56} style={{ borderRadius: 'var(--r-lg)' }} />
                <Sk h={220} style={{ borderRadius: 'var(--r-lg)' }} />
                <Sk h={156} style={{ borderRadius: 'var(--r-lg)' }} />
              </motion.div>
            ) : (

              <motion.div
                key="content"
                variants={pageVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >

                <div className="lg:col-span-4 flex flex-col gap-4">

                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-[var(--r-lg)] border border-gray-100 p-6 flex flex-col items-center text-center"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="relative mb-4">
                      <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#e9e3ff] to-[#c4b5fd] shadow-sm">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center relative">
                          {uploadImageMutation.isPending && (
                            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-10">
                              <Loader2 className="w-7 h-7 text-[#6B46C1] animate-spin" />
                            </div>
                          )}
                          {avatarSrc ? (
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-gray-300" />
                          )}
                        </div>
                      </div>

                      <label
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        className="absolute bottom-0 right-0 bg-[#6B46C1] p-2.5 rounded-full text-white cursor-pointer shadow-lg border-[2.5px] border-white active:scale-90 hover:bg-[#5a3aa3] transition-transform"
                      >
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadImageMutation.isPending}
                        />
                      </label>
                    </div>

                    <h2 className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">
                      {profileData?.full_name}
                    </h2>
                    <p className="text-[13.5px] text-gray-500 font-medium mb-4">{profileData?.email}</p>

                    <button
                      onClick={openEditModal}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-full transition-all flex items-center gap-2 mb-6"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Profile
                    </button>

                    <div className="flex w-full gap-3">
                      <div
                        className="flex-1 bg-white rounded-[var(--r-md)] p-3 flex items-center gap-3 border border-gray-100 hover:shadow-md transition-shadow"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                      >
                        <div className="relative w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#FFE770] via-[#F5C341] to-[#D97706] shadow-[0_3px_8px_rgba(217,119,6,0.28)] border-[1.5px] border-[#FFF7A1] flex items-center justify-center">
                          <div className="absolute inset-[2px] rounded-full border border-white/50 flex items-center justify-center">
                            <span className="text-[#87590C] font-black text-[16px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">C</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Credits</span>
                          <span className="font-extrabold text-gray-900 text-[19px] leading-tight truncate w-full">
                            {profileData?.account_credits ?? 0}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex-1 bg-white rounded-[var(--r-md)] p-3 flex items-center gap-3 border border-gray-100 hover:shadow-md transition-shadow"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                      >
                        <div className="relative w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#D8B4FE] via-[#A855F7] to-[#7E22CE] shadow-[0_3px_8px_rgba(168,85,247,0.28)] border-[1.5px] border-[#F3E8FF] flex items-center justify-center">
                          <div className="absolute inset-[2px] rounded-full border border-white/50 flex items-center justify-center">
                            <Shield className="w-[18px] h-[18px] text-white fill-white/20" />
                          </div>
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Aura</span>
                          <span className="font-extrabold text-gray-900 text-[19px] leading-tight truncate w-full">
                            {profileData?.aura_points ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Link
                      to="/aura"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      className="bg-gradient-to-r from-[#8b5cf6] to-[#6B46C1] rounded-[var(--r-lg)] p-4 flex items-center justify-between shadow-md active:scale-[0.97] transition-all block"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-[var(--r-sm)] backdrop-blur-sm">
                          <Star className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-white text-[15px]">Level Up Your Aura</h3>
                          <p className="text-[12px] text-white/75 font-medium mt-0.5">
                            Build trust to get better deals.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/60" />
                    </Link>
                  </motion.div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-5 mt-2 lg:mt-0 pb-10">

                  {menuGroups.map((group, gIdx) => (
                    <motion.div variants={itemVariants} key={gIdx} className="flex flex-col gap-2">
                      <h3 className="pl-4 text-[11.5px] font-bold text-gray-400 uppercase tracking-widest">
                        {group.title}
                      </h3>
                      <div
                        className="bg-white border border-gray-50 overflow-hidden"
                        style={{ borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)' }}
                      >
                        {group.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.to}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`flex items-center justify-between px-4 py-3.5 active:bg-gray-50/80 transition-colors ${
                              idx !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`p-2.5 rounded-[var(--r-sm)] ${item.color}`}>
                                <item.icon className="w-[18px] h-[18px]" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] font-semibold text-gray-900 leading-snug">
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span className="bg-[#f3f0ff] text-[#6B46C1] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full leading-none">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <span className="text-[12px] text-gray-400 mt-0.5 font-medium leading-none">
                                    {item.subtitle}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  <motion.div variants={itemVariants}>
                    <div
                      className="bg-white border border-gray-50 overflow-hidden"
                      style={{ borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-card)' }}
                    >
                      <Link
                        to="/delete-account"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                        className="flex items-center justify-between px-4 py-3.5 active:bg-red-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 rounded-[var(--r-sm)] bg-red-50 text-red-500">
                            <Trash2 className="w-[18px] h-[18px]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-semibold text-red-500 leading-snug">Delete Account</span>
                            <span className="text-[12px] text-gray-400 mt-0.5 font-medium leading-none">
                              Permanently remove your data
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                      </Link>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsEditModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="bg-white w-full max-w-lg rounded-t-[var(--r-lg)] sm:rounded-[var(--r-lg)] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative z-10"
              >
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                  <h2 className="text-[18px] font-bold text-gray-900">Edit Profile</h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className="bg-gray-100 p-2 rounded-full text-gray-500 active:scale-90 hover:bg-gray-200 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 overscroll-contain pb-32 sm:pb-6">
                  <form id="editProfileForm" onSubmit={handleEditSubmit} className="space-y-7">

                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-[#6B46C1] uppercase tracking-widest mb-1">
                        Basic Information
                      </h3>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="text" placeholder="Full Name" required
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="tel" placeholder="Phone Number" required
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-bold text-[#6B46C1] uppercase tracking-widest">
                          Pickup Address
                        </h3>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                          Seller Required
                        </span>
                      </div>

                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="text" placeholder="House No. / Flat No." required
                          value={editForm.pickupAddress.houseNo}
                          onChange={(e) => setEditForm({ ...editForm, pickupAddress: { ...editForm.pickupAddress, houseNo: e.target.value } })}
                          className={inputCls}
                        />
                      </div>

                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="text" placeholder="Area, Street, Sector" required
                          value={editForm.pickupAddress.areaStreet}
                          onChange={(e) => setEditForm({ ...editForm, pickupAddress: { ...editForm.pickupAddress, areaStreet: e.target.value } })}
                          className={inputCls}
                        />
                      </div>

                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-300" />
                        <input
                          type="text" placeholder="Landmark (Optional)"
                          value={editForm.pickupAddress.landmark}
                          onChange={(e) => setEditForm({ ...editForm, pickupAddress: { ...editForm.pickupAddress, landmark: e.target.value } })}
                          className={inputCls}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text" placeholder="City" required
                          value={editForm.pickupAddress.city}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            city: e.target.value,
                            pickupAddress: { ...editForm.pickupAddress, city: e.target.value }
                          })}
                          className={inputClsNoIcon}
                        />
                        <input
                          type="text" placeholder="State" required
                          value={editForm.pickupAddress.state}
                          onChange={(e) => setEditForm({ ...editForm, pickupAddress: { ...editForm.pickupAddress, state: e.target.value } })}
                          className={inputClsNoIcon}
                        />
                      </div>

                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <input
                          type="text" placeholder="Pincode (6 Digits)" required maxLength="6"
                          value={editForm.pickupAddress.pincode}
                          onChange={(e) => setEditForm({ ...editForm, pickupAddress: { ...editForm.pickupAddress, pincode: e.target.value } })}
                          className={`${inputCls} tracking-[0.2em]`}
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div
                  className="border-t border-gray-100 bg-white flex gap-3 absolute sm:relative bottom-0 w-full z-20 px-4 pt-3 pb-safe-area"
                >
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className="flex-1 py-3.5 rounded-[var(--r-md)] font-bold text-gray-600 bg-gray-100 active:bg-gray-200 active:scale-95 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="editProfileForm"
                    disabled={editProfileMutation.isPending}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`flex-1 py-3.5 rounded-[var(--r-md)] font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                      editProfileMutation.isPending
                        ? 'bg-[#6B46C1]/50 text-white cursor-not-allowed'
                        : 'bg-[#6B46C1] text-white active:bg-[#5a3aa3] active:scale-95 shadow-lg shadow-[#6B46C1]/25'
                    }`}
                  >
                    {editProfileMutation.isPending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : 'Save Changes'
                    }
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default ProfilePage;