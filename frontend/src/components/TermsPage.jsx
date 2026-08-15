import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#faf9fc] text-gray-800 font-sans pb-12">
      {/* Sticky Premium Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-4 flex items-center gap-4 shadow-sm">
        <Link 
          to="/" 
          className="p-2 bg-gray-50 hover:bg-[#f5f3ff] hover:text-[#6B46C1] text-gray-600 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Terms & Conditions</h1>
      </div>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* Intro Section */}
        <div className="mb-6 flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-1.5 bg-purple-50 text-[#6B46C1] text-xs font-bold px-3 py-1.5 rounded-full border border-purple-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            Last Updated: June 2026
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Please read these terms carefully before using the Dealit platform.
          </p>
        </div>

        {/* Terms Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 space-y-8">
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-[#A388E1]">1.</span> Introduction
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Welcome to Dealit. By accessing our website or mobile application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-[#A388E1]">2.</span> User Accounts
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              When you create an account with us, you must provide accurate, complete, and current information. You are strictly responsible for safeguarding the password and OTPs you use to access the service and for any activities or actions under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-[#A388E1]">3.</span> Barter System & Dealit Credits
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Dealit facilitates the exchange of physical goods using a proprietary digital credit system (Dealit Credits). 
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1.5 marker:text-[#A388E1]">
              <li>Credits hold no real-world monetary value outside the Dealit ecosystem.</li>
              <li>Credits cannot be withdrawn, cashed out, or transferred to bank accounts.</li>
              <li>Dealit reserves the right to modify credit balances if fraudulent activity is detected.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-[#A388E1]">4.</span> Prohibited Items
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Users are strictly prohibited from listing illegal items, weapons, hazardous materials, perishable goods, stolen property, or explicit content. Dealit reserves the right to permanently ban users who violate this policy and report them to relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-[#A388E1]">5.</span> Limitation of Liability
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dealit acts merely as an intermediary platform to connect users. We are not responsible for the quality, safety, legality, or actual condition of the items exchanged. All trades are conducted at your own risk.
            </p>
          </section>

        </div>
        
      
        <div className="h-10"></div>
      </div>
    </div>
  );
};

export default TermsPage;