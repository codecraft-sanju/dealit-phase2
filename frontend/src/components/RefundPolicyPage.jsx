import React, { useEffect } from 'react';
import { ArrowLeft, ShieldAlert, CreditCard, Package, Truck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const RefundPolicyPage = () => {
  // Scroll to top on mount for legal pages
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

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
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Refund Policy</h1>
      </div>

      {/* Main Content Container */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        
        {/* Intro Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-6 flex flex-col items-start gap-3"
        >
          <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5" />
            Effective Date: August 15, 2026
          </div>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            Because Dealit operates a unique peer-to-peer bartering and digital credit system, our refund structures differ from standard e-commerce platforms. Please review our policies regarding Credits, Swaps, and Shipping below.
          </p>
        </motion.div>

        {/* Policy Card */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 space-y-8"
        >
          
          <motion.section variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 text-[#6B46C1] rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              1. Dealit Credits Purchases
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3 pl-9">
              <p>
                <strong>All purchases of Dealit Credits are final and non-refundable.</strong> Once real currency (INR) is converted into Dealit Credits and added to your wallet, it cannot be transferred back to your bank account, credit card, or UPI ID.
              </p>
              <p>
                <strong>Failed Transactions:</strong> If your payment method is charged but the Credits fail to reflect in your Dealit Wallet due to a technical error, the transaction will automatically be reconciled by our payment gateway (Razorpay). The amount will be refunded to your original payment method within 5-7 business days.
              </p>
            </div>
          </motion.section>

          <motion.div variants={itemVariants} className="h-px bg-gray-100 w-full"></motion.div>

          <motion.section variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
              2. Item-for-Item Swaps & Credit Trades
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3 pl-9">
              <p>
                Dealit acts purely as a technology intermediary connecting individuals. We do not own, hold, or inspect the inventory listed on our platform. 
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#6B46C1]">
                <li><strong>No Return Policy:</strong> Once an offer (whether a physical item or Credits) is accepted and the physical exchange takes place, the transaction is considered final. Dealit does not facilitate returns.</li>
                <li><strong>Buyer Beware:</strong> It is the responsibility of the receiving party to inspect the item, request additional videos/photos in the chat, and verify its condition before finalizing the physical exchange or dispatch.</li>
                <li><strong>Disputes:</strong> If you receive an item that is significantly not as described or counterfeit, you must report the user within 24 hours of receipt. While we cannot mandate a refund, we will investigate and may permanently ban the offending user and adjust Aura scores accordingly.</li>
              </ul>
            </div>
          </motion.section>

          <motion.div variants={itemVariants} className="h-px bg-gray-100 w-full"></motion.div>

          <motion.section variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Truck className="w-4 h-4" />
              </div>
              3. Shipping & Logistics Fees
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3 pl-9">
              <p>
                If you opt to use Dealit's integrated shipping partners (e.g., Shiprocket) to send or receive a bartered item, the shipping fee is paid separately.
              </p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#6B46C1]">
                <li><strong>Pre-Dispatch Cancellations:</strong> If an order is canceled by either party <em>before</em> the courier partner has picked up the item, the shipping fee will be refunded entirely to your Dealit Wallet.</li>
                <li><strong>Post-Dispatch:</strong> Once the item has been picked up by the logistics partner, shipping fees become strictly non-refundable, regardless of whether the trade is subsequently disputed.</li>
              </ul>
            </div>
          </motion.section>

          <motion.div variants={itemVariants} className="h-px bg-gray-100 w-full"></motion.div>

          <motion.section variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                <AlertCircle className="w-4 h-4" />
              </div>
              4. Account Termination
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed pl-9">
              <p>
                If Dealit suspends or terminates your account due to a violation of our Terms and Conditions (such as listing prohibited items or engaging in fraudulent trades), any remaining Credits in your Wallet are immediately forfeited and will not be refunded.
              </p>
            </div>
          </motion.section>

        </motion.div>
        
        {/* Contact Support Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center pt-8 pb-12"
        >
          <p className="text-xs text-gray-500 mb-2">Have a specific question about a recent transaction?</p>
          <Link to="/help-support" className="text-sm font-bold text-[#6B46C1] hover:text-[#553c9a] flex items-center justify-center transition-colors">
            Contact our Support Team
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default RefundPolicyPage;