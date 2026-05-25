import React from 'react';
import { Link } from 'react-router-dom';
import { X, AlertCircle, Package, Coins, RefreshCw, CheckCircle2 } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import { getOptimizedCloudinaryUrl } from '../components/HomePage';
import ProductCard from '../components/ProductCard';

const TradeModal = ({
  isOpen,
  onClose,
  isLoading, 
  myItems,
  selectedMyItem,
  setSelectedMyItem,
  balanceError,
  targetValue,
  offeredValue,
  requiredCredits,
  submitting,
  onConfirm
}) => {
 
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
      
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-slate-900/50 backdrop-blur-sm sm:px-4"
        >
          <motion.div 
           
            initial={{ y: '100%', opacity: 0.5, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
           
            className="bg-white w-full max-w-lg rounded-t-[2rem] lg:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[92vh] lg:h-[88vh]"
          >
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select an Item</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Choose what you want to offer in return</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#f8f9fb]">
              {balanceError && (
                <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 mb-0.5">Trade Cannot Proceed</p>
                    <p className="text-xs text-red-600 mb-2 leading-relaxed">{balanceError}</p>
                    <Link 
                      to="/wallet" 
                      onClick={onClose} 
                      className="inline-block bg-white border border-red-200 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition mt-1"
                    >
                      Get Credits
                    </Link>
                  </div>
                </div>
              )}

          
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="bg-white rounded-[1.25rem] p-2.5 border border-slate-100 shadow-sm animate-pulse">
                      <div className="w-full aspect-square bg-slate-200/70 rounded-xl mb-3"></div>
                      <div className="px-1 mb-1 space-y-2.5">
                        <div className="h-3.5 bg-slate-200/70 rounded-md w-4/5"></div>
                        <div className="h-3 bg-slate-200/70 rounded-md w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myItems?.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-[#f8f6ff] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-[#A388E1]" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4 px-4">You don't have any items to offer yet.</p>
                  <Link to="/add-item" onClick={onClose} className="inline-block bg-[#EBE5F7] text-[#6B46C1] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#d6bcfa] transition">
                    Add an Item Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-2">
              
                  {myItems?.map(myItem => (
                    <ProductCard
                      key={myItem._id}
                      item={myItem}
                      onClick={setSelectedMyItem}
                      isSelected={selectedMyItem === myItem._id}
                    />
                  ))}
                </div>
              )}
            </div>

          
            <div className="px-5 pt-4 pb-8 lg:pb-5 border-t border-slate-100 bg-white flex flex-col gap-3 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
              
              {selectedMyItem && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {requiredCredits > 0 ? (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <RefreshCw className="w-4 h-4 text-[#6B46C1]" />
                        <span className="font-bold text-slate-900">Trade Summary</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Target item is <span className="font-bold text-slate-900">{targetValue} Credits</span>. Your offer is <span className="font-bold text-slate-900">{offeredValue} Credits</span>. 
                        If accepted, <span className="font-bold text-[#6B46C1]">{requiredCredits} Credits</span> will be deducted.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#E6F4EA] border border-[#CEEAD6] p-3 rounded-xl shadow-sm text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                        <span className="font-bold text-[#137333]">Fair Trade Match!</span>
                      </div>
                      <p className="text-[#137333]/80 text-xs">No extra credits will be required for this swap.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  disabled={!selectedMyItem || submitting}
                  className={`flex-[2] px-4 py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    !selectedMyItem || submitting 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-[#6B46C1] hover:bg-[#5a3aa8] text-white shadow-lg shadow-[#6B46C1]/20 active:scale-[0.98]'
                  }`}
                >
                  {submitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    'Confirm Offer'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeModal;