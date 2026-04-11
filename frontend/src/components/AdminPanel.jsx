import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Shield, Users, Package, Trash2, X, Edit, List, AlertTriangle, Eye, User, 
  ShieldAlert, ShieldCheck, Mail, Phone, MapPin, Calendar, Wallet, Image as ImageIcon, Plus, 
  Check, ToggleLeft, ToggleRight, Layers, Settings,
  Car, Monitor, Book, Shirt, Gamepad2, Watch, Home as HomeIcon, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Smartphone, Target,
  IndianRupee, Activity, Truck, ChevronRight
} from 'lucide-react'; 
import axios from 'axios';
import Cropper from 'react-easy-crop';

import SettingsPanel from '../admin/SettingsPanel';
import AdminTable from '../admin/AdminTable';
import ViewItemModal from '../admin/ViewItemModal';
import OfferModal from '../admin/OfferModal';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET || 'salon_preset';
const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || 'dvoenforj';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((file) => {
      if (file) {
        file.name = 'cropped.jpeg';
        resolve(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
};

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [totalIncome, setTotalIncome] = useState(0);
  
  const [creditSettings, setCreditSettings] = useState({
    isCreditSystemEnabled: true,
    creditsPerListing: 50,
    maxListingsRewarded: 3,
    maxAllowedListings: 5,
    isWelcomeBonusEnabled: true, 
    welcomeBonusAmount: 50,      
    isReferralSystemEnabled: true, 
    referralRewardCredits: 40,
    maxReferralLimit: 5,
    milestoneReferralReward: 100,
    shippingMethod: 'flat',
    flatShippingCost: 60
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', category: '', condition: '', estimated_value: '', preferred_item: ''
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerForm, setOfferForm] = useState({ mobileImage: '', desktopImage: '', isActive: true });
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropType, setCropType] = useState('desktop'); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'Package', isActive: true });

  const AVAILABLE_ICONS = [
    { name: 'Package', icon: Package }, { name: 'Smartphone', icon: Smartphone },
    { name: 'Car', icon: Car }, { name: 'Monitor', icon: Monitor },
    { name: 'Book', icon: Book }, { name: 'Shirt', icon: Shirt },
    { name: 'Gamepad2', icon: Gamepad2 }, { name: 'Watch', icon: Watch },
    { name: 'Home', icon: HomeIcon }, { name: 'Sofa', icon: Sofa },
    { name: 'Music', icon: Music }, { name: 'Utensils', icon: Utensils },
    { name: 'Heart', icon: Heart }, { name: 'Briefcase', icon: Briefcase },
    { name: 'Camera', icon: Camera }, { name: 'Dumbbell', icon: Dumbbell }
  ];

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'settings') {
          const response = await axios.get(`${API_URL}/admin/credit-settings`, { withCredentials: true });
          if (response.data.success && response.data.data) {
            setCreditSettings({ ...creditSettings, ...response.data.data });
          }
        } else {
          let endpoint = '';
          if (activeTab === 'pending') endpoint = `${API_URL}/admin/pending-items`;
          else if (activeTab === 'users') endpoint = `${API_URL}/admin/users`;
          else if (activeTab === 'items') endpoint = `${API_URL}/admin/all-items`;
          else if (activeTab === 'offers') endpoint = `${API_URL}/admin/offers`; 
          else if (activeTab === 'categories') endpoint = `${API_URL}/categories`;
          else if (activeTab === 'transactions') endpoint = `${API_URL}/admin/transactions`; 

          const response = await axios.get(endpoint, { withCredentials: true });
          
          if (activeTab === 'transactions') {
             setTotalIncome(response.data.totalIncome || 0);
          }
          
          setData(response.data.data || []);
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // ALL HANDLERS REMAIN UNCHANGED (handleApprove, handleRejectClick, etc.)
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
      title: item.title || '', description: item.description || '', category: item.category || '',
      condition: item.condition || '', estimated_value: item.estimated_value || '', preferred_item: item.preferred_item || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

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

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, { withCredentials: true });
      setData(data.filter(u => u._id !== id));
      if (isViewUserModalOpen && viewingUser?._id === id) setIsViewUserModalOpen(false);
    } catch (error) {
      console.error(`Error deleting user:`, error);
      alert(error.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleUpdateRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'make this user an admin' : 'remove admin rights from this user';
    
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      const response = await axios.put(`${API_URL}/admin/users/role/${id}`, { role: newRole }, { withCredentials: true });
      if (response.data.success) {
        setData(data.map(u => u._id === id ? { ...u, role: newRole } : u));
        if (isViewUserModalOpen && viewingUser?._id === id) {
          setViewingUser({ ...viewingUser, role: newRole });
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert(error.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleViewUserClick = (userData) => {
    setViewingUser(userData);
    setIsViewUserModalOpen(true);
  };

  const handleImageSelect = (e, imageType) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setCropType(imageType);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels);

  const handleCropAndUpload = async () => {
    setIsProcessingCrop(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (cropType === 'mobile') setIsUploadingMobile(true);
      else setIsUploadingDesktop(true);

      const formData = new FormData();
      formData.append('file', croppedImageBlob);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      
      if (cropType === 'mobile') setOfferForm(prev => ({ ...prev, mobileImage: res.data.secure_url }));
      else setOfferForm(prev => ({ ...prev, desktopImage: res.data.secure_url }));
      
      setCropModalOpen(false);
    } catch (error) {
      console.error('Error cropping/uploading:', error);
      alert('Failed to upload image.');
    } finally {
      setIsProcessingCrop(false);
      if (cropType === 'mobile') setIsUploadingMobile(false);
      else setIsUploadingDesktop(false);
    }
  };

  const handleAddOfferClick = () => {
    setEditingOfferId(null);
    setOfferForm({ mobileImage: '', desktopImage: '', isActive: true });
    setIsOfferModalOpen(true);
  };

  const handleEditOfferClick = (offer) => {
    setEditingOfferId(offer._id);
    setOfferForm({ mobileImage: offer.mobileImage || '', desktopImage: offer.desktopImage || '', isActive: offer.isActive });
    setIsOfferModalOpen(true);
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerForm.mobileImage || !offerForm.desktopImage) return alert('Provide Mobile and Desktop images.');
    setUpdating(true);
    try {
      if (editingOfferId) {
        const res = await axios.put(`${API_URL}/admin/offers/${editingOfferId}`, offerForm, { withCredentials: true });
        setData(data.map(o => o._id === editingOfferId ? res.data.data : o));
      } else {
        const res = await axios.post(`${API_URL}/admin/offers`, offerForm, { withCredentials: true });
        setData([res.data.data, ...data]);
      }
      setIsOfferModalOpen(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Delete this banner permanently?')) return;
    try {
      await axios.delete(`${API_URL}/admin/offers/${id}`, { withCredentials: true });
      setData(data.filter(offer => offer._id !== id));
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer.');
    }
  };

  const handleAddCategoryClick = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', icon: 'Package', isActive: true });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({ name: cat.name, icon: cat.icon || 'Package', isActive: cat.isActive });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return alert('Category name is required');
    setUpdating(true);
    try {
      if (editingCategoryId) {
        const res = await axios.put(`${API_URL}/categories/${editingCategoryId}`, categoryForm, { withCredentials: true });
        setData(data.map(c => c._id === editingCategoryId ? res.data.data : c));
      } else {
        const res = await axios.post(`${API_URL}/categories`, categoryForm, { withCredentials: true });
        setData([...data, res.data.data].sort((a,b) => a.name.localeCompare(b.name)));
      }
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Failed to save category.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category permanently?')) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`, { withCredentials: true });
      setData(data.filter(c => c._id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/admin/credit-settings`, creditSettings, { withCredentials: true });
      if (response.data.success) {
        alert('Credit settings successfully updated! 🎉');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setUpdating(false);
    }
  };

  // Nav Items Array
  const navItems = [
    { id: 'pending', name: 'Pending Approvals', icon: Package },
    { id: 'items', name: 'Manage Items', icon: List },
    { id: 'users', name: 'Manage Users', icon: Users },
    { id: 'offers', name: 'Offers / Banners', icon: ImageIcon },
    { id: 'categories', name: 'Categories', icon: Layers },
    { id: 'transactions', name: 'Transactions', icon: IndianRupee },
    { id: 'settings', name: 'System Settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-full bg-[#0B0F19] flex overflow-hidden relative selection:bg-emerald-500/30 text-gray-100 font-sans">
      
      {/* --- Ambient Deep Space Background Glows --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* --- Custom Scrollbar styling --- */}
      <style dangerouslySetInnerHTML={{__html: `
        .admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .admin-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />

      {/* --- SIDEBAR (SaaS Style) --- */}
      <aside className="w-64 md:w-72 flex-shrink-0 border-r border-white/5 bg-white/[0.01] backdrop-blur-2xl flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Admin Portal</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-0.5">Premium Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 admin-scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/10' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? (item.id === 'offers' ? 'text-[#A388E1]' : item.id === 'transactions' ? 'text-yellow-400' : 'text-emerald-400') : 'group-hover:text-white'}`} />
                  {item.name}
                </div>
                
                {/* Dynamic Counters in Sidebar */}
                {item.id === 'pending' && activeTab === 'pending' && data.length > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider">
                    {data.length}
                  </span>
                )}
                {!isActive && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <img src={user?.profilePic || `https://ui-avatars.com/api/?name=Admin&background=random`} alt="Admin" className="w-9 h-9 rounded-full object-cover border border-white/20" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col z-10 overflow-hidden relative">
        
        {/* Top Header Panel */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-white/[0.01] backdrop-blur-md shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Manage and monitor your platform data</p>
          </div>

          <div className="flex gap-3">
            {activeTab === 'offers' && (
              <button onClick={handleAddOfferClick} className="bg-[#A388E1] hover:bg-[#8b70ca] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(163,136,225,0.3)] flex items-center gap-2 border border-white/10 hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5" /> New Banner
              </button>
            )}
            {activeTab === 'categories' && (
              <button onClick={handleAddCategoryClick} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2 border border-white/10 hover:scale-105 active:scale-95">
                <Plus className="w-5 h-5" /> New Category
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Content Container */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 lg:p-8">
          <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden backdrop-blur-xl relative">
            
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19]/50 backdrop-blur-sm z-50">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-emerald-400 font-bold tracking-widest mt-4 animate-pulse text-sm">FETCHING DATA...</p>
              </div>
            ) : null}

            {/* --- SPECIFIC TAB RENDER LOGIC --- */}
            
            {activeTab === 'settings' && !loading && (
              <SettingsPanel 
                creditSettings={creditSettings}
                setCreditSettings={setCreditSettings}
                handleSaveSettings={handleSaveSettings}
                updating={updating}
              />
            )}

            {activeTab === 'transactions' && !loading && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Income Summary Widgets - Premium Glass Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-900/40 rounded-3xl p-8 border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/30 transition-colors"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs mb-2">Total Platform Revenue</p>
                        <h3 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200">
                          ₹{totalIncome.toLocaleString('en-IN')}
                        </h3>
                      </div>
                      <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30 backdrop-blur-md">
                        <IndianRupee className="w-10 h-10 text-emerald-300" />
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-white/[0.03] rounded-3xl p-8 border border-white/10 shadow-lg group">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Transactions</p>
                        <h3 className="text-4xl lg:text-5xl font-black text-white">{data.length}</h3>
                      </div>
                      <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 backdrop-blur-md">
                        <Activity className="w-10 h-10 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions Table - Glassmorphism */}
                {data.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] rounded-3xl border border-white/5">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <IndianRupee className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">No Revenue Yet</h3>
                    <p className="text-gray-500 text-sm">Transactions will appear here once users start buying credits.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto admin-scroll bg-white/[0.01] rounded-2xl border border-white/5 relative">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead className="sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 shadow-sm">
                        <tr className="text-xs uppercase tracking-widest text-gray-400">
                          <th className="p-5 font-bold">User</th>
                          <th className="p-5 font-bold">Amount</th>
                          <th className="p-5 font-bold">Type</th>
                          <th className="p-5 font-bold">Order Details</th>
                          <th className="p-5 font-bold">Status</th>
                          <th className="p-5 font-bold">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.map(txn => (
                          <tr key={txn._id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                {txn.user?.profilePic ? (
                                  <img src={txn.user.profilePic} alt="User" className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                     <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                   <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{txn.user?.full_name || 'Unknown User'}</p>
                                   <p className="text-[11px] text-gray-500">{txn.user?.email || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="text-lg font-black text-emerald-400 tracking-tight">
                                ₹{txn.amount}
                              </span>
                            </td>
                            <td className="p-5">
                              {txn.transactionType === 'shipping_fee' ? (
                                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center w-fit gap-1.5 shadow-sm">
                                  <Package className="w-3.5 h-3.5" /> Shipping
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center w-fit gap-1.5 shadow-sm">
                                  <Wallet className="w-3.5 h-3.5" /> Wallet
                                </span>
                              )}
                            </td>
                            <td className="p-5">
                              <div className="text-xs font-mono">
                                <p className="text-gray-400 font-semibold mb-1">ID: <span className="text-blue-300">{txn.razorpay_order_id}</span></p>
                                <p className="text-gray-500/80 truncate w-48 text-[10px]" title={txn.razorpay_payment_id}>Pay: {txn.razorpay_payment_id}</p>
                              </div>
                            </td>
                            <td className="p-5">
                               <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                                 txn.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                 txn.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                 'bg-red-500/10 text-red-400 border-red-500/20'
                               }`}>
                                 {txn.status}
                               </span>
                            </td>
                            <td className="p-5">
                              <p className="text-sm text-gray-300 font-bold">{new Date(txn.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{new Date(txn.created_at).toLocaleTimeString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'settings' && activeTab !== 'transactions' && !loading && (
              data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/[0.01]">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/10 shadow-inner">
                    {activeTab === 'pending' ? <Package className="w-8 h-8 text-gray-500" /> : 
                     activeTab === 'users' ? <Users className="w-8 h-8 text-gray-500" /> : 
                     activeTab === 'offers' ? <ImageIcon className="w-8 h-8 text-gray-500" /> : 
                     activeTab === 'categories' ? <Layers className="w-8 h-8 text-gray-500" /> : 
                     <List className="w-8 h-8 text-gray-500" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2 tracking-tight">No Records Found</h3>
                  <p className="text-gray-500 text-sm">There are currently no {activeTab === 'pending' ? 'pending approvals' : activeTab === 'offers' ? 'banners available' : activeTab === 'categories' ? 'categories available' : 'records to display'}.</p>
                </div>
              ) : (
                <AdminTable 
                  activeTab={activeTab}
                  data={data}
                  AVAILABLE_ICONS={AVAILABLE_ICONS}
                  handleViewClick={handleViewClick}
                  handleApprove={handleApprove}
                  handleRejectClick={handleRejectClick}
                  handleEditOfferClick={handleEditOfferClick}
                  handleDeleteOffer={handleDeleteOffer}
                  handleEditCategoryClick={handleEditCategoryClick}
                  handleDeleteCategory={handleDeleteCategory}
                  handleEditClick={handleEditClick}
                  handleDeleteItem={handleDeleteItem}
                  handleViewUserClick={handleViewUserClick}
                  handleUpdateRole={handleUpdateRole}
                  handleDeleteUser={handleDeleteUser}
                />
              )
            )}
          </div>
        </div>
      </main>

      {/* --- ALL MODALS (Upgraded to Frosted Glass UI) --- */}
      
      {/* View User Modal */}
      {isViewUserModalOpen && viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0B0F19]/95 w-full max-w-2xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200 backdrop-blur-3xl">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 h-32 relative border-b border-white/5">
              <button onClick={() => setIsViewUserModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8 relative flex-1 overflow-y-auto admin-scroll">
              <div className="absolute -top-16 left-8">
                <div className="w-32 h-32 bg-[#0B0F19] border-4 border-white/10 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                  {viewingUser.profilePic ? (
                    <img src={viewingUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-500" />
                  )}
                </div>
              </div>

              <div className="absolute top-6 right-8 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.1)] backdrop-blur-md">
                 <Wallet className="w-6 h-6 text-yellow-400" />
                 <div>
                   <p className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-widest">Balance</p>
                   <p className="text-2xl font-black text-yellow-400 leading-none">{viewingUser.account_credits || 0}</p>
                 </div>
              </div>

              <div className="pt-20">
                <h2 className="text-3xl font-black text-white flex items-center gap-2 tracking-tight">
                  {viewingUser.full_name} 
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg mt-3 border shadow-sm ${
                  viewingUser.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {viewingUser.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                  Role: {viewingUser.role}
                </span>

                <div className="mt-8 space-y-3">
                  {/* Detailed Info Cards */}
                  <div className="flex items-center gap-4 text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><Mail className="w-5 h-5 text-blue-400" /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Email Address</p>
                      <p className="font-semibold text-gray-200">{viewingUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Phone className="w-5 h-5 text-emerald-400" /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Phone Number</p>
                      <p className="font-semibold text-gray-200">{viewingUser.phone || <span className="text-gray-600 italic">Not provided</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><MapPin className="w-5 h-5 text-red-400" /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Location</p>
                      <p className="font-semibold text-gray-200 capitalize">{viewingUser.city || <span className="text-gray-600 italic">Not provided</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><Truck className="w-5 h-5 text-indigo-400" /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Pickup Address</p>
                      <p className="font-semibold text-gray-200 capitalize">
                        {viewingUser.pickupAddress?.addressLine 
                          ? `${viewingUser.pickupAddress.addressLine}, ${viewingUser.pickupAddress.city}, ${viewingUser.pickupAddress.state} - ${viewingUser.pickupAddress.pincode}` 
                          : <span className="text-gray-600 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20"><Calendar className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Joined Platform</p>
                      <p className="font-semibold text-gray-200">{new Date(viewingUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => handleUpdateRole(viewingUser._id, viewingUser.role)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/[0.05] hover:text-white hover:bg-white/[0.1] border border-white/10 transition-all shadow-sm"
              >
                {viewingUser.role === 'admin' ? "Remove Admin" : "Make Admin"}
              </button>
              <button onClick={() => setIsViewUserModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Item Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-md rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
              <h2 className="text-lg font-black text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Reject Item
              </h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-white/5 p-2 rounded-full hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <form id="rejectForm" onSubmit={handleRejectSubmit}>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Reason for rejection <span className="text-red-400 font-normal lowercase">*</span></label>
                <textarea 
                  required
                  rows="4" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] resize-none transition-all placeholder:text-gray-600 text-sm shadow-inner" 
                  placeholder="E.g., Contains inappropriate imagery..."
                ></textarea>
              </form>
            </div>
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
              <button type="submit" form="rejectForm" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] border border-red-500/50 transition-all">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-2xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400" /> Edit Item Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 admin-scroll">
              <form id="adminEditForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Title</label>
                    <input type="text" name="title" required value={editForm.title} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Description</label>
                    <textarea name="description" required rows="4" value={editForm.description} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] resize-none transition-all shadow-inner"></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Category</label>
                    <select name="category" required value={editForm.category} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all appearance-none shadow-inner">
                      <option value="Electronics" className="bg-[#0B0F19]">Electronics</option>
                      <option value="Fashion" className="bg-[#0B0F19]">Fashion</option>
                      <option value="Home" className="bg-[#0B0F19]">Home & Garden</option>
                      <option value="Vehicles" className="bg-[#0B0F19]">Vehicles</option>
                      <option value="Other" className="bg-[#0B0F19]">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Condition</label>
                    <select name="condition" required value={editForm.condition} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all appearance-none shadow-inner">
                      <option value="New" className="bg-[#0B0F19]">Brand New</option>
                      <option value="Like New" className="bg-[#0B0F19]">Like New</option>
                      <option value="Used" className="bg-[#0B0F19]">Used - Good</option>
                      <option value="Fair" className="bg-[#0B0F19]">Fair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Estimated Value (Credits)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Coins className="h-4 w-4 text-yellow-400" />
                      </div>
                      <input type="number" name="estimated_value" value={editForm.estimated_value} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Preferred Item</label>
                    <input type="text" name="preferred_item" value={editForm.preferred_item} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
              <button type="submit" form="adminEditForm" disabled={updating} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-emerald-600/30 text-emerald-200/50 cursor-not-allowed border-emerald-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/50'}`}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-sm rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                {editingCategoryId ? <Edit className="w-5 h-5 text-blue-400" /> : <Layers className="w-5 h-5 text-blue-400" />} 
                {editingCategoryId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="categoryForm" onSubmit={handleCategorySubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Category Name</label>
                  <input 
                    type="text" 
                    value={categoryForm.name} 
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600"
                    placeholder="e.g., Electronics..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Select Icon</label>
                  <div className="flex gap-2.5 overflow-x-auto admin-scroll pb-2">
                    {AVAILABLE_ICONS.map((iconObj) => {
                      const IconComp = iconObj.icon;
                      const isSelected = categoryForm.icon === iconObj.name;
                      return (
                        <div 
                          key={iconObj.name}
                          onClick={() => setCategoryForm({ ...categoryForm, icon: iconObj.name })}
                          className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                              ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                              : 'bg-white/[0.02] border-white/10 text-gray-500 hover:bg-white/5 hover:text-gray-300'
                          }`}
                          title={iconObj.name}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setCategoryForm({ ...categoryForm, isActive: !categoryForm.isActive })}>
                  <div>
                    <p className="font-bold text-white text-sm tracking-tight">Active Status</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Hidden categories won't show to users.</p>
                  </div>
                  {categoryForm.isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-600" />
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
              <button 
                type="submit" 
                form="categoryForm" 
                disabled={updating} 
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-blue-600/30 text-white/50 cursor-not-allowed border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50'}`}
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewItemModal 
        isViewModalOpen={isViewModalOpen}
        setIsViewModalOpen={setIsViewModalOpen}
        viewingItem={viewingItem}
        handleRejectClick={handleRejectClick}
        handleApprove={handleApprove}
      />

      <OfferModal 
        isOfferModalOpen={isOfferModalOpen}
        setIsOfferModalOpen={setIsOfferModalOpen}
        editingOfferId={editingOfferId}
        offerForm={offerForm}
        setOfferForm={setOfferForm}
        handleOfferSubmit={handleOfferSubmit}
        handleImageSelect={handleImageSelect}
        isUploadingMobile={isUploadingMobile}
        isUploadingDesktop={isUploadingDesktop}
        isProcessingCrop={isProcessingCrop}
        updating={updating}
      />

      {/* Interactive Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-4 bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-3xl rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
              <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                <ImageIcon className="w-5 h-5 text-[#A388E1]" /> 
                Crop {cropType === 'desktop' ? 'Desktop (5:1)' : 'Mobile (2.5:1)'} Banner
              </h2>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black w-full h-full border-y border-white/5">
              {imageToCrop && (
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropType === 'desktop' ? 5 / 1 : 2.5 / 1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="p-5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-1/2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-[#A388E1]"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button type="button" onClick={() => setCropModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={isProcessingCrop}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isProcessingCrop ? 'bg-[#A388E1]/30 text-white/50 cursor-not-allowed border-[#A388E1]/20' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.3)] border border-[#A388E1]/50'}`}
                >
                  {isProcessingCrop ? 'Processing...' : 'Crop & Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;