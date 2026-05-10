import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns'; // Great for dynamic time text

const BarterDetailCard = ({ barter, currentUser, onAcceptOffer, onDeclineOffer, onCompletePayment }) => {
  const isOwner = currentUser._id === barter.owner._id;
  const isRequester = currentUser._id === barter.requester._id;

  // Calculate Credit Difference
  const targetValue = barter.item.estimated_value || 0;
  const offeredValue = barter.offered_item.estimated_value || 0;
  const creditDifference = Math.max(0, targetValue - offeredValue);

  const renderDynamicStatus = () => {
    switch (barter.status) {
      case 'PENDING':
        return (
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-yellow-400 font-semibold text-lg">Action Required</h3>
            {isOwner ? (
              <p className="text-gray-300 mt-1">
                {barter.requester.full_name} requested this trade on {format(new Date(barter.created_at), 'PPP')}. 
                Review the offer and accept to proceed to shipping payment.
              </p>
            ) : (
              <p className="text-gray-300 mt-1">
                You sent this request on {formatDistanceToNow(new Date(barter.created_at), { addSuffix: true })}. 
                Waiting for {barter.owner.full_name} to review it.
              </p>
            )}
          </div>
        );

      case 'AWAITING_PAYMENT':
        const expiresAtText = format(new Date(barter.expiresAt), 'PPP at p');
        return (
          <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700">
            <h3 className="text-blue-400 font-semibold text-lg">Waiting for Final Payment</h3>
            {isOwner ? (
              <p className="text-gray-300 mt-1">
                You accepted this deal and paid your shipping. We are now waiting for {barter.requester.full_name} to pay their shipping fee. 
                If they do not pay by {expiresAtText}, the deal will cancel and your money will be refunded automatically.
              </p>
            ) : (
              <div className="mt-1">
                <p className="text-gray-300">
                  Good news! {barter.owner.full_name} accepted your offer and paid for their shipping.
                </p>
                <p className="text-white font-medium mt-2">
                  You must complete your shipping payment by {expiresAtText} to lock the deal.
                </p>
              </div>
            )}
          </div>
        );

      case 'ACCEPTED':
        return (
          <div className="p-4 bg-green-900/30 rounded-lg border border-green-700">
            <h3 className="text-green-400 font-semibold text-lg">Deal Locked!</h3>
            <p className="text-gray-300 mt-1">
              Both parties have paid their shipping fees. Separate orders have been generated in your My Orders tab. Pack your item securely!
            </p>
          </div>
        );

      case 'REJECTED':
      case 'CANCELLED':
        return (
          <div className="p-4 bg-red-900/30 rounded-lg border border-red-700">
            <h3 className="text-red-400 font-semibold text-lg">Trade {barter.status === 'REJECTED' ? 'Declined' : 'Cancelled'}</h3>
            <p className="text-gray-300 mt-1">
              This barter request is no longer active.
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (barter.status === 'PENDING' && isOwner) {
      return (
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => onAcceptOffer(barter._id)}
            className="flex-1 bg-white text-black py-3 rounded-md font-semibold hover:bg-gray-200 transition"
          >
            Accept & Pay Shipping
          </button>
          <button 
            onClick={() => onDeclineOffer(barter._id)}
            className="flex-1 bg-transparent border border-gray-600 text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition"
          >
            Decline Offer
          </button>
        </div>
      );
    }

    if (barter.status === 'AWAITING_PAYMENT' && isRequester) {
      return (
        <div className="mt-6">
          <button 
            onClick={() => onCompletePayment(barter._id, creditDifference)}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Pay Shipping {creditDifference > 0 ? `& Deduct ${creditDifference} Credits` : ''} to Lock Deal
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-white max-w-3xl mx-auto">
      
      {/* Items Comparison Section */}
      <div className="flex justify-between items-center mb-8">
        
        {/* Target Item */}
        <div className="w-5/12 text-center">
          <p className="text-sm text-gray-400 mb-2">{isOwner ? 'Your Item' : 'Requested Item'}</p>
          <img src={barter.item.images[0]} alt={barter.item.title} className="w-full h-40 object-cover rounded-lg border border-gray-700" />
          <h4 className="font-medium mt-3 truncate">{barter.item.title}</h4>
          <p className="text-sm text-gray-400">Value: ₹{barter.item.estimated_value}</p>
        </div>

        {/* Swap Icon */}
        <div className="w-2/12 flex flex-col items-center justify-center">
          <div className="bg-gray-800 p-3 rounded-full">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          {creditDifference > 0 && (
             <span className="text-xs text-yellow-500 mt-2 font-medium">+{creditDifference} Credits</span>
          )}
        </div>

        {/* Offered Item */}
        <div className="w-5/12 text-center">
          <p className="text-sm text-gray-400 mb-2">{isRequester ? 'Your Offer' : 'Offered Item'}</p>
          <img src={barter.offered_item.images[0]} alt={barter.offered_item.title} className="w-full h-40 object-cover rounded-lg border border-gray-700" />
          <h4 className="font-medium mt-3 truncate">{barter.offered_item.title}</h4>
          <p className="text-sm text-gray-400">Value: ₹{barter.offered_item.estimated_value}</p>
        </div>

      </div>

      {/* Dynamic Status Text */}
      {renderDynamicStatus()}

      {/* Action Buttons */}
      {renderActionButtons()}

    </div>
  );
};

export default BarterDetailCard;