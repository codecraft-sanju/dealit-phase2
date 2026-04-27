import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-300">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
      </div>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl space-y-6">
        <p>Last updated: [Date]</p>
        <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
        <p>Welcome to Dealit. By accessing our website, you agree to be bound by these Terms and Conditions.</p>
        
        <h2 className="text-xl font-semibold text-white">2. User Accounts</h2>
        <p>When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password that you use to access the service.</p>
        
        <h2 className="text-xl font-semibold text-white">3. Barter and Credits</h2>
        <p>Dealit facilitates the exchange of items and the use of credits. We are not responsible for the quality or safety of items exchanged between users.</p>
      </div>
    </div>
  );
};

export default TermsPage;