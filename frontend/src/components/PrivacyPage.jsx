import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-300">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      </div>
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 shadow-xl space-y-6">
        <p>Last updated: [Date]</p>
        <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create or modify your account, list items, or contact customer support.</p>
        
        <h2 className="text-xl font-semibold text-white">2. How We Use Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, and to process transactions securely.</p>
        
        <h2 className="text-xl font-semibold text-white">3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as described in this privacy policy.</p>
      </div>
    </div>
  );
};

export default PrivacyPage;