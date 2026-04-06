import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, User, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2, Coins, ChevronRight, ClipboardList, Archive, Tag, Heart, Wallet, Bell, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const MotionLink = motion(Link);

const ProfilePage = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log("Fetching profile from:", `${API_URL}/users/profile`);
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        console.log("Profile Data received:", response.data);
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert(`Profile Fetch Error: ${error.message} | Status: ${error.response?.status}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file);
    
    if (!file) {
      alert("No file selected!"); 
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET || 'salon_preset';
      const cloudName = import.meta.env.VITE_CLOUD_NAME || 'dvoenforj';
      
      formData.append('upload_preset', uploadPreset);
      console.log("Uploading to Cloudinary...");

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      console.log("Cloudinary response:", cloudinaryRes.data);
      const uploadedUrl = cloudinaryRes.data.secure_url;
      console.log("Sending URL to backend:", uploadedUrl);

      const response = await axios.put(
        `${API_URL}/users/profile-pic`,
        { profilePic: uploadedUrl },
        { withCredentials: true }
      );

      console.log("Backend response:", response.data);

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, profilePic: uploadedUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Upload Failed: ${error.message}\nDetails: ${JSON.stringify(error.response?.data || 'No extra data')}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  };

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
        transition={{ duration: 0.6, ease: "easeOut" }}
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
                <div className="flex gap-2 w-full justify-center mt-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                          <div className="h-3 w-32 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-gray-200 rounded-md"></div>
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
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="w-24 h-24 bg-white rounded-[1.5rem] p-1.5 shadow-sm border border-gray-100"
                  >
                    <div className="w-full h-full bg-[#f8f6ff] rounded-[1.2rem] flex items-center justify-center overflow-hidden">
                      {uploadingImage ? (
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
                  
                  <motion.label 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#805ad5] to-[#6B46C1] p-2.5 rounded-full text-white cursor-pointer shadow-md border-2 border-white z-10"
                  >
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                    />
                  </motion.label>
                </div>

                <h2 className="text-xl font-bold text-gray-900 leading-tight">{profileData?.full_name}</h2>
                <p className="text-sm text-gray-500 font-medium mb-3">{profileData?.email}</p>

                <div className="flex items-center gap-2 justify-center w-full mt-2">
                  <span className="bg-[#EBE5F7] text-[#6B46C1] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {profileData?.role || 'USER'}
                  </span>
                  <span className="bg-[#FFF4D2] border border-[#FFE28A]/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Coins className="w-3.5 h-3.5 text-yellow-600" />
                    <span className="text-[11px] font-bold text-gray-900">{profileData?.account_credits || 0} Credits</span>
                  </span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  
                  <motion.button 
                    whileTap={{ backgroundColor: "#f9fafb" }}
                    onClick={() => setShowAccountDetails(!showAccountDetails)} 
                    className="flex items-center w-full justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <User className="w-6 h-6 text-[#6B46C1]" />
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-gray-800">Account Details</span>
                        <span className="text-[11px] text-gray-500 font-medium mt-0.5">Personal info & contact</span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showAccountDetails ? 90 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6B46C1] transition-colors" />
                    </motion.div>
                  </motion.button>

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
                            { icon: Calendar, label: 'Member Since', value: profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently' }
                          ].map((item, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-4 py-2 px-2"
                            >
                              <div className="bg-white p-2 rounded-xl text-[#A388E1] shadow-sm border border-gray-100">
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                <p className={`font-semibold text-gray-900 text-sm ${item.capitalize ? 'capitalize' : ''}`}>
                                  {item.value || 'Not provided'}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {[
                    { to: "/dashboard", icon: ClipboardList, title: "My Listings", subtitle: "", badge: "2 Active" },
                    { to: "/orders", icon: Archive, title: "My Orders", subtitle: "View your past transactions" },
                    { to: "/swaps", icon: RefreshCw, title: "My Swaps", subtitle: "Your Trade Offers & Barters" },
                    { to: "#", icon: Tag, title: "My Offers", subtitle: "Items You've Bid On", iconClass: "fill-[#6B46C1]/20" },
                    
                    // CHANGE START: Updated link destination for Wishlist
                    { to: "/wishlist", icon: Heart, title: "Wishlist", subtitle: "Saved Items", iconClass: "fill-[#6B46C1]" },
                    // CHANGE END

                    { to: "/wallet", icon: Wallet, title: "My Wallet", subtitle: "Credit Balance & Purchases" },
                    { to: "#", icon: Bell, title: "Notifications", subtitle: "Alert Settings", iconClass: "fill-[#6B46C1]" },
                    { to: "#", icon: HelpCircle, title: "Help & Support", subtitle: "Get Assistance", iconClass: "fill-[#6B46C1]/20", noBorder: true }
                  ].map((item, index) => (
                    <MotionLink 
                      key={index}
                      to={item.to}
                      whileHover={{ x: 4, backgroundColor: "#f9fafb" }}
                      whileTap={{ scale: 0.98, backgroundColor: "#f3f4f6" }}
                      className={`flex items-center justify-between p-4 group ${!item.noBorder ? 'border-b border-gray-100' : ''}`}
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
                            <span className="text-[11px] text-gray-500 font-medium mt-0.5">{item.subtitle}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6B46C1] transition-colors" />
                    </MotionLink>
                  ))}

                </div>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage;