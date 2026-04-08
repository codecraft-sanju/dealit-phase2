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
  handleDeleteUser
}) => {
  return (
    <div className="flex-1 overflow-auto admin-scroll rounded-3xl">
      <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap sm:whitespace-normal">
        
        <thead className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md text-gray-400 border-b border-gray-700/80 shadow-sm">
          <tr>
            <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">ID</th>
            {activeTab === 'users' ? (
              <>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">User Info</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Contact</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Location</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Role</th>
              </>
            ) : activeTab === 'offers' ? (
              <>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Banner Preview</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Status</th>
              </>
            ) : activeTab === 'categories' ? (
              <>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Category Name</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Date Created</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Status</th>
              </>
            ) : (
              <>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Item Details</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Category & Condition</th>
                <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs">Status</th>
              </>
            )}
            <th className="px-6 py-5 font-bold uppercase tracking-wider text-xs text-right bg-gray-900/95">Actions</th>
          </tr>
        </thead>
        
        <tbody className="divide-y divide-gray-700/50">
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-gray-700/30 transition-colors duration-200 group">
              <td className="px-6 py-4 font-mono text-xs text-gray-500">#{row._id.substring(0,6)}</td>
              
              {activeTab === 'users' ? (
                <>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {row.profilePic ? (
                        <img src={row.profilePic} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-gray-400 shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">{row.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 font-medium">{row.phone || <span className="text-gray-600 italic">Not set</span>}</td>
                  <td className="px-6 py-4 text-gray-300 capitalize font-medium">{row.city || <span className="text-gray-600 italic">Unknown</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                      row.role === 'admin' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}>
                      {row.role === 'admin' && <Shield className="w-3 h-3" />}
                      {row.role}
                    </span>
                  </td>
                </>
              ) : activeTab === 'offers' ? (
                <>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {/* Desktop Preview */}
                      <div className="relative group/img">
                        <div className="w-32 h-14 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-sm">
                          <img src={row.desktopImage} alt="Desktop" className={`w-full h-full object-cover ${!row.isActive ? 'grayscale opacity-50' : ''}`} />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded text-white border border-gray-600">Desktop</span>
                      </div>
                      
                      {/* Mobile Preview */}
                      <div className="relative group/img">
                        <div className="w-14 h-14 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-sm">
                          <img src={row.mobileImage} alt="Mobile" className={`w-full h-full object-cover ${!row.isActive ? 'grayscale opacity-50' : ''}`} />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded text-white border border-gray-600">Mobile</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                      row.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {row.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {row.isActive ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                </>
              ) : activeTab === 'categories' ? (
                <>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const match = AVAILABLE_ICONS.find(i => i.name === row.icon);
                        const IconComp = match ? match.icon : Package;
                        return (
                          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                            <IconComp className="w-5 h-5 text-blue-400" />
                          </div>
                        );
                      })()}
                      <span className="font-bold text-white text-base">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                      row.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {row.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {row.images && row.images.length > 0 && row.images[0] ? (
                        <img src={row.images[0]} alt="item" className="w-14 h-14 rounded-xl bg-gray-800 object-cover border border-gray-700 shadow-sm" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shadow-sm">
                          <Package className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-base max-w-[200px] truncate group-hover:text-emerald-400 transition-colors" title={row.title}>{row.title}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> {row.owner?.full_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-gray-800 px-3 py-1 rounded-lg text-sm text-gray-200 border border-gray-700 shadow-sm mb-1">{row.category || 'N/A'}</span>
                    <p className="text-xs text-gray-500 font-medium ml-1">{row.condition || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest w-fit shadow-sm ${
                        row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        row.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                        row.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        row.status === 'reserved' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                        row.status === 'swapped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                      }`}>
                        {row.status}
                      </span>
                      {row.status === 'rejected' && row.rejection_reason && (
                        <span className="text-[10px] text-red-400/80 max-w-[150px] truncate bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10" title={row.rejection_reason}>
                          {row.rejection_reason}
                        </span>
                      )}
                    </div>
                  </td>
                </>
              )}

              <td className="px-6 py-4 text-right">
                {activeTab === 'pending' ? (
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleViewClick(row)}
                      className="bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/30 transition-all px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    >
                      <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Review</span>
                    </button>
                    <button 
                      onClick={() => handleApprove(row._id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 transition-all p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRejectClick(row._id)}
                      className="bg-red-500/10 hover:bg-red-50 hover:text-white text-red-400 border border-red-500/30 transition-all p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : activeTab === 'offers' ? (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleEditOfferClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all p-2 rounded-xl">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteOffer(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all p-2 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : activeTab === 'categories' ? (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleEditCategoryClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all p-2 rounded-xl" title="Edit Category">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all p-2 rounded-xl" title="Delete Category">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : activeTab === 'items' ? (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleViewClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all p-2 rounded-xl">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleEditClick(row)} className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all p-2 rounded-xl">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteItem(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all p-2 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleViewUserClick(row)} className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all p-2 rounded-xl">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleUpdateRole(row._id, row.role)} className={`transition-all p-2 rounded-xl flex items-center justify-center ${row.role === 'admin' ? 'text-purple-400 hover:text-white hover:bg-purple-500/80' : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10'}`}>
                      {row.role === 'admin' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDeleteUser(row._id)} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all p-2 rounded-xl">
                      <Trash2 className="w-5 h-5" />
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