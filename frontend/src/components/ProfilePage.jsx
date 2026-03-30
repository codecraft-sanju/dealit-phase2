import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut, User, Wallet, Mail, Phone, MapPin, Calendar, Package, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ProfilePage = ({ user, onLogout }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400 text-lg">Manage your account and items here.</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl font-bold transition border border-red-500/20"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 animate-pulse py-10 font-medium">Loading profile details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 bg-gray-800 rounded-3xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 h-24"></div>
            <div className="px-8 pb-8 relative">
              <div className="w-24 h-24 bg-gray-900 border-4 border-gray-800 rounded-full flex items-center justify-center absolute -top-12 shadow-lg">
                <User className="w-10 h-10 text-emerald-400" />
              </div>
              
              <div className="absolute top-4 right-8 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                 <Wallet className="w-5 h-5 text-yellow-500" />
                 <div>
                   <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider">My Wallet</p>
                   <p className="text-lg font-bold text-yellow-500 leading-none">{profileData?.account_credits || 0} <span className="text-xs">Credits</span></p>
                 </div>
              </div>

              <div className="pt-16">
                <h2 className="text-2xl font-bold text-white">{profileData?.full_name}</h2>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-md mt-2 border border-emerald-500/20">
                  {profileData?.role}
                </span>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email Address</p>
                      <p className="font-medium">{profileData?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                      <p className="font-medium">{profileData?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-medium capitalize">{profileData?.city || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Member Since</p>
                      <p className="font-medium">{new Date(profileData?.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <Link to="/dashboard" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-emerald-500/50 transition group flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition border border-emerald-500/20">
                <Package className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">My Items</h3>
              <p className="text-sm text-gray-400">View, edit, or check the status of your listed items.</p>
            </Link>
            
            <Link to="/swaps" className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 p-8 shadow-xl hover:border-[#f97316]/50 transition group flex flex-col items-center justify-center text-center h-full">
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