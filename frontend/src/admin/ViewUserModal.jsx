import React from 'react';
import { X, User, Wallet, Shield, Mail, Phone, MapPin, Truck, Calendar } from 'lucide-react';

const ViewUserModal = ({ isViewUserModalOpen, setIsViewUserModalOpen, viewingUser, handleUpdateRole }) => {
  if (!isViewUserModalOpen || !viewingUser) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Modal Container */}
      <div className="bg-[#0B0F19] w-full max-w-3xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Scrollable Body */}
        <div className="overflow-y-auto admin-scroll flex-1 relative">
          
          {/* Top Banner */}
          <div className="h-32 md:h-40 bg-gradient-to-br from-[#A388E1]/20 via-purple-600/20 to-blue-600/20 relative">
            <button 
              onClick={() => setIsViewUserModalOpen(false)} 
              className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10 z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F19]/90"></div>
          </div>

          {/* Profile Content */}
          <div className="px-6 md:px-8 pb-8 -mt-16 md:-mt-20 relative z-10">
            
            {/* Header Row: Avatar & Wallet */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              {/* Avatar */}
              <div className="w-28 h-28 md:w-36 md:h-36 bg-[#111827] border-4 border-[#0B0F19] rounded-full flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
                {viewingUser.profilePic ? (
                  <img src={viewingUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 md:w-16 md:h-16 text-gray-500" />
                )}
              </div>

              {/* Balance Badge */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-md w-fit mt-2 md:mt-0">
                <div className="bg-yellow-500/20 p-2 rounded-xl border border-yellow-500/30 shrink-0">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-widest mb-0.5">Wallet Balance</p>
                  <p className="text-xl md:text-2xl font-black text-yellow-400 leading-none">{viewingUser.account_credits || 0}</p>
                </div>
              </div>
            </div>

            {/* Name & Role */}
            <div className="mt-5 md:mt-6">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {viewingUser.full_name}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg mt-3 border shadow-sm ${
                viewingUser.role === 'admin' 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {viewingUser.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                Role: {viewingUser.role}
              </span>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-8">
              
              <div className="flex gap-4 items-start bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm font-semibold text-gray-200 truncate" title={viewingUser.email}>
                    {viewingUser.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                  <Phone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-200">
                    {viewingUser.phone || <span className="text-gray-600 italic">Not provided</span>}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shrink-0">
                  <MapPin className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-200 capitalize">
                    {viewingUser.city || <span className="text-gray-600 italic">Not provided</span>}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shrink-0">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Joined Platform</p>
                  <p className="text-sm font-semibold text-gray-200">
                    {new Date(viewingUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white/[0.02] hover:bg-white/[0.04] p-4 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-all md:col-span-2">
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shrink-0">
                  <Truck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Shipping / Pickup Address</p>
                  <p className="text-sm font-semibold text-gray-200 capitalize leading-relaxed">
                    {viewingUser.pickupAddress?.addressLine 
                      ? `${viewingUser.pickupAddress.addressLine}, ${viewingUser.pickupAddress.city}, ${viewingUser.pickupAddress.state} - ${viewingUser.pickupAddress.pincode}` 
                      : <span className="text-gray-600 italic">No shipping address provided yet.</span>}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="p-4 md:p-5 border-t border-white/10 bg-[#0B0F19] flex justify-end gap-3 shrink-0">
          <button 
            onClick={() => handleUpdateRole(viewingUser._id, viewingUser.role)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/[0.05] hover:text-white hover:bg-white/[0.1] border border-white/10 transition-all shadow-sm"
          >
            {viewingUser.role === 'admin' ? "Remove Admin Access" : "Make Admin"}
          </button>
          <button 
            onClick={() => setIsViewUserModalOpen(false)} 
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#A388E1] hover:bg-[#8c67d6] text-white transition-all shadow-[0_0_15px_rgba(163,136,225,0.3)] border border-white/10"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewUserModal;