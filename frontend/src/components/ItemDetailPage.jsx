import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package, RefreshCw, ArrowLeft, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ItemDetailPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [selectedMyItem, setSelectedMyItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // NAYA STATE: Balance error handle karne ke liye
  const [balanceError, setBalanceError] = useState(null);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/items/${id}`);
        setItem(response.data.data);
      } catch (error) {
        console.error('Error fetching item details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  const handleOpenBarterModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
    setBalanceError(null); // Reset error when opening modal
    try {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      const myActiveItems = response.data.data.filter(i => i.status === 'active');
      setMyItems(myActiveItems);
    } catch (error) {
      console.error('Error fetching your items:', error);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedMyItem) return;
    setSubmitting(true);
    setBalanceError(null);
    try {
      await axios.post(`${API_URL}/barter`, {
        requestedItem: item._id,
        offeredItem: selectedMyItem,
        receiver: item.owner._id
      }, { withCredentials: true });
      
      setShowModal(false);
      navigate('/swaps'); 
    } catch (error) {
      console.error('Asli Error Details:', error.response?.data || error);
      
      // NAYA LOGIC: Agar backend ne "insufficientCredits: true" bheja hai, toh error show karo
      if (error.response?.data?.insufficientCredits) {
        setBalanceError(error.response.data.message);
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        alert(`Swap Failed: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center text-emerald-400 mt-20 font-medium animate-pulse">Loading item details...</div>;
  if (!item) return <div className="text-center text-white mt-20">Item not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Feed
      </Link>

      <div className="bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 shadow-xl grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 bg-gray-900/50 flex flex-col gap-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900 border border-gray-700 flex items-center justify-center">
            {item.images && item.images.length > 0 && item.images[0] ? (
              <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-20 h-20 text-gray-600" />
            )}
          </div>
          {item.images && item.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {item.images.slice(1).map((img, i) => (
                <img key={i} src={img} alt={`Gallery ${i}`} className="w-24 h-24 rounded-xl object-cover border border-gray-700 flex-shrink-0" />
              ))}
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col">
          <h1 className="text-3xl font-bold text-white mb-2">{item.title}</h1>
          <p className="text-gray-400 mb-6">{item.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Condition</p>
              <p className="text-white font-medium">{item.condition || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Item Value</p>
              <p className="text-white font-medium flex items-center gap-1">
                <span className="text-yellow-500">🪙</span> {item.estimated_value || '0'} Credits
              </p>
            </div>

            <div className="col-span-2 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
              <p className="text-xs text-emerald-500 mb-1">Owner is looking for:</p>
              <p className="text-emerald-400 font-bold">{item.preferred_item || 'Open to offers'}</p>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-700">
            {user && item.owner?._id === user.id ? (
              <button disabled className="w-full bg-gray-700 text-gray-400 py-4 rounded-xl font-bold cursor-not-allowed">
                This is your item
              </button>
            ) : (
              <button 
                onClick={handleOpenBarterModal}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-5 h-5" /> Barter this item
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Select an item to offer</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition p-2 bg-gray-900 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-900/50">
              {/* NAYA: Error Message UI for Insufficient Balance */}
              {balanceError && (
                <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-400 mb-1">Transaction Failed</p>
                    <p className="text-sm text-gray-300">{balanceError}</p>
                    {/* Yahan Buy Credits page ka link banayenge baad me */}
                  <Link 
  to="/wallet" 
  onClick={() => setShowModal(false)} // Modal band karke le jao
  className="mt-3 inline-block bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition"
>
  Get More Credits
</Link>
                  </div>
                </div>
              )}

              {myItems.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">You don't have any active items to offer yet.</p>
                  <Link to="/add-item" onClick={() => setShowModal(false)} className="inline-block bg-emerald-500 text-white px-6 py-2 rounded-full font-medium hover:bg-emerald-600 transition">Add an Item Now</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {myItems.map(myItem => (
                    <div 
                      key={myItem._id} 
                      onClick={() => setSelectedMyItem(myItem._id)}
                      className={`cursor-pointer rounded-xl overflow-hidden border-2 transition flex flex-col ${selectedMyItem === myItem._id ? 'border-emerald-500 scale-95 shadow-lg shadow-emerald-500/20' : 'border-gray-700 hover:border-gray-500 bg-gray-800'}`}
                    >
                      {myItem.images && myItem.images.length > 0 && myItem.images[0] ? (
                        <img src={myItem.images[0]} alt={myItem.title} className="w-full h-32 object-cover" />
                      ) : (
                        <div className="w-full h-32 bg-gray-900 flex items-center justify-center"><Package className="w-10 h-10 text-gray-600" /></div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium text-white truncate">{myItem.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-800 flex justify-end gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:text-white hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmOrder}
                disabled={!selectedMyItem || submitting}
                className={`px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 ${!selectedMyItem || submitting ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}
              >
                {submitting ? 'Sending...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;