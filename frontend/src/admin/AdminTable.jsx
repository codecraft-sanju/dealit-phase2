import React from 'react';
import {
  User, Shield, Check, X, Package, Eye, CheckCircle,
  Edit, Trash2, ShieldAlert, ShieldCheck
} from 'lucide-react';

const AdminTable = ({
  activeTab,
  data,
  AVAILABLE_ICONS,
  handleViewClick,
  handleApprove,
  handleRejectClick,
  handleEditOfferClick,
  handleDeleteOffer,
  handleEditCategoryClick,
  handleDeleteCategory,
  handleEditClick,
  handleDeleteItem,
  handleViewUserClick,
  handleUpdateRole,
  handleDeleteUser,
  handleEditOrderClick 
}) => {
  return (
    <div className="flex-1 overflow-auto admin-scroll rounded-xl md:rounded-2xl border border-white/5 bg-white/[0.01] relative w-full">
      <table className="w-full text-left text-xs md:text-sm text-gray-300 border-collapse min-w-max">
        
        <thead className="sticky top-0 z-20 bg-[#0B0F19]/95 backdrop-blur-xl text-gray-400 border-b border-white/10 shadow-sm">
          <tr>
            {/* ID Column - Hidden on very small mobile if needed, but keeping here as it's often small */}
            <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">ID</th>
            
            {activeTab === 'users' ? (
              <>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">User Info</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden md:table-cell">Contact</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden sm:table-cell">Location</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Role</th>
              </>
            ) : activeTab === 'offers' ? (
              <>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Banner Preview</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Status</th>
              </>
            ) : activeTab === 'categories' ? (
              <>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Category Name</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden sm:table-cell">Date Created</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Status</th>
              </>
            ) : activeTab === 'orders' ? (
              <>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Item & Price</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden md:table-cell">Parties</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden sm:table-cell">Tracking Details</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Status</th>
              </>
            ) : (
              <>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Item Details</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] hidden sm:table-cell">Category & Condition</th>
                <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Status</th>
              </>
            )}
            <th className="px-4 md:px-6 py-3 md:py-5 font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-right">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-white/5">
          {Array.isArray(data) && data.map((row) => (
            <tr key={row._id} className="hover:bg-white/[0.02] transition-colors duration-200 group">
              <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-[10px] md:text-xs text-gray-500">#{row._id.substring(0,6)}</td>
              
              {activeTab === 'users' ? (
                <>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      {row.profilePic ? (
                        <img src={row.profilePic} alt="Profile" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white/10 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 shadow-sm">
                          <User className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                      )}
                      <div className="max-w-[120px] md:max-w-[200px]">
                        <p className="font-bold text-gray-200 text-xs md:text-sm group-hover:text-white transition-colors truncate">{row.full_name}</p>
                        <p className="text-[9px] md:text-[11px] text-gray-500 mt-0.5 tracking-wide truncate">{row.email}</p>
                        {/* Mobile only fallback for phone */}
                        <p className="text-[9px] text-gray-500 md:hidden truncate">{row.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 font-medium text-[10px] md:text-xs hidden md:table-cell">{row.phone || <span className="text-gray-600 italic">Not set</span>}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 capitalize font-medium text-[10px] md:text-xs hidden sm:table-cell">{row.city || <span className="text-gray-600 italic">Unknown</span>}</td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 w-fit shadow-sm ${
                      row.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {row.role === 'admin' && <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      {row.role}
                    </span>
                  </td>
                </>
              ) : activeTab === 'offers' ? (
                <>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap sm:flex-nowrap">
                      {/* Desktop Preview */}
                      <div className="relative group/img">
                        <div className="w-24 md:w-32 h-10 md:h-14 bg-white/5 rounded-lg overflow-hidden border border-white/10 shadow-sm">
                          <img src={row.desktopImage} alt="Desktop" className={`w-full h-full object-cover ${!row.isActive ? 'grayscale opacity-50' : ''}`} />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-[#0B0F19] text-[7px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded text-gray-300 border border-white/10">Desktop</span>
                      </div>
                      
                      {/* Mobile Preview */}
                      <div className="relative group/img">
                        <div className="w-10 md:w-14 h-10 md:h-14 bg-white/5 rounded-lg overflow-hidden border border-white/10 shadow-sm">
                          <img src={row.mobileImage} alt="Mobile" className={`w-full h-full object-cover ${!row.isActive ? 'grayscale opacity-50' : ''}`} />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-[#0B0F19] text-[7px] md:text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded text-gray-300 border border-white/10">Mobile</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 w-fit shadow-sm ${
                      row.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {row.isActive ? <Check className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <X className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      {row.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                </>
              ) : activeTab === 'categories' ? (
                <>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      {(() => {
                        const match = AVAILABLE_ICONS.find(i => i.name === row.icon);
                        const IconComp = match ? match.icon : Package;
                        return (
                          <div className="p-1.5 md:p-2 bg-white/[0.02] rounded-lg md:rounded-xl border border-white/10 shadow-sm">
                            <IconComp className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                          </div>
                        );
                      })()}
                      <span className="font-bold text-gray-200 text-xs md:text-sm group-hover:text-white transition-colors">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 text-[10px] md:text-xs font-medium hidden sm:table-cell">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 w-fit shadow-sm ${
                      row.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {row.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </>
              ) : activeTab === 'orders' ? ( 
                <>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <p className="font-bold text-gray-200 text-xs md:text-sm truncate max-w-[120px] md:max-w-[150px]" title={row.item?.title}>{row.item?.title || 'Unknown Item'}</p>
                    <p className="text-[9px] md:text-[11px] text-emerald-400 font-bold mt-1">₹{row.totalAmount} Total</p>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                    <p className="text-[9px] md:text-[10px] text-gray-400"><span className="font-bold text-blue-400">Buyer:</span> {row.buyer?.full_name}</p>
                    <p className="text-[9px] md:text-[10px] text-gray-400 mt-1"><span className="font-bold text-purple-400">Seller:</span> {row.seller?.full_name}</p>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                     <p className="text-[9px] md:text-[11px] text-gray-300 font-mono">{row.trackingDetails?.awb_code || <span className="text-gray-500 italic">No AWB Assigned</span>}</p>
                     <p className="text-[8px] md:text-[10px] text-gray-500 uppercase mt-0.5 font-bold tracking-wider">{row.trackingDetails?.courier_company || 'Pending'}</p>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 w-fit shadow-sm border ${
                      row.orderStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      row.orderStatus === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      (row.orderStatus === 'shipped' || row.orderStatus === 'in_transit') ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {row.orderStatus}
                    </span>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-2 md:gap-4">
                      {row.images && row.images.length > 0 && row.images[0] ? (
                        <img src={row.images[0]} alt="item" className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 object-cover border border-white/10 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-sm">
                          <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="max-w-[120px] md:max-w-[200px]">
                        <p className="font-bold text-gray-200 text-xs md:text-sm truncate group-hover:text-emerald-400 transition-colors" title={row.title}>{row.title}</p>
                        <p className="text-[9px] md:text-[11px] text-gray-500 mt-0.5 md:mt-1 flex items-center gap-1 font-medium truncate">
                          <User className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" /> {row.owner?.full_name || 'Unknown'}
                        </p>
                        {/* Mobile fallback for category/condition */}
                        <p className="text-[9px] text-gray-500 sm:hidden mt-0.5 truncate">{row.category} • {row.condition}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4 hidden sm:table-cell">
                    <span className="inline-block bg-white/5 px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-[11px] font-semibold text-gray-300 border border-white/10 shadow-sm mb-1 tracking-wide">{row.category || 'N/A'}</span>
                    <p className="text-[9px] md:text-[11px] text-gray-500 font-medium ml-1">{row.condition || 'N/A'}</p>
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col items-start gap-1 md:gap-1.5">
                      <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest w-fit shadow-sm border ${
                        row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        row.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                        row.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        row.status === 'reserved' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        row.status === 'swapped' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {row.status}
                      </span>
                      {row.status === 'rejected' && row.rejection_reason && (
                        <span className="text-[7px] md:text-[9px] text-red-400/80 max-w-[100px] md:max-w-[150px] truncate bg-red-500/5 px-1.5 md:px-2 py-0.5 rounded border border-red-500/10 tracking-wide" title={row.rejection_reason}>
                          {row.rejection_reason}
                        </span>
                      )}
                    </div>
                  </td>
                </>
              )}

              <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                {activeTab === 'pending' ? (
                  <div className="flex justify-end gap-1 md:gap-2">
                    <button 
                      onClick={() => handleViewClick(row)}
                      className="bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/30 transition-all p-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      title="Review"
                    >
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Review</span>
                    </button>
                    <button 
                      onClick={() => handleApprove(row._id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      title="Approve"
                    >
                      <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => handleRejectClick(row._id)}
                      className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      title="Reject"
                    >
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : activeTab === 'offers' ? (
                  <div className="flex justify-end gap-1 md:gap-1.5">
                    <button onClick={() => handleEditOfferClick(row)} className="text-gray-400 hover:text-[#A388E1] hover:bg-[#A388E1]/10 border border-transparent hover:border-[#A388E1]/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleDeleteOffer(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : activeTab === 'categories' ? (
                  <div className="flex justify-end gap-1 md:gap-1.5">
                    <button onClick={() => handleEditCategoryClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl" title="Edit Category">
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleDeleteCategory(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl" title="Delete Category">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : activeTab === 'orders' ? (
                  <div className="flex justify-end gap-1 md:gap-1.5">
                    <button 
                      onClick={() => handleEditOrderClick(row)} 
                      className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl"
                      title="Update Delivery Status"
                    >
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : activeTab === 'items' ? (
                  <div className="flex justify-end gap-1 md:gap-1.5">
                    <button onClick={() => handleViewClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleEditClick(row)} className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 border border-transparent hover:border-emerald-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleDeleteItem(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1 md:gap-1.5">
                    <button onClick={() => handleViewUserClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={() => handleUpdateRole(row._id, row.role)} className={`transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl border border-transparent flex items-center justify-center ${row.role === 'admin' ? 'text-purple-400 hover:text-white hover:bg-purple-500/50 hover:border-purple-500/50' : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/30'}`}>
                      {row.role === 'admin' ? <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    </button>
                    <button onClick={() => handleDeleteUser(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-all p-1.5 md:p-2 rounded-lg md:rounded-xl">
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;