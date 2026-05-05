import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X, UploadCloud, Tag, AlignLeft, Activity, Coins, RefreshCw, Scale, Box, Sparkles, Wand2 } from 'lucide-react'; // --- NAYA CHANGE: Added Sparkles, Wand2 ---
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import imageCompression from 'browser-image-compression';
import { removeBackground } from '@imgly/background-removal'; // --- NAYA CHANGE: Added for AI BG removal ---

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

export const getOptimizedCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || url.includes('q_auto')) {
    return url;
  }
  return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
};

// --- NAYA CHANGE: Added blob map for BG removal ---
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

const EditItemPage = () => {
  const { id } = useParams();
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // --- NAYA CHANGE: State for AI Tools ---
  const [processingAIIndex, setProcessingAIIndex] = useState(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/categories`);
      return res.data.success ? res.data.data : [];
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/items/${id}`);
        if (response.data.success) {
          const item = response.data.data;
          
          let weightCat = '0.5';
          let exactWt = '';
          if ([0.5, 1, 2, 5].includes(item.weight)) {
            weightCat = item.weight.toString();
          } else if (item.weight) {
            weightCat = 'custom';
            exactWt = item.weight.toString();
          }

          setFormData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || '',
            condition: item.condition || '',
            preferred_item: item.preferred_item || '',
            estimated_value: item.estimated_value || '',
            weightCategory: weightCat,
            exactWeight: exactWt,
            dimensions: item.dimensions || { length: 10, width: 10, height: 10 }
          });
          setImages(item.images || []);
        }
      } catch (err) {
        setError('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

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

  const handleImageSelect = async (e) => {
    if (images.length >= 5) {
      toast.error('You can only upload a maximum of 5 images.');
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      let imageFile = e.target.files[0];

      const options = {
        maxSizeMB: 0.8,
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

  // --- NAYA CHANGE START: AI Tools Logic ---
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
  // --- NAYA CHANGE END ---

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.length < 3) {
      setError('Please upload at least 3 images of your item.');
      return;
    }

    const finalWeight = formData.weightCategory === 'custom' 
      ? parseFloat(formData.exactWeight) 
      : parseFloat(formData.weightCategory);

    if (formData.weightCategory === 'custom' && (!finalWeight || finalWeight <= 0)) {
       setError("Please enter a valid custom weight in Kg.");
       return;
    }

    setSaving(true);
    setError('');

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

    try {
      const response = await axios.put(
        `${API_URL}/items/${id}`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        queryClient.invalidateQueries(['myItems']);
        toast.success('Item updated successfully!');
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6FF] flex flex-col items-center justify-center pb-20">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#A388E1]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-[#6B46C1] border-r-[#FFE28A] rounded-full animate-spin duration-1000"></div>
          <div className="bg-white p-4 rounded-full shadow-lg z-10">
            <RefreshCw className="w-8 h-8 text-[#6B46C1] animate-pulse" />
          </div>
        </div>
        <p className="text-[#6B46C1] font-bold tracking-wide animate-pulse text-lg">Fetching details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-12 md:max-w-3xl relative font-sans selection:bg-[#6B46C1]/20">
      
      <div className="sticky top-0 z-50 bg-gray-50">
        <div className="bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] pt-6 pb-8 px-5 md:px-8 rounded-b-[2.5rem] shadow-lg relative z-10 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-10 w-24 h-24 bg-[#FFE28A]/20 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <Link 
              to="/dashboard" 
              className="p-2 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all backdrop-blur-md border border-white/10 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-wide leading-tight text-white drop-shadow-sm">Edit Item</h1>
              <p className="text-xs md:text-sm text-purple-100 font-medium mt-1 opacity-90">Perfect your listing details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        
        <div className="bg-white rounded-[2rem] border border-gray-100 p-5 sm:p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-5 py-4 rounded-2xl mb-6 font-bold flex items-center gap-3 animate-in fade-in zoom-in-95">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#6B46C1]" /> Item Photos
              </label>
              
              <div className="flex flex-wrap gap-3 sm:gap-4 items-start">
                {images.map((url, index) => {
                  const isAIApplied = url.startsWith("blob:");
                  const isProcessing = processingAIIndex === index;
                  
                  return (
                    <div key={index} className="flex flex-col gap-1.5 w-20 sm:w-24">
                      <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-gray-100 group shrink-0">
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
                        
                        {isProcessing && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}

                        <button 
                          type="button" 
                          onClick={() => removeImage(index)} 
                          disabled={isProcessing}
                          className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      {/* --- NAYA CHANGE: Toggle Background Button --- */}
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
                
                {images.length < 5 && (
                  <div className="flex flex-col gap-1.5 w-20 sm:w-24">
                    <label className="w-full aspect-square bg-[#f8f6ff] border-2 border-[#e9d8ff] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#f3edff] hover:border-[#d6bcfa] transition-all shadow-sm">
                      <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 text-[#805ad5] mb-1" />
                      <span className="text-[10px] sm:text-xs font-semibold text-[#805ad5]">Add Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadImageMutation.isPending} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* --- NAYA CHANGE: AI Auto-Fill Section --- */}
              {images.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(128,90,213,0.08)] mt-5 relative overflow-hidden">
                  
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

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="md:col-span-2 space-y-1.5 group">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" placeholder="What are you trading?" />
                </div>
              </div>

              {/* --- NAYA CHANGE: Added Write With AI Button to Description --- */}
              <div className="md:col-span-2 space-y-1.5 group">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generateDescMutation.isPending || autoFillMutation.isPending}
                    className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${generateDescMutation.isPending ? 'animate-pulse' : ''}`} />
                    {generateDescMutation.isPending ? 'Writing...' : 'Write with AI'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute top-3.5 sm:top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <AlignLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white resize-none transition-all shadow-sm leading-relaxed" placeholder="Describe the item, flaws, features..."></textarea>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                <select 
                  name="category" 
                  required 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  disabled={loadingCategories}
                  className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {loadingCategories ? 'Loading...' : 'Select Category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Condition</label>
                <select name="condition" required value={formData.condition} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">Select Condition</option>
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used - Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  Item Value (Credits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                  </div>
                  <input type="number" name="estimated_value" required value={formData.estimated_value} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-bold focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:bg-white transition-all shadow-sm" placeholder="0" />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Looking For</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <input type="text" name="preferred_item" value={formData.preferred_item} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" placeholder="What do you want?" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Box className="w-4 h-4 text-[#6B46C1]" /> Shipping Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1"><Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Item Weight (Approx)</label>
                  <select
                    name="weightCategory"
                    value={formData.weightCategory}
                    onChange={handleInputChange}
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="0.5">Up to 500g (Phones, Clothes)</option>
                    <option value="1">500g to 1 Kg (Shoes, Books)</option>
                    <option value="2">1 Kg to 2 Kg (Laptops, Appliances)</option>
                    <option value="5">2 Kg to 5 Kg (Heavy items)</option>
                    <option value="custom">Custom Weight (Kg)</option>
                  </select>

                  {formData.weightCategory === 'custom' && (
                    <div className="relative mt-2 sm:mt-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        name="exactWeight"
                        value={formData.exactWeight}
                        onChange={handleInputChange}
                        placeholder="e.g. 1.5"
                        className="w-full bg-[#F8F9FA] border border-[#A388E1] rounded-2xl pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm"
                      />
                      <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs sm:text-sm">Kg</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Box Dimensions (cm)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" name="length" placeholder="L" value={formData.dimensions.length} onChange={handleDimensionChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-2 py-3 sm:py-3.5 text-center text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" />
                    <input type="number" name="width" placeholder="W" value={formData.dimensions.width} onChange={handleDimensionChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-2 py-3 sm:py-3.5 text-center text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" />
                    <input type="number" name="height" placeholder="H" value={formData.dimensions.height} onChange={handleDimensionChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-2 py-3 sm:py-3.5 text-center text-sm sm:text-base text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving || uploadImageMutation.isPending} 
              className={`w-full font-black text-base sm:text-lg rounded-2xl px-4 py-3.5 sm:py-4 transition-all mt-6 sm:mt-8 flex items-center justify-center gap-2 shadow-lg ${saving || uploadImageMutation.isPending ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#FFE28A] to-[#FFD75E] hover:to-[#FFC107] text-gray-900 active:scale-[0.98] shadow-[#FFE28A]/40 hover:shadow-[#FFE28A]/60'}`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> Updating Item...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 sm:w-6 sm:h-6" /> Save Changes
                </>
              )}
            </button>
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

export default EditItemPage;