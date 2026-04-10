import React from 'react';
import { Coins, ToggleRight, ToggleLeft, Package, List, Gift, Users, Target, Truck, Zap ,IndianRupee} from 'lucide-react'; // <-- NAYA CHANGE: Zap icon add kiya dynamic ke liye

const SettingsPanel = ({ creditSettings, setCreditSettings, handleSaveSettings, updating }) => {
  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto admin-scroll">
      <div className="max-w-4xl mx-auto bg-gray-800/80 rounded-[2rem] border border-gray-700 p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-700/80 pb-6">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
            <Coins className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wide">Platform Configurations</h2>
            <p className="text-sm text-gray-400 mt-1">Manage rules for user listings and credit rewards.</p>
          </div>
        </div>
        
        <form onSubmit={handleSaveSettings} className="space-y-8">
          
          {/* 1. Free Credits Section */}
          <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-700 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors" onClick={() => setCreditSettings({ ...creditSettings, isCreditSystemEnabled: !creditSettings.isCreditSystemEnabled })}>
             <div>
               <p className="font-bold text-white text-lg tracking-wide">Enable Free Credits</p>
               <p className="text-sm text-gray-400 mt-1 max-w-md">If turned off, users will not receive any credits for listing new products.</p>
             </div>
             {creditSettings.isCreditSystemEnabled ? (
               <ToggleRight className="w-14 h-14 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
             ) : (
               <ToggleLeft className="w-14 h-14 text-gray-600" />
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Credits Per Listing</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="w-5 h-5 text-yellow-500" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.creditsPerListing} 
                    onChange={(e) => setCreditSettings({...creditSettings, creditsPerListing: Number(e.target.value)})} 
                    disabled={!creditSettings.isCreditSystemEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Amount awarded upon approval.</p>
             </div>

             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Max Rewarded Limit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Package className="w-5 h-5 text-blue-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxListingsRewarded} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxListingsRewarded: Number(e.target.value)})} 
                    disabled={!creditSettings.isCreditSystemEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Listings eligible for reward (e.g., 3).</p>
             </div>

             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Max Allowed Listings</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <List className="w-5 h-5 text-emerald-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxAllowedListings || 5} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxAllowedListings: Number(e.target.value)})} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <p className="text-xs text-gray-500">Total items a user can list on platform.</p>
             </div>
          </div>

          <hr className="border-gray-700 my-4" />

          {/* --- WELCOME BONUS SECTION --- */}
          <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-700 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors" onClick={() => setCreditSettings({ ...creditSettings, isWelcomeBonusEnabled: !creditSettings.isWelcomeBonusEnabled })}>
             <div>
               <p className="font-bold text-white text-lg tracking-wide">Enable Welcome Bonus</p>
               <p className="text-sm text-gray-400 mt-1 max-w-md">If turned off, the claim bonus button will be hidden for new users.</p>
             </div>
             {creditSettings.isWelcomeBonusEnabled ? (
               <ToggleRight className="w-14 h-14 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]" />
             ) : (
               <ToggleLeft className="w-14 h-14 text-gray-600" />
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Bonus Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gift className="w-5 h-5 text-pink-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.welcomeBonusAmount || 50} 
                    onChange={(e) => setCreditSettings({...creditSettings, welcomeBonusAmount: Number(e.target.value)})} 
                    disabled={!creditSettings.isWelcomeBonusEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Credits given when user claims bonus.</p>
             </div>
          </div>

          <hr className="border-gray-700 my-4" />

          {/* 2. Referral System Section */}
          <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-700 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-colors" onClick={() => setCreditSettings({ ...creditSettings, isReferralSystemEnabled: !creditSettings.isReferralSystemEnabled })}>
             <div>
               <p className="font-bold text-white text-lg tracking-wide">Enable Refer & Earn</p>
               <p className="text-sm text-gray-400 mt-1 max-w-md">If turned off, the referral input on sign-up and the share page will be hidden.</p>
             </div>
             {creditSettings.isReferralSystemEnabled ? (
               <ToggleRight className="w-14 h-14 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
             ) : (
               <ToggleLeft className="w-14 h-14 text-gray-600" />
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">First Reward</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gift className="w-5 h-5 text-blue-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.referralRewardCredits || 40} 
                    onChange={(e) => setCreditSettings({...creditSettings, referralRewardCredits: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Credits given on 1st successful refer.</p>
             </div>

             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Max Referral Limit</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    value={creditSettings.maxReferralLimit || 5} 
                    onChange={(e) => setCreditSettings({...creditSettings, maxReferralLimit: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Max friends a user can invite for rewards.</p>
             </div>

             <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Milestone Reward</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    value={creditSettings.milestoneReferralReward || 100} 
                    onChange={(e) => setCreditSettings({...creditSettings, milestoneReferralReward: Number(e.target.value)})} 
                    disabled={!creditSettings.isReferralSystemEnabled} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
                <p className="text-xs text-gray-500">Bumper prize when max limit is reached.</p>
             </div>
          </div>

          {/* <-- NAYA CHANGE: SHIPPING METHOD SELECTION --> */}
          <hr className="border-gray-700 my-4" />

          <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-700 flex flex-col justify-between">
             <div className="mb-6">
               <p className="font-bold text-white text-lg tracking-wide">Shipping Settings</p>
               <p className="text-sm text-gray-400 mt-1 max-w-md">Configure how shipping costs are calculated for buyers.</p>
             </div>

             {/* Shipping Method Toggles */}
             <div className="flex bg-gray-800 p-1.5 rounded-2xl border border-gray-700 w-full mb-8">
                <button
                  type="button"
                  onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'flat'})}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    creditSettings.shippingMethod === 'flat' 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Truck className="w-4 h-4" /> Flat Rate (Static)
                </button>
                <button
                  type="button"
                  onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'dynamic'})}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    creditSettings.shippingMethod === 'dynamic' 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Zap className="w-4 h-4" /> Dynamic API (Shiprocket)
                </button>
             </div>

             {/* Conditional Form Fields based on Shipping Method */}
             <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50">
               {creditSettings.shippingMethod === 'flat' ? (
                 <div className="space-y-3 max-w-sm">
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Flat Shipping Cost (₹)</label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <IndianRupee className="w-5 h-5 text-indigo-400" />
                     </div>
                     <input 
                       type="number" 
                       required 
                       min="0" 
                       value={creditSettings.flatShippingCost !== undefined ? creditSettings.flatShippingCost : 60} 
                       onChange={(e) => setCreditSettings({...creditSettings, flatShippingCost: Number(e.target.value)})} 
                       className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" 
                     />
                   </div>
                   <p className="text-xs text-gray-500 mt-2">This fixed amount will be charged on all orders. Set to 0 for platform-wide free shipping.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-emerald-500/20 p-2 rounded-lg">
                        <Zap className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">Dynamic Calculation Active</h4>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                          Shipping cost is now calculated in real-time based on the item's weight and the distance between the seller's pickup address and the buyer's delivery pincode.
                        </p>
                      </div>
                    </div>
                    {/* Future me yahan Shiprocket API Keys input karne ka option banega */}
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mt-4">
                       <p className="text-yellow-500 text-xs font-bold">⚠️ Integration Note: To use Dynamic rates, ensure your courier aggregator API (e.g., Shiprocket) is configured in the backend.</p>
                    </div>
                 </div>
               )}
             </div>

          </div>

          <div className="pt-8 border-t border-gray-700 flex justify-end">
             <button type="submit" disabled={updating} className={`px-8 py-3.5 rounded-xl font-black uppercase tracking-widest transition-all flex items-center gap-2 text-sm ${updating ? 'bg-purple-600/50 text-white/50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'}`}>
               {updating ? 'Saving...' : 'Save Settings'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPanel;