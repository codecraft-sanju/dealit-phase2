import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, User, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2, Coins, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ProfilePage = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State to track if the page is scrolled
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // DEBUG ADDED: Log API URL
        console.log("Fetching profile from:", `${API_URL}/users/profile`);
        
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        
        // DEBUG ADDED: Log response data
        console.log("Profile Data received:", response.data);
        
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // DEBUG ADDED: Alert to show exact error on iOS screen
        alert(`Profile Fetch Error: ${error.message} | Status: ${error.response?.status}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Listen for scroll events to shrink the header
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
    
    // DEBUG ADDED: Log selected file
    console.log("Selected file:", file);
    
    if (!file) {
      alert("No file selected!"); // DEBUG ADDED
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET || 'salon_preset';
      const cloudName = import.meta.env.VITE_CLOUD_NAME || 'dvoenforj';
      
      formData.append('upload_preset', uploadPreset);

      // DEBUG ADDED: Alert before Cloudinary upload
      console.log("Uploading to Cloudinary...");

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      // DEBUG ADDED: Log Cloudinary response
      console.log("Cloudinary response:", cloudinaryRes.data);
      
      const uploadedUrl = cloudinaryRes.data.secure_url;

      // DEBUG ADDED: Check before sending to backend
      console.log("Sending URL to backend:", uploadedUrl);

      const response = await axios.put(
        `${API_URL}/users/profile-pic`,
        { profilePic: uploadedUrl },
        { withCredentials: true }
      );

      // DEBUG ADDED: Log backend response
      console.log("Backend response:", response.data);

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, profilePic: uploadedUrl }));
        alert("Image uploaded successfully!"); // DEBUG ADDED
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // DEBUG ADDED: Detailed alert for iOS
      alert(`Upload Failed: ${error.message}\nDetails: ${JSON.stringify(error.response?.data || 'No extra data')}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative">
      
      {/* CHANGE START: Fixed Sticky Header Mirroring DealDetailsPage */}
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
            className={`flex items-center gap-2 bg-white/10 hover:bg-red-500 rounded-full font-bold transition-all duration-300 shadow-sm border border-white/20 hover:border-red-500 ${
              isScrolled ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
            }`}
          >
            <LogOut className={`transition-all duration-300 ${isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} /> 
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      {/* CHANGE END */}

      {/* Decorative curved background (behind the main card) */}
      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

      {/* Main Content Container with top padding to offset the fixed header */}
      <div className="max-w-md mx-auto md:max-w-7xl px-5 md:px-8 pt-28 relative z-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-pulse">
            
            {/* Skeleton Profile Card */}
            <div className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-[1.5rem] mb-4"></div>
              <div className="h-6 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded-lg mb-4"></div>
              <div className="flex gap-2 w-full justify-center mt-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            </div>

            {/* Skeleton Details & Actions Column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              
              {/* Skeleton Account Details */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                <div className="h-5 w-1/3 bg-gray-200 rounded-lg mb-6 px-2"></div>
                <div className="space-y-6 px-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded-md"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skeleton Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 h-[116px] shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3"></div>
                    <div>
                      <div className="h-4 w-20 bg-gray-200 rounded-md mb-2"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            
            {/* Primary Profile Card (Overlapping the banner) */}
            <div className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
              
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-white rounded-[1.5rem] p-1.5 shadow-sm border border-gray-100">
                  <div className="w-full h-full bg-[#f8f6ff] rounded-[1.2rem] flex items-center justify-center overflow-hidden">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-[#A388E1] animate-spin" />
                    ) : profileData?.profilePic ? (
                      <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-[#A388E1]" />
                    )}
                  </div>
                </div>
                
                <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#805ad5] to-[#6B46C1] p-2.5 rounded-full text-white cursor-pointer hover:shadow-lg transition-all shadow-md border-2 border-white">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              {/* User Identity */}
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{profileData?.full_name}</h2>
              <p className="text-sm text-gray-500 font-medium mb-3">{profileData?.email}</p>

              {/* Role & Credits Badges */}
              <div className="flex items-center gap-2 justify-center w-full mt-2">
                <div className="bg-[#EBE5F7] text-[#6B46C1] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {profileData?.role || 'USER'}
                </div>
                <div className="bg-[#FFF4D2] border border-[#FFE28A]/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Coins className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-[11px] font-bold text-gray-900">{profileData?.account_credits || 0} Credits</span>
                </div>
              </div>
            </div>

            {/* Details & Actions Column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              
              {/* Info Details Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 px-2">Account Details</h3>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-4 py-3 hover:bg-gray-50/80 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-2.5 rounded-xl text-[#A388E1]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                      <p className="font-semibold text-gray-900 text-sm">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3 hover:bg-gray-50/80 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-2.5 rounded-xl text-[#A388E1]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                      <p className="font-semibold text-gray-900 capitalize text-sm">{profileData?.city || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3 hover:bg-gray-50/80 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-2.5 rounded-xl text-[#A388E1]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Member Since</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Link to="/dashboard" className="bg-[#F8F6FF] rounded-3xl border border-[#EBE5F7] p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm text-[#A388E1]">
                      <Package className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center justify-between">
                      My Items
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">Manage listings</p>
                  </div>
                  <Package className="absolute -right-3 -bottom-3 w-20 h-20 text-[#EBE5F7] opacity-60 group-hover:scale-110 transition-transform" />
                </Link>
                
                <Link to="/swaps" className="bg-[#FFF9E5] rounded-3xl border border-[#FFE28A]/50 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm text-yellow-500">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center justify-between">
                      My Swaps
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                    </h3>
                    <p className="text-[11px] text-gray-600 font-medium">Track trades</p>
                  </div>
                  <RefreshCw className="absolute -right-3 -bottom-3 w-20 h-20 text-[#FFE28A] opacity-30 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </Link>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;