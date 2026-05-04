import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X, UploadCloud, Tag, AlignLeft, Activity, Coins, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const EditItemPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    preferred_item: '',
    estimated_value: '',
    images: [] // CHANGED: Added images array to hold existing images for preview
  });
  
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/items/${id}`);
        if (response.data.success) {
          const item = response.data.data;
          setFormData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || '',
            condition: item.condition || '',
            preferred_item: item.preferred_item || '',
            estimated_value: item.estimated_value || '',
            images: item.images || [] // CHANGED: Fetching images
          });
          setExistingImages(item.images || []);
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

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setNewImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImage = (indexToRemove) => {
    setNewImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('condition', formData.condition);
    submitData.append('preferred_item', formData.preferred_item);
    submitData.append('estimated_value', formData.estimated_value);
    
    submitData.append('existing_images', JSON.stringify(existingImages));
    
    newImages.forEach(imageObj => {
      submitData.append('images', imageObj.file);
    });

    try {
      const response = await axios.put(
        `${API_URL}/items/${id}`,
        submitData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    // CHANGED: Updated loader to match light theme
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
    // CHANGED: Container updated to match dashboard layout and light theme
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-12 md:max-w-3xl relative font-sans selection:bg-[#6B46C1]/20">
      
      {/* CHANGED: Sticky purple header matching Dashboard */}
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
        
        {/* CHANGED: Form container updated to light theme card style */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
              
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {existingImages.map((img, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                    <img src={img} alt={`Existing ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => removeExistingImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 active:scale-90 transition-transform shadow-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {newImages.map((img, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-green-100 shadow-sm group">
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">NEW</div>
                    <img src={img.preview} alt={`New ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <button type="button" onClick={() => removeNewImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 active:scale-90 transition-transform shadow-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <label className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 bg-[#F8F6FF] flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-[#6B46C1] transition-colors group">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-[#6B46C1]" />
                  </div>
                  <span className="text-xs font-bold text-[#6B46C1]">Add Photo</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CHANGED: Inputs styled with light theme colors and focused states */}
              <div className="md:col-span-2 space-y-1.5 group">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Tag className="w-5 h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" placeholder="What are you trading?" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 group">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <AlignLeft className="w-5 h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white resize-none transition-all shadow-sm leading-relaxed" placeholder="Describe the item, flaws, features..."></textarea>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                <select name="category" required value={formData.category} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">Select Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home & Garden</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Condition</label>
                <select name="condition" required value={formData.condition} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">Select Condition</option>
                  <option value="New">Brand New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used - Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                  Item Value (Credits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Coins className="w-5 h-5 text-gray-400 group-focus-within:text-yellow-500 transition-colors" />
                  </div>
                  <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-gray-900 font-bold focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 focus:bg-white transition-all shadow-sm" placeholder="0" />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Looking For</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Activity className="w-5 h-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
                  </div>
                  <input type="text" name="preferred_item" value={formData.preferred_item} onChange={handleInputChange} className="w-full bg-[#F8F9FA] border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:border-[#6B46C1] focus:ring-4 focus:ring-[#6B46C1]/10 focus:bg-white transition-all shadow-sm" placeholder="What do you want?" />
                </div>
              </div>
            </div>

            {/* CHANGED: Yellow theme button matching the dashboard's Call-To-Action style */}
            <button 
              type="submit" 
              disabled={saving} 
              className={`w-full font-black text-lg rounded-2xl px-4 py-4 transition-all mt-8 flex items-center justify-center gap-2 shadow-lg ${saving ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#FFE28A] to-[#FFD75E] hover:to-[#FFC107] text-gray-900 active:scale-[0.98] shadow-[#FFE28A]/40 hover:shadow-[#FFE28A]/60'}`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> Updating Item...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6" /> Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditItemPage;