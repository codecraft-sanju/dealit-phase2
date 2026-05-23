import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  X, Plus, ChevronLeft, Gift, Image as ImageIcon,
  Sparkles, Wand2, Scale, Box, MapPin, Home, Hash,
  Loader2, ChevronDown, Check, AlertCircle
} from 'lucide-react';

import axios from 'axios';

import Cropper from 'react-easy-crop';

import { toast } from 'react-toastify';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import imageCompression from 'browser-image-compression';

import { motion, AnimatePresence } from 'framer-motion';



const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;


// ─── Indian States List ───────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry'
];


export const getOptimizedCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || url.includes('q_auto')) {
    return url;
  }
  return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
};


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
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((file) => {
      if (file) { file.name = 'cropped.jpeg'; resolve(file); }
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg', 0.9);
  });
};


// ─── State Autocomplete Input ─────────────────────────────────────────────────
const StateAutocompleteInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter states based on input
  const getFilteredStates = (query) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return INDIAN_STATES.filter(state =>
      state.toLowerCase().startsWith(q) ||
      state.toLowerCase().includes(q)
    ).slice(0, 6);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const filtered = getFilteredStates(val);
    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
    setActiveIndex(-1);
  };

  const handleSelect = (state) => {
    onChange(state);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching part of text
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-black text-[#6B46C1]">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder="State"
        required
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim()) {
            const filtered = getFilteredStates(value);
            setSuggestions(filtered);
            setIsOpen(filtered.length > 0);
          }
        }}
        autoComplete="off"
        className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-[#6B46C1] focus:bg-white outline-none transition-all font-medium text-gray-800"
      />

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 2, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-purple-100 rounded-2xl shadow-[0_8px_30px_rgba(107,70,193,0.15)] overflow-hidden py-1"
          >
            {suggestions.map((state, idx) => (
              <li
                key={state}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(state); }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center gap-2.5 transition-colors select-none ${
                  idx === activeIndex
                    ? 'bg-purple-50 text-[#6B46C1]'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-[#6B46C1]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-300" />
                <span>{highlightMatch(state, value)}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Custom Dropdown ──────────────────────────────────────────────────────────
const CustomDropdown = ({ label, options, value, onChange, placeholder, icon: Icon, disabled, hasError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="flex items-center gap-1.5 text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border shadow-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-[#805ad5] ring-2 ring-[#805ad5]/10'
            : 'border-gray-200'
        }`}
      >
        <span className={`text-xs sm:text-sm truncate pr-2 ${value ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#805ad5]' : 'text-gray-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[100] w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden py-1.5"
          >
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ─── Shimmer Loading ──────────────────────────────────────────────────────────
const ShimmerLoading = () => (
  <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
    <div className="w-full max-w-xl bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
      <div className="sticky top-0 z-50 bg-gray-200 px-4 py-5 flex items-center justify-between shadow-md md:rounded-t-[2.5rem] animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
        <div className="w-32 h-6 bg-gray-300 rounded-md" />
        <div className="w-12 h-4 bg-gray-300 rounded-md" />
      </div>
      <div className="p-6 md:p-8 space-y-6">
        <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
        <div className="pb-4 border-b border-gray-100 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
            <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
            <div className="w-24 h-24 bg-gray-200 rounded-2xl hidden sm:block" />
          </div>
        </div>
        <div className="space-y-5 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="w-full h-12 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="pt-4 animate-pulse">
          <div className="w-full h-14 bg-gray-200 rounded-[1.25rem]" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mt-4" />
        </div>
      </div>
    </div>
  </div>
);


// ─── Main Component ───────────────────────────────────────────────────────────
const AddItemPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const DRAFT_STORAGE_KEY = 'dealit_add_item_draft';

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    preferred_item: '',
    estimated_value: '',
    weightCategory: '0.5',
    exactWeight: '',
    dimensions: { length: 10, width: 10, height: 10 }
  });
  const [images, setImages] = useState([]);

  // ── Validation errors ───────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState({ category: false, condition: false });

  // ── AI fill highlight ───────────────────────────────────────────────────────
  const [aiFilledFields, setAiFilledFields] = useState([]);

  // ── Address modal ───────────────────────────────────────────────────────────
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    houseNo: '', areaStreet: '', landmark: '', city: '', state: '', pincode: ''
  });

  // ── Crop modal ──────────────────────────────────────────────────────────────
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // ── AI processing ───────────────────────────────────────────────────────────
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const progressIntervalRef = useRef(null);
  const draftTimerRef = useRef(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, []);

  // ── Sync address form when user/modal changes ───────────────────────────────
  useEffect(() => {
    if (user?.pickupAddress) {
      setAddressForm({
        houseNo: user.pickupAddress.houseNo || '',
        areaStreet: user.pickupAddress.areaStreet || '',
        landmark: user.pickupAddress.landmark || '',
        city: user.pickupAddress.city || '',
        state: user.pickupAddress.state || '',
        pincode: user.pickupAddress.pincode || ''
      });
    }
  }, [user, isAddressModalOpen]);

  // ── Refresh user on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };
    refreshUserData();
  }, [setUser]);

  // ── Load draft once on mount ────────────────────────────────────────────────
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return;
    try {
      const { formData: savedFormData, images: savedImages } = JSON.parse(savedDraft);
      if (savedFormData) setFormData(savedFormData);
      if (savedImages) setImages(savedImages);
    } catch {
      console.warn('Draft parse failed, clearing.');
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  // ── Debounced draft save ────────────────────────────────────────────────────
  useEffect(() => {
    if (formData.title === '' && images.length === 0) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ formData, images }));
    }, 800);
  }, [formData, images]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`, { withCredentials: true });
        if (res.data?.success && Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.categories)) return res.data.categories;
        return [];
      } catch { return []; }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: systemSettings = {
    isCreditSystemEnabled: true,
    creditsPerListing: 50,
    maxListingsRewarded: 3,
    maxAllowedListings: 5,
    minImagesRequired: 3
  }, isLoading: loadingSettings } = useQuery({
    queryKey: ['creditSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/admin/public-settings`, { withCredentials: true });
      return res.data.success && res.data.data ? res.data.data : {
        isCreditSystemEnabled: true,
        creditsPerListing: 50,
        maxListingsRewarded: 3,
        maxAllowedListings: 5,
        minImagesRequired: 3
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  const activeListedCount = user?.listedProductsCount || 0;
  const rewardedCount = user?.rewardedListingsCount || 0;
  const isLimitReached = activeListedCount >= systemSettings.maxAllowedListings;
  const minImages = systemSettings.minImagesRequired || 3;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDimensionChange = (e) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [e.target.name]: e.target.value }
    }));
  };

  const handleImageSelect = (e) => {
    if (images.length >= 5) { toast.error('Maximum 5 images allowed.'); return; }
    if (!e.target.files?.length) return;

    const imageFile = e.target.files[0];
    const imageUrl = URL.createObjectURL(imageFile);
    setImageToCrop(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
    e.target.value = null;
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // ── Upload image mutation ────────────────────────────────────────────────────
  const uploadImageMutation = useMutation({
    mutationFn: async () => {
      let croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      try {
        croppedImageBlob = await imageCompression(croppedImageBlob, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg'
        });
      } catch (error) {
        console.warn("Compression failed, using original cropped blob", error);
      }

      const data = new FormData();
      data.append('file', croppedImageBlob);
      data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        data
      );
      return response.data.secure_url;
    },
    onSuccess: (originalUrl) => {
      setImages(prev => [...prev, originalUrl]);
      setCropModalOpen(false);
      if (imageToCrop) URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    },
    onError: () => toast.error('Failed to upload image. Please try again.'),
  });

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  // ── AI Auto-fill ─────────────────────────────────────────────────────────────
  const autoFillMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/ai/analyze-images`,
        { imageUrls: images.slice(0, 3) },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setAnalyzeProgress(100);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      if (data.success && data.data) {
        const { title, category, description } = data.data;
        const filled = [];
        setTimeout(() => {
          setFormData(prev => {
            if (title && !prev.title) filled.push('title');
            if (category && !prev.category) filled.push('category');
            if (description && !prev.description) filled.push('description');
            return {
              ...prev,
              title: title || prev.title,
              category: category || prev.category,
              description: description || prev.description,
            };
          });
          setAiFilledFields(filled);
          setTimeout(() => setAiFilledFields([]), 2000);
          setAnalyzeProgress(0);
        }, 600);
      } else {
        setAnalyzeProgress(0);
      }
    },
    onError: () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setFormData(prev => ({
        ...prev,
        title: prev.title || 'My Item for Sale',
        category: prev.category || 'Other',
        description: prev.description || 'I am selling this item. It is in good condition. Please refer to the uploaded images for more details.',
      }));
      toast.warning("AI couldn't analyze images right now. Generic details filled — please edit them.");
      setAnalyzeProgress(0);
    }
  });

  const handleAutoFillFromImages = () => {
    if (images.length === 0) {
      toast.error('Please upload at least 1 image so the AI can analyze your item.');
      return;
    }
    setAnalyzeProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setAnalyzeProgress(prev => {
        if (prev >= 92) { clearInterval(progressIntervalRef.current); return prev; }
        return Math.min(92, prev + Math.floor(Math.random() * 8) + 4);
      });
    }, 350);
    autoFillMutation.mutate();
  };

  // ── AI Generate description ──────────────────────────────────────────────────
  const generateDescMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/ai/generate-description`,
        { title: formData.title, category: formData.category, condition: formData.condition },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
        setAiFilledFields(['description']);
        setTimeout(() => setAiFilledFields([]), 2000);
      }
    },
    onError: () => {
      const safeTitle = formData.title || 'item';
      const safeCondition = formData.condition || 'good';
      const templates = {
        Electronics: `Selling my ${safeTitle}. It is in ${safeCondition} condition. Works perfectly fine with no major issues. Message me for more details!`,
        Vehicles: `Up for sale is my ${safeTitle}. Condition is ${safeCondition}. Well maintained and ready to go.`,
        Clothing: `Selling this ${safeTitle}. It is in ${safeCondition} condition. Looks great. Reach out if interested.`,
        Furniture: `Selling my ${safeTitle}. It's in ${safeCondition} condition. Very sturdy and well-maintained.`,
        Other: `I am selling my ${safeTitle}. The condition is ${safeCondition}. Please contact me if you have any questions.`
      };
      setFormData(prev => ({ ...prev, description: templates[formData.category] || templates.Other }));
      toast.warning("AI is busy. A basic template was added — feel free to edit it!");
    }
  });

  const handleGenerateDescription = () => {
    if (!formData.title || !formData.category) {
      toast.error('Please enter a Title and select a Category first.');
      return;
    }
    generateDescMutation.mutate();
  };

  // ── Address mutation ─────────────────────────────────────────────────────────
  const updateAddressMutation = useMutation({
    mutationFn: async (updatedAddress) => {
      const payload = {
        full_name: user?.full_name,
        phone: user?.phone,
        city: user?.city,
        pickupAddress: updatedAddress
      };
      return await axios.put(`${API_URL}/users/profile`, payload, { withCredentials: true });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['profile']);
      setIsAddressModalOpen(false);
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch { /* non-critical */ }
      toast.success('Pickup address updated successfully!');
    },
    onError: () => toast.error('Failed to update pickup address.'),
  });

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (addressForm.houseNo && !/\d/.test(addressForm.houseNo)) {
      toast.error('House No. must include at least one digit (e.g., Flat 4B, Plot 12).');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      toast.error('Pincode must be exactly 6 digits.');
      return;
    }
    updateAddressMutation.mutate(addressForm);
  };

  // ── Create item mutation ─────────────────────────────────────────────────────
  const createItemMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.post(`${API_URL}/items`, payload, { withCredentials: true });
      return response.data;
    },
    onSuccess: async () => {
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch { /* non-critical */ }
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      toast.success('Product listed successfully! Credits will be added once admin approves it.', { autoClose: 5000 });
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to list item. Please try again.');
    }
  });

  // ── Form submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Manual validation for custom dropdown fields
    const errors = { category: !formData.category, condition: !formData.condition };
    setFieldErrors(errors);
    if (errors.category || errors.condition) {
      toast.error('Please select both Category and Condition.');
      return;
    }

    if (!user?.pickupAddress?.houseNo) {
      toast.error('Please add your pickup address first.', { position: 'top-center', autoClose: 5000 });
      setIsAddressModalOpen(true);
      return;
    }

    if (images.length < minImages) {
      toast.error(`Please upload at least ${minImages} image${minImages > 1 ? 's' : ''}.`);
      return;
    }

    if (formData.weightCategory === 'custom') {
      const parsedWeight = parseFloat(formData.exactWeight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        toast.error('Please enter a valid custom weight greater than 0 Kg.');
        return;
      }
    }

    const estimatedVal = parseFloat(formData.estimated_value);
    if (!estimatedVal || estimatedVal <= 0) {
      toast.error('Please enter a valid price greater than 0.');
      return;
    }

    const finalWeight = formData.weightCategory === 'custom'
      ? parseFloat(formData.exactWeight)
      : parseFloat(formData.weightCategory);

    const toastId = toast.loading('Listing your item...');

    createItemMutation.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      condition: formData.condition,
      preferred_item: formData.preferred_item,
      estimated_value: formData.estimated_value,
      images: images,
      weight: finalWeight,
      dimensions: formData.dimensions
    }, {
      onSettled: () => toast.dismiss(toastId),
    });
  };

  // ── Dropdown options ─────────────────────────────────────────────────────────
  const categoryOptions = [
    ...categories.map(cat => ({ label: cat.name || cat.title, value: cat.name || cat.title })),
    { label: 'Other', value: 'Other' }
  ];
  const conditionOptions = [
    { label: 'Brand New', value: 'New' },
    { label: 'Like New', value: 'Like New' },
    { label: 'Used - Good', value: 'Used' },
    { label: 'Fair', value: 'Fair' }
  ];
  const weightOptions = [
    { label: 'Up to 500g (Phones, Clothes)', value: '0.5' },
    { label: '500g to 1 Kg (Shoes, Books)', value: '1' },
    { label: '1 Kg to 2 Kg (Laptops, Appliances)', value: '2' },
    { label: '2 Kg to 5 Kg (Heavy items)', value: '5' },
    { label: 'Custom Weight (Kg)', value: 'custom' }
  ];

  // ── AI highlight helper ──────────────────────────────────────────────────────
  const getFieldHighlight = (field) =>
    aiFilledFields.includes(field)
      ? 'ring-2 ring-green-400 border-green-300 transition-all duration-500'
      : '';

  // ── Guard: show shimmer while settings load ──────────────────────────────────
  if (loadingSettings) return <ShimmerLoading />;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-xl bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-50 bg-[#6B46C1] px-4 py-4 sm:py-5 flex items-center justify-between text-white shadow-md md:rounded-t-[2.5rem] relative">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <h2 className="text-lg sm:text-xl font-bold tracking-wide absolute left-1/2 -translate-x-1/2">
            List an Item
          </h2>

          <button
            onClick={() => setIsAddressModalOpen(prev => !prev)}
            className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-full transition-all duration-300 active:scale-95 ${
              user?.pickupAddress?.houseNo
                ? 'bg-green-500/20 border-green-300/40 hover:bg-green-400/30'
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">Pickup</span>
            {!user?.pickupAddress?.houseNo && (
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* ── Address Dropdown ── */}
          <AnimatePresence>
            {isAddressModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddressModalOpen(false)}
                  className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="absolute top-[70px] right-4 left-4 sm:left-auto sm:w-[380px] bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[70] overflow-hidden border border-gray-100"
                >
                  <div className="px-5 py-4 border-b border-gray-100 bg-[#f8f6ff] flex justify-between items-center relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#9F7AEA] via-[#805ad5] to-[#6B46C1]" />
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#6B46C1]" />
                      Pickup Details
                    </h3>
                    <button
                      onClick={() => setIsAddressModalOpen(false)}
                      className="bg-white p-1.5 rounded-full text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <form id="pickupAddressForm" onSubmit={handleAddressSubmit} className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px] sm:text-xs p-2.5 rounded-xl font-medium mb-2 flex items-start gap-2">
                        <span className="text-yellow-500 text-lg leading-none mt-0.5">•</span>
                        Address where shipping agents will pick up your item.
                      </div>

                      {[
                        { icon: Home, placeholder: 'House No. / Flat No.', key: 'houseNo', required: true },
                        { icon: MapPin, placeholder: 'Area, Street, Sector', key: 'areaStreet', required: true },
                        { icon: MapPin, placeholder: 'Landmark (Optional)', key: 'landmark', required: false, faded: true },
                      ].map(({ icon: Icon, placeholder, key, required, faded }) => (
                        <div className="relative" key={key}>
                          <Icon className={`absolute left-3.5 top-3.5 w-4 h-4 ${faded ? 'text-gray-300' : 'text-gray-400'}`} />
                          <input
                            type="text"
                            placeholder={placeholder}
                            required={required}
                            value={addressForm[key]}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-[#6B46C1] focus:bg-white outline-none transition-all font-medium text-gray-800"
                          />
                        </div>
                      ))}

                      {/* City + State row — State uses autocomplete */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* City — plain input */}
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="City"
                            required
                            value={addressForm.city}
                            onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-[#6B46C1] focus:bg-white outline-none transition-all font-medium text-gray-800"
                          />
                        </div>

                        {/* State — autocomplete */}
                        <StateAutocompleteInput
                          value={addressForm.state}
                          onChange={(val) => setAddressForm(prev => ({ ...prev, state: val }))}
                        />
                      </div>

                      <div className="relative">
                        <Hash className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Pincode (6 Digits)"
                          required
                          maxLength="6"
                          value={addressForm.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setAddressForm(prev => ({ ...prev, pincode: val }));
                          }}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-[#6B46C1] focus:bg-white outline-none transition-all font-medium text-gray-800"
                        />
                      </div>
                    </form>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-white">
                    <button
                      type="submit"
                      form="pickupAddressForm"
                      disabled={updateAddressMutation.isPending}
                      className="w-full bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {updateAddressMutation.isPending
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : 'Confirm Pickup Address'}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Content ── */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">

          {/* ── Credit / Limit Banner ── */}
          {!isLimitReached ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 sm:p-3 mb-4 sm:mb-5 flex items-center gap-2.5 shadow-sm">
              <div className="bg-purple-100 p-1.5 rounded-full flex-shrink-0">
                <Gift className="w-4 h-4 text-purple-600" />
              </div>
              <div className="w-full">
                {systemSettings.isCreditSystemEnabled ? (
                  rewardedCount < systemSettings.maxListingsRewarded ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] sm:text-xs font-bold text-purple-800">
                          Earn {systemSettings.creditsPerListing} Credits! 🪙
                        </h4>
                        <span className="text-[9px] sm:text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">
                          {activeListedCount}/{systemSettings.maxAllowedListings} Listed
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 leading-tight">
                        Reward valid for next <strong>{systemSettings.maxListingsRewarded - rewardedCount} approval(s)</strong>.
                        Max <strong>{systemSettings.maxAllowedListings} items</strong> allowed.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <h4 className="text-[11px] sm:text-xs font-bold text-purple-800">Free Listing Available 📦</h4>
                        <span className="text-[9px] sm:text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">
                          {activeListedCount}/{systemSettings.maxAllowedListings} Listed
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 leading-tight">
                        All rewards claimed! You can still list <strong>{systemSettings.maxAllowedListings - activeListedCount} more</strong> for free.
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] sm:text-xs font-bold text-purple-800">Free Listing Available 📦</h4>
                      <span className="text-[9px] sm:text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">
                        {activeListedCount}/{systemSettings.maxAllowedListings} Listed
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 leading-tight">
                      List <strong>{systemSettings.maxAllowedListings - activeListedCount} more item(s)</strong>. Add clear pictures and details!
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-red-800">Listing Limit Reached</h4>
                  <p className="text-[10px] sm:text-[11px] text-red-600 mt-0.5">
                    Maximum {systemSettings.maxAllowedListings} items allowed.
                  </p>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md">
                {activeListedCount}/{systemSettings.maxAllowedListings}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

            {/* ── Image Upload Section ── */}
            <div className="pb-4 border-b border-purple-100 border-dashed">
              <label className="block text-xs sm:text-sm font-bold text-[#553c9a] mb-3 sm:mb-4">
                Add at least {minImages} image{minImages > 1 ? 's' : ''}*
              </label>

              <div className="flex flex-wrap gap-3 sm:gap-4 items-start">
                {images.map((url, index) => {
                  return (
                    <div key={index} className="flex flex-col gap-1.5 w-20 sm:w-24">
                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-gray-100 group shrink-0">
                        <img
                          src={getOptimizedCloudinaryUrl(url)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>

                        {/* First image badge */}
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#6B46C1]/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                            Cover
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {images.length < 5 && !isLimitReached && (
                  <div className="flex flex-col gap-1.5 w-20 sm:w-24">
                    <label className="w-full aspect-square bg-[#f8f6ff] border-2 border-[#e9d8ff] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#f3edff] hover:border-[#d6bcfa] transition-all shadow-sm">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-[#805ad5] mb-1" />
                      <span className="text-[10px] sm:text-xs font-semibold text-[#805ad5]">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={uploadImageMutation.isPending}
                        className="hidden"
                      />
                    </label>
                    {/* Image count indicator */}
                    <div className="text-center text-[9px] text-gray-400 font-medium">
                      {images.length}/{minImages} min
                    </div>
                  </div>
                )}
              </div>

              {/* ── AI Auto-fill Card ── */}
              {images.length > 0 && !isLimitReached && (
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(128,90,213,0.08)] mt-5 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 text-purple-100 opacity-50 transform rotate-12 pointer-events-none">
                    <Sparkles className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 w-full sm:w-auto">
                    <h4 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-[#6B46C1] flex items-center gap-1.5">
                      Lazy to type? <Wand2 className="w-4 h-4 text-[#805ad5]" />
                    </h4>
                    <p className="text-[11px] sm:text-xs text-purple-600 mt-1 font-medium">
                      Let AI fill Title, Category & Description from your photos.
                    </p>
                  </div>
                  <div className="relative z-10 w-full sm:w-auto shrink-0 flex items-center justify-end">
                    {autoFillMutation.isPending ? (
                      <div className="w-full sm:w-48 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-[#6B46C1]">
                          <span className="flex items-center gap-1.5 animate-pulse">
                            <Wand2 className="w-3.5 h-3.5" /> Analyzing...
                          </span>
                          <span className="tabular-nums">{analyzeProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden shadow-inner p-[1px]">
                          <div
                            className="h-full bg-gradient-to-r from-[#9F7AEA] via-[#805ad5] to-[#553C9A] rounded-full transition-all duration-300 ease-out relative"
                            style={{ width: `${analyzeProgress}%` }}
                          >
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAutoFillFromImages}
                        disabled={autoFillMutation.isPending || generateDescMutation.isPending}
                        className="group relative flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9F7AEA] via-[#805ad5] to-[#6B46C1] bg-[length:200%_auto] hover:bg-right hover:shadow-[0_4px_15px_rgba(128,90,213,0.4)] px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl transition-all duration-500 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto overflow-hidden"
                      >
                        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out rounded-xl" />
                        <Sparkles className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative z-10">Auto-Fill Details</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Form Fields ── */}
            <div className="space-y-4 sm:space-y-5">

              {/* Title */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">
                  Title of Your Item
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  disabled={isLimitReached}
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full bg-white border border-gray-200 shadow-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100 ${getFieldHighlight('title')}`}
                  placeholder="Enter item title"
                />
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {loadingCategories ? (
                  <div>
                    <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">
                      Choose Category
                    </label>
                    <div className="w-full bg-gray-50 border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-[11px] sm:text-xs font-medium">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className={getFieldHighlight('category') ? 'rounded-xl ' + getFieldHighlight('category') : ''}>
                    <CustomDropdown
                      label="Choose Category"
                      placeholder="Select"
                      options={categoryOptions}
                      value={formData.category}
                      onChange={(val) => {
                        setFormData(prev => ({ ...prev, category: val }));
                        setFieldErrors(prev => ({ ...prev, category: false }));
                      }}
                      disabled={isLimitReached}
                      hasError={fieldErrors.category}
                    />
                    {fieldErrors.category && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Required
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <CustomDropdown
                    label="Item Condition"
                    placeholder="Select"
                    options={conditionOptions}
                    value={formData.condition}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, condition: val }));
                      setFieldErrors(prev => ({ ...prev, condition: false }));
                    }}
                    disabled={isLimitReached}
                    hasError={fieldErrors.condition}
                  />
                  {fieldErrors.condition && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Required
                    </p>
                  )}
                </div>
              </div>

              {/* Price + Preferred Item */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5 pb-4 border-b border-purple-100 border-dashed">
                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">
                    Set Your Price
                  </label>
                  <input
                    type="number"
                    name="estimated_value"
                    required
                    min="1"
                    disabled={isLimitReached}
                    value={formData.estimated_value}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="Credits"
                  />
                  <p className="mt-1.5 text-[9px] sm:text-[10px] font-bold text-[#553c9a]">₹1 = 1 Credit</p>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">
                    Preferred Item
                  </label>
                  <input
                    type="text"
                    name="preferred_item"
                    disabled={isLimitReached}
                    value={formData.preferred_item}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Shipping Details */}
              <div className="space-y-3 sm:space-y-4 pb-4 border-b border-purple-100 border-dashed">
                <h3 className="text-xs sm:text-sm font-bold text-[#553c9a] flex items-center gap-1.5">
                  <Box className="w-4 h-4" /> Shipping Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  <div>
                    <CustomDropdown
                      label="Item Weight (Approx)"
                      icon={Scale}
                      placeholder="Select Weight"
                      options={weightOptions}
                      value={formData.weightCategory}
                      onChange={(val) => setFormData(prev => ({ ...prev, weightCategory: val }))}
                      disabled={isLimitReached}
                    />
                    {formData.weightCategory === 'custom' && (
                      <div className="relative mt-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          name="exactWeight"
                          value={formData.exactWeight}
                          onChange={handleInputChange}
                          placeholder="e.g. 1.5"
                          className="w-full bg-white border border-purple-300 shadow-sm rounded-xl pl-4 pr-10 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs sm:text-sm">Kg</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-sm font-bold text-gray-600 mb-1.5 sm:mb-2">
                      Box Dimensions (L × W × H in cm)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['length', 'width', 'height'].map((dim, i) => (
                        <input
                          key={dim}
                          type="number"
                          name={dim}
                          placeholder={['L', 'W', 'H'][i]}
                          value={formData.dimensions[dim]}
                          onChange={handleDimensionChange}
                          className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 py-2.5 sm:py-3 text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#805ad5]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="block text-xs sm:text-sm font-bold text-[#553c9a]">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generateDescMutation.isPending || autoFillMutation.isPending || isLimitReached}
                    className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${generateDescMutation.isPending ? 'animate-pulse' : ''}`} />
                    {generateDescMutation.isPending ? 'Writing...' : 'Write with AI'}
                  </button>
                </div>
                <textarea
                  name="description"
                  required
                  disabled={isLimitReached}
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full bg-white border border-gray-200 shadow-sm rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all resize-none disabled:bg-gray-100 ${getFieldHighlight('description')}`}
                  placeholder="Describe your item in detail..."
                />
              </div>
            </div>

            {/* ── Submit Button ── */}
            <div className="pt-2 sm:pt-4 pb-4">
              <button
                type="submit"
                disabled={createItemMutation.isPending || uploadImageMutation.isPending || isLimitReached}
                className={`w-full font-bold text-sm sm:text-lg rounded-[1.25rem] px-4 py-3.5 sm:py-4 transition-all transform active:scale-[0.99] ${
                  createItemMutation.isPending || uploadImageMutation.isPending || isLimitReached
                    ? 'bg-[#b794f4] text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#805ad5] to-[#6B46C1] hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.01] text-white'
                }`}
              >
                {createItemMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Listing Item...
                  </span>
                ) : 'Sell Item'}
              </button>

              <p className="text-center text-[10px] sm:text-xs font-medium text-gray-500 mt-3 sm:mt-4">
                List up to {systemSettings.maxAllowedListings} items. Make sure your details are accurate!
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Crop Modal ── */}
      <AnimatePresence>
        {cropModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-gray-800 w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
              style={{ height: '75dvh', maxHeight: '600px' }}
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#A388E1]" />
                  Adjust Image (1:1)
                </h2>
                <button
                  onClick={() => {
                    setCropModalOpen(false);
                    if (imageToCrop) URL.revokeObjectURL(imageToCrop);
                    setImageToCrop(null);
                  }}
                  className="text-gray-400 hover:text-white transition-all p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 rounded-full"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Cropper area */}
              <div className="relative flex-1 bg-black w-full min-h-0">
                {imageToCrop && (
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 w-full">
                  <span className="text-gray-400 text-xs sm:text-sm font-bold">Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-[#A388E1]"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3 w-full justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCropModalOpen(false);
                      if (imageToCrop) URL.revokeObjectURL(imageToCrop);
                      setImageToCrop(null);
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => uploadImageMutation.mutate()}
                    disabled={uploadImageMutation.isPending}
                    className={`flex-1 sm:flex-none px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                      uploadImageMutation.isPending
                        ? 'bg-[#A388E1]/50 text-white/50 cursor-not-allowed'
                        : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.4)]'
                    }`}
                  >
                    {uploadImageMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    ) : (
                      'Crop & Upload'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddItemPage;