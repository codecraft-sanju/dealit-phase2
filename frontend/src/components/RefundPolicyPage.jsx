import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-300">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Refund Policy</h1>
      </div>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl space-y-6">
        <p>Last updated: [Date]</p>
        <h2 className="text-xl font-semibold text-white">1. Credit Purchases</h2>
        <p>All credit purchases made on Dealit are final and non-refundable unless otherwise required by law.</p>
        
        <h2 className="text-xl font-semibold text-white">2. Item Transactions</h2>
        <p>Since Dealit facilitates transactions between individual users, refunds for items purchased using credits must be negotiated directly with the seller.</p>
        
        <h2 className="text-xl font-semibold text-white">3. Disputed Transactions</h2>
        <p>If you believe a transaction was fraudulent, please contact our support team within 7 days of the transaction.</p>
      </div>
    </div>
  );
};

export default RefundPolicyPage;