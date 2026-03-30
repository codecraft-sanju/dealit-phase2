import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, User, Wallet, Mail, Phone, MapPin, Calendar, Package, RefreshCw, Camera, Loader2 } from 'lucide-react';
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
      
      // Fallback strings added just in case env variables are missing
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
        // Update local state to show new image immediately
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
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400 text-base sm:text-lg">Manage your account and items here.</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold transition border border-red-500/20 w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 animate-pulse py-10 font-medium">Loading profile details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Profile Card */}
          <div className="lg:col-span-2 bg-gray-800 rounded-3xl border border-gray-700 shadow-xl overflow-hidden">
            {/* Banner Background */}
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 h-28 sm:h-32"></div>
            
            <div className="px-6 sm:px-8 pb-8 relative">
              
              {/* Profile Avatar with Upload Button */}
              <div className="absolute -top-12 sm:-top-16 left-6 sm:left-8">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gray-900 border-4 border-gray-800 rounded-full flex items-center justify-center shadow-xl group transition-all">
                  
                  {uploadingImage ? (
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-spin" />
                  ) : profileData?.profilePic ? (
                    <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-400" />
                  )}

                  {/* Camera Icon - Positioned at bottom right */}
                  <label className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-emerald-500 p-2 rounded-full text-white cursor-pointer hover:bg-emerald-600 hover:scale-110 transition shadow-lg border-4 border-gray-800" title="Upload Profile Picture">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>
              
              {/* Wallet Info Container */}
              <div className="absolute top-4 right-4 sm:right-8 bg-yellow-500/10 border border-yellow-500/20 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                 <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                 <div>
                   <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider hidden sm:block">My Wallet</p>
                   <p className="text-base sm:text-lg font-bold text-yellow-500 leading-none">{profileData?.account_credits || 0} <span className="text-xs font-medium">Credits</span></p>
                 </div>
              </div>

              {/* User Info */}
              <div className="pt-16 sm:pt-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{profileData?.full_name}</h2>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-md mt-2 border border-emerald-500/20">
                  {profileData?.role}
                </span>

                <div className="mt-8 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-xs text-gray-500 font-medium">Email Address</p>
                      <p className="font-medium truncate">{profileData?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                      <p className="font-medium">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-medium capitalize">{profileData?.city || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Member Since</p>
                      <p className="font-medium">{new Date(profileData?.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards (Items & Swaps) */}
          <div className="flex flex-col gap-6">
            <Link to="/dashboard" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-emerald-500/50 transition group flex flex-col items-center justify-center text-center h-full min-h-[220px]">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition border border-emerald-500/20">
                <Package className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">My Items</h3>
              <p className="text-sm text-gray-400">View, edit, or check the status of your listed items.</p>
            </Link>
            
            <Link to="/swaps" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-[#f97316]/50 transition group flex flex-col items-center justify-center text-center h-full min-h-[220px]">
              <div className="w-16 h-16 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition border border-[#f97316]/20">
                <RefreshCw className="w-8 h-8 text-[#f97316]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#f97316] transition">My Swaps</h3>
              <p className="text-sm text-gray-400">Check incoming requests and track your ongoing trades.</p>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProfilePage;