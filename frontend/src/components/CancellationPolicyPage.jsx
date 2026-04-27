import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CancellationPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-300">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Cancellation Policy</h1>
      </div>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl space-y-6">
        <p>Last updated: [Date]</p>
        <h2 className="text-xl font-semibold text-white">1. Order Cancellation</h2>
        <p>You may cancel a purchase or barter offer before the other party has accepted it. Once accepted, the transaction is considered final.</p>
        
        <h2 className="text-xl font-semibold text-white">2. Account Cancellation</h2>
        <p>You can cancel your Dealit account at any time through your profile settings. Upon cancellation, any unused credits may be forfeited.</p>
      </div>
    </div>
  );
};

export default CancellationPolicyPage;