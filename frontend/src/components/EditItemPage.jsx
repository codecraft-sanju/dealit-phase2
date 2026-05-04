import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X, UploadCloud, Tag, AlignLeft, Activity, Coins, RefreshCw, Scale, Box } from 'lucide-react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // CHANGED: Added useQuery import
import imageCompression from 'browser-image-compression';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

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

  // CHANGED: Added useQuery to fetch dynamic categories like AddItemPage
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
        
        {/* CHANGED: Made padding responsive (p-5 for mobile, p-8 for desktop) */}
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
              
              {/* CHANGED: Made grid responsive, 2 cols on mobile, 3 on tablet, 4 on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group bg-gray-50">
                    <img src={getOptimizedCloudinaryUrl(url)} alt={`Upload ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    {/* CHANGED: Replaced hover overlay with a top-right corner button that is always visible on mobile, hover on desktop */}
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 sm:p-2 rounded-full hover:bg-red-50 hover:text-red-600 active:scale-90 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10 border border-red-100"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 bg-[#F8F6FF] flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-[#6B46C1] transition-colors group">
                    <div className="bg-white p-2.5 sm:p-3 rounded-full shadow-sm mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-[#6B46C1]" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#6B46C1]">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploadImageMutation.isPending} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* CHANGED: Made spacing responsive (gap-4 on mobile, gap-6 on desktop) */}
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

              <div className="md:col-span-2 space-y-1.5 group">
                <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
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