import React from 'react';
import { Coins, ToggleRight, ToggleLeft, Package, List, Gift, Users, Target, Truck, Zap, IndianRupee, Clock, AlertTriangle, Settings, Image as ImageIcon, Bot, Cpu, Database, MessageSquare, Mail, MonitorSmartphone, UploadCloud } from 'lucide-react';

const SettingsPanel = ({ activeTab, creditSettings, setCreditSettings, aiSettings, setAiSettings, handleSaveSettings, updating, handleImageSelect, isUploadingHero, isUploadingHowItWorks }) => {
  
  const getTabTitle = () => {
    switch(activeTab) {
      case 'settings-credits': 
      case 'settings': 
        return { title: 'Credits & Bonuses', sub: 'Manage listing rewards & welcome gifts' };
      case 'settings-ui': 
        return { title: 'Platform UI & Display', sub: 'Manage visual elements and layout toggle' };
      case 'settings-referrals': 
        return { title: 'Referral System', sub: 'Configure refer & earn milestones' };
      case 'settings-shipping': 
        return { title: 'Shipping Rules', sub: 'Set flat rates or dynamic APIs' };
      case 'settings-orders': 
        return { title: 'Order & Aura', sub: 'Manage automated limits and penalties' };
      
      case 'settings-ai': 
        return { title: 'AI Training Controls', sub: 'Manage models and automated learning batches' };
      default: 
        return { title: 'Platform Configurations', sub: 'Manage Rules, Limits & Rewards' };
    }
  };

  const currentInfo = getTabTitle();

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto admin-scroll relative">

      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 md:w-96 md:h-96 bg-blue-600/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto bg-white/[0.02] rounded-3xl md:rounded-[2rem] border border-white/10 p-5 md:p-8 lg:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 md:mb-10 border-b border-white/10 pb-5 md:pb-6">
          <div className={`p-3 md:p-3.5 rounded-xl md:rounded-2xl border inline-flex w-fit shrink-0 ${activeTab === 'settings-ai' ? 'bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : activeTab === 'settings-ui' ? 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.15)]'}`}>
            {activeTab === 'settings-ai' ? (
              <Bot className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
            ) : activeTab === 'settings-ui' ? (
              <MonitorSmartphone className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
            ) : (
              <Settings className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight leading-tight">
              {currentInfo.title}
            </h2>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
              {currentInfo.sub}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSaveSettings} className="space-y-8 md:space-y-10 relative z-10">
          
          {/* ===================== TAB 1: CREDITS & BONUS ===================== */}
          {(activeTab === 'settings-credits' || activeTab === 'settings') && (
            <>
              {/* Free Credits Section */}
              <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setCreditSettings({ ...creditSettings, isCreditSystemEnabled: !creditSettings.isCreditSystemEnabled })}>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable Free Credits</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned off, users will not receive any credits for listing new products.</p>
                  </div>
                  {creditSettings.isCreditSystemEnabled ? (
                    <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
                  <div className="space-y-2 md:space-y-2.5">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credits Per Listing</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Coins className="w-4 h-4 text-yellow-400 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        value={creditSettings.creditsPerListing} 
                        onChange={(e) => setCreditSettings({...creditSettings, creditsPerListing: Number(e.target.value)})} 
                        disabled={!creditSettings.isCreditSystemEnabled} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Amount awarded upon approval.</p>
                  </div>

                  <div className="space-y-2 md:space-y-2.5">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Rewarded Limit</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Package className="w-4 h-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        value={creditSettings.maxListingsRewarded} 
                        onChange={(e) => setCreditSettings({...creditSettings, maxListingsRewarded: Number(e.target.value)})} 
                        disabled={!creditSettings.isCreditSystemEnabled} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Listings eligible for reward.</p>
                  </div>

                  <div className="space-y-2 md:space-y-2.5">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Allowed</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <List className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        value={creditSettings.maxAllowedListings || 5} 
                        onChange={(e) => setCreditSettings({...creditSettings, maxAllowedListings: Number(e.target.value)})} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Total items a user can list.</p>
                  </div>

                  <div className="space-y-2 md:space-y-2.5">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min Images Required</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <ImageIcon className="w-4 h-4 text-[#A388E1] group-focus-within:text-purple-300 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        max="5"
                        value={creditSettings.minImagesRequired || 3} 
                        onChange={(e) => setCreditSettings({...creditSettings, minImagesRequired: Number(e.target.value)})} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-[#A388E1]/50 focus:bg-black/40 transition-all shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Images required to list (1-5).</p>
                  </div>

                </div>
              </div>

              <hr className="border-white/5" />

              <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[50ms]">
                <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setCreditSettings({ ...creditSettings, isDiscountSimulationEnabled: !creditSettings.isDiscountSimulationEnabled })}>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable Smart Discounts (Visual Only)</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned on, the system will automatically display random simulated discounts (like 10%, 15%, 18% OFF) on products to make the platform look highly active and attractive.</p>
                  </div>
                  {creditSettings.isDiscountSimulationEnabled ? (
                    <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-[#A388E1] drop-shadow-[0_0_10px_rgba(163,136,225,0.4)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                  )}
                </div>
              </div>

              <hr className="border-white/5" />

              {/* Welcome Bonus Section */}
              <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setCreditSettings({ ...creditSettings, isWelcomeBonusEnabled: !creditSettings.isWelcomeBonusEnabled })}>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable Welcome Bonus</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned off, the claim bonus button will be hidden for new users.</p>
                  </div>
                  {creditSettings.isWelcomeBonusEnabled ? (
                    <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.4)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                  <div className="space-y-2 md:space-y-2.5">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bonus Amount</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <Gift className="w-4 h-4 text-pink-400 group-focus-within:text-pink-300 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        value={creditSettings.welcomeBonusAmount || 50} 
                        onChange={(e) => setCreditSettings({...creditSettings, welcomeBonusAmount: Number(e.target.value)})} 
                        disabled={!creditSettings.isWelcomeBonusEnabled} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Credits given when claimed.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===================== TAB: UI & DISPLAY ===================== */}
          {activeTab === 'settings-ui' && (
            <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setCreditSettings({ ...creditSettings, isNewUIEnabled: !creditSettings.isNewUIEnabled })}>
                <div className="flex-1">
                  <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable New Hero Banner UI</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned on, the homepage will display the new modern hero banner and trust badges instead of the old slider UI.</p>
                </div>
                {creditSettings.isNewUIEnabled ? (
                  <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] shrink-0" />
                ) : (
                  <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                )}
              </div>

              {/* Dynamic Image Uploaders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-6">
                {/* Hero Banner Upload */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <h3 className="text-xs md:text-sm font-bold text-gray-300 mb-3 uppercase tracking-widest w-full text-left">Hero Banner Image</h3>
                  
                  {/* Hero banner aspect ratio set to match Homepage exactly (approx 4:3 or slightly wider) */}
                  <div className="w-full aspect-[4/3] max-h-48 bg-black/40 rounded-xl mb-4 border border-white/10 overflow-hidden relative flex items-center justify-center">
                    {creditSettings.heroBannerImage ? (
                      <img src={creditSettings.heroBannerImage} alt="Hero Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-600" />
                    )}
                    {isUploadingHero && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                         <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-2"></div>
                         <span className="text-[10px] font-bold text-purple-300 animate-pulse">UPLOADING...</span>
                      </div>
                    )}
                  </div>
                  
                  <input type="file" id="heroBannerUpload" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'heroBanner')} disabled={isUploadingHero} />
                  <label htmlFor="heroBannerUpload" className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isUploadingHero ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'}`}>
                    <UploadCloud className="w-4 h-4" /> Change Hero Banner
                  </label>
                  <p className="text-[9px] text-gray-500 mt-2">Any resolution allowed (Auto-fits to container).</p>
                </div>

                {/* How It Works Upload */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <h3 className="text-xs md:text-sm font-bold text-gray-300 mb-3 uppercase tracking-widest w-full text-left">How Dealit Works Image</h3>
                  
                  {/* How it works is an infographic, so showing it object-contain */}
                  <div className="w-full h-48 bg-black/40 rounded-xl mb-4 border border-white/10 overflow-hidden relative flex items-center justify-center p-2">
                    {creditSettings.howItWorksImage ? (
                      <img src={creditSettings.howItWorksImage} alt="How It Works" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-600" />
                    )}
                    {isUploadingHowItWorks && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                         <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                         <span className="text-[10px] font-bold text-blue-300 animate-pulse">UPLOADING...</span>
                      </div>
                    )}
                  </div>
                  
                  <input type="file" id="howItWorksUpload" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'howItWorks')} disabled={isUploadingHowItWorks} />
                  <label htmlFor="howItWorksUpload" className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isUploadingHowItWorks ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'}`}>
                    <UploadCloud className="w-4 h-4" /> Change Guide Image
                  </label>
                  <p className="text-[9px] text-gray-500 mt-2">Tall infographics recommended. Width auto-scales.</p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: REFERRALS ===================== */}
          {activeTab === 'settings-referrals' && (
            <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setCreditSettings({ ...creditSettings, isReferralSystemEnabled: !creditSettings.isReferralSystemEnabled })}>
                <div className="flex-1">
                  <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable Refer & Earn</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned off, the referral input on sign-up and the share page will be hidden.</p>
                </div>
                {creditSettings.isReferralSystemEnabled ? (
                  <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)] shrink-0" />
                ) : (
                  <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Reward</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Gift className="w-4 h-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      value={creditSettings.referralRewardCredits || 40} 
                      onChange={(e) => setCreditSettings({...creditSettings, referralRewardCredits: Number(e.target.value)})} 
                      disabled={!creditSettings.isReferralSystemEnabled} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Credits given on 1st refer.</p>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Referral Limit</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Users className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={creditSettings.maxReferralLimit || 5} 
                      onChange={(e) => setCreditSettings({...creditSettings, maxReferralLimit: Number(e.target.value)})} 
                      disabled={!creditSettings.isReferralSystemEnabled} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Max friends user can invite.</p>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Milestone Reward</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Target className="w-4 h-4 text-yellow-400 group-focus-within:text-yellow-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      value={creditSettings.milestoneReferralReward || 100} 
                      onChange={(e) => setCreditSettings({...creditSettings, milestoneReferralReward: Number(e.target.value)})} 
                      disabled={!creditSettings.isReferralSystemEnabled} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-yellow-500/50 focus:bg-black/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Bumper prize at max limit.</p>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: SHIPPING ===================== */}
          {activeTab === 'settings-shipping' && (
            <div className="bg-white/[0.02] p-5 md:p-6 sm:p-8 rounded-2xl md:rounded-3xl border border-white/5 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-5 md:mb-6">
                <p className="font-bold text-white text-base md:text-lg tracking-tight">Shipping Settings</p>
                <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1 max-w-md leading-relaxed">Configure how shipping costs are calculated for buyers.</p>
              </div>

              {/* Shipping Method Toggles */}
              <div className="flex flex-col sm:flex-row bg-black/20 p-1.5 rounded-xl md:rounded-2xl border border-white/5 w-full mb-6 md:mb-8 shadow-inner gap-1">
                <button
                  type="button"
                  onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'flat'})}
                  className={`flex-1 py-3 px-3 md:py-3.5 md:px-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    creditSettings.shippingMethod === 'flat' 
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 md:w-4 md:h-4" /> Flat Rate
                </button>
                <button
                  type="button"
                  onClick={() => setCreditSettings({...creditSettings, shippingMethod: 'dynamic'})}
                  className={`flex-1 py-3 px-3 md:py-3.5 md:px-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    creditSettings.shippingMethod === 'dynamic' 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 md:w-4 md:h-4" /> Dynamic API
                </button>
              </div>

              {/* Conditional Form Fields */}
              <div className="bg-white/[0.01] p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 shadow-inner">
                {creditSettings.shippingMethod === 'flat' ? (
                  <div className="space-y-2 md:space-y-3 max-w-sm">
                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Flat Shipping Cost (₹)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                        <IndianRupee className="w-4 h-4 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
                      </div>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        value={creditSettings.flatShippingCost !== undefined ? creditSettings.flatShippingCost : 60} 
                        onChange={(e) => setCreditSettings({...creditSettings, flatShippingCost: Number(e.target.value)})} 
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-indigo-500/50 focus:bg-black/40 transition-all shadow-inner" 
                      />
                    </div>
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider mt-1.5 md:mt-2 leading-relaxed">This fixed amount will be charged on all orders. Set to 0 for platform-wide free shipping.</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-emerald-500/10 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-emerald-500/20 shrink-0 mt-0.5 md:mt-1">
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-emerald-100 font-bold text-xs md:text-sm tracking-wide">Dynamic Calculation Active</h4>
                        <p className="text-gray-400 text-[10px] md:text-xs mt-1 md:mt-1.5 leading-relaxed">
                          Shipping cost is now calculated in real-time based on the item's weight and the distance between the seller's pickup address and the buyer's delivery pincode.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-4">
                      <div className="p-3 md:p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg md:rounded-xl flex-1 flex items-start gap-2">
                         <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                         <p className="text-yellow-500/90 text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                           Ensure Shiprocket credentials are set securely in your backend .env file.
                         </p>
                      </div>
                      <div className="p-3 md:p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg md:rounded-xl flex-1 flex items-start gap-2">
                         <Package className="w-4 h-4 text-blue-400 shrink-0" />
                         <p className="text-blue-400/90 text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                           Requires sellers to input exact weight & box dimensions while listing items.
                         </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: ORDERS & AURA ===================== */}
          {activeTab === 'settings-orders' && (
            <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {/* ---> WHATSAPP MODIFICATION START */}
                <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]" onClick={() => setCreditSettings({ ...creditSettings, isWhatsAppNotificationEnabled: !creditSettings.isWhatsAppNotificationEnabled })}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <p className="font-bold text-emerald-100 text-base md:text-lg tracking-tight">WhatsApp Alerts</p>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-400 max-w-md leading-relaxed">Send real-time WhatsApp updates for deals.</p>
                  </div>
                  {creditSettings.isWhatsAppNotificationEnabled ? (
                    <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                  )}
                </div>
                {/* ---> WHATSAPP MODIFICATION END */}

                {/* ---> EMAIL MODIFICATION START */}
                <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4 shadow-[0_0_20px_rgba(59,130,246,0.05)] mt-4 md:mt-0" onClick={() => setCreditSettings({ ...creditSettings, isEmailNotificationEnabled: !creditSettings.isEmailNotificationEnabled })}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <p className="font-bold text-blue-100 text-base md:text-lg tracking-tight">Email Alerts</p>
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-400 max-w-md leading-relaxed">Send automated emails for order notifications and updates.</p>
                  </div>
                  {creditSettings.isEmailNotificationEnabled ? (
                    <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] shrink-0" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                  )}
                </div>
                {/* ---> EMAIL MODIFICATION END */}
              </div>

              <div className="bg-white/[0.02] p-5 md:p-6 sm:p-8 rounded-2xl md:rounded-3xl border border-white/5 flex flex-col justify-between">
                <div className="mb-5 md:mb-6">
                  <p className="font-bold text-white text-base md:text-lg tracking-tight">Order Management</p>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1 max-w-md leading-relaxed">Configure automated rules and aura points for orders on the platform.</p>
                </div>

                <div className="bg-white/[0.01] p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                    
                    {/* Auto-Cancel Timer */}
                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Auto-Cancel Timer
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-xs font-bold group-focus-within:text-white transition-colors">Hr</span>
                        </div>
                        <input 
                          type="number" 
                          required 
                          min="1" 
                          value={creditSettings.autoCancelHours !== undefined ? creditSettings.autoCancelHours : 24} 
                          onChange={(e) => setCreditSettings({...creditSettings, autoCancelHours: Number(e.target.value)})} 
                          className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-white/50 focus:bg-black/40 transition-all shadow-inner" 
                        />
                      </div>
                      <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider mt-1.5 md:mt-2 leading-relaxed">
                        Pending orders older than this will be auto-cancelled.
                      </p>
                    </div>

                    {/* Delivery Reward */}
                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-emerald-400" /> Delivery Reward (Aura)
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                          <span className="text-emerald-500 text-xs font-bold group-focus-within:text-emerald-400 transition-colors">+</span>
                        </div>
                        <input 
                          type="number" 
                          required 
                          min="0" 
                          value={creditSettings.auraReward !== undefined ? creditSettings.auraReward : 50} 
                          onChange={(e) => setCreditSettings({...creditSettings, auraReward: Number(e.target.value)})} 
                          className="w-full bg-black/20 border border-emerald-500/10 rounded-xl pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-3.5 text-emerald-100 text-xs md:text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-emerald-900/10 transition-all shadow-inner" 
                        />
                      </div>
                      <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider mt-1.5 md:mt-2 leading-relaxed">
                        Aura points awarded to seller on successful delivery.
                      </p>
                    </div>

                    {/* Cancel Penalty */}
                    <div className="space-y-2 md:space-y-3">
                      <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Cancel Penalty (Aura)
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                          <span className="text-red-500 text-xs font-bold group-focus-within:text-red-400 transition-colors">-</span>
                        </div>
                        <input 
                          type="number" 
                          required 
                          min="0" 
                          value={creditSettings.auraPenalty !== undefined ? creditSettings.auraPenalty : 50} 
                          onChange={(e) => setCreditSettings({...creditSettings, auraPenalty: Number(e.target.value)})} 
                          className="w-full bg-black/20 border border-red-500/10 rounded-xl pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-3.5 text-red-100 text-xs md:text-sm font-bold focus:outline-none focus:border-red-500/50 focus:bg-red-900/10 transition-all shadow-inner" 
                        />
                      </div>
                      <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider mt-1.5 md:mt-2 leading-relaxed">
                        Aura points deducted for late dispatch or cancellation.
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 5: AI TRAINING SETTINGS ===================== */}
          {activeTab === 'settings-ai' && (
            <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-white/[0.02] p-4 md:p-6 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors gap-3 md:gap-4" onClick={() => setAiSettings({ ...aiSettings, isAutoTrainingEnabled: !aiSettings.isAutoTrainingEnabled })}>
                <div className="flex-1">
                  <p className="font-bold text-white text-base md:text-lg tracking-tight">Enable Auto-Training Pipeline</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 max-w-md leading-relaxed">If turned on, background cron jobs will clean data logs and automatically trigger model fine-tuning when the batch size target is reached.</p>
                </div>
                {aiSettings?.isAutoTrainingEnabled ? (
                  <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] shrink-0" />
                ) : (
                  <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-gray-600 shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                
                {/* Active Model Input */}
                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Model ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Cpu className="w-4 h-4 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={aiSettings?.activeModelId || ''} 
                      onChange={(e) => setAiSettings({...aiSettings, activeModelId: e.target.value})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all shadow-inner placeholder:text-gray-600" 
                      placeholder="e.g. llama-3.3-70b-versatile"
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Primary AI model used for user chat.</p>
                </div>

                {/* Fallback Model Input */}
                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fallback Model ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Bot className="w-4 h-4 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      required 
                      value={aiSettings?.fallbackModelId || ''} 
                      onChange={(e) => setAiSettings({...aiSettings, fallbackModelId: e.target.value})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-purple-500/50 focus:bg-black/40 transition-all shadow-inner placeholder:text-gray-600" 
                      placeholder="e.g. llama-3.1-8b-instant"
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Used if the primary active model fails.</p>
                </div>

                {/* Batch Size Input */}
                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Training Batch Size</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Database className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="10" 
                      value={aiSettings?.batchSize !== undefined ? aiSettings.batchSize : 500} 
                      onChange={(e) => setAiSettings({...aiSettings, batchSize: Number(e.target.value)})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Number of cleaned logs needed to train.</p>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cleaner Interval (Mins)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Clock className="w-4 h-4 text-orange-400 group-focus-within:text-orange-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={aiSettings?.cleanerInterval !== undefined ? aiSettings.cleanerInterval : 15} 
                      onChange={(e) => setAiSettings({...aiSettings, cleanerInterval: Number(e.target.value)})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Execution gap for cleaning background charts logs.</p>
                </div>

                <div className="space-y-2 md:space-y-2.5">
                  <label className="block text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Polling (Mins)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <Clock className="w-4 h-4 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                    </div>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      value={aiSettings?.pollingInterval !== undefined ? aiSettings.pollingInterval : 5} 
                      onChange={(e) => setAiSettings({...aiSettings, pollingInterval: Number(e.target.value)})} 
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 md:pl-11 pr-3 md:pr-4 py-3 md:py-3.5 text-white text-xs md:text-sm font-bold focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all shadow-inner" 
                    />
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Polling loop timer to verify training completion.</p>
                </div>

              </div>
            </div>
          )}

          
          <div className="pt-6 md:pt-8 border-t border-white/5 flex justify-end mt-auto">
             <button type="submit" disabled={updating} className={`w-full sm:w-auto px-6 md:px-10 py-3.5 md:py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs ${updating ? 'bg-purple-600/30 text-white/50 cursor-not-allowed border border-purple-500/20' : 'bg-gradient-to-r from-[#A388E1] to-purple-600 hover:from-purple-500 hover:to-indigo-600 text-white shadow-[0_0_20px_rgba(163,136,225,0.4)] border border-[#A388E1]/50 hover:scale-105 active:scale-95'}`}>
               {updating ? 'Saving...' : 'Save All Settings'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPanel;