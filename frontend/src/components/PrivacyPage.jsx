import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-8 pb-20 px-4 md:px-8 selection:bg-emerald-500/30">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-gray-400 hover:text-white transition p-2 bg-gray-800 rounded-full hover:bg-gray-700 shadow-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Shield className="w-8 h-8 text-purple-500" />
            Privacy Policy
          </h1>
        </div>

        <div className="bg-gray-800 rounded-[2rem] border border-gray-700 p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] space-y-8 text-gray-300 relative overflow-hidden">
          
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[4rem] pointer-events-none"></div>

          <section className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="p-2 bg-emerald-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-emerald-400" />
              </span>
              1. Information We Collect
            </h2>
            <p className="leading-relaxed mb-4 text-gray-400">
              When you use Dealit, we collect information to help you trade and swap items smoothly. This includes:
            </p>
            <ul className="space-y-3 bg-gray-900/50 p-5 rounded-2xl border border-gray-700/50">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                <p><strong>Account Details:</strong> Your name, email, and basic profile information.</p>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                <p><strong>Listing Data:</strong> Details about items you upload, including images, descriptions, categories, and estimated credit values.</p>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                <p><strong>Communications:</strong> Chat messages between you and other users to facilitate successful swaps.</p>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0"></div>
                <p><strong>Transaction History:</strong> Wallet balances, credits, and details of your past deals.</p>
              </li>
            </ul>
          </section>

          <section className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="p-2 bg-purple-500/10 rounded-xl">
                <Eye className="w-5 h-5 text-purple-400" />
              </span>
              2. How We Use Your Information
            </h2>
            <p className="leading-relaxed mb-4 text-gray-400">
              We use your data strictly to make the Dealit platform function properly. Your information helps us:
            </p>
            <ul className="space-y-3 bg-gray-900/50 p-5 rounded-2xl border border-gray-700/50">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                <p>Connect you with relevant barter matches and preferred items.</p>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                <p>Process secure credit transactions within your Dealit Wallet.</p>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                <p>Keep the platform safe and prevent fraudulent item listings.</p>
              </li>
            </ul>
          </section>

          <section className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="p-2 bg-blue-500/10 rounded-xl">
                <Lock className="w-5 h-5 text-blue-400" />
              </span>
              3. Data Security & Sharing
            </h2>
            <p className="leading-relaxed text-gray-400 bg-gray-900/50 p-5 rounded-2xl border border-gray-700/50">
              We take your privacy seriously. Dealit does not sell your personal data to third parties. We only share necessary public information (like your profile name and item listings) with other users so you can negotiate swaps. We use standard security measures to protect your account, active chats, and wallet data from unauthorized access.
            </p>
          </section>

          <section className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-4">4. Your Rights</h2>
            <p className="leading-relaxed text-gray-400">
              You have full control over your data. You can update your profile, modify item listings, update estimated values, or request account deletion at any time through your Dashboard and Profile settings.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-700/50 text-sm text-gray-500 relative z-10">
            <p>Last updated: April 2026</p>
            <p className="mt-1">If you have any questions about this Privacy Policy, please contact our administrative team.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;