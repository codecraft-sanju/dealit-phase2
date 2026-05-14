import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2, Coins, ChevronRight, ClipboardList, Archive, Tag, Heart, Wallet, Bell, HelpCircle, Edit2, X, Home, Hash, Truck, Shield, Star, Trash2 } from 'lucide-react'; 
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ProfilePage = ({ user, setUser, onLogout }) => {
  const navigate = useNavigate();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
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

  /* NAYA CHANGE START */
  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/stats`, { withCredentials: true });
      return response.data.data;
    },
    refetchInterval: 10000
  });
  /* NAYA CHANGE END */

  useEffect(() => {
    if (profileData && setUser) {
      setUser(profileData);
      localStorage.setItem('dealit_user', JSON.stringify(profileData));
    }
  }, [profileData, setUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else if (window.scrollY < 10) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
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

      alert('Profile updated successfully!');
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.3, ease: 'easeOut' } 
    }
  };

  /* NAYA CHANGE START */
  const swapsBadge = userStats?.swapsActive > 0 ? `${userStats.swapsActive} Active` : null;
  let swapsSubtitle = "Your Trade Offers & Barters";
  if (userStats?.receivedSwaps > 0 || userStats?.sentSwaps > 0) {
    const receivedText = userStats.receivedSwaps > 0 ? `${userStats.receivedSwaps} Received` : '';
    const sentText = userStats.sentSwaps > 0 ? `${userStats.sentSwaps} Sent` : '';
    swapsSubtitle = [receivedText, sentText].filter(Boolean).join(' | ');
  }

  const ordersBadge = userStats?.activeOrders > 0 ? `${userStats.activeOrders} Active` : null;

  const menuItems = [
    { to: "/dashboard", icon: ClipboardList, title: "My Listings", subtitle: "", badge: "Active" },
    { to: "/orders", icon: Archive, title: "My Orders", subtitle: "View your past transactions", badge: ordersBadge },
    { to: "/swaps", icon: RefreshCw, title: "My Swaps", subtitle: swapsSubtitle, badge: swapsBadge },
    { to: "#", icon: Tag, title: "My Offers", subtitle: "Items You've Bid On", iconClass: "fill-[#6B46C1]/20" },
    { to: "/wishlist", icon: Heart, title: "Wishlist", subtitle: "Saved Items", iconClass: "fill-[#6B46C1]" },
    { to: "/wallet", icon: Wallet, title: "My Wallet", subtitle: "Credit Balance & Purchases" },
    { to: "/notifications", icon: Bell, title: "Notifications", subtitle: "Alert Settings", iconClass: "fill-[#6B46C1]" },     
    { to: "/help-support", icon: HelpCircle, title: "Help & Support", subtitle: "Get Assistance", iconClass: "fill-[#6B46C1]/20" }
  ];
  /* NAYA CHANGE END */

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative overflow-x-hidden">
      
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-7xl px-5 md:px-8 flex justify-between items-center text-white">
          <div className="flex flex-col justify-center">
            <h1 className={`font-bold tracking-wide leading-tight transition-all duration-300 ${
              isScrolled ? 'text-xl' : 'text-2xl'
            }`}>
              My Profile
            </h1>
            <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
            }`}>
              Manage your account
            </p>
          </div>
          <button 
            onClick={onLogout}
            className={`flex items-center gap-2 bg-white/10 hover:bg-red-500 rounded-full font-bold transition-all duration-300 shadow-sm border border-white/20 hover:border-red-500 active:scale-95 ${
              isScrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            <LogOut className={`transition-all duration-300 ${isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> 
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"
      />

      <div className="max-w-md mx-auto md:max-w-7xl px-5 md:px-8 pt-28 relative z-20">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-pulse"
            >
              <div className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-[1.5rem] mb-4"></div>
                <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded-lg mb-4"></div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            >
              
              <motion.div variants={itemVariants} className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative mb-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                    className="w-24 h-24 bg-white rounded-[1.5rem] p-1.5 shadow-sm border border-gray-100"
                  >
                    <div className="w-full h-full bg-[#f8f6ff] rounded-[1.2rem] flex items-center justify-center overflow-hidden">
                      {uploadImageMutation.isPending ? (
                        <Loader2 className="w-8 h-8 text-[#A388E1] animate-spin" />
                      ) : profileData?.profilePic ? (
                        <motion.img 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          src={profileData.profilePic} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-10 h-10 text-[#A388E1]" />
                      )}
                    </div>
                  </motion.div>
                  
                  <label 
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#805ad5] to-[#6B46C1] p-2.5 rounded-full text-white cursor-pointer shadow-md border-2 border-white z-10 hover:scale-110 active:scale-95 transition-transform"
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

                <h2 className="text-xl font-bold text-gray-900 leading-tight">{profileData?.full_name}</h2>
                <p className="text-sm text-gray-500 font-medium mb-3">{profileData?.email}</p>

                
                <div className="mt-1 w-full flex flex-col items-center">
                  
                  <span className="bg-[#F4F0FF] text-[#6B46C1] text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-5">
                    {profileData?.role || 'USER'}
                  </span>

                  <div className="flex w-full gap-3 mb-4">
                    <div className="flex-1 bg-[#FFF9E6] rounded-xl py-3 px-2 flex items-center justify-center gap-2 border border-[#FFF0C2]/50 shadow-sm">
                      <Coins className="w-5 h-5 text-[#EAB308]" />
                      <span className="font-bold text-gray-800 text-sm">{profileData?.account_credits || 0} Credits</span>
                    </div>

                    <div className="flex-1 bg-[#F5F0FF] rounded-xl py-3 px-2 flex items-center justify-center gap-2 border border-[#E9DFFF]/50 shadow-sm">
                      <Shield className="w-5 h-5 text-[#6B46C1] fill-[#6B46C1]/20" />
                      <span className="font-bold text-gray-800 text-sm">{profileData?.aura_points || 0} Aura</span>
                    </div>
                  </div>

                  
                  <Link to="/aura" className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer block">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#6B46C1] p-3 rounded-xl flex-shrink-0 shadow-sm border border-[#5a3aa3]">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900 text-[14px]">Build your Aura!</h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-snug pr-2">
                          Complete trades, get good reviews & be active to increase your Aura.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>

                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  
                  <div className="flex items-center justify-between border-b border-gray-100 bg-white group">
                    <button 
                      onClick={() => setShowAccountDetails(!showAccountDetails)} 
                      className="flex items-center w-full justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <User className="w-6 h-6 text-[#6B46C1]" />
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-gray-800">Account Details</span>
                          <span className="text-[11px] text-gray-500 font-medium mt-0.5">Personal info & Pickup address</span>
                        </div>
                      </div>
                      <div className={`transition-transform duration-300 ${showAccountDetails ? 'rotate-90' : 'rotate-0'}`}>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6B46C1]" />
                      </div>
                    </button>
                    {showAccountDetails && (
                      <button onClick={openEditModal} className="pr-4 pl-2 py-4 hover:text-[#6B46C1] active:scale-90 text-gray-400 transition-all">
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {showAccountDetails && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden bg-gray-50/50 shadow-inner"
                      >
                        <div className="p-4 border-b border-gray-100 space-y-1">
                          {[
                            { icon: Mail, label: 'Email Address', value: profileData?.email },
                            { icon: Phone, label: 'Phone Number', value: profileData?.phone },
                            { icon: MapPin, label: 'Location', value: profileData?.city, capitalize: true },
                            { 
                              icon: Truck, 
                              label: 'Pickup Address', 
                              value: profileData?.pickupAddress?.houseNo 
                                ? `${profileData.pickupAddress.houseNo}, ${profileData.pickupAddress.areaStreet}${profileData.pickupAddress.landmark ? `, ${profileData.pickupAddress.landmark}` : ''}, ${profileData.pickupAddress.city}, ${profileData.pickupAddress.pincode}` 
                                : 'Not provided (Needed for selling)' 
                            },
                            { icon: Calendar, label: 'Member Since', value: profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 py-2 px-2">
                              <div className="bg-white p-2 rounded-xl text-[#A388E1] shadow-sm border border-gray-100">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                <p className={`font-semibold text-gray-900 text-sm ${item.capitalize ? 'capitalize' : ''}`}>
                                  {item.value || <span className="text-gray-400 italic">Not provided</span>}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* NAYA CHANGE START */}
                  {menuItems.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.to}
                      className={`flex items-center justify-between p-4 group border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className={`w-6 h-6 ${item.iconClass || 'text-[#6B46C1]'} ${item.icon === Archive ? 'text-[#4B5563]' : ''}`} />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-[15px] font-bold text-gray-800">{item.title}</span>
                            {item.badge && (
                              <span className="bg-[#EBE5F7] text-[#6B46C1] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <span className={`text-[11px] font-medium mt-0.5 ${item.badge && (item.title === 'My Swaps' || item.title === 'My Orders') ? 'text-[#A388E1]' : 'text-gray-500'}`}>
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6B46C1] transition-colors" />
                    </Link>
                  ))}
                  {/* NAYA CHANGE END */}

                  <Link
                    to="/delete-account"
                    className="flex items-center justify-between p-4 group hover:bg-red-50 active:bg-red-100 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Trash2 className="w-6 h-6 text-red-500" />
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-red-600">Delete Account</span>
                        <span className="text-[11px] text-red-400 font-medium mt-0.5">Permanently remove your data</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-colors" />
                  </Link>

                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#f8f6ff]">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#6B46C1]" /> Edit Profile
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 bg-white rounded-full shadow-sm active:scale-95 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 admin-scroll">
                <form id="editProfileForm" onSubmit={handleEditSubmit} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Basic Information</h3>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="Full Name" required value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="tel" placeholder="Phone Number" required value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-gray-800 text-sm">Pickup Address</h3>
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">Needed for Sellers</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Home className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="House No. / Flat No. / Road No." required value={editForm.pickupAddress.houseNo} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, houseNo: e.target.value}})}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Area, Street, Sector" required value={editForm.pickupAddress.areaStreet} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, areaStreet: e.target.value}})}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 opacity-50" />
                        <input type="text" placeholder="Landmark (Optional)" value={editForm.pickupAddress.landmark} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, landmark: e.target.value}})}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <input type="text" placeholder="City" required value={editForm.pickupAddress.city} onChange={(e) => {
                        setEditForm({
                          ...editForm, 
                          city: e.target.value, 
                          pickupAddress: {...editForm.pickupAddress, city: e.target.value}
                        })
                      }}
                        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                      
                      <input type="text" placeholder="State" required value={editForm.pickupAddress.state} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, state: e.target.value}})}
                        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>

                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="text" placeholder="Pincode (6 Digits)" required maxLength="6" value={editForm.pickupAddress.pincode} onChange={(e) => setEditForm({...editForm, pickupAddress: {...editForm.pickupAddress, pincode: e.target.value}})}
                        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3 focus:border-[#6B46C1] focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-5 border-t border-gray-100 bg-[#f8f6ff] flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-all text-sm">Cancel</button>
                <button type="submit" form="editProfileForm" disabled={editProfileMutation.isPending} className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 ${editProfileMutation.isPending ? 'bg-[#6B46C1]/50 text-white cursor-not-allowed' : 'bg-[#6B46C1] hover:bg-[#5a3aa3] active:scale-95 text-white shadow-md shadow-[#6B46C1]/20'}`}>
                  {editProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Details'}
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