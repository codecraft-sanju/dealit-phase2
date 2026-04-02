import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Coins, ChevronRight, Plus, UserCircle,
  Smartphone, Shirt, Watch, Home as HomeIcon, Gamepad2, 
  Car, Monitor, Book, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell
} from 'lucide-react';
import axios from 'axios';
import ProductCard from './ProductCard'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ICON_DICTIONARY = {
  'Package': Package,
  'Smartphone': Smartphone,
  'Shirt': Shirt,
  'Watch': Watch,
  'Home': HomeIcon,
  'Gamepad2': Gamepad2,
  'Car': Car,
  'Monitor': Monitor,
  'Book': Book,
  'Sofa': Sofa,
  'Music': Music,
  'Utensils': Utensils,
  'Heart': Heart,
  'Briefcase': Briefcase,
  'Camera': Camera,
  'Dumbbell': Dumbbell
};

const HomePage = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const url = activeCategory === 'All' 
          ? `${API_URL}/items` 
          : `${API_URL}/items?category=${activeCategory}`;
          
        const response = await axios.get(url);
        setItems(response.data.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchOffers = async () => {
      try {
        const response = await axios.get(`${API_URL}/offers`);
        const activeOffers = response.data.data.filter(offer => offer.isActive);
        setOffers(activeOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoadingOffers(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchOffers();
    fetchCategories(); 
    fetchItems(); 
  }, [activeCategory]); 

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl md:px-0">
      <div className="px-4 pt-4 pb-0">
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#F8F6FF] border border-[#EBE5F7] rounded-3xl p-4 flex flex-col justify-center h-full">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-2">
              Turn unused items into <br />
              things you <span className="text-[#A388E1]">want</span>
            </h1>
            <p className="text-xs text-gray-500">No money needed!</p>
          </div>

          {user ? (
            <div className="bg-gradient-to-br from-[#A388E1] to-[#b7a3eb] rounded-3xl p-4 text-white shadow-lg shadow-[#A388E1]/30 flex flex-col justify-between h-full relative overflow-hidden">
              <div>
                <div className="bg-yellow-400 p-1.5 rounded-full inline-flex items-center justify-center mb-2">
                  <Coins className="w-5 h-5 text-yellow-900" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold leading-none">{user.account_credits || 0}</span>
                  <span className="text-xs font-normal opacity-90 mb-0.5">credits</span>
                </div>
              </div>
              <Link to="/wallet" className="bg-[#FFF4D2] text-[#8B70CA] text-xs font-bold px-3 py-2 mt-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition hover:bg-white">
                Earn More <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 text-white shadow-lg shadow-gray-900/30 flex flex-col justify-between h-full relative overflow-hidden">
              <div>
                <UserCircle className="w-8 h-8 text-gray-400 opacity-80 mb-2" />
                <h3 className="text-sm font-bold leading-tight">Join Dealit</h3>
                <p className="text-[10px] text-gray-300 mt-0.5">Earn & trade</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to="/login" className="flex-1 bg-white text-gray-900 text-center text-xs font-bold px-2 py-2 rounded-xl shadow-sm hover:bg-gray-100 transition">
                  Login
                </Link>
                <Link to="/signup" className="flex-1 bg-[#A388E1] text-white text-center text-xs font-bold px-2 py-2 rounded-xl shadow-sm hover:bg-[#8b70ca] transition">
                  Join
                </Link>
              </div>
            </div>
          )}
        </div>

        {loadingOffers ? (
          <div className="mb-3">
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
              <div className="w-full h-[173px] sm:h-[200px] md:h-[220px] flex-shrink-0 rounded-2xl bg-[#F8F6FF] border border-gray-50 animate-pulse flex items-center justify-center">
                <div className="w-full h-full bg-[#EBE5F7] rounded-2xl"></div>
              </div>
            </div>
          </div>
        ) : offers.length > 0 ? (
          <div className="mb-3">
            <div className="flex overflow-x-auto hide-scrollbar gap-4 snap-x snap-mandatory pb-2">
              {offers.map((offer) => (
                <div 
                  key={offer._id} 
                  className="w-full h-[173px] sm:h-[200px] md:h-[220px] flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-md border border-gray-100 relative bg-gray-50"
                >
                  <img 
                    src={offer.imageUrl} 
                    alt="Special Offer" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

      <div className="px-4 py-2">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar items-center pb-2">
          
          <div 
            onClick={() => setActiveCategory('All')}
            className={`flex flex-col items-center gap-2 min-w-max cursor-pointer transition-transform hover:scale-105`}
          >
            {activeCategory === 'All' ? (
              <div className="bg-[#EBE5F7] text-[#A388E1] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#A388E1]/20 shadow-sm">
                <Package className="w-5 h-5" />
                <span className="text-sm font-bold">All</span>
              </div>
            ) : (
              <>
                <div className="bg-[#F8F9FA] text-gray-500 p-3 rounded-2xl w-14 h-14 flex items-center justify-center border border-gray-100 shadow-sm">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-500 font-medium">All</span>
              </>
            )}
          </div>

          {loadingCategories ? (
             [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-max">
                <div className="bg-gray-100 animate-pulse p-3 rounded-2xl w-14 h-14"></div>
                <div className="bg-gray-100 animate-pulse h-3 w-10 rounded"></div>
              </div>
            ))
          ) : (
            <>
              {categories.map((cat) => {
                const IconComponent = ICON_DICTIONARY[cat.icon] || Package;
                const isActive = activeCategory === cat.name;

                return (
                  <div 
                    key={cat._id} 
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex flex-col items-center gap-2 min-w-max cursor-pointer transition-transform hover:scale-105`}
                  >
                    {isActive ? (
                      <div className="bg-[#EBE5F7] text-[#A388E1] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#A388E1]/20 shadow-sm">
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-bold">{cat.name}</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#F8F9FA] text-gray-500 p-3 rounded-2xl w-14 h-14 flex items-center justify-center border border-gray-100 shadow-sm">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{cat.name}</span>
                      </>
                    )}
                  </div>
                );
              })}

              <div 
                onClick={() => setActiveCategory('Other')}
                className={`flex flex-col items-center gap-2 min-w-max cursor-pointer transition-transform hover:scale-105`}
              >
                {activeCategory === 'Other' ? (
                  <div className="bg-[#EBE5F7] text-[#A388E1] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#A388E1]/20 shadow-sm">
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-bold">Other</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#F8F9FA] text-gray-500 p-3 rounded-2xl w-14 h-14 flex items-center justify-center border border-gray-100 shadow-sm">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Other</span>
                  </>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      <div className="px-4 py-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            {activeCategory === 'All' ? 'Popular Items' : `${activeCategory} Items`}
          </h2>
          <Link to="/items" className="text-sm font-semibold text-gray-500 flex items-center gap-1 hover:text-[#A388E1]">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="min-w-[150px] w-[150px] flex-shrink-0" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
            <Package className="w-8 h-8 text-gray-300 mb-2" />
            No items in this category right now.
          </div>
        ) : (
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x">
            {items.map((item) => (
              <ProductCard key={item._id} item={item} className="min-w-[150px] w-[150px] flex-shrink-0 snap-start" />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <div className="bg-[#EBE5F7] rounded-3xl p-5 relative overflow-hidden">
          <div className="w-2/3 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Got unused items?</h3>
            <p className="text-sm text-gray-700 font-bold mb-1">List them to earn credits now!</p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            <Link to={user ? "/add-item" : "/login"} className="bg-[#FFE28A] text-gray-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-1 shadow-sm hover:bg-[#FFD75E] transition">
              <Plus className="w-4 h-4" /> List an Item
            </Link>
          </div>
          
          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20">
            <Package className="w-full h-full text-[#A388E1]" />
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}; 

export default HomePage;