import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Shield, Users, Package, Trash2, X, Edit, List, AlertTriangle, Eye, User, 
  ShieldAlert, ShieldCheck, Mail, Phone, MapPin, Calendar, Wallet, Image as ImageIcon, Plus, 
  Check, ToggleLeft, ToggleRight, Layers, Settings, Menu, 
  Car, Monitor, Book, Shirt, Gamepad2, Watch, Home as HomeIcon, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Smartphone, Target,
  IndianRupee, Activity, Truck, ChevronRight, LayoutDashboard, Coins,
  Search, ChevronLeft, RefreshCcw, Bot, MessageSquare, CheckCircle, Database
} from 'lucide-react'; 
import axios from 'axios';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useQueryClient } from '@tanstack/react-query';

import SettingsPanel from '../admin/SettingsPanel';
import AdminTable from '../admin/AdminTable';
import ViewItemModal from '../admin/ViewItemModal';
import OfferModal from '../admin/OfferModal';
import DashboardOverview from '../admin/DashboardOverview';
import ViewUserModal from '../admin/ViewUserModal';
import AdminSidebar from '../admin/AdminSidebar';
import CategoryModal from '../admin/CategoryModal';
import EditItemModal from '../admin/EditItemModal';
import EditOrderModal from '../admin/EditOrderModal';
import RejectItemModal from '../admin/RejectItemModal';
import ImageCropModal from '../admin/ImageCropModal';
import ViewAILogModal from '../admin/ViewAILogModal';
import ResolveRefundModal from '../admin/ResolveRefundModal';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [totalIncome, setTotalIncome] = useState(0);
  const [financials, setFinancials] = useState({ 
    walletIncome: 0, 
    shippingIncome: 0, 
    baseShippingIncome: 0, 
    totalPlatformFees: 0, 
    totalGstCollected: 0, 
    totalRevenue: 0, 
    totalRefunds: 0, 
    netIncome: 0 
  });

  const [aiLogStats, setAiLogStats] = useState({ pending: 0, cleaned: 0, rejected: 0, trained: 0 });

  const [aiSettings, setAiSettings] = useState({
    activeModelId: '',
    fallbackModelId: '',
    isAutoTrainingEnabled: true,
    batchSize: 500,
    cleanerInterval: 15,
    pollingInterval: 5
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    flatShippingCost: 60,
    auraReward: 50,
    auraPenalty: 50,
    minImagesRequired: 3,
    isDiscountSimulationEnabled: false,
    isWhatsAppNotificationEnabled: true,
    isEmailNotificationEnabled: true,
    isNewUIEnabled: true,
    heroBannerImage: '', 
    howItWorksImage: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', category: '', condition: '', estimated_value: '', preferred_item: ''
  });

  const [dropdownCategories, setDropdownCategories] = useState([]);

  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    orderStatus: '', awb_code: '', courier_company: ''
  });

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingOrder, setResolvingOrder] = useState(null);
  const [resolveForm, setResolveForm] = useState({ adminNote: '', transactionId: '' });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isRejectionReasonModalOpen, setIsRejectionReasonModalOpen] = useState(false);
  const [currentRejectionReason, setCurrentRejectionReason] = useState('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  const [isViewAILogModalOpen, setIsViewAILogModalOpen] = useState(false);
  const [viewingAILog, setViewingAILog] = useState(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [offerForm, setOfferForm] = useState({ mobileImage: '', desktopImage: '', isActive: true });
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingHowItWorks, setIsUploadingHowItWorks] = useState(false);

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
    const fetchDropdownCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories?limit=100`, { withCredentials: true });
        if (res.data.success && res.data.data) {
          setDropdownCategories(res.data.data.filter(c => c.isActive));
        }
      } catch (error) {
        console.error("Failed to load categories for dropdown", error);
      }
    };
    fetchDropdownCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (searchQuery !== debouncedSearch) {
         setCurrentPage(1); 
      }
    }, 500); 
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab.startsWith('settings')) {
          const response = await axios.get(`${API_URL}/admin/credit-settings`, { withCredentials: true });
          if (response.data.success && response.data.data) {
            setCreditSettings({ ...creditSettings, ...response.data.data });
          }

          const aiResponse = await axios.get(`${API_URL}/admin/ai-settings`, { withCredentials: true });
          if (aiResponse.data.success && aiResponse.data.data) {
            setAiSettings(aiResponse.data.data);
          }

        } else {
          let endpoint = '';
          if (activeTab === 'overview') endpoint = `${API_URL}/admin/dashboard-stats`; 
          else if (activeTab === 'pending') endpoint = `${API_URL}/admin/pending-items`;
          else if (activeTab === 'users') endpoint = `${API_URL}/admin/users`;
          else if (activeTab === 'items') endpoint = `${API_URL}/admin/all-items`;
          else if (activeTab === 'offers') endpoint = `${API_URL}/admin/offers`; 
          else if (activeTab === 'categories') endpoint = `${API_URL}/categories`;
          else if (activeTab === 'transactions') endpoint = `${API_URL}/admin/transactions`; 
          else if (activeTab === 'orders') endpoint = `${API_URL}/admin/orders`; 
          else if (activeTab === 'ai-logs') {
            endpoint = `${API_URL}/admin/ai-logs`;
        
            const statsRes = await axios.get(`${API_URL}/admin/ai-log-stats`, { withCredentials: true });
            if (statsRes.data.success && statsRes.data.data) {
              const statsObj = { pending: 0, cleaned: 0, rejected: 0, trained: 0 };
              statsRes.data.data.forEach(stat => {
                if (stat._id) statsObj[stat._id] = stat.count;
              });
              setAiLogStats(statsObj);
            }
          }

          if (['pending', 'users', 'items', 'transactions', 'orders', 'ai-logs'].includes(activeTab)) {
            endpoint += `?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`;
          }

          const response = await axios.get(endpoint, { withCredentials: true });
          
          if (activeTab === 'transactions') {
            setTotalIncome(response.data.totalIncome || 0);
            if (response.data.financials) {
              setFinancials(response.data.financials);
            }
          }
          
          setData(response.data.data || []);
          
          if (response.data.totalPages) {
             setTotalPages(response.data.totalPages);
          } else {
             setTotalPages(1);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        toast.error('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, currentPage, debouncedSearch]); 

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_URL}/admin/item-status/${id}`, { status: 'active' }, { withCredentials: true });
      setData(Array.isArray(data) ? data.filter(item => item._id !== id) : data);
      toast.success('Item approved successfully! 🎉'); 
    } catch (error) {
      console.error('Error approving item:', error);
      toast.error('Failed to approve item.'); 
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
      setData(Array.isArray(data) ? data.filter(item => item._id !== rejectingItemId) : data);
      setIsRejectModalOpen(false);
      toast.success('Item rejected successfully.'); 
    } catch (error) {
      console.error('Error rejecting item:', error);
      toast.error('Failed to reject item.'); 
    }
  };

  const handleViewRejectionReason = (reason) => {
    setCurrentRejectionReason(reason);
    setIsRejectionReasonModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this item permanently?`)) return;
    try {
      await axios.delete(`${API_URL}/items/${id}`, { withCredentials: true });
      setData(Array.isArray(data) ? data.filter(item => item._id !== id) : data);
      toast.success('Item deleted permanently.'); 
    } catch (error) {
      console.error(`Error deleting item:`, error);
      toast.error('Failed to delete item.'); 
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
        setData(Array.isArray(data) ? data.map(item => item._id === editingItemId ? { ...item, ...editForm } : item) : data);
        setIsEditModalOpen(false);
        toast.success('Item updated successfully! 📝'); 
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item.'); 
    } finally {
      setUpdating(false);
    }
  };

  const handleEditOrderClick = (order) => {
    setEditingOrder(order);
    setOrderForm({
      orderStatus: order.orderStatus || 'pending',
      awb_code: order.trackingDetails?.awb_code || '',
      courier_company: order.trackingDetails?.courier_company || ''
    });
    setIsEditOrderModalOpen(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const response = await axios.put(`${API_URL}/admin/orders/${editingOrder._id}`, orderForm, { withCredentials: true });
      if (response.data.success) {
        setData(Array.isArray(data) ? data.map(o => o._id === editingOrder._id ? response.data.data : o) : data);
        setIsEditOrderModalOpen(false);
        toast.success('Order tracking & status updated! 🚚'); 
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order details.'); 
    } finally {
      setUpdating(false);
    }
  };

  const handleResolveRefundClick = (order) => {
    setResolvingOrder(order);
    setResolveForm({ adminNote: '', transactionId: '' });
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axios.put(`${API_URL}/admin/orders/${resolvingOrder._id}/resolve-refund`, resolveForm, { withCredentials: true });
      if (res.data.success) {
        setData(Array.isArray(data) ? data.map(o => o._id === resolvingOrder._id ? res.data.data : o) : data);
        setIsResolveModalOpen(false);
        toast.success('Failed refund resolved manually! ✅');
      }
    } catch (error) {
      console.error('Error resolving refund:', error);
      toast.error('Failed to resolve refund.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRetryRefundClick = async (orderId) => {
    if (!window.confirm('Are you sure you want to retry the refund automatically via Razorpay?')) return;
    try {
      const res = await axios.put(`${API_URL}/admin/orders/${orderId}/retry-refund`, {}, { withCredentials: true });
      if (res.data.success) {
        setData(Array.isArray(data) ? data.map(o => o._id === orderId ? res.data.data : o) : data);
        toast.success('Refund re-initiated successfully! 🔄');
      }
    } catch (error) {
      console.error('Error retrying refund:', error);
      toast.error(error.response?.data?.message || 'Failed to retry refund.');
    }
  };

  const handleViewClick = (item) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleViewAILogClick = (log) => {
    setViewingAILog(log);
    setIsViewAILogModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, { withCredentials: true });
      setData(Array.isArray(data) ? data.filter(u => u._id !== id) : data);
      if (isViewUserModalOpen && viewingUser?._id === id) setIsViewUserModalOpen(false);
      toast.success('User account deleted.'); 
    } catch (error) {
      console.error(`Error deleting user:`, error);
      toast.error(error.response?.data?.message || 'Failed to delete user.'); 
    }
  };

  const handleUpdateRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'make this user an admin' : 'remove admin rights from this user';
    
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      const response = await axios.put(`${API_URL}/admin/users/role/${id}`, { role: newRole }, { withCredentials: true });
      if (response.data.success) {
        setData(Array.isArray(data) ? data.map(u => u._id === id ? { ...u, role: newRole } : u) : data);
        if (isViewUserModalOpen && viewingUser?._id === id) {
          setViewingUser({ ...viewingUser, role: newRole });
        }
        toast.success(`User role updated to ${newRole.toUpperCase()}! 🛡️`); 
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role.'); 
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
      else if (cropType === 'desktop') setIsUploadingDesktop(true);
      else if (cropType === 'heroBanner') setIsUploadingHero(true);
      else if (cropType === 'howItWorks') setIsUploadingHowItWorks(true);

      const formData = new FormData();
      formData.append('file', croppedImageBlob);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      
      if (cropType === 'mobile') {
        setOfferForm(prev => ({ ...prev, mobileImage: res.data.secure_url }));
      } else if (cropType === 'desktop') {
        setOfferForm(prev => ({ ...prev, desktopImage: res.data.secure_url }));
      } else if (cropType === 'heroBanner') {
        setCreditSettings(prev => ({ ...prev, heroBannerImage: res.data.secure_url }));
      } else if (cropType === 'howItWorks') {
        setCreditSettings(prev => ({ ...prev, howItWorksImage: res.data.secure_url }));
      }
      
      setCropModalOpen(false);

      const typeName = cropType === 'heroBanner' ? 'Hero Banner' : cropType === 'howItWorks' ? 'Guide Image' : cropType === 'mobile' ? 'Mobile Banner' : 'Desktop Banner';
      toast.success(`${typeName} uploaded successfully!`); 
    } catch (error) {
      console.error('Error cropping/uploading:', error);
      toast.error('Failed to upload image. Try again.'); 
    } finally {
      setIsProcessingCrop(false);
      if (cropType === 'mobile') setIsUploadingMobile(false);
      else if (cropType === 'desktop') setIsUploadingDesktop(false);
      else if (cropType === 'heroBanner') setIsUploadingHero(false);
      else if (cropType === 'howItWorks') setIsUploadingHowItWorks(false);
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
    if (!offerForm.mobileImage || !offerForm.desktopImage) {
      return toast.error('Please provide both Mobile and Desktop images.'); 
    }
    setUpdating(true);
    try {
      if (editingOfferId) {
        const res = await axios.put(`${API_URL}/admin/offers/${editingOfferId}`, offerForm, { withCredentials: true });
        setData(Array.isArray(data) ? data.map(o => o._id === editingOfferId ? res.data.data : o) : data);
        toast.success('Banner updated successfully! 🖼️'); 
      } else {
        const res = await axios.post(`${API_URL}/admin/offers`, offerForm, { withCredentials: true });
        setData(Array.isArray(data) ? [res.data.data, ...data] : [res.data.data]);
        toast.success('New banner published! 🚀'); 
      }
      setIsOfferModalOpen(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer.'); 
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Delete this banner permanently?')) return;
    try {
      await axios.delete(`${API_URL}/admin/offers/${id}`, { withCredentials: true });
      setData(Array.isArray(data) ? data.filter(offer => offer._id !== id) : data);
      toast.success('Banner removed from platform.'); 
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer.'); 
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
    if (!categoryForm.name.trim()) return toast.error('Category name is required.'); 
    setUpdating(true);
    try {
      if (editingCategoryId) {
        const res = await axios.put(`${API_URL}/categories/${editingCategoryId}`, categoryForm, { withCredentials: true });
        setData(Array.isArray(data) ? data.map(c => c._id === editingCategoryId ? res.data.data : c) : data);
        setDropdownCategories(prev => prev.map(c => c._id === editingCategoryId ? res.data.data : c).filter(c => c.isActive));
        toast.success('Category updated! 📑'); 
      } else {
        const res = await axios.post(`${API_URL}/categories`, categoryForm, { withCredentials: true });
        setData(Array.isArray(data) ? [...data, res.data.data].sort((a,b) => a.name.localeCompare(b.name)) : [res.data.data]);
        setDropdownCategories(prev => [...prev, res.data.data].filter(c => c.isActive).sort((a,b) => a.name.localeCompare(b.name)));
        toast.success('Category created! ✨'); 
      }
      setIsCategoryModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category.'); 
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category permanently?')) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`, { withCredentials: true });
      setData(Array.isArray(data) ? data.filter(c => c._id !== id) : data);
      setDropdownCategories(prev => prev.filter(c => c._id !== id));
      toast.success('Category deleted.'); 
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.'); 
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      if (activeTab === 'settings-ai') {
        const aiResponse = await axios.put(`${API_URL}/admin/ai-settings`, aiSettings, { withCredentials: true });
        if (aiResponse.data.success) {
          toast.success('AI Settings successfully updated! 🤖'); 
        }
      } else {
        const response = await axios.put(`${API_URL}/admin/credit-settings`, creditSettings, { withCredentials: true });
        if (response.data.success) {
          toast.success('Credit settings successfully updated! 🎉'); 
          queryClient.invalidateQueries({ queryKey: ['creditSettings'] });
          queryClient.invalidateQueries({ queryKey: ['publicSettings'] });
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.'); 
    } finally {
      setUpdating(false);
    }
  };

  const isSearchableTab = ['pending', 'users', 'items', 'transactions', 'orders'].includes(activeTab);

  return (
    <div className="h-screen w-full bg-[#0B0F19] flex overflow-hidden relative selection:bg-emerald-500/30 text-gray-100 font-sans">
      
      <ToastContainer theme="dark" position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />

  
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      
      <style dangerouslySetInnerHTML={{__html: `
        .admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .admin-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />

  
      <AdminSidebar 
        user={user}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        data={data}
        searchQuery={searchQuery}
        setData={setData}
        setLoading={setLoading}
        setCurrentPage={setCurrentPage}
        setSearchQuery={setSearchQuery}
        setDebouncedSearch={setDebouncedSearch}
      />

  
      <main className="flex-1 flex flex-col z-10 overflow-hidden relative w-full">
        
        <header className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 bg-white/[0.01] backdrop-blur-md shrink-0 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="truncate">
              <h2 className="text-xl md:text-2xl font-bold text-white capitalize tracking-tight truncate">
                {activeTab.startsWith('settings') ? activeTab.replace('settings-', '').replace('-', ' ') : activeTab.replace('-', ' ')}
              </h2>
              <p className="hidden md:block text-sm text-gray-400 mt-1">Manage and monitor your platform data</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto shrink-0">
            {isSearchableTab && (
              <div className="relative w-full sm:w-64 md:w-72">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${activeTab.replace('-', ' ')}...`}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 md:py-2.5 text-white text-xs md:text-sm focus:outline-none focus:border-[#A388E1]/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600"
                />
              </div>
            )}

            {activeTab === 'offers' && (
              <button onClick={handleAddOfferClick} className="bg-[#A388E1] hover:bg-[#8b70ca] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-[0_0_20px_rgba(163,136,225,0.3)] flex items-center justify-center gap-1.5 md:gap-2 border border-white/10 hover:scale-105 active:scale-95 w-full sm:w-auto">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>New Banner</span>
              </button>
            )}
            {activeTab === 'categories' && (
              <button onClick={handleAddCategoryClick} className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-1.5 md:gap-2 border border-white/10 hover:scale-105 active:scale-95 w-full sm:w-auto">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span>New Category</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 lg:p-8">
          <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-xl relative">
            
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F19]/50 backdrop-blur-sm z-50">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-[#A388E1]/20 border-t-[#A388E1] rounded-full animate-spin"></div>
                <p className="text-[#A388E1] font-bold tracking-widest mt-4 animate-pulse text-xs md:text-sm">FETCHING DATA...</p>
              </div>
            ) : null}
            
            {activeTab === 'overview' && !loading && (
              <DashboardOverview data={data} />
            )}


            {activeTab.startsWith('settings') && !loading && (
              <SettingsPanel 
                activeTab={activeTab} 
                creditSettings={creditSettings}
                setCreditSettings={setCreditSettings}
                aiSettings={aiSettings}
                setAiSettings={setAiSettings}
                handleSaveSettings={handleSaveSettings}
                updating={updating}
                handleImageSelect={handleImageSelect}
                isUploadingHero={isUploadingHero}
                isUploadingHowItWorks={isUploadingHowItWorks}
              />
            )}

        
            {activeTab === 'ai-logs' && !loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 shrink-0 bg-white/[0.01] border-b border-white/5">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 md:p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-blue-400">
                    <Database className="w-4 h-4 md:w-5 md:h-5" />
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Pending</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">{aiLogStats.pending || 0}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Awaiting cleanup job</p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 md:p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-emerald-400">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Cleaned</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">{aiLogStats.cleaned || 0}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Ready for next batch</p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-3 md:p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-red-400">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Rejected</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">{aiLogStats.rejected || 0}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Spam or short msgs</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 p-3 md:p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1 text-purple-400">
                    <Bot className="w-4 h-4 md:w-5 md:h-5" />
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Trained</p>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">{aiLogStats.trained || 0}</h3>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">Learned by model</p>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && !loading && (
              <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                <div className="flex flex-row gap-2 md:gap-4 mb-3 md:mb-4 shrink-0">
                  
                
                  <div className="flex-[2] relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-teal-900/30 rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-emerald-500/20 shadow-sm flex flex-col justify-center gap-2 md:gap-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="bg-emerald-500/20 p-1.5 md:p-2.5 rounded-lg border border-emerald-500/30 shrink-0">
                        <IndianRupee className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-emerald-400/80 font-bold uppercase tracking-widest text-[8px] md:text-[10px] mb-0.5 truncate">Net Balance</p>
                        <h3 className="text-sm sm:text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 truncate">
                          ₹{financials.netIncome ? financials.netIncome.toLocaleString('en-IN') : totalIncome.toLocaleString('en-IN')}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-start justify-between gap-2 pt-2 md:pt-3 border-t border-emerald-500/10">
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] md:text-[9px] text-emerald-400/70 font-bold uppercase tracking-wider mb-0.5 truncate">Total In</p>
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-emerald-300 truncate leading-none mb-1">₹{financials.totalRevenue ? financials.totalRevenue.toLocaleString('en-IN') : '0'}</p>
                    
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[7px] md:text-[8px] text-gray-400 truncate leading-none"><span className="text-purple-400 font-semibold">Wallet:</span> ₹{financials.walletIncome ? financials.walletIncome.toLocaleString('en-IN') : '0'}</p>
                          <p className="text-[7px] md:text-[8px] text-blue-400 font-semibold mt-1">Shipping Breakdown:</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 pl-1.5 border-l border-white/10 ml-1 truncate leading-none">Base: ₹{financials.baseShippingIncome ? financials.baseShippingIncome.toLocaleString('en-IN') : '0'}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 pl-1.5 border-l border-white/10 ml-1 truncate leading-none">Fee (2%): ₹{financials.totalPlatformFees ? financials.totalPlatformFees.toLocaleString('en-IN') : '0'}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 pl-1.5 border-l border-white/10 ml-1 truncate leading-none">GST (18%): ₹{financials.totalGstCollected ? financials.totalGstCollected.toLocaleString('en-IN') : '0'}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-300 pl-1.5 border-l border-white/10 ml-1 mt-0.5 truncate leading-none font-semibold">= Total Ship: ₹{financials.shippingIncome ? financials.shippingIncome.toLocaleString('en-IN') : '0'}</p>
                        </div>
          
                      </div>
                      <div className="w-px self-stretch bg-emerald-500/20 shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[7px] md:text-[9px] text-red-400/70 font-bold uppercase tracking-wider mb-0.5 truncate">Refunds Out</p>
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-red-300 truncate leading-none">₹{financials.totalRefunds ? financials.totalRefunds.toLocaleString('en-IN') : '0'}</p>
                      </div>
                    </div>
                  </div>

          
                  <div className="flex-[1] relative overflow-hidden bg-white/[0.03] rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-white/10 shadow-sm flex flex-col items-center justify-center text-center shrink-0">
                    <div className="bg-blue-500/10 p-1.5 md:p-2.5 rounded-lg border border-blue-500/20 mb-1.5 md:mb-2">
                      <Activity className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px] md:text-[10px] mb-0.5 truncate">Displayed</p>
                      <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white truncate">{Array.isArray(data) ? data.length : 0}</h3>
                    </div>
                  </div>

                </div>

                {(!Array.isArray(data) || data.length === 0) ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8 bg-white/[0.02] rounded-2xl md:rounded-3xl border border-white/5">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                      <IndianRupee className="w-8 h-8 md:w-10 md:h-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1 tracking-tight">No Transactions Found</h3>
                    {searchQuery ? <p className="text-gray-500 text-xs md:text-sm">Try adjusting your search terms.</p> : <p className="text-gray-500 text-xs md:text-sm">Transactions will appear here once users start buying credits.</p>}
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto admin-scroll bg-white/[0.01] rounded-xl md:rounded-2xl border border-white/5 relative">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead className="sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-white/10 shadow-sm">
                        <tr className="text-[10px] md:text-xs uppercase tracking-widest text-gray-400">
                          <th className="p-4 md:p-5 font-bold">User</th>
                          <th className="p-4 md:p-5 font-bold">Amount</th>
                          <th className="p-4 md:p-5 font-bold">Type</th>
                          <th className="p-4 md:p-5 font-bold">Order Details</th>
                          <th className="p-4 md:p-5 font-bold">Status</th>
                          <th className="p-4 md:p-5 font-bold">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.isArray(data) && data.map(txn => (
                          <tr key={txn._id} className="hover:bg-white/[0.02] transition-colors group text-xs md:text-sm">
                            <td className="p-4 md:p-5">
                              <div className="flex items-center gap-3">
                                {txn.user?.profilePic ? (
                                  <img src={txn.user.profilePic} alt="User" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-white/10 shadow-sm" />
                                ) : (
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                     <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                   <p className="font-bold text-gray-200 group-hover:text-white transition-colors">{txn.user?.full_name || 'Unknown User'}</p>
                                   <p className="text-[10px] md:text-[11px] text-gray-500">{txn.user?.email || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 md:p-5">
                              <span className="text-base md:text-lg font-black text-emerald-400 tracking-tight">
                                ₹{txn.amount}
                              </span>
                              
                       
                              {txn.transactionType === 'shipping_fee' && txn.amount > 0 && (() => {
                                const base = Number((txn.amount / 1.20).toFixed(2));
                                const fee = Number((base * 0.02).toFixed(2));
                                const gst = Number((txn.amount - base - fee).toFixed(2));
                                return (
                                  <div className="mt-1.5 flex flex-col gap-1 border-l-2 border-emerald-500/20 pl-2">
                                    <span className="text-[8px] text-gray-400 font-medium leading-none">Base: ₹{base}</span>
                                    <span className="text-[8px] text-gray-400 font-medium leading-none">Fee (2%): ₹{fee}</span>
                                    <span className="text-[8px] text-gray-400 font-medium leading-none">GST (18%): ₹{gst}</span>
                                  </div>
                                );
                              })()}
                            

                            </td>
                            <td className="p-4 md:p-5">
                              {txn.transactionType === 'shipping_fee' ? (
                                <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center w-fit gap-1 md:gap-1.5 shadow-sm">
                                  <Package className="w-3 h-3 md:w-3.5 md:h-3.5" /> Shipping
                                </span>
                              ) : txn.transactionType === 'shipping_refund' || txn.transactionType === 'order_refund' ? (
                                <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 flex items-center w-fit gap-1 md:gap-1.5 shadow-sm">
                                  <RefreshCcw className="w-3 h-3 md:w-3.5 md:h-3.5" /> Refund
                                </span>
                              ) : (
                                <span className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center w-fit gap-1 md:gap-1.5 shadow-sm">
                                  <Wallet className="w-3 h-3 md:w-3.5 md:h-3.5" /> Wallet
                                </span>
                              )}
                            </td>
                            <td className="p-4 md:p-5">
                              <div className="text-[10px] md:text-xs font-mono">
                                <p className="text-gray-400 font-semibold mb-1">ID: <span className="text-blue-300">{txn.razorpay_order_id}</span></p>
                                <p className="text-gray-500/80 truncate w-32 md:w-48 text-[9px] md:text-[10px]" title={txn.razorpay_payment_id}>Pay: {txn.razorpay_payment_id}</p>
                              </div>
                            </td>
                            <td className="p-4 md:p-5">
                               <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider shadow-sm border ${
                                 txn.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                 txn.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                 'bg-red-500/10 text-red-400 border-red-500/20'
                               }`}>
                                 {txn.status}
                               </span>
                            </td>
                            <td className="p-4 md:p-5">
                              <p className="text-xs md:text-sm text-gray-300 font-bold">{new Date(txn.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] md:text-[11px] text-gray-500 mt-0.5">{new Date(txn.created_at).toLocaleTimeString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Embedded Pagination for Transactions Tab */}
                {totalPages > 1 && Array.isArray(data) && data.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-t-0 border-white/5 rounded-b-xl md:rounded-b-2xl shrink-0 mt-4">
                    <p className="text-xs text-gray-500 font-medium">
                      Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'overview' && !activeTab.startsWith('settings') && activeTab !== 'transactions' && !loading && (
              (!Array.isArray(data) || data.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8 bg-white/[0.01]">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 md:mb-5 border border-white/10 shadow-inner">
                    {activeTab === 'pending' ? <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     activeTab === 'users' ? <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     activeTab === 'orders' ? <Truck className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     activeTab === 'offers' ? <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     activeTab === 'categories' ? <Layers className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     activeTab === 'ai-logs' ? <Bot className="w-6 h-6 md:w-8 md:h-8 text-gray-500" /> : 
                     <List className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-200 mb-2 tracking-tight">No Records Found</h3>
                  {searchQuery 
                    ? <p className="text-gray-500 text-xs md:text-sm px-4">We couldn't find anything matching "{searchQuery}". Try a different keyword.</p>
                    : <p className="text-gray-500 text-xs md:text-sm px-4">There are currently no {activeTab === 'pending' ? 'pending approvals' : activeTab === 'offers' ? 'banners available' : activeTab === 'categories' ? 'categories available' : activeTab === 'orders' ? 'active orders or swaps' : activeTab === 'ai-logs' ? 'training logs to review' : 'records to display'}.</p>
                  }
                </div>
              ) : (
                <AdminTable 
                  activeTab={activeTab}
                  data={Array.isArray(data) ? data : []}
                  AVAILABLE_ICONS={AVAILABLE_ICONS}
                  handleViewClick={handleViewClick}
                  handleViewAILogClick={handleViewAILogClick} 
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
                  handleEditOrderClick={handleEditOrderClick} 
                  handleResolveRefundClick={handleResolveRefundClick}
                  handleRetryRefundClick={handleRetryRefundClick} 
                  handleViewRejectionReason={handleViewRejectionReason}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              )
            )}
          </div>
        </div>
      </main>

  
      <ResolveRefundModal
        isResolveModalOpen={isResolveModalOpen}
        setIsResolveModalOpen={setIsResolveModalOpen}
        resolvingOrder={resolvingOrder}
        handleResolveSubmit={handleResolveSubmit}
        resolveForm={resolveForm}
        setResolveForm={setResolveForm}
        updating={updating}
      />
   
      {isRejectionReasonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-sm rounded-2xl md:rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 md:p-5 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
              <h2 className="text-base md:text-lg font-black text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 md:w-5 md:h-5" /> Rejection Reason
              </h2>
              <button onClick={() => setIsRejectionReasonModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-white/5 p-2 rounded-full hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 md:p-6">
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 text-sm text-gray-300 leading-relaxed min-h-[80px]">
                {currentRejectionReason || "No reason was provided."}
              </div>
            </div>
            
            <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsRejectionReasonModalOpen(false)} 
                className="px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

   
      <ViewAILogModal 
        isViewAILogModalOpen={isViewAILogModalOpen}
        setIsViewAILogModalOpen={setIsViewAILogModalOpen}
        viewingAILog={viewingAILog}
      />

      <EditOrderModal 
        isEditOrderModalOpen={isEditOrderModalOpen}
        setIsEditOrderModalOpen={setIsEditOrderModalOpen}
        editingOrder={editingOrder}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        handleOrderSubmit={handleOrderSubmit}
        updating={updating}
      />

      <RejectItemModal 
        isRejectModalOpen={isRejectModalOpen}
        setIsRejectModalOpen={setIsRejectModalOpen}
        handleRejectSubmit={handleRejectSubmit}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
      />

      <EditItemModal 
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editForm={editForm}
        handleEditChange={handleEditChange}
        handleEditSubmit={handleEditSubmit}
        dropdownCategories={dropdownCategories}
        updating={updating}
      />

      {isCategoryModalOpen && (
        <CategoryModal
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          editingCategoryId={editingCategoryId}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          handleCategorySubmit={handleCategorySubmit}
          updating={updating}
          AVAILABLE_ICONS={AVAILABLE_ICONS}
        />
      )}

      <ViewUserModal 
        isViewUserModalOpen={isViewUserModalOpen} 
        setIsViewUserModalOpen={setIsViewUserModalOpen} 
        viewingUser={viewingUser} 
        handleUpdateRole={handleUpdateRole} 
      />

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

      <ImageCropModal 
        cropModalOpen={cropModalOpen}
        setCropModalOpen={setCropModalOpen}
        imageToCrop={imageToCrop}
        cropType={cropType}
        crop={crop}
        setCrop={setCrop}
        zoom={zoom}
        setZoom={setZoom}
        onCropComplete={onCropComplete}
        handleCropAndUpload={handleCropAndUpload}
        isProcessingCrop={isProcessingCrop}
      />

    </div>
  );
};

export default AdminPanel;