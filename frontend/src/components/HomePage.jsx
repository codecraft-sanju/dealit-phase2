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

// Dummy avatars from pravatar.cc (real human face photos)
const DUMMY_AVATARS = [
  'https://i.pravatar.cc/40?img=11',
  'https://i.pravatar.cc/40?img=32',
  'https://i.pravatar.cc/40?img=45',
  'https://i.pravatar.cc/40?img=16',
  'https://i.pravatar.cc/40?img=57',
];

const HomePage = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
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
    fetchItems(); 
  }, [activeCategory]);

  return (
    <div className="max-w-md mx-auto bg-white pb-1 md:max-w-7xl md:px-0">
      <div className="px-4 pt-3 pb-0">
        
        {/* Hero Cards */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <div className="col-span-3 bg-[#F8F6FF] border border-[#EBE5F7] rounded-2xl p-3 flex flex-col justify-center h-full">
            <h1 className="text-sm md:text-base font-bold text-gray-900 leading-tight mb-1">
              Turn unused items into <br />
              things you <span className="text-[#A388E1]">want</span>
            </h1>
            <p className="text-[10px] md:text-xs text-gray-500">No money needed!</p>
          </div>

          {user ? (
            <div className="col-span-2 bg-gradient-to-br from-[#A388E1] to-[#b7a3eb] rounded-2xl p-2.5 text-white shadow-lg shadow-[#A388E1]/30 flex flex-col justify-between h-full relative overflow-hidden">
              <div>
                <div className="bg-yellow-400 p-1 rounded-full inline-flex items-center justify-center mb-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-900" />
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-lg font-bold leading-none">{user.account_credits || 0}</span>
                  <span className="text-[10px] font-normal opacity-90 mb-0.5">credits</span>
                </div>
              </div>
              <Link to="/wallet" className="bg-[#FFF4D2] text-[#8B70CA] text-[10px] font-bold px-2 py-1.5 mt-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition hover:bg-white">
                Earn More <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-2.5 text-white shadow-lg shadow-gray-900/30 flex flex-col justify-between h-full relative overflow-hidden">
              <div>
                <UserCircle className="w-5 h-5 text-gray-400 opacity-80 mb-1" />
                <h3 className="text-[11px] font-bold leading-tight">Join Dealit</h3>
                <p className="text-[9px] text-gray-300 mt-0.5">Earn & trade</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                <Link to="/login" className="flex-1 bg-white text-gray-900 text-center text-[10px] font-bold px-1.5 py-1.5 rounded-lg shadow-sm hover:bg-gray-100 transition">
                  Login
                </Link>
                <Link to="/signup" className="flex-1 bg-[#A388E1] text-white text-center text-[10px] font-bold px-1.5 py-1.5 rounded-lg shadow-sm hover:bg-[#8b70ca] transition">
                  Join
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Offers Banner */}
        {loadingOffers ? (
          <div className="mb-0">
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0">
              <div className="w-full h-[140px] sm:h-[160px] md:h-[180px] flex-shrink-0 rounded-2xl bg-[#F8F6FF] border border-gray-50 animate-pulse flex items-center justify-center">
                <div className="w-full h-full bg-[#EBE5F7] rounded-2xl"></div>
              </div>
            </div>
          </div>
        ) : offers.length > 0 ? (
          <div className="mb-0">
            <div className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory pb-0">
              {offers.map((offer) => (
                <div 
                  key={offer._id} 
                  className="w-full h-[140px] sm:h-[160px] md:h-[180px] flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative bg-gray-50"
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

      {/* Categories */}
      <div className="px-4 pt-1.5 pb-0">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-center pb-0">
          
          <div 
            onClick={() => setActiveCategory('All')}
            className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer transition-transform hover:scale-105"
          >
            {activeCategory === 'All' ? (
              <div className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm">
                <Package className="w-4 h-4" />
                <span className="text-xs font-bold">All</span>
              </div>
            ) : (
              <>
                <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">All</span>
              </>
            )}
          </div>

          {loadingCategories ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-max">
                <div className="bg-gray-100 animate-pulse p-2.5 rounded-xl w-12 h-12"></div>
                <div className="bg-gray-100 animate-pulse h-2 w-8 rounded"></div>
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
                    className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer transition-transform hover:scale-105"
                  >
                    {isActive ? (
                      <div className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm">
                        <IconComponent className="w-4 h-4" />
                        <span className="text-xs font-bold">{cat.name}</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{cat.name}</span>
                      </>
                    )}
                  </div>
                );
              })}

              <div 
                onClick={() => setActiveCategory('Other')}
                className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer transition-transform hover:scale-105"
              >
                {activeCategory === 'Other' ? (
                  <div className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span className="text-xs font-bold">Other</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">Other</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="px-4 pt-1.5 pb-0">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-bold text-gray-900">
            {activeCategory === 'All' ? 'Popular Items' : `Top in ${activeCategory}`}
          </h2>
          <Link 
            to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`} 
            className="text-xs font-semibold text-[#A388E1] bg-[#F8F6FF] px-2.5 py-1 rounded-full flex items-center gap-0.5 hover:bg-[#EBE5F7] transition-colors"
          >
            See All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="min-w-[120px] w-[120px] flex-shrink-0" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
            <Package className="w-6 h-6 text-gray-300 mb-1.5" />
            <span className="text-xs">No items right now.</span>
          </div>
        ) : (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0 snap-x">
            {items.map((item) => (
              <ProductCard key={item._id} item={item} className="min-w-[120px] w-[120px] flex-shrink-0 snap-start" />
            ))}
          </div>
        )}
      </div>

      {/* Got Unused Items Banner */}
      <div className="px-4 pt-1.5 pb-1">
        <div className="bg-[#EBE5F7] rounded-2xl p-4 relative overflow-hidden">
          <div className="w-3/4 relative z-10">
            <h3 className="text-base font-bold text-gray-900 mb-1">Got unused items?</h3>
            <p className="text-[11px] text-gray-600 mb-3 leading-snug">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            <Link 
              to={user ? "/add-item" : "/login"} 
              className="bg-[#FFE28A] text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm hover:bg-[#FFD75E] transition"
            >
              <Plus className="w-3.5 h-3.5" /> List an Item
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-4 w-28 h-28 opacity-20">
            <Package className="w-full h-full text-[#A388E1]" />
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="px-4 pb-2 pt-1">
        <div className="flex items-center gap-2.5 px-1">
          
          {/* Trending Icon */}
          <div className="flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L9 11L13 15L21 7" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 7H21V13" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-gray-800 leading-tight">
              Start earning by selling what you don't use anymore!
            </p>

            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {DUMMY_AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`user-${i}`}
                    className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=U${i}&background=A388E1&color=fff&size=40`;
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-gray-500 font-medium">
                people are already trading
              </p>
            </div>
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