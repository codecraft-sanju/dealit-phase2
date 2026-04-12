import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, X, Gift, Sparkles, Coins, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const PromoAlert = ({ user, hasZeroPriceIssue }) => {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkPromoEligibility = async () => {
      if (!user) return;
      if (hasZeroPriceIssue !== false) return; 
      if (location.pathname.includes('/login') || location.pathname.includes('/signup')) return;

      const promoShown = sessionStorage.getItem('promo_shown');
      if (promoShown === 'true') return;

      if ((user.listedProductsCount || 0) >= 2) return;

      try {
        const res = await axios.get(`${API_URL}/admin/public-settings`);
        
        let finalSettings = {
          isCreditSystemEnabled: true,
          creditsPerListing: 50,
          isReferralSystemEnabled: true,
          referralRewardCredits: 40
        };

        if (res.data.success && res.data.data) {
          const fetchedSettings = res.data.data;
          finalSettings = {
            isCreditSystemEnabled: fetchedSettings.isCreditSystemEnabled ?? true,
            creditsPerListing: fetchedSettings.creditsPerListing || 50,
            isReferralSystemEnabled: fetchedSettings.isReferralSystemEnabled ?? true,
            referralRewardCredits: fetchedSettings.referralRewardCredits || 40
          };
        }

        if (!finalSettings.isCreditSystemEnabled && !finalSettings.isReferralSystemEnabled) {
          return;
        }

        setSettings(finalSettings);
        setShow(true);
        sessionStorage.setItem('promo_shown', 'true'); 
      } catch (err) {
        console.error("Failed to load promo settings, using defaults");
        setSettings({
          isCreditSystemEnabled: true,
          creditsPerListing: 50,
          isReferralSystemEnabled: true,
          referralRewardCredits: 40
        });
        setShow(true);
        sessionStorage.setItem('promo_shown', 'true');
      }
    };

    if (hasZeroPriceIssue === false) {
      const timer = setTimeout(checkPromoEligibility, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasZeroPriceIssue, location.pathname]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
    }, 300);
  };

  if (!show || !settings) return null;
  if (!settings.isCreditSystemEnabled && !settings.isReferralSystemEnabled) return null;

  return (
    <div 
      onClick={handleClose}
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'} duration-300`}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-gradient-to-b from-gray-800 to-gray-900 border border-emerald-500/30 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(16,185,129,0.2)] relative overflow-hidden transform ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-8' : 'animate-in zoom-in-95 slide-in-from-bottom-8'} duration-300`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[3rem] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[3rem] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full z-20 border border-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Gift className="w-10 h-10 text-white" />
            <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
          </div>

          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Earn Free Credits!</h3>
          <p className="text-gray-400 text-sm mb-6">Kickstart your trading journey on Dealit with these exclusive rewards.</p>

          <div className="space-y-3 mb-8">
            
            {settings.isCreditSystemEnabled && (
              <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex items-center gap-4 text-left shadow-inner">
                <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">List an Item</p>
                  <p className="text-gray-400 text-xs mt-0.5">Get <strong className="text-blue-400">{settings.creditsPerListing} credits</strong> when approved</p>
                </div>
              </div>
            )}

            {settings.isReferralSystemEnabled && (
              <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700 flex items-center gap-4 text-left shadow-inner">
                <div className="bg-yellow-500/20 p-2.5 rounded-xl border border-yellow-500/30 shrink-0">
                  <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Refer Friends</p>
                  <p className="text-gray-400 text-xs mt-0.5">Earn <strong className="text-yellow-400">{settings.referralRewardCredits} credits</strong> per referral</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              handleClose();
              setTimeout(() => navigate('/add-item'), 300);
            }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg py-4 px-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" /> List First Item Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoAlert;