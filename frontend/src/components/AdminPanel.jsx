import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Shield, Users, Package, Trash2, X, Edit, List, AlertTriangle, Eye, User, 
  ShieldAlert, ShieldCheck, Mail, Phone, MapPin, Calendar, Wallet, Image as ImageIcon, Plus, 
  Check, ToggleLeft, ToggleRight, Layers, Settings,
  Car, Monitor, Book, Shirt, Gamepad2, Watch, Home as HomeIcon, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Smartphone, Target
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
  
  // Dynamic Settings Initial State (Updated with Welcome Bonus)
  const [creditSettings, setCreditSettings] = useState({
    isCreditSystemEnabled: true,
    creditsPerListing: 50,
    maxListingsRewarded: 3,
    maxAllowedListings: 5,
    isWelcomeBonusEnabled: true, // NAYA
    welcomeBonusAmount: 50,      // NAYA
    isReferralSystemEnabled: true, 
    referralRewardCredits: 40,
    maxReferralLimit: 5,
    milestoneReferralReward: 100
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
            setCreditSettings({
              ...creditSettings,
              ...response.data.data
            });
          }
        } else {
          let endpoint = '';
          if (activeTab === 'pending') endpoint = `${API_URL}/admin/pending-items`;
          else if (activeTab === 'users') endpoint = `${API_URL}/admin/users`;
          else if (activeTab === 'items') endpoint = `${API_URL}/admin/all-items`;
          else if (activeTab === 'offers') endpoint = `${API_URL}/admin/offers`; 
          else if (activeTab === 'categories') endpoint = `${API_URL}/categories`;

          const response = await axios.get(endpoint, { withCredentials: true });
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

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, { withCredentials: true });
      setData(data.filter(u => u._id !== id));
      if (isViewUserModalOpen && viewingUser?._id === id) {
        setIsViewUserModalOpen(false);
      }
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
      const response = await axios.put(
        `${API_URL}/admin/users/role/${id}`, 
        { role: newRole }, 
        { withCredentials: true }
      );
      
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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

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
      
      if (cropType === 'mobile') {
        setOfferForm(prev => ({ ...prev, mobileImage: res.data.secure_url }));
      } else {
        setOfferForm(prev => ({ ...prev, desktopImage: res.data.secure_url }));
      }
      
      setCropModalOpen(false);
    } catch (error) {
      console.error('Error cropping or uploading image:', error);
      alert('Failed to process and upload image. Please try again.');
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
    setOfferForm({ 
      mobileImage: offer.mobileImage || '', 
      desktopImage: offer.desktopImage || '', 
      isActive: offer.isActive 
    });
    setIsOfferModalOpen(true);
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerForm.mobileImage || !offerForm.desktopImage) {
      return alert('Please provide both Mobile and Desktop images for the banner.');
    }
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
    if (!window.confirm('Are you sure you want to delete this banner permanently?')) return;
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
    if (!window.confirm('Are you sure you want to delete this category permanently? This might affect items using it.')) return;
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

  return (
    <div className="h-[calc(100vh-80px)] min-h-[600px] w-full bg-gray-900 flex flex-col pt-6 pb-6 px-4 sm:px-6 lg:px-8">
      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .admin-scroll::-webkit-scrollbar-track { background: rgba(31, 41, 55, 0.5); border-radius: 10px; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(75, 85, 99, 0.8); border-radius: 10px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 1); }
      `}} />

      <div className="max-w-7xl mx-auto w-full flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 font-medium">Manage your platform resources efficiently</p>
            </div>
          </div>
          
          {activeTab === 'offers' && (
            <button 
              onClick={handleAddOfferClick}
              className="bg-[#A388E1] hover:bg-[#8b70ca] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-[#A388E1]/20 flex items-center gap-2 border border-[#A388E1]/50"
            >
              <Plus className="w-5 h-5" /> Add New Banner
            </button>
          )}

          {activeTab === 'categories' && (
            <button 
              onClick={handleAddCategoryClick}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center gap-2 border border-blue-500/50"
            >
              <Plus className="w-5 h-5" /> Add Category
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6 bg-gray-800/40 p-1.5 rounded-2xl border border-gray-700/50 backdrop-blur-xl w-fit">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'pending' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <Package className="w-4 h-4" /> Pending Approvals
            {activeTab === 'pending' && data.length > 0 && (
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs ml-1">{data.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'items' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <List className="w-4 h-4" /> Manage Items
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <Users className="w-4 h-4" /> Manage Users
          </button>
          <button 
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'offers' ? 'bg-[#A388E1] text-white shadow-lg shadow-[#A388E1]/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <ImageIcon className="w-4 h-4" /> Offers
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <Layers className="w-4 h-4" /> Categories
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 scale-100' : 'text-gray-400 hover:text-white hover:bg-gray-700/50 scale-95'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 min-h-0 bg-gray-800/40 backdrop-blur-xl border border-gray-700/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-400 font-bold tracking-widest animate-pulse">LOADING DATA...</p>
          </div>
        ) : activeTab === 'settings' ? (
          
          <SettingsPanel 
            creditSettings={creditSettings}
            setCreditSettings={setCreditSettings}
            handleSaveSettings={handleSaveSettings}
            updating={updating}
          />

        ) : data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
              {activeTab === 'pending' ? <Package className="w-10 h-10 text-gray-500" /> : 
               activeTab === 'users' ? <Users className="w-10 h-10 text-gray-500" /> : 
               activeTab === 'offers' ? <ImageIcon className="w-10 h-10 text-gray-500" /> : 
               activeTab === 'categories' ? <Layers className="w-10 h-10 text-gray-500" /> : 
               <List className="w-10 h-10 text-gray-500" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">No Data Found</h3>
            <p className="text-gray-500">There are currently no {activeTab === 'pending' ? 'pending approvals' : activeTab === 'offers' ? 'banners available' : activeTab === 'categories' ? 'categories available' : 'records to display'}.</p>
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
        )}
      </div>

      {/* --- ALL MODALS BELOW --- */}
      
      {/* View User Modal */}
      {isViewUserModalOpen && viewingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-gray-800 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-28 relative">
              <button onClick={() => setIsViewUserModalOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-8 pb-8 relative flex-1 overflow-y-auto admin-scroll">
              <div className="absolute -top-14 left-8">
                <div className="w-28 h-28 bg-gray-900 border-4 border-gray-800 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                  {viewingUser.profilePic ? (
                    <img src={viewingUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="absolute top-4 right-8 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                 <Wallet className="w-6 h-6 text-yellow-500" />
                 <div>
                   <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-widest">Credits Balance</p>
                   <p className="text-xl font-black text-yellow-500 leading-none">{viewingUser.account_credits || 0}</p>
                 </div>
              </div>

              <div className="pt-16">
                <h2 className="text-3xl font-black text-white flex items-center gap-2">
                  {viewingUser.full_name} 
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg mt-3 border shadow-sm ${
                  viewingUser.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {viewingUser.role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                  Role: {viewingUser.role}
                </span>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-4 text-gray-300 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="p-3 bg-gray-800 rounded-xl"><Mail className="w-5 h-5 text-blue-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                      <p className="font-semibold text-white">{viewingUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="p-3 bg-gray-800 rounded-xl"><Phone className="w-5 h-5 text-emerald-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Phone Number</p>
                      <p className="font-semibold text-white">{viewingUser.phone || <span className="text-gray-600 italic">Not provided</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="p-3 bg-gray-800 rounded-xl"><MapPin className="w-5 h-5 text-red-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Location</p>
                      <p className="font-semibold text-white capitalize">{viewingUser.city || <span className="text-gray-600 italic">Not provided</span>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-300 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="p-3 bg-gray-800 rounded-xl"><Calendar className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Joined Platform</p>
                      <p className="font-semibold text-white">{new Date(viewingUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-300 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="p-3 bg-gray-800 rounded-xl"><Target className="w-5 h-5 text-yellow-400" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Referrals Done</p>
                      <p className="font-semibold text-white">{viewingUser.totalReferrals || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => handleUpdateRole(viewingUser._id, viewingUser.role)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-300 bg-gray-800 hover:text-white hover:bg-gray-700 border border-gray-700 transition-all shadow-sm"
              >
                {viewingUser.role === 'admin' ? "Remove Admin Access" : "Grant Admin Access"}
              </button>
              <button onClick={() => setIsViewUserModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -> CHANGES MADE: Replaced inline View Item Modal with the new ViewItemModal Component */}
      <ViewItemModal 
        isViewModalOpen={isViewModalOpen}
        setIsViewModalOpen={setIsViewModalOpen}
        viewingItem={viewingItem}
        handleRejectClick={handleRejectClick}
        handleApprove={handleApprove}
      />

      {/* Reject Item Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-gray-800 w-full max-w-md rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-red-900/50 flex justify-between items-center bg-red-500/10">
              <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> Reject Item
              </h2>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-gray-900/50 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form id="rejectForm" onSubmit={handleRejectSubmit}>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide">Reason for rejection <span className="text-gray-500 font-normal capitalize">(Required)</span></label>
                <textarea 
                  required
                  rows="4" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 resize-none transition-all" 
                  placeholder="E.g., Contains inappropriate imagery, description is misleading..."
                ></textarea>
              </form>
            </div>
            <div className="p-5 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
              <button onClick={() => setIsRejectModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
              <button type="submit" form="rejectForm" className="px-6 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-gray-800 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-emerald-500" /> Edit Item Details
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 admin-scroll bg-gray-800/50">
              <form id="adminEditForm" onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Title</label>
                    <input type="text" name="title" required value={editForm.title} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea name="description" required rows="4" value={editForm.description} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none transition-all"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Category</label>
                    <select name="category" required value={editForm.category} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none">
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home">Home & Garden</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Condition</label>
                    <select name="condition" required value={editForm.condition} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none">
                      <option value="New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Used">Used - Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Estimated Value (Credits)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Coins className="h-5 w-5 text-yellow-500" />
                      </div>
                      <input type="number" name="estimated_value" value={editForm.estimated_value} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Preferred Item</label>
                    <input type="text" name="preferred_item" value={editForm.preferred_item} onChange={handleEditChange} className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all">Cancel</button>
              <button type="submit" form="adminEditForm" disabled={updating} className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${updating ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="bg-gray-800 w-full max-w-sm rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {editingCategoryId ? <Edit className="w-6 h-6 text-blue-400" /> : <Layers className="w-6 h-6 text-blue-400" />} 
                {editingCategoryId ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="categoryForm" onSubmit={handleCategorySubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Category Name</label>
                  <input 
                    type="text" 
                    value={categoryForm.name} 
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="e.g., Electronics, Books..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Select Icon</label>
                  <div className="flex gap-3 overflow-x-auto admin-scroll pb-2">
                    {AVAILABLE_ICONS.map((iconObj) => {
                      const IconComp = iconObj.icon;
                      const isSelected = categoryForm.icon === iconObj.name;
                      return (
                        <div 
                          key={iconObj.name}
                          onClick={() => setCategoryForm({ ...categoryForm, icon: iconObj.name })}
                          className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border-2 ${
                            isSelected 
                              ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                              : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                          }`}
                          title={iconObj.name}
                        >
                          <IconComp className="w-6 h-6" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer" onClick={() => setCategoryForm({ ...categoryForm, isActive: !categoryForm.isActive })}>
                  <div>
                    <p className="font-bold text-white text-sm">Active Status</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Hidden categories won't show to users.</p>
                  </div>
                  {categoryForm.isActive ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-500" />
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex justify-end gap-3">
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
              <button 
                type="submit" 
                form="categoryForm" 
                disabled={updating} 
                className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${updating ? 'bg-blue-600/50 text-white/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -> CHANGES MADE: Replaced inline Offer Banner Modal with the new OfferModal Component */}
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-gray-800 w-full max-w-3xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-[#A388E1]" /> 
                Crop {cropType === 'desktop' ? 'Desktop (5:1)' : 'Mobile (2.5:1)'} Banner
              </h2>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black w-full h-full">
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

            <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-1/2">
                <span className="text-gray-400 text-sm font-bold">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="w-full accent-[#A388E1]"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button type="button" onClick={() => setCropModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={isProcessingCrop}
                  className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isProcessingCrop ? 'bg-[#A388E1]/50 text-white/50 cursor-not-allowed' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.4)]'}`}
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