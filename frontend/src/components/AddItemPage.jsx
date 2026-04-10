import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// NAYA CHANGE: Imported Sparkles icon for the AI button
import { X, Plus, ChevronLeft, Gift, Image as ImageIcon, Sparkles } from 'lucide-react'; 
import axios from 'axios';
import Cropper from 'react-easy-crop'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

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

// CHANGE: Added professional shimmer skeleton component matching your form layout
const ShimmerLoading = () => {
  return (
    <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-lg bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header Skeleton */}
        <div className="sticky top-0 z-50 bg-gray-200 px-4 py-5 flex items-center justify-between shadow-md md:rounded-t-[2.5rem] animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="w-32 h-6 bg-gray-300 rounded-md"></div>
          <div className="w-12 h-4 bg-gray-300 rounded-md"></div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Info Box Skeleton */}
          <div className="bg-gray-100 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>

          {/* Image Upload Area Skeleton */}
          <div className="pb-4 border-b border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
              <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
              <div className="w-24 h-24 bg-gray-200 rounded-2xl hidden sm:block"></div>
            </div>
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-5 animate-pulse">
            {/* Input 1 */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>
            
            {/* Input 2 */}
            <div className="pb-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
            </div>

            {/* Select 1 */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>

            {/* Select 2 */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-full h-24 bg-gray-100 rounded-xl"></div>
            </div>
          </div>

          {/* Button Skeleton */}
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    preferred_item: '',
    estimated_value: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [systemSettings, setSystemSettings] = useState({
    isCreditSystemEnabled: true,
    creditsPerListing: 50,
    maxListingsRewarded: 3,
    maxAllowedListings: 5 
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  // NAYA CHANGE: State to track if AI is generating text
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const listedCount = user?.listedProductsCount || 0;
  const isLimitReached = listedCount >= systemSettings.maxAllowedListings;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await axios.get(`${API_URL}/categories`);
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }

        const settingsRes = await axios.get(`${API_URL}/admin/credit-settings`, { withCredentials: true });
        if (settingsRes.data.success && settingsRes.data.data) {
          setSystemSettings(settingsRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setLoadingCategories(false);
        setLoadingSettings(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    if (images.length >= 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result);
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
    setError('');
    try {
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      const data = new FormData();
      data.append('file', croppedImageBlob);
      data.append('upload_preset', 'salon_preset');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dvoenforj/image/upload`,
        data
      );
      
      setImages([...images, response.data.secure_url]);
      setCropModalOpen(false);
      setImageToCrop(null);
    } catch (err) {
      console.error('Upload Error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // NAYA CHANGE: Fallback function added
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

  // NAYA CHANGE: Function to handle AI description generation
  const handleGenerateDescription = async () => {
    // Check if we have enough data to generate a meaningful description
    if (!formData.title || !formData.category) {
      setError("Please enter a Title and select a Category first so the AI knows what to write about.");
      return;
    }

    setIsGeneratingAI(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/ai/generate-description`, // Aapko backend par yeh route banana hoga
        {
          title: formData.title,
          category: formData.category,
          condition: formData.condition
        },
        { withCredentials: true }
      );

      if (response.data.success && response.data.description) {
        setFormData(prev => ({ ...prev, description: response.data.description }));
      }
    } catch (err) {
      console.error("AI Generation failed:", err);
      // NAYA CHANGE: Updated catch block for fallback
      const fallbackText = getFallbackDescription(formData.title, formData.category, formData.condition);
      setFormData(prev => ({ ...prev, description: fallbackText }));
      setError("AI is currently busy. We added a basic template for you, feel free to edit it!");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (images.length < 3) {
      setError('Please upload at least 3 images of your item.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/items`,
        { ...formData, images },
        { withCredentials: true }
      );

      if (response.data.success) {
        try {
          const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
          if (userRes.data.success && setUser) {
            setUser(userRes.data.data);
            localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
          }
        } catch (e) {
          console.error("Failed to update user profile locally", e);
        }

        window.alert(response.data.message);
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // CHANGE: Replaced the basic spinner with the professional ShimmerLoading component
  // Also included loadingCategories so it shows shimmer until categories are ready too
  if (loadingSettings || loadingCategories) {
    return <ShimmerLoading />;
  }

  return (
    <div className="min-h-screen bg-[#f4f2f9] md:py-10 flex justify-center font-sans">
      <div className="w-full max-w-lg bg-[#fcfbff] md:rounded-[2.5rem] shadow-2xl flex flex-col relative">
        
        <div className="sticky top-0 z-50 bg-[#6B46C1] px-4 py-5 flex items-center justify-between text-white shadow-md md:rounded-t-[2.5rem]">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <h2 className="text-xl font-bold tracking-wide">List an Item</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium hover:text-purple-200 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          
          {!isLimitReached ? (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
              <div className="bg-purple-100 p-2 rounded-full mt-1 flex-shrink-0">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                {systemSettings.isCreditSystemEnabled ? (
                  <>
                    <h4 className="text-sm font-bold text-purple-800">Earn Credits on Approval! 🪙</h4>
                    <p className="text-xs text-purple-600 mt-1 leading-relaxed">
                      You can list a maximum of <strong>{systemSettings.maxAllowedListings} items</strong>. Earn <strong>{systemSettings.creditsPerListing} Credits</strong> for your first {systemSettings.maxListingsRewarded} listings once the admin approves them!
                      <br/>
                      <span className="font-semibold text-purple-700 inline-block mt-1">Your current listings: {listedCount}/{systemSettings.maxAllowedListings}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-bold text-purple-800">List Your Items! 📦</h4>
                    <p className="text-xs text-purple-600 mt-1 leading-relaxed">
                      You can list up to <strong>{systemSettings.maxAllowedListings} items</strong> on the platform. Add clear pictures and details!
                      <br/>
                      <span className="font-semibold text-purple-700 inline-block mt-1">Your current listings: {listedCount}/{systemSettings.maxAllowedListings}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 shadow-sm">
              <h4 className="text-sm font-bold text-red-800">Listing Limit Reached</h4>
              <p className="text-xs text-red-600 mt-1">You have reached the maximum limit of {systemSettings.maxAllowedListings} listed items. You cannot list more items right now.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-sm px-4 py-3 rounded-2xl mb-6 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="pb-4 border-b border-purple-100 border-dashed">
              <label className="block text-sm font-bold text-[#553c9a] mb-4">
                Add at least 3 images*
              </label>
              
              <div className="flex flex-wrap gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-gray-100 group">
                    <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && !isLimitReached && (
                  <label className="w-24 h-24 bg-[#f8f6ff] border-2 border-[#e9d8ff] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#f3edff] hover:border-[#d6bcfa] transition-all shadow-sm">
                    <Plus className="w-8 h-8 text-[#805ad5] mb-1" />
                    <span className="text-xs font-semibold text-[#805ad5]">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} disabled={isProcessingCrop} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Title of Your Item</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  disabled={isLimitReached}
                  value={formData.title} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100" 
                  placeholder="Enter item title" 
                />
              </div>

              <div className="pb-4 border-b border-purple-100 border-dashed">
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Set Your Price</label>
                <input 
                  type="number" 
                  name="estimated_value" 
                  required
                  disabled={isLimitReached}
                  value={formData.estimated_value} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100" 
                  placeholder="Enter price in credits" 
                />
                <div className="mt-2 text-xs">
                  <span className="font-bold text-[#553c9a]">Remember: ₹1 = 1 Credit</span>
                  <p className="text-gray-500 mt-0.5">Keep pricing fair: Set the value you'd accept in credits.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Choose Category</label>
                <select 
                  name="category" 
                  required 
                  disabled={loadingCategories || isLimitReached}
                  value={formData.category} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all appearance-none disabled:bg-gray-100"
                >
                  <option value="" disabled className="text-gray-400">
                    {loadingCategories ? 'Loading categories...' : 'Select category'}
                  </option>
                  
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                  
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Item Condition</label>
                <select 
                  name="condition" 
                  required 
                  disabled={isLimitReached}
                  value={formData.condition} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all appearance-none disabled:bg-gray-100"
                >
                  <option value="" disabled>Select Condition</option>
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used - Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* NAYA CHANGE: Description section with AI button side-by-side */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-[#553c9a]">Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingAI || isLimitReached}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-pulse' : ''}`} />
                    {isGeneratingAI ? 'Writing...' : 'Write with AI'}
                  </button>
                </div>
                <textarea 
                  name="description" 
                  required 
                  disabled={isLimitReached}
                  rows="4" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all resize-none disabled:bg-gray-100" 
                  placeholder="Describe the item in detail..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Preferred Item in Return (Optional)</label>
                <input 
                  type="text" 
                  name="preferred_item" 
                  disabled={isLimitReached}
                  value={formData.preferred_item} 
                  onChange={handleInputChange} 
                  className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all disabled:bg-gray-100" 
                  placeholder="What are you looking for?" 
                />
              </div>

            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading || isProcessingCrop || isLimitReached} 
                className={`w-full font-bold text-lg rounded-[1.25rem] px-4 py-4 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  loading || isProcessingCrop || isLimitReached
                    ? 'bg-[#b794f4] text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#805ad5] to-[#6B46C1] hover:shadow-lg hover:shadow-purple-500/30 text-white'
                }`}
              >
                {loading ? 'Listing Item...' : 'Sell Item'}
              </button>
              
              <p className="text-center text-xs font-medium text-gray-500 mt-4">
                List up to {systemSettings.maxAllowedListings} items. Make sure your details are accurate!
              </p>
            </div>

          </form>
        </div>
      </div>

      {cropModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-gray-800 w-full max-w-xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col h-[70vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#A388E1]" /> 
                Adjust Image (1:1)
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
                  aspect={1} 
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 w-full">
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
              <div className="flex gap-3 w-full justify-end mt-2">
                <button type="button" onClick={() => setCropModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
                <button
                  onClick={handleCropAndUpload}
                  disabled={isProcessingCrop}
                  className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${isProcessingCrop ? 'bg-[#A388E1]/50 text-white/50 cursor-not-allowed' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.4)]'}`}
                >
                  {isProcessingCrop ? 'Uploading...' : 'Crop & Upload'}
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