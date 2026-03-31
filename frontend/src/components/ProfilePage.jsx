import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, User, Wallet, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2, Coins, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ProfilePage = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET || 'salon_preset';
      const cloudName = import.meta.env.VITE_CLOUD_NAME || 'dvoenforj';
      
      formData.append('upload_preset', uploadPreset);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      const uploadedUrl = cloudinaryRes.data.secure_url;

      // 2. Update Backend with new URL
      const response = await axios.put(
        `${API_URL}/users/profile-pic`,
        { profilePic: uploadedUrl },
        { withCredentials: true }
      );

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, profilePic: uploadedUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-24 md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-md md:max-w-5xl md:px-4">
        
        {/* Header Section */}
        <div className="px-5 pt-6 pb-4 flex justify-between items-center md:px-0 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">My Profile</h1>
            <p className="text-sm text-gray-500 font-medium">Manage your account</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-sm font-bold transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#A388E1] animate-spin mb-4" />
            <div className="text-[#A388E1] font-bold animate-pulse">Loading profile...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
            
            {/* Main Profile Card */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100 flex flex-col">
              
              {/* Banner Background */}
              <div className="bg-gradient-to-r from-[#A388E1] to-[#b7a3eb] h-32 relative">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              </div>
              
              <div className="px-6 pb-8 relative flex-1">
                
                {/* Profile Header Area (Avatar & Wallet Pill) */}
                <div className="flex justify-between items-end -mt-12 mb-6">
                  
                  {/* Avatar with Upload */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-white rounded-[1.5rem] p-1.5 shadow-md">
                      <div className="w-full h-full bg-[#f8f6ff] rounded-[1.2rem] flex items-center justify-center overflow-hidden relative">
                        {uploadingImage ? (
                          <Loader2 className="w-8 h-8 text-[#A388E1] animate-spin" />
                        ) : profileData?.profilePic ? (
                          <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-[#A388E1]" />
                        )}
                      </div>
                    </div>
                    
                    {/* Camera Button */}
                    <label className="absolute -bottom-2 -right-2 bg-[#A388E1] p-2.5 rounded-full text-white cursor-pointer hover:bg-[#8b70ca] hover:scale-105 transition-all shadow-md border-2 border-white" title="Upload Picture">
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

                  {/* Wallet Pill */}
                  <div className="bg-[#FFF4D2] border border-[#FFE28A]/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm mb-2">
                    <div className="bg-yellow-400 p-1 rounded-full">
                      <Coins className="w-3.5 h-3.5 text-yellow-900" />
                    </div>
                    <span className="font-bold text-gray-900">{profileData?.account_credits || 0}</span>
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profileData?.full_name}</h2>
                  <div className="inline-block bg-[#EBE5F7] text-[#805ad5] text-xs font-bold px-3 py-1 rounded-full mt-2">
                    {profileData?.role?.toUpperCase() || 'USER'}
                  </div>
                </div>

                {/* Details List */}
                <div className="mt-8 space-y-1">
                  
                  <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-3 rounded-2xl text-[#A388E1]">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</p>
                      <p className="font-semibold text-gray-900 truncate text-sm">{profileData?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-3 rounded-2xl text-[#A388E1]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                      <p className="font-semibold text-gray-900 text-sm">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-3 rounded-2xl text-[#A388E1]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                      <p className="font-semibold text-gray-900 capitalize text-sm">{profileData?.city || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-3.5 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors">
                    <div className="bg-[#F8F6FF] p-3 rounded-2xl text-[#A388E1]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Member Since</p>
                      <p className="font-semibold text-gray-900 text-sm">{new Date(profileData?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Action Cards Column */}
            <div className="md:col-span-1 flex flex-col gap-4">
              
              <Link to="/dashboard" className="bg-[#F8F6FF] rounded-[2rem] border border-[#EBE5F7] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-[#A388E1]">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center justify-between">
                    My Items
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">Manage your listed items</p>
                </div>
                {/* Decorative Icon */}
                <Package className="absolute -right-4 -bottom-4 w-24 h-24 text-[#EBE5F7] opacity-50 group-hover:scale-110 transition-transform" />
              </Link>
              
              <Link to="/swaps" className="bg-[#FFF9E5] rounded-[2rem] border border-[#FFE28A]/50 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-yellow-500">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center justify-between">
                    My Swaps
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">Track your trades</p>
                </div>
                {/* Decorative Icon */}
                <RefreshCw className="absolute -right-4 -bottom-4 w-24 h-24 text-[#FFE28A] opacity-30 group-hover:scale-110 transition-transform group-hover:rotate-12" />
              </Link>

            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;