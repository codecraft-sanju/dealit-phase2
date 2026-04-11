import React from 'react';
import { Coins, ToggleRight, ToggleLeft, Package, List, Gift, Users, Target, Truck, Zap ,IndianRupee} from 'lucide-react';

const SettingsPanel = ({ creditSettings, setCreditSettings, handleSaveSettings, updating }) => {
  return (
    <div className="flex-1 p-6 lg:p-10 overflow-y-auto admin-scroll relative">
      {/* Background Ambience Inside Settings */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto bg-white/[0.02] rounded-[2rem] border border-white/10 p-8 md:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <div className="p-3.5 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.15)] inline-flex w-fit">
            <Coins className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Platform Configurations</h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Manage Rules, Limits & Rewards</p>
          </div>
        </div>
        
        <form onSubmit={handleSaveSettings} className="space-y-10 relative z-10">
          
          {/* 1. Free Credits Section */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-4" onClick={() => setCreditSettings({ ...creditSettings, isCreditSystemEnabled: !creditSettings.isCreditSystemEnabled })}>
              <div>
                <p className="font-bold text-white text-lg tracking-tight">Enable Free Credits</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">If turned off, users will not receive any credits for listing new products.</p>
              </div>
              {creditSettings.isCreditSystemEnabled ? (
                <ToggleRight className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)] shrink-0" />
              ) : (
                <ToggleLeft className="w-12 h-12 sm:w-14 sm:h-14 text-gray-600 shrink-0" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Per Listing</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="w-4 h-4 text-yellow-400 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.creditsPerListing} 
                    onChange={(e) => setCreditSettings({...creditSettings, creditsPerListing: Number(e.target.value)})} 
                    disabled={!creditSettings.isCreditSystemEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Amount awarded upon approval.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Rewarded Limit</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Package className="w-4 h-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxListingsRewarded} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxListingsRewarded: Number(e.target.value)})} 
                    disabled={!creditSettings.isCreditSystemEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Listings eligible for reward (e.g., 3).</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Allowed Listings</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <List className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxAllowedListings || 5} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxAllowedListings: Number(e.target.value)})} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total items a user can list.</p>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* --- WELCOME BONUS SECTION --- */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-4" onClick={() => setCreditSettings({ ...creditSettings, isWelcomeBonusEnabled: !creditSettings.isWelcomeBonusEnabled })}>
              <div>
                <p className="font-bold text-white text-lg tracking-tight">Enable Welcome Bonus</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">If turned off, the claim bonus button will be hidden for new users.</p>
              </div>
              {creditSettings.isWelcomeBonusEnabled ? (
                <ToggleRight className="w-12 h-12 sm:w-14 sm:h-14 text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.4)] shrink-0" />
              ) : (
                <ToggleLeft className="w-12 h-12 sm:w-14 sm:h-14 text-gray-600 shrink-0" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bonus Amount</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gift className="w-4 h-4 text-pink-400 group-focus-within:text-pink-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.welcomeBonusAmount || 50} 
                    onChange={(e) => setCreditSettings({...creditSettings, welcomeBonusAmount: Number(e.target.value)})} 
                    disabled={!creditSettings.isWelcomeBonusEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Credits given when claimed.</p>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* 2. Referral System Section */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-4" onClick={() => setCreditSettings({ ...creditSettings, isReferralSystemEnabled: !creditSettings.isReferralSystemEnabled })}>
              <div>
                <p className="font-bold text-white text-lg tracking-tight">Enable Refer & Earn</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">If turned off, the referral input on sign-up and the share page will be hidden.</p>
              </div>
              {creditSettings.isReferralSystemEnabled ? (
                <ToggleRight className="w-12 h-12 sm:w-14 sm:h-14 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)] shrink-0" />
              ) : (
                <ToggleLeft className="w-12 h-12 sm:w-14 sm:h-14 text-gray-600 shrink-0" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Reward</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gift className="w-4 h-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.referralRewardCredits || 40} 
                    onChange={(e) => setCreditSettings({...creditSettings, referralRewardCredits: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Credits given on 1st refer.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Referral Limit</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxReferralLimit || 5} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxReferralLimit: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Max friends user can invite.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Milestone Reward</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Target className="w-4 h-4 text-yellow-400 group-focus-within:text-yellow-300 transition-colors" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.milestoneReferralReward || 100} 
                    onChange={(e) => setCreditSettings({...creditSettings, milestoneReferralReward: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-yellow-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bumper prize at max limit.</p>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* SHIPPING METHOD SELECTION */}
          <div className="bg-white/[0.02] p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col justify-between">
            <div className="mb-6">
              <p className="font-bold text-white text-lg tracking-tight">Shipping Settings</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md">Configure how shipping costs are calculated for buyers.</p>
            </div>

            {/* Shipping Method Toggles */}
            <div className="flex flex-col sm:flex-row bg-black/20 p-1.5 rounded-2xl border border-white/5 w-full mb-8 shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'flat'})}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  creditSettings.shippingMethod === 'flat' 
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Truck className="w-4 h-4" /> Flat Rate (Static)
              </button>
              <button
                type="button"
                onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'dynamic'})}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  creditSettings.shippingMethod === 'dynamic' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-4 h-4" /> Dynamic API (Shiprocket)
              </button>
            </div>

            {/* Conditional Form Fields */}
            <div className="bg-white/[0.01] p-6 rounded-2xl border border-white/5 shadow-inner">
              {creditSettings.shippingMethod === 'flat' ? (
                <div className="space-y-3 max-w-sm">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flat Shipping Cost (₹)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <IndianRupee className="w-4 h-4 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      value={creditSettings.flatShippingCost !== undefined ? creditSettings.flatShippingCost : 60} 
                      onChange={(e) => setCreditSettings({...creditSettings, flatShippingCost: Number(e.target.value)})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-inner" 
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-2 leading-relaxed">This fixed amount will be charged on all orders. Set to 0 for platform-wide free shipping.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0 mt-1">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-emerald-100 font-bold text-sm tracking-wide">Dynamic Calculation Active</h4>
                      <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">
                        Shipping cost is now calculated in real-time based on the item's weight and the distance between the seller's pickup address and the buyer's delivery pincode.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mt-4">
                     <p className="text-yellow-500/90 text-[11px] font-bold uppercase tracking-wider leading-relaxed">⚠️ Integration Note: To use Dynamic rates, ensure your courier aggregator API (e.g., Shiprocket) is configured in the backend.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-8 border-t border-white/5 flex justify-end">
             <button type="submit" disabled={updating} className={`px-10 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center gap-2 text-xs ${updating ? 'bg-purple-600/30 text-white/50 cursor-not-allowed border border-purple-500/20' : 'bg-gradient-to-r from-[#A388E1] to-purple-600 hover:from-purple-500 hover:to-indigo-600 text-white shadow-[0_0_25px_rgba(163,136,225,0.4)] border border-[#A388E1]/50 hover:scale-105 active:scale-95'}`}>
               {updating ? 'Saving Changes...' : 'Save All Settings'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPanel;