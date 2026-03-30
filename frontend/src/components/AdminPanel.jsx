import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Package, Trash2, X, CheckCircle, Edit, List, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

  // NAYA: Reject Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  // NAYA: Reject logic with reason
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
      alert('Failed to delete user.');
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

  // --- Edit Item Logic ---
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
                            {/* NAYA: Admin panel me bhi reason dikhega agar reject hua hai */}
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
                            onClick={() => handleApprove(row._id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 transition px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleRejectClick(row._id)}
                            className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 transition px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : activeTab === 'items' ? (
                        <div className="flex justify-end gap-2">
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
                        <button 
                          onClick={() => handleDeleteUser(row._id)}
                          className="text-gray-500 hover:text-red-400 transition p-2 hover:bg-red-400/10 rounded-lg"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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