import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Check, ArrowLeft, MessageSquare, Package, User, ShieldAlert, Phone, Calendar, Copy } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const DealDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDealDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/barter/${id}`, { withCredentials: true });
        if (response.data.success) {
          setDeal(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching deal:', err);
        setError('Failed to load deal details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDealDetails();
  }, [id]);

  const handleCopyId = () => {
    if (deal) {
      navigator.clipboard.writeText(deal._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center font-bold text-[#6B46C1]">Loading Deal Details...</div>;
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">{error || 'Deal not found'}</h2>
        <button onClick={() => navigate('/swaps')} className="bg-[#6B46C1] text-white px-6 py-2 rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const isRequester = user._id === deal.requester._id;
  
  const counterpart = isRequester ? deal.owner : deal.requester;
  const counterpartItem = isRequester ? deal.item : deal.offered_item;
  const myItem = isRequester ? deal.offered_item : deal.item;

  const dealDate = new Date(deal.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const whatsappMessage = `Hi ${counterpart.full_name}! 👋\n\nWe just locked a deal on *Dealit*! 🎉\n\nI will be exchanging my *${myItem.title}* for your *${counterpartItem.title}*.\n\nLet me know how you would like to proceed with the exchange. We can plan a meetup or coordinate via courier, whichever works best for you. Let's discuss!\n\nDeal ID: #${deal._id.substring(0, 8)}`;

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative">
      
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] px-5 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/swaps')} 
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white leading-tight">Deal Summary</h1>
            <div className="flex items-center gap-1.5 text-purple-200">
              <p className="text-xs font-medium">#{deal._id.substring(0, 8)}</p>
              <button onClick={handleCopyId} className="hover:text-white transition-colors" title="Copy Deal ID">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Decorative curved background (behind the main card) */}
      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

      {/* Main Content Container with top padding to offset the fixed header */}
      <div className="max-w-xl mx-auto px-5 md:px-8 pt-24 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-gray-100 text-center">
          
          <div className="w-20 h-20 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
            <Check className="w-10 h-10 text-[#137333]" />
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-2">Deal Locked! 🎉</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-bold uppercase mb-4 tracking-wide">
            <Calendar className="w-4 h-4" /> 
            <span>Date: {dealDate}</span>
          </div>
          
          <p className="text-sm text-gray-500 mb-8 font-medium">
            Congratulations! The barter request has been accepted. You can now contact your exchange partner to finalize the details.
          </p>

          <div className="bg-[#fcfbff] rounded-2xl p-5 mb-6 text-left border border-[#f0eaff]">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-[#EBE5F7] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-[#6B46C1]" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-0.5">Your Partner</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{counterpart.full_name}</p>
                <p className="text-sm text-gray-600 font-medium">{counterpart.phone || 'Phone not available'}</p>
              </div>
              {counterpart.phone && (
                <a href={`tel:${counterpart.phone}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm">
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Link to={`/item/${counterpartItem._id}`} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col hover:border-purple-300 transition-colors group">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 group-hover:text-purple-500">They are bringing</p>
                <div className="h-24 w-full bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {counterpartItem.images && counterpartItem.images.length > 0 ? (
                    <img src={counterpartItem.images[0]} alt={counterpartItem.title} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-2">{counterpartItem.title}</p>
              </Link>

              <Link to={`/item/${myItem._id}`} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col hover:border-purple-300 transition-colors group">
                <p className="text-[10px] text-[#A388E1] font-bold uppercase mb-2 group-hover:text-purple-600">You are giving</p>
                <div className="h-24 w-full bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {myItem.images && myItem.images.length > 0 ? (
                    <img src={myItem.images[0]} alt={myItem.title} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-2">{myItem.title}</p>
              </Link>
            </div>

            <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm mt-4">
              <h3 className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mb-3">Swap Details & Credits</h3>
              <div className="space-y-2 text-sm text-gray-700 font-medium">
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">Value of {myItem.title}:</span>
                  <span className="whitespace-nowrap font-bold">{myItem.estimated_value || 0} 🪙</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">Value of {counterpartItem.title}:</span>
                  <span className="whitespace-nowrap font-bold">{counterpartItem.estimated_value || 0} 🪙</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                  <span>Wallet Deduction:</span>
                  <span className="font-bold text-red-500">-{deal.credits_deducted || 0} 🪙</span>
                </div>
              </div>
            </div>
            
          </div>

          {counterpart.phone ? (
            <a 
              href={`https://wa.me/${counterpart.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-lg py-4 px-4 rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 mb-4"
            >
              <MessageSquare className="w-5 h-5" /> Chat on WhatsApp
            </a>
          ) : (
            <button disabled className="w-full bg-gray-100 text-gray-400 font-bold text-lg py-4 px-4 rounded-xl cursor-not-allowed border border-gray-200 mb-4">
              No Phone Number Available
            </button>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Safety Tip</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Always meet in well-lit, public places or use trusted courier services. Thoroughly check the item condition before completing the exchange.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DealDetailsPage;