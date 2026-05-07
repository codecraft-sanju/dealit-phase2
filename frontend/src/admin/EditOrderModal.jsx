import React from 'react';
import { Truck, X } from 'lucide-react';

const EditOrderModal = ({
  isEditOrderModalOpen,
  setIsEditOrderModalOpen,
  editingOrder,
  orderForm,
  setOrderForm,
  handleOrderSubmit,
  updating
}) => {
  if (!isEditOrderModalOpen || !editingOrder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-md rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Update Order Status
          </h2>
          <button onClick={() => setIsEditOrderModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 md:p-6">
          <form id="orderForm" onSubmit={handleOrderSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Order Status</label>
              <select 
                value={orderForm.orderStatus} 
                onChange={(e) => setOrderForm({ ...orderForm, orderStatus: e.target.value })} 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs md:text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all appearance-none shadow-inner"
              >
                <option value="pending" className="bg-[#0B0F19]">Pending</option>
                <option value="processing" className="bg-[#0B0F19]">Processing</option>
                <option value="shipped" className="bg-[#0B0F19]">Shipped</option>
                <option value="delivered" className="bg-[#0B0F19]">Delivered (Will Release Escrow)</option>
                <option value="cancelled" className="bg-[#0B0F19]">Cancelled (Will Refund)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">AWB / Tracking Number</label>
              <input 
                type="text" 
                value={orderForm.awb_code} 
                onChange={(e) => setOrderForm({ ...orderForm, awb_code: e.target.value })} 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs md:text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600 font-mono"
                placeholder="e.g. AWB123456789"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Courier Company</label>
              <input 
                type="text" 
                value={orderForm.courier_company} 
                onChange={(e) => setOrderForm({ ...orderForm, courier_company: e.target.value })} 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs md:text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600"
                placeholder="e.g. Delhivery, Bluedart"
              />
            </div>
          </form>
        </div>
        
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3">
          <button type="button" onClick={() => setIsEditOrderModalOpen(false)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button 
            type="submit" 
            form="orderForm" 
            disabled={updating} 
            className={`px-5 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-blue-600/30 text-white/50 cursor-not-allowed border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50'}`}
          >
            {updating ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;