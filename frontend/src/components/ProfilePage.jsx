import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
// MODIFIED: Added LayoutList, ShoppingBag, ArrowLeftRight, Trophy, and Headset
import { LogOut, User, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2, Coins, ChevronRight, ClipboardList, Archive, Tag, Heart, Wallet, Bell, HelpCircle, Edit2, X, Home, Hash, Truck, Shield, Star, Trash2, Settings, LayoutList, ShoppingBag, ArrowLeftRight, Trophy, Headset } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// --- Animation Variants for Premium Feel ---
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const ProfilePage = ({ user, setUser, onLogout }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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

  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
      return response.data.data;
    },
    onError: (error) => {
      console.error('Error fetching profile:', error);
      alert(`Profile Fetch Error: ${error.message} | Status: ${error.response?.status}`);
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/stats`, { withCredentials: true });
      return response.data.data;
    },
    refetchInterval: 10000
  });
 
  useEffect(() => {
    if (profileData && setUser) {
      setUser(profileData);
      localStorage.setItem('dealit_user', JSON.stringify(profileData));
    }
  }, [profileData, setUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else if (window.scrollY < 10) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ;
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      
      formData.append('upload_preset', uploadPreset);
      console.log("Uploading to Cloudinary...");

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      const uploadedUrl = cloudinaryRes.data.secure_url;

      const response = await axios.put(
        `${API_URL}/users/profile-pic`,
        { profilePic: uploadedUrl },
        { withCredentials: true }
      );
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      alert(`Upload Failed: ${error.message}\nDetails: ${JSON.stringify(error.response?.data || 'No extra data')}`);
    }
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
  
    if (!file) {
      alert("No file selected!"); 
      return;
    }
    uploadImageMutation.mutate(file);
  };

  const openEditModal = () => {
    setEditForm({
      full_name: profileData?.full_name || '',
      phone: profileData?.phone || '',
      city: profileData?.city || '',
      pickupAddress: {
        houseNo: profileData?.pickupAddress?.houseNo || '',
        areaStreet: profileData?.pickupAddress?.areaStreet || '',
        landmark: profileData?.pickupAddress?.landmark || '',
        city: profileData?.pickupAddress?.city || '',
        state: profileData?.pickupAddress?.state || '',
        pincode: profileData?.pickupAddress?.pincode || ''
      }
    });
    setIsEditModalOpen(true);
  };

  const editProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      return await axios.put(`${API_URL}/users/profile`, updatedData, { withCredentials: true });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditModalOpen(false);
      
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch (e) {
        console.error("Failed to update global user state", e);
      }
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editForm.pickupAddress.houseNo && !/\d/.test(editForm.pickupAddress.houseNo)) {
      alert('Please include at least one number in your House No. (e.g., Flat 4B, Plot 12) for Shiprocket pickups.');
      return;
    }
    editProfileMutation.mutate(editForm);
  };

  if (!user) return <Navigate to="/login" />;

  const swapsBadge = userStats?.swapsActive > 0 ? `${userStats.swapsActive} Active` : null;
  let swapsSubtitle = "Your Trade Offers";
  if (userStats?.receivedSwaps > 0 || userStats?.sentSwaps > 0) {
    const receivedText = userStats.receivedSwaps > 0 ? `${userStats.receivedSwaps} Received` : '';
    const sentText = userStats.sentSwaps > 0 ? `${userStats.sentSwaps} Sent` : '';
    swapsSubtitle = [receivedText, sentText].filter(Boolean).join(' | ');
  }
  const ordersBadge = userStats?.activeOrders > 0 ? `${userStats.activeOrders} Active` : null;

 // MODIFIED: Updated icons and unified the color scheme to match the primary theme
  const menuGroups = [
    {
      title: "My Activity",
      items: [
        { to: "/dashboard", icon: LayoutList, title: "My Listings", subtitle: "Manage your items", badge: "Active", color: "bg-[#f3f0ff] text-[#6B46C1]" },
        { to: "/orders", icon: ShoppingBag, title: "My Orders", subtitle: "Past transactions", badge: ordersBadge, color: "bg-[#f3f0ff] text-[#6B46C1]" },
        { to: "/swaps", icon: ArrowLeftRight, title: "My Swaps", subtitle: swapsSubtitle, badge: swapsBadge, color: "bg-[#f3f0ff] text-[#6B46C1]" },
        { to: "/wishlist", icon: Heart, title: "Wishlist", subtitle: "Saved Items", color: "bg-[#f3f0ff] text-[#6B46C1]" },
      ]
    },
    {
      title: "Rewards & Payments",
      items: [
        { to: "/offers", icon: Trophy, title: "Play & Earn", subtitle: "Complete events for credits", color: "bg-[#f3f0ff] text-[#6B46C1]" },
        { to: "/wallet", icon: Wallet, title: "My Wallet", subtitle: "Credit Balance & Purchases", color: "bg-[#f3f0ff] text-[#6B46C1]" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { to: "/notifications", icon: Bell, title: "Notifications", subtitle: "Alert Settings", color: "bg-[#f3f0ff] text-[#6B46C1]" },      
        { to: "/help-support", icon: Headset, title: "Help & Support", subtitle: "Get Assistance", color: "bg-[#f3f0ff] text-[#6B46C1]" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-24 font-sans relative overflow-x-hidden selection:bg-[#6B46C1]/20">
      
      {/* Background Orbs (Static to prevent lag, glossy look) */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#6B46C1] via-[#7c52d6] to-transparent z-0 pointer-events-none" />
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#805ad5] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 z-0 pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-[#d53f8c] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 z-0 pointer-events-none" />

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isScrolled ? 'py-4 bg-[#6B46C1]/95 backdrop-blur-xl shadow-sm border-b border-white/10' : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-7xl px-5 md:px-8 flex justify-between items-center text-white relative z-10">
          <div className="flex flex-col justify-center">
            <h1 className={`font-bold tracking-wide transition-all duration-300 ${isScrolled ? 'text-lg' : 'text-2xl'}`}>
              Profile
            </h1>
          </div>
          <button 
            onClick={onLogout}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full font-semibold transition-all active:scale-90 border border-white/20 hover:bg-white/20 ${
              isScrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            <LogOut className={`w-4 h-4`} /> 
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
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 animate-pulse"
            >
              {/* Premium Skeleton matched to layout */}
              <div className="bg-white/80 rounded-[2rem] p-6 flex flex-col items-center border border-white">
                <div className="w-24 h-24 bg-gray-200/60 rounded-full mb-4"></div>
                <div className="h-6 w-40 bg-gray-200/60 rounded-lg mb-3"></div>
                <div className="h-4 w-48 bg-gray-200/60 rounded-lg mb-6"></div>
                <div className="flex w-full gap-3">
                  <div className="flex-1 h-16 bg-gray-200/60 rounded-2xl"></div>
                  <div className="flex-1 h-16 bg-gray-200/60 rounded-2xl"></div>
                </div>
              </div>
              <div className="h-20 bg-gray-200/60 rounded-[1.5rem] w-full"></div>
            </motion.div>
          ) : (
            <motion.div 
              variants={pageVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* Profile Header Widget */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-6 flex flex-col items-center text-center relative border border-gray-50">
                  
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-tr from-gray-50 to-gray-100 rounded-full p-1 shadow-sm border border-gray-100">
                      <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white relative">
                        {uploadImageMutation.isPending ? (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                            <Loader2 className="w-8 h-8 text-[#A388E1] animate-spin" />
                          </div>
                        ) : null}
                        {profileData?.profilePic ? (
                          <img 
                            src={profileData.profilePic} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                    </div>
                    
                    <label 
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      className="absolute bottom-0 right-0 bg-[#6B46C1] p-2.5 rounded-full text-white cursor-pointer shadow-md border-[2.5px] border-white active:scale-90 transition-transform hover:bg-[#5a3aa3]"
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

                  <h2 className="text-[22px] font-bold text-gray-900 leading-tight tracking-tight">{profileData?.full_name}</h2>
                  <p className="text-[14px] text-gray-500 font-medium mb-4">{profileData?.email}</p>

                  <button 
                    onClick={openEditModal}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 text-gray-800 font-semibold text-sm px-6 py-2.5 rounded-full transition-all flex items-center gap-2 mb-6"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>

                  {/* Compact & Premium Stats Row */}
                  <div className="flex w-full gap-3">
                    {/* 3D Shiny Coin Card */}
                    <div className="flex-1 bg-white rounded-2xl p-3 flex items-center gap-3 border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow">
                      <div className="relative w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#FFE770] via-[#F5C341] to-[#D97706] shadow-[0_3px_8px_rgba(217,119,6,0.3)] border-[1.5px] border-[#FFF7A1] flex items-center justify-center">
                        <div className="absolute inset-[2px] rounded-full border border-white/50 border-b-black/10 flex items-center justify-center bg-gradient-to-b from-transparent to-black/5">
                          <span className="text-[#87590C] font-black text-[16px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">C</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Credits</span>
                        <span className="font-extrabold text-gray-900 text-[19px] leading-tight truncate w-full">{profileData?.account_credits || 0}</span>
                      </div>
                    </div>

                    {/* Premium Aura Card */}
                    <div className="flex-1 bg-white rounded-2xl p-3 flex items-center gap-3 border border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow">
                      <div className="relative w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#D8B4FE] via-[#A855F7] to-[#7E22CE] shadow-[0_3px_8px_rgba(168,85,247,0.3)] border-[1.5px] border-[#F3E8FF] flex items-center justify-center">
                        <div className="absolute inset-[2px] rounded-full border border-white/50 border-b-black/10 flex items-center justify-center bg-gradient-to-b from-transparent to-black/5">
                          <Shield className="w-[18px] h-[18px] text-white fill-white/20 drop-shadow-sm" />
                        </div>
                      </div>
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Aura</span>
                        <span className="font-extrabold text-gray-900 text-[19px] leading-tight truncate w-full">{profileData?.aura_points || 0}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Link 
                    to="/aura" 
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#6B46C1] rounded-[1.5rem] p-4 flex items-center justify-between shadow-md active:scale-[0.97] transition-all cursor-pointer block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-white text-[15px]">Level Up Your Aura</h3>
                        <p className="text-[12px] text-white/80 font-medium mt-0.5">
                          Build trust to get better deals.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/70" />
                  </Link>
                </motion.div>
              </div>

              {/* Grouped Menu Section */}
              <div className="lg:col-span-8 flex flex-col gap-6 mt-2 lg:mt-0 pb-10">
                {menuGroups.map((group, groupIdx) => (
                  <motion.div variants={itemVariants} key={groupIdx} className="flex flex-col gap-2">
                    <h3 className="pl-4 text-[13px] font-bold text-gray-500 uppercase tracking-wider">{group.title}</h3>
                    <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-50 overflow-hidden">
                      {group.items.map((item, index) => (
                        <Link 
                          key={index}
                          to={item.to}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          className={`flex items-center justify-between p-4 active:bg-gray-50 transition-colors ${
                            index !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${item.color}`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[16px] font-semibold text-gray-900">{item.title}</span>
                                {item.badge && (
                                  <span className="bg-[#f3f0ff] text-[#6B46C1] text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <span className="text-[12px] text-gray-500 mt-0.5 font-medium">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Danger Zone */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2 mt-2">
                  <div className="bg-white rounded-[2rem] shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-50 overflow-hidden">
                    <Link
                      to="/delete-account"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      className="flex items-center justify-between p-4 active:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                          <Trash2 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[16px] font-semibold text-red-600">Delete Account</span>
                          <span className="text-[12px] text-gray-500 mt-0.5 font-medium">Permanently remove your data</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spring Modal for Edit Profile */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative z-10"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="bg-gray-100 p-2 rounded-full text-gray-600 active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 overscroll-contain pb-24 sm:pb-6">
                <form id="editProfileForm" onSubmit={handleEditSubmit} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-bold text-[#6B46C1] uppercase tracking-wider">Basic Information</h3>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="Full Name" required value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="tel" placeholder="Phone Number" required value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-bold text-[#6B46C1] uppercase tracking-wider">Pickup Address</h3>
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">Seller Req.</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Home className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="House No. / Flat No." required value={editForm.pickupAddress.houseNo} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, houseNo: e.target.value}})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Area, Street, Sector" required value={editForm.pickupAddress.areaStreet} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, areaStreet: e.target.value}})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-300" />
                        <input type="text" placeholder="Landmark (Optional)" value={editForm.pickupAddress.landmark} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, landmark: e.target.value}})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <input type="text" placeholder="City" required value={editForm.pickupAddress.city} onChange={(e) => {
                        setEditForm({
                          ...editForm, 
                          city: e.target.value, 
                          pickupAddress: {...editForm.pickupAddress, city: e.target.value}
                        })
                      }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                      
                      <input type="text" placeholder="State" required value={editForm.pickupAddress.state} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, state: e.target.value}})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold" />
                    </div>

                    <div className="relative">
                      <Hash className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="Pincode (6 Digits)" required maxLength="6" value={editForm.pickupAddress.pincode} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, pincode: e.target.value}})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-sm font-semibold tracking-widest" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 absolute sm:relative bottom-0 w-full z-20 pb-safe">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className="w-1/2 sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 active:bg-gray-200 active:scale-95 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="editProfileForm" 
                  disabled={editProfileMutation.isPending} 
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`w-1/2 sm:w-auto px-8 py-3.5 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${editProfileMutation.isPending ? 'bg-[#6B46C1]/50 text-white cursor-not-allowed' : 'bg-[#6B46C1] active:bg-[#5a3aa3] active:scale-95 text-white shadow-lg shadow-[#6B46C1]/30'}`}
                >
                  {editProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Details'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProfilePage;