import React from 'react';
import { X, User, Wallet, Shield, Mail, Phone, MapPin, Truck, Calendar } from 'lucide-react';

const ViewUserModal = ({ isViewUserModalOpen, setIsViewUserModalOpen, viewingUser, handleUpdateRole }) => {
  if (!isViewUserModalOpen || !viewingUser) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:py-8 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 w-full max-w-2xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200 backdrop-blur-3xl">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 h-24 md:h-32 relative border-b border-white/5">
          <button onClick={() => setIsViewUserModalOpen(false)} className="absolute top-3 md:top-4 right-3 md:right-4 text-white/70 hover:text-white transition p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
        
        <div className="px-6 md:px-8 pb-6 md:pb-8 relative flex-1 overflow-y-auto admin-scroll">
          <div className="absolute -top-12 md:-top-16 left-6 md:left-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#0B0F19] border-4 border-white/10 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
              {viewingUser.profilePic ? (
                <img src={viewingUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-gray-500" />
              )}
            </div>
          </div>

          <div className="absolute top-4 md:top-6 right-6 md:right-8 bg-yellow-500/10 border border-yellow-500/20 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 shadow-[0_0_20px_rgba(234,179,8,0.1)] backdrop-blur-md">
             <Wallet className="w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
             <div>
               <p className="text-[8px] md:text-[10px] text-yellow-400/80 font-bold uppercase tracking-widest">Balance</p>
               <p className="text-lg md:text-2xl font-black text-yellow-400 leading-none">{viewingUser.account_credits || 0}</p>
             </div>
          </div>

          <div className="pt-16 md:pt-20">
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2 tracking-tight">
              {viewingUser.full_name} 
            </h2>
            <span className={`inline-flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg mt-2 md:mt-3 border shadow-sm ${
              viewingUser.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {viewingUser.role === 'admin' && <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />}
              Role: {viewingUser.role}
            </span>

            <div className="mt-6 md:mt-8 space-y-2 md:space-y-3">
              <div className="flex items-center gap-3 md:gap-4 text-gray-300 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20"><Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /></div>
                <div className="truncate">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Email Address</p>
                  <p className="text-sm md:text-base font-semibold text-gray-200 truncate">{viewingUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-gray-300 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="p-2 md:p-3 bg-emerald-500/10 rounded-lg md:rounded-xl border border-emerald-500/20"><Phone className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /></div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Phone Number</p>
                  <p className="text-sm md:text-base font-semibold text-gray-200">{viewingUser.phone || <span className="text-gray-600 italic">Not provided</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-gray-300 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="p-2 md:p-3 bg-red-500/10 rounded-lg md:rounded-xl border border-red-500/20"><MapPin className="w-4 h-4 md:w-5 md:h-5 text-red-400" /></div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Location</p>
                  <p className="text-sm md:text-base font-semibold text-gray-200 capitalize">{viewingUser.city || <span className="text-gray-600 italic">Not provided</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-gray-300 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="p-2 md:p-3 bg-indigo-500/10 rounded-lg md:rounded-xl border border-indigo-500/20"><Truck className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" /></div>
                <div className="flex-1">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Pickup Address</p>
                  <p className="text-xs md:text-sm font-semibold text-gray-200 capitalize">
                    {viewingUser.pickupAddress?.addressLine 
                      ? `${viewingUser.pickupAddress.addressLine}, ${viewingUser.pickupAddress.city}, ${viewingUser.pickupAddress.state} - ${viewingUser.pickupAddress.pincode}` 
                      : <span className="text-gray-600 italic">Not provided</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-4 text-gray-300 bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                <div className="p-2 md:p-3 bg-purple-500/10 rounded-lg md:rounded-xl border border-purple-500/20"><Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-400" /></div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Joined Platform</p>
                  <p className="text-sm md:text-base font-semibold text-gray-200">{new Date(viewingUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3 shrink-0">
          <button 
            onClick={() => handleUpdateRole(viewingUser._id, viewingUser.role)}
            className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-300 bg-white/[0.05] hover:text-white hover:bg-white/[0.1] border border-white/10 transition-all shadow-sm"
          >
            {viewingUser.role === 'admin' ? "Remove Admin" : "Make Admin"}
          </button>
          <button onClick={() => setIsViewUserModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;