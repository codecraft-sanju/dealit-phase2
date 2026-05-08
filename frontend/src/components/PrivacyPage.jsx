import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Database, Eye, Share2, Lock, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative">
      
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] px-5 py-4 shadow-md flex items-center gap-4">
        <Link 
          to="/" 
          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold tracking-wide text-white leading-tight">Privacy Policy</h1>
      </header>

      {/* Decorative curved background */}
      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto px-5 md:px-8 pt-24 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100">
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#F4F0FF] rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#6B46C1]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Dealit Privacy Policy</h2>
          </div>
          
          <p className="text-sm font-bold text-center text-gray-500 mb-8 border-b border-gray-100 pb-6">
            Last updated: {currentDate}
          </p>

          <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
            
            {/* Introduction */}
            <p className="font-medium">
              Welcome to Dealit! Your privacy is critically important to us. This Privacy Policy explains how we collect, use, and share your personal information when you use our platform to barter, buy credits, and exchange items.
            </p>

            {/* Section 1 */}
            <div className="bg-[#fcfbff] p-5 rounded-2xl border border-[#f0eaff]">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-[#6B46C1]" />
                <h2 className="text-lg font-bold text-gray-900">1. Information We Collect</h2>
              </div>
              <p className="mb-3">We collect information directly from you when you create an account, update your profile, or use our services:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-gray-600 marker:text-[#6B46C1]">
                <li><strong>Account Data:</strong> Full name, email address, phone number, and city.</li>
                <li><strong>Logistics Data:</strong> Full pickup address (House/Flat No, Street, Landmark, State, Pincode) required for courier and Shiprocket services.</li>
                <li><strong>Media Data:</strong> Profile pictures and item images uploaded to our servers (hosted securely via Cloudinary).</li>
                <li><strong>Transaction Data:</strong> Barter history, item listings, wishlist, Aura points, and Wallet credits.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="bg-[#fcfbff] p-5 rounded-2xl border border-[#f0eaff]">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-[#6B46C1]" />
                <h2 className="text-lg font-bold text-gray-900">2. How We Use Your Information</h2>
              </div>
              <p className="mb-3">The information we collect is strictly used to improve your Dealit experience:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-gray-600 marker:text-[#6B46C1]">
                <li>To verify your identity using OTPs and secure your account.</li>
                <li>To calculate your <strong>Aura Score</strong> based on platform activity and successful trades.</li>
                <li>To manage your Wallet balance, process Razorpay transactions, and handle shipping fees/refunds.</li>
                <li>To manage the Referral System and credit bonuses.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-[#fff9e6] p-5 rounded-2xl border border-[#ffe28a]">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">3. Information Sharing (Important)</h2>
              </div>
              <p className="mb-3">Because Dealit is a peer-to-peer exchange platform, specific data sharing is necessary:</p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-gray-700 marker:text-yellow-500">
                <li><strong>With Exchange Partners:</strong> Once a deal is "Locked" and accepted, we share your <strong>Name and Phone Number</strong> with your exchange partner so you can communicate via WhatsApp to coordinate delivery.</li>
                <li><strong>With Shipping Partners:</strong> Your pickup address and contact details are shared with delivery partners (e.g., Shiprocket) to facilitate physical item exchanges.</li>
                <li><strong>With Payment Gateways:</strong> When buying credits, basic details (Name, Email, Phone) are passed to Razorpay. We <strong>do not</strong> store your credit card or UPI PIN details.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="bg-[#fcfbff] p-5 rounded-2xl border border-[#f0eaff]">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-[#6B46C1]" />
                <h2 className="text-lg font-bold text-gray-900">4. Data Security</h2>
              </div>
              <p className="font-medium">
                We use strict security measures, including JWT (JSON Web Tokens) for authentication and secure HTTPS protocols, to protect your data. However, remember that no method of electronic transmission or storage is 100% secure. Please be cautious when sharing your address or location with other users via WhatsApp after a deal is locked.
              </p>
            </div>

            {/* Section 5 */}
            <div className="bg-[#fcfbff] p-5 rounded-2xl border border-[#f0eaff]">
              <div className="flex items-center gap-2 mb-3">
                <UserX className="w-5 h-5 text-[#6B46C1]" />
                <h2 className="text-lg font-bold text-gray-900">5. Account Deletion & Rights</h2>
              </div>
              <p className="font-medium mb-3">
                You have full control over your data. You can update your profile and pickup address at any time from the Profile tab.
              </p>
              <p className="font-medium">
                If you wish to leave Dealit, you can permanently delete your account and data by navigating to the <Link to="/delete-account" className="text-[#6B46C1] font-bold hover:underline">Delete Account</Link> section in the app.
              </p>
            </div>

            <div className="text-center pt-6 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-400">
                Got questions? Contact us at <a href="mailto:dealit.info@gmail.com" className="text-[#6B46C1] hover:underline">support@dealit.in</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;