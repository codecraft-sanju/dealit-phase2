import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ChevronLeft, Gift, Image as ImageIcon, Sparkles, Wand2, Scale, Box } from 'lucide-react';
import axios from 'axios';
import Cropper from 'react-easy-crop'; 
import { toast } from 'react-toastify'; 
import { removeBackground } from '@imgly/background-removal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 

// <-- NAYA CHANGE: Import browser-image-compression -->
import imageCompression from 'browser-image-compression';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// <-- NAYA CHANGE: Helper function to optimize Cloudinary URLs for fast loading -->
export const getOptimizedCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || url.includes('q_auto')) {
    return url;
  }
  return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
};

const blobToOriginalMap = new Map();

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
    }, 'image/jpeg', 0.9); 
  });
};

const ShimmerLoading = () => {
  return (
    <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-xl bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
        
        <div className="sticky top-0 z-50 bg-gray-200 px-4 py-5 flex items-center justify-between shadow-md md:rounded-t-[2.5rem] animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="w-32 h-6 bg-gray-300 rounded-md"></div>
          <div className="w-12 h-4 bg-gray-300 rounded-md"></div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          <div className="pb-4 border-b border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
              <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
              <div className="w-24 h-24 bg-gray-200 rounded-2xl hidden sm:block"></div>
            </div>
          </div>

          <div className="space-y-5 animate-pulse">
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>
            
            <div className="pb-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            </div>

            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>

            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-full h-24 bg-gray-100 rounded-xl"></div>
            </div>
          </div>

          <div className="pt-4 animate-pulse">
            <div className="w-full h-14 bg-gray-200 rounded-[1.25rem]"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mt-4"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

const AddItemPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/categories`);
      return res.data.success ? res.data.data : [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: systemSettings = {
    isCreditSystemEnabled: true,
    creditsPerListing: 50,
    maxListingsRewarded: 3,
    maxAllowedListings: 5 
  }, isLoading: loadingSettings } = useQuery({
    queryKey: ['creditSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/admin/credit-settings`, { withCredentials: true });
      return res.data.success && res.data.data ? res.data.data : {
        isCreditSystemEnabled: true,
        creditsPerListing: 50,
        maxListingsRewarded: 3,
        maxAllowedListings: 5 
      };
    },
    staleTime: 1000 * 60 * 30,
  });

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [processingAIIndex, setProcessingAIIndex] = useState(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const listedCount = user?.listedProductsCount || 0;
  const isLimitReached = listedCount >= systemSettings.maxAllowedListings;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDimensionChange = (e) => {
    setFormData({
      ...formData,
      dimensions: {
        ...formData.dimensions,
        [e.target.name]: e.target.value
      }
    });
  };

  // <-- NAYA CHANGE: Image Compression added before showing crop modal -->
  const handleImageSelect = async (e) => {
    if (images.length >= 5) {
      toast.error('You can only upload a maximum of 5 images.');
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      let imageFile = e.target.files[0];

      const options = {
        maxSizeMB: 0.8, // compress to max 800 KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      try {
        imageFile = await imageCompression(imageFile, options);
      } catch (error) {
        console.error('Compression error:', error);
        toast.error('Failed to optimize image. Please try another one.');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(imageFile);
    }
    e.target.value = null; 
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadImageMutation = useMutation({
    mutationFn: async () => {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const data = new FormData();
      data.append('file', croppedImageBlob);
      data.append('upload_preset', 'salon_preset');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dvoenforj/image/upload`,
        data
      );
      return response.data.secure_url;
    },
    onSuccess: (originalUrl) => {
      setImages([...images, originalUrl]);
      setCropModalOpen(false);
      setImageToCrop(null);
    },
    onError: (err) => {
      console.error('Upload Error:', err);
      toast.error('Failed to upload image. Please try again.');
    }
  });

  const toggleAIBackground = async (index) => {
    setProcessingAIIndex(index);
    const currentUrl = images[index];

    if (currentUrl.startsWith("blob:")) {
      const originalUrl = blobToOriginalMap.get(currentUrl);
      if (originalUrl) {
        const updatedImages = [...images];
        updatedImages[index] = originalUrl;
        setImages(updatedImages);
      }
      setProcessingAIIndex(null);
      return;
    }

    try {
      const imageBlob = await removeBackground(currentUrl);
      const transparentImageUrl = URL.createObjectURL(imageBlob);
      
      blobToOriginalMap.set(transparentImageUrl, currentUrl);

      const updatedImages = [...images];
      updatedImages[index] = transparentImageUrl;
      setImages(updatedImages);
      
      toast.success("Background removed successfully!");
    } catch (error) {
      console.error("Local AI Background Removal Error:", error);
      toast.error("Failed to remove background. Try a clearer image.");
    } finally {
      setProcessingAIIndex(null);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const getFallbackVisionData = () => {
    return {
      title: "My Item for Sale",
      category: "Other",
      description: "I am selling this item. It is in good condition. Please refer to the uploaded images for more details. Contact me if you have any questions."
    };
  };

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
      if (data.success && data.data) {
        const { title, category, description } = data.data;
        setTimeout(() => {
          setFormData(prev => ({ 
            ...prev, 
            title: title || prev.title,
            category: category || prev.category,
            description: description || prev.description
          }));
          setAnalyzeProgress(0);
        }, 600);
      } else {
        setAnalyzeProgress(0);
      }
    },
    onError: (err) => {
      console.error("AI Vision failed:", err);
      const fallbackData = getFallbackVisionData();
      setFormData(prev => ({ 
        ...prev, 
        title: prev.title || fallbackData.title,
        category: prev.category || fallbackData.category,
        description: prev.description || fallbackData.description
      }));
      toast.warning("AI couldn't analyze the images right now. We filled in some generic details, please edit them manually.");
      setAnalyzeProgress(0);
    }
  });

  const handleAutoFillFromImages = () => {
    if (images.length === 0) {
      toast.error("Please upload at least 1 image first so the AI can analyze your item.");
      return;
    }

    setAnalyzeProgress(0);
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => {
        if (prev >= 92 || !autoFillMutation.isPending) {
          clearInterval(progressInterval);
          return prev;
        }
        const jump = Math.floor(Math.random() * 8) + 4;
        return Math.min(92, prev + jump);
      });
    }, 350);

    autoFillMutation.mutate();
  };

  const getFallbackDescription = (title, category, condition) => {
    const safeTitle = title || "item";
    const safeCondition = condition || "good";
    const templates = {
      Electronics: `Selling my ${safeTitle}. It is in ${safeCondition} condition. Works perfectly fine with no major issues. Message me for more details!`,
      Vehicles: `Up for sale is my ${safeTitle}. Condition is ${safeCondition}. Well maintained and ready to go. Let me know if you want to check it out.`,
      Clothing: `Selling this ${safeTitle}. It is in ${safeCondition} condition. Looks great and fits perfectly. Reach out if interested.`,
      Furniture: `Selling my ${safeTitle}. It's in ${safeCondition} condition. Very sturdy and well-maintained.`,
      Other: `I am selling my ${safeTitle}. The condition is ${safeCondition}. Please contact me if you have any questions.`
    };
    return templates[category] || templates.Other;
  };

  const generateDescMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/ai/generate-description`, 
        {
          title: formData.title,
          category: formData.category,
          condition: formData.condition
        },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
      }
    },
    onError: (err) => {
      console.error("AI Generation failed:", err);
      const fallbackText = getFallbackDescription(formData.title, formData.category, formData.condition);
      setFormData(prev => ({ ...prev, description: fallbackText }));
      toast.warning("AI is currently busy. We added a basic template for you, feel free to edit it!");
    }
  });

  const handleGenerateDescription = () => {
    if (!formData.title || !formData.category) {
      toast.error("Please enter a Title and select a Category first so the AI knows what to write about.");
      return;
    }
    generateDescMutation.mutate();
  };

  const createItemMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.post(
        `${API_URL}/items`,
        payload,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch (e) {
        console.error("Failed to update user profile locally", e);
      }
      toast.success(data.message);
      navigate('/dashboard'); 
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to list item. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (images.length < 3) {
      toast.error('Please upload at least 3 images of your item.');
      return;
    }

    const finalWeight = formData.weightCategory === 'custom' 
      ? parseFloat(formData.exactWeight) 
      : parseFloat(formData.weightCategory);

    if (formData.weightCategory === 'custom' && (!finalWeight || finalWeight <= 0)) {
       toast.error("Please enter a valid custom weight in Kg.");
       return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      condition: formData.condition,
      preferred_item: formData.preferred_item,
      estimated_value: formData.estimated_value,
      images: images,
      weight: finalWeight,
      dimensions: formData.dimensions
    };

    createItemMutation.mutate(payload);
  };

  if (loadingSettings || loadingCategories) {
    return <ShimmerLoading />;
  }

  return (
    <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-xl bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative">
        
        <div className="sticky top-0 z-50 bg-[#6B46C1] px-4 py-4 sm:py-5 flex items-center justify-between text-white shadow-md md:rounded-t-[2.5rem]">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold tracking-wide">List an Item</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xs sm:text-sm font-medium hover:text-purple-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">
          
          {!isLimitReached ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 sm:p-3 mb-4 sm:mb-5 flex items-center gap-2.5 shadow-sm">
              <div className="bg-purple-100 p-1.5 rounded-full flex-shrink-0">
                <Gift className="w-4 h-4 text-purple-600" />
              </div>
              <div className="w-full">
                {systemSettings.isCreditSystemEnabled ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] sm:text-xs font-bold text-purple-800">Earn Credits on Approval! 🪙</h4>
                      <span className="text-[9px] sm:text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">{listedCount}/{systemSettings.maxAllowedListings} Listed</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 leading-tight">
                      Max <strong>{systemSettings.maxAllowedListings} items</strong>. Earn <strong>{systemSettings.creditsPerListing} Credits</strong> for first {systemSettings.maxListingsRewarded} approvals.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] sm:text-xs font-bold text-purple-800">List Your Items! 📦</h4>
                      <span className="text-[9px] sm:text-[10px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">{listedCount}/{systemSettings.maxAllowedListings} Listed</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 leading-tight">
                      Max <strong>{systemSettings.maxAllowedListings} items</strong>. Add clear pictures and details!
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-red-800">Listing Limit Reached</h4>
                <p className="text-[10px] sm:text-[11px] text-red-600 mt-0.5">Maximum {systemSettings.maxAllowedListings} items allowed.</p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md">{listedCount}/{systemSettings.maxAllowedListings}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            <div className="pb-4 border-b border-purple-100 border-dashed">
              <label className="block text-xs sm:text-sm font-bold text-[#553c9a] mb-3 sm:mb-4">
                Add at least 3 images*
              </label>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 items-start">
                {images.map((url, index) => {
                  const isAIApplied = url.startsWith("blob:");
                  const isProcessing = processingAIIndex === index;
                  
                  return (
                    <div key={index} className="flex flex-col gap-1.5 w-20 sm:w-24">
                      {/* Image Thumbnail Container */}
                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-gray-100 group shrink-0">
                        {/* <-- NAYA CHANGE: Using getOptimizedCloudinaryUrl for fast rendering --> */}
                        <img 
                          src={getOptimizedCloudinaryUrl(url)} 
                          alt={`Upload ${index + 1}`} 
                          className="w-full h-full object-cover" 
                          onLoad={() => {
                            if (processingAIIndex === index) setProcessingAIIndex(null);
                          }}
                          onError={() => {
                            if (processingAIIndex === index) setProcessingAIIndex(null);
                          }}
                        />
                        
                        {/* Loading Overlay */}
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}

                        {/* Delete Button */}
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)} 
                          disabled={isProcessing}
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* AI Background Button underneath */}
                      <button 
                        type="button" 
                        onClick={() => toggleAIBackground(index)} 
                        disabled={isProcessing}
                        className={`w-full py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
                          isAIApplied 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                        title={isAIApplied ? "Revert to Original" : "Apply AI Background"}
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Wait...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{isAIApplied ? 'Revert BG' : 'Remove BG'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                
                {images.length < 5 && !isLimitReached && (
                  <div className="flex flex-col gap-1.5 w-20 sm:w-24">
                    <label className="w-full aspect-square bg-[#f8f6ff] border-2 border-[#e9d8ff] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#f3edff] hover:border-[#d6bcfa] transition-all shadow-sm">
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-[#805ad5] mb-1" />
                      <span className="text-[10px] sm:text-xs font-semibold text-[#805ad5]">Add Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadImageMutation.isPending} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {images.length > 0 && !isLimitReached && (
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(128,90,213,0.08)] mt-5 relative overflow-hidden">
                  
                  {/* Subtle background decoration */}
                  <div className="absolute -right-6 -top-6 text-purple-100 opacity-50 transform rotate-12 pointer-events-none">
                     <Sparkles className="w-24 h-24" />
                  </div>

                  <div className="relative z-10 w-full sm:w-auto">
                    <h4 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-[#6B46C1] flex items-center gap-1.5">
                      Lazy to type? <Wand2 className="w-4 h-4 text-[#805ad5]" />
                    </h4>
                    <p className="text-[11px] sm:text-xs text-purple-600 mt-1 font-medium">Let AI write the Title, Category, and Description based on your photos.</p>
                  </div>

                  <div className="relative z-10 w-full sm:w-auto shrink-0 flex items-center justify-end">
                    {autoFillMutation.isPending ? (
                       <div className="w-full sm:w-48 flex flex-col gap-2">
                         <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-[#6B46C1]">
                           <span className="flex items-center gap-1.5 animate-pulse">
                             <Wand2 className="w-3.5 h-3.5" /> Analyzing Magic...
                           </span>
                           <span className="tabular-nums">{analyzeProgress}%</span>
                         </div>
                         <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden shadow-inner p-[1px]">
                           <div
                             className="h-full bg-gradient-to-r from-[#9F7AEA] via-[#805ad5] to-[#553C9A] rounded-full transition-all duration-300 ease-out relative"
                             style={{ width: `${analyzeProgress}%` }}
                           >
                             <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
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
                         <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out rounded-xl"></span>
                         <Sparkles className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                         <span className="relative z-10">Auto-Fill Details</span>
                       </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-5">
              
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">Title of Your Item</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  disabled={isLimitReached}
                  value={formData.title} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100" 
                  placeholder="Enter item title" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">Choose Category</label>
                  <select 
                    name="category" 
                    required 
                    disabled={loadingCategories || isLimitReached}
                    value={formData.category} 
                    onChange={handleInputChange} 
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all appearance-none disabled:bg-gray-100"
                  >
                    <option value="" disabled className="text-gray-400">
                      {loadingCategories ? 'Loading...' : 'Select'}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">Item Condition</label>
                  <select 
                    name="condition" 
                    required 
                    disabled={isLimitReached}
                    value={formData.condition} 
                    onChange={handleInputChange} 
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all appearance-none disabled:bg-gray-100"
                  >
                    <option value="" disabled>Select</option>
                    <option value="New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used - Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 pb-4 border-b border-purple-100 border-dashed">
                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">Set Your Price</label>
                  <input 
                    type="number" 
                    name="estimated_value" 
                    required
                    disabled={isLimitReached}
                    value={formData.estimated_value} 
                    onChange={handleInputChange} 
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100" 
                    placeholder="Credits" 
                  />
                  <div className="mt-1.5 text-[9px] sm:text-[10px]">
                    <span className="font-bold text-[#553c9a]">₹1 = 1 Credit</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-sm font-bold text-[#553c9a] mb-1.5 sm:mb-2">Preferred Item</label>
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

              <div className="space-y-3 sm:space-y-4 pb-4 border-b border-purple-100 border-dashed">
                <h3 className="text-xs sm:text-sm font-bold text-[#553c9a] flex items-center gap-1.5"><Box className="w-4 h-4" /> Shipping Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  <div>
                    <label className="block text-[11px] sm:text-sm font-bold text-gray-600 mb-1.5 sm:mb-2 flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Item Weight (Approx)</label>
                    <select
                      name="weightCategory"
                      value={formData.weightCategory}
                      onChange={handleInputChange}
                      disabled={isLimitReached}
                      className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100"
                    >
                      <option value="0.5">Up to 500g (Phones, Clothes)</option>
                      <option value="1">500g to 1 Kg (Shoes, Books)</option>
                      <option value="2">1 Kg to 2 Kg (Laptops, Appliances)</option>
                      <option value="5">2 Kg to 5 Kg (Heavy items)</option>
                      <option value="custom">Custom Weight (Kg)</option>
                    </select>

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
                    <label className="block text-[11px] sm:text-sm font-bold text-gray-600 mb-1.5 sm:mb-2">Box Dimensions (L x W x H in cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" name="length" placeholder="L" value={formData.dimensions.length} onChange={handleDimensionChange} className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 py-2.5 sm:py-3 text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#805ad5]" />
                      <input type="number" name="width" placeholder="W" value={formData.dimensions.width} onChange={handleDimensionChange} className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 py-2.5 sm:py-3 text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#805ad5]" />
                      <input type="number" name="height" placeholder="H" value={formData.dimensions.height} onChange={handleDimensionChange} className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-2 py-2.5 sm:py-3 text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#805ad5]" />
                    </div>
                  </div>
                </div>
              </div>

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
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all resize-none disabled:bg-gray-100" 
                  placeholder="Describe the item in detail..."
                ></textarea>
              </div>

            </div>

            <div className="pt-2 sm:pt-4">
              <button 
                type="submit" 
                disabled={createItemMutation.isPending || uploadImageMutation.isPending || isLimitReached} 
                className={`w-full font-bold text-sm sm:text-lg rounded-[1.25rem] px-4 py-3.5 sm:py-4 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  createItemMutation.isPending || uploadImageMutation.isPending || isLimitReached
                    ? 'bg-[#b794f4] text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#805ad5] to-[#6B46C1] hover:shadow-lg hover:shadow-purple-500/30 text-white'
                }`}
              >
                {createItemMutation.isPending ? 'Listing Item...' : 'Sell Item'}
              </button>
              
              <p className="text-center text-[10px] sm:text-xs font-medium text-gray-500 mt-3 sm:mt-4">
                List up to {systemSettings.maxAllowedListings} items. Make sure your details are accurate!
              </p>
            </div>

          </form>
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-gray-800 w-full max-w-xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-[70vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#A388E1]" /> 
                Adjust Image (1:1)
              </h2>
              <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="relative flex-1 bg-black w-full h-full">
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

            <div className="p-4 sm:p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-between gap-3 sm:gap-4 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 w-full">
                <span className="text-gray-400 text-xs sm:text-sm font-bold">Zoom</span>
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
              <div className="flex gap-2 sm:gap-3 w-full justify-end mt-1 sm:mt-2">
                <button type="button" onClick={() => setCropModalOpen(false)} className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-gray-400 hover:text-white transition-all">Cancel</button>
                <button
                  onClick={() => uploadImageMutation.mutate()}
                  disabled={uploadImageMutation.isPending}
                  className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${uploadImageMutation.isPending ? 'bg-[#A388E1]/50 text-white/50 cursor-not-allowed' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.4)]'}`}
                >
                  {uploadImageMutation.isPending ? 'Uploading...' : 'Crop & Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddItemPage;