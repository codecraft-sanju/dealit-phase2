import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ChevronLeft, Gift } from 'lucide-react'; 
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // User ke list kiye gaye products ka count (agar data nahi hai toh 0)
  const listedCount = user?.listedProductsCount || 0;
  const isLimitReached = listedCount >= 5;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    setUploading(true);
    setError('');

    const uploadedUrls = [...images];

    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', 'salon_preset');

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dvoenforj/image/upload`,
          data
        );
        uploadedUrls.push(response.data.secure_url);
      }
      setImages(uploadedUrls);
    } catch (err) {
      console.error('Upload Error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
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
        // Form submit hone ke baad user state update kar do taaki limit count update ho jaye
        try {
          const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
          if (userRes.data.success && setUser) {
            setUser(userRes.data.data);
            localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
          }
        } catch (e) {
          console.error("Failed to update user profile locally", e);
        }

        // Backend se aaya response message show karo
        window.alert(response.data.message);
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to list item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          
          {/* NAYA CHANGE: Banner update kiya gaya admin approval wale logic ke hisaab se */}
          {!isLimitReached ? (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-sm">
              <div className="bg-purple-100 p-2 rounded-full mt-1 flex-shrink-0">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-800">Earn Credits on Approval! 🪙</h4>
                <p className="text-xs text-purple-600 mt-1 leading-relaxed">
                  You can list a maximum of <strong>5 items</strong>. Earn <strong>50 Credits</strong> for your first 3 listings once the admin approves them!
                  <br/>
                  <span className="font-semibold text-purple-700 inline-block mt-1">Your current listings: {listedCount}/5</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 shadow-sm">
              <h4 className="text-sm font-bold text-red-800">Listing Limit Reached</h4>
              <p className="text-xs text-red-600 mt-1">You have reached the maximum limit of 5 listed items. You cannot list more items right now.</p>
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
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
              {uploading && <p className="text-[#805ad5] font-medium text-sm mt-3 animate-pulse">Uploading images...</p>}
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

              <div>
                <label className="block text-sm font-bold text-[#553c9a] mb-2">Description</label>
                <textarea 
                  name="description" 
                  required 
                  disabled={isLimitReached}
                  rows="3" 
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
                disabled={loading || uploading || isLimitReached} 
                className={`w-full font-bold text-lg rounded-[1.25rem] px-4 py-4 transition-all transform hover:scale-[1.01] active:scale-[0.99] ${
                  loading || uploading || isLimitReached
                    ? 'bg-[#b794f4] text-white cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#805ad5] to-[#6B46C1] hover:shadow-lg hover:shadow-purple-500/30 text-white'
                }`}
              >
                {loading ? 'Listing Item...' : 'Sell Item'}
              </button>
              
              <p className="text-center text-xs font-medium text-gray-500 mt-4">
                List up to 5 items. Make sure your details are accurate!
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemPage;