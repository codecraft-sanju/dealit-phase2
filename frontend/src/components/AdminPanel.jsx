import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Package, Trash2, X, CheckCircle, Edit, List, AlertTriangle, Eye, Coins, User, ShieldAlert, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API ;
const API_URL = `${API_BASE}/api`;

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', category: '', condition: '', estimated_value: '', preferred_item: ''
  });

  // Reject Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // NAYA: View Details Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (activeTab === 'pending') endpoint = `${API_URL}/admin/pending-items`;
        else if (activeTab === 'users') endpoint = `${API_URL}/admin/users`;
        else if (activeTab === 'items') endpoint = `${API_URL}/admin/all-items`;

        const response = await axios.get(endpoint, { withCredentials: true });
        setData(response.data.data || []);
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_URL}/admin/item-status/${id}`, { status: 'active' }, { withCredentials: true });
      setData(data.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error approving item:', error);
      alert('Failed to approve item.');
    }
  };

  const handleRejectClick = (id) => {
    setRejectingItemId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${API_URL}/admin/item-status/${rejectingItemId}`, 
        { status: 'rejected', rejection_reason: rejectionReason }, 
        { withCredentials: true }
      );
      setData(data.filter(item => item._id !== rejectingItemId));
      setIsRejectModalOpen(false);
    } catch (error) {
      console.error('Error rejecting item:', error);
      alert('Failed to reject item.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, { withCredentials: true });
      setData(data.filter(u => u._id !== id));
    } catch (error) {
      console.error(`Error deleting user:`, error);
      alert(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  // NAYA: Handle Role Change (Make Admin / Remove Admin)
  const handleUpdateRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'make this user an admin' : 'remove admin rights from this user';
    
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      const response = await axios.put(
        `${API_URL}/admin/users/role/${id}`, 
        { role: newRole }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Update user state locally without refreshing
        setData(data.map(u => u._id === id ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert(error.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this item permanently?`)) return;
    try {
      await axios.delete(`${API_URL}/items/${id}`, { withCredentials: true });
      setData(data.filter(item => item._id !== id));
    } catch (error) {
      console.error(`Error deleting item:`, error);
      alert('Failed to delete item.');
    }
  };

  const handleEditClick = (item) => {
    setEditingItemId(item._id);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      condition: item.condition || '',
      estimated_value: item.estimated_value || '',
      preferred_item: item.preferred_item || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/items/${editingItemId}`, editForm, { withCredentials: true });
      if (response.data.success) {
        setData(data.map(item => item._id === editingItemId ? { ...item, ...editForm } : item));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item.');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewClick = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
        <Shield className="w-8 h-8 text-emerald-400" />
        <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${activeTab === 'pending' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          <Package className="w-4 h-4" /> Pending Approvals
        </button>
        <button 
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${activeTab === 'items' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          <List className="w-4 h-4" /> Manage All Items
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          <Users className="w-4 h-4" /> Manage Users
        </button>
      </div>

      <div className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-emerald-400 animate-pulse font-medium">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No {activeTab === 'pending' ? 'pending items' : 'data'} found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900/80 text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-5 font-semibold">ID</th>
                  {activeTab === 'users' ? (
                    <>
                      <th className="px-6 py-5 font-semibold">User Info</th>
                      <th className="px-6 py-5 font-semibold">Contact</th>
                      <th className="px-6 py-5 font-semibold">Location</th>
                      <th className="px-6 py-5 font-semibold">Role</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-5 font-semibold">Item Details</th>
                      <th className="px-6 py-5 font-semibold">Category / Condition</th>
                      <th className="px-6 py-5 font-semibold">Status</th>
                    </>
                  )}
                  <th className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {data.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-700/30 transition duration-200">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{row._id.substring(0,8)}</td>
                    
                    {activeTab === 'users' ? (
                      <>
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-base">{row.full_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{row.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{row.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300 capitalize">{row.city || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            row.role === 'admin' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {row.role}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {row.images && row.images.length > 0 && row.images[0] ? (
                              <img src={row.images[0]} alt="item" className="w-12 h-12 rounded-xl bg-gray-900 object-cover border border-gray-600" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-600 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-white text-base">{row.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Owner: {row.owner?.full_name || 'Unknown'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-300">{row.category || 'N/A'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{row.condition || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                              row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              row.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              row.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {row.status}
                            </span>
                            {row.status === 'rejected' && row.rejection_reason && (
                              <span className="text-[10px] text-red-400 max-w-[150px] truncate" title={row.rejection_reason}>
                                Reason: {row.rejection_reason}
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-right">
                      {activeTab === 'pending' ? (
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleViewClick(row)}
                            className="bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/20 transition px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5"
                            title="View Information"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <button 
                            onClick={() => handleApprove(row._id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 transition px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectClick(row._id)}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 transition px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : activeTab === 'items' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleViewClick(row)}
                            className="text-gray-400 hover:text-blue-400 transition p-2 hover:bg-blue-400/10 rounded-lg"
                            title="View Item"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(row)}
                            className="text-gray-400 hover:text-blue-400 transition p-2 hover:bg-blue-400/10 rounded-lg"
                            title="Edit Item"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(row._id)}
                            className="text-gray-500 hover:text-red-400 transition p-2 hover:bg-red-400/10 rounded-lg"
                            title="Delete Item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {/* NAYA: Make Admin / Remove Admin Button */}
                          <button 
                            onClick={() => handleUpdateRole(row._id, row.role)}
                            className={`transition p-2 rounded-lg flex items-center justify-center ${
                              row.role === 'admin' 
                                ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-400/10' 
                                : 'text-blue-400 hover:text-blue-300 hover:bg-blue-400/10'
                            }`}
                            title={row.role === 'admin' ? "Remove Admin Role" : "Make Admin"}
                          >
                            {row.role === 'admin' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                          </button>

                          <button 
                            onClick={() => handleDeleteUser(row._id)}
                            className="text-gray-500 hover:text-red-400 transition p-2 hover:bg-red-400/10 rounded-lg"
                            title="Delete User"
                          >
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
        )}
      </div>

      {/* --- MODAL FOR VIEWING ITEM DETAILS --- */}
      {isViewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 w-full max-w-3xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-full">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-400" /> Item Information
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white transition p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Image Gallery */}
              {viewingItem.images && viewingItem.images.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-bold uppercase tracking-wider">Uploaded Images</p>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {viewingItem.images.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`view-${idx}`} className="w-40 h-40 object-cover rounded-xl border border-gray-700 flex-shrink-0 hover:border-blue-500 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 text-center text-gray-500 flex flex-col items-center">
                  <Package className="w-8 h-8 mb-2" />
                  <p>No images uploaded for this item.</p>
                </div>
              )}

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Title</p>
                  <p className="text-xl font-bold text-white">{viewingItem.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estimated Value</p>
                  <p className="text-xl font-bold text-yellow-500 flex items-center gap-1">
                    <Coins className="w-5 h-5"/> {viewingItem.estimated_value || '0'} Credits
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-700 leading-relaxed">
                    {viewingItem.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category & Condition</p>
                  <p className="text-gray-300 font-medium">{viewingItem.category} <span className="text-gray-600 px-2">•</span> {viewingItem.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Looking for in return</p>
                  <p className="text-emerald-400 font-medium">{viewingItem.preferred_item || 'Open to offers'}</p>
                </div>

                {/* Owner Information Section */}
                <div className="md:col-span-2 border-t border-gray-700 pt-6 mt-2">
                  <p className="text-sm text-blue-400 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Owner Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-900/30 p-5 rounded-2xl border border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
                      <p className="text-sm text-white font-medium">{viewingItem.owner?.full_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email Address</p>
                      <p className="text-sm text-white font-medium">{viewingItem.owner?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone Number</p>
                      <p className="text-sm text-white font-medium">{viewingItem.owner?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3 flex-wrap">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition">
                Close
              </button>
              
              {viewingItem.status === 'pending' && (
                <>
                  <button 
                    onClick={() => { setIsViewModalOpen(false); handleRejectClick(viewingItem._id); }} 
                    className="px-6 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reject Item
                  </button>
                  <button 
                    onClick={() => { setIsViewModalOpen(false); handleApprove(viewingItem._id); }} 
                    className="px-6 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Item
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL FOR REJECTION REASON --- */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 w-full max-w-md rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-red-500/10">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Reject Item
              </h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form id="rejectForm" onSubmit={handleRejectSubmit}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason for rejection (Optional but recommended)</label>
                <textarea 
                  required
                  rows="3" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none" 
                  placeholder="E.g., Inappropriate image, incomplete details..."
                ></textarea>
              </form>
            </div>
            <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-4">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-6 py-2 rounded-xl font-bold text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" form="rejectForm" className="px-6 py-2 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL FOR EDITING ITEMS --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-emerald-400" /> Edit Item Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="adminEditForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input type="text" name="title" required value={editForm.title} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea name="description" required rows="3" value={editForm.description} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select name="category" required value={editForm.category} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home">Home & Garden</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Condition</label>
                    <select name="condition" required value={editForm.condition} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                      <option value="New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Used">Used - Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Value (₹)</label>
                    <input type="number" name="estimated_value" value={editForm.estimated_value} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Preferred Item</label>
                    <input type="text" name="preferred_item" value={editForm.preferred_item} onChange={handleEditChange} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-4">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-gray-700 transition">Cancel</button>
              <button type="submit" form="adminEditForm" disabled={updating} className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 ${updating ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}>{updating ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;