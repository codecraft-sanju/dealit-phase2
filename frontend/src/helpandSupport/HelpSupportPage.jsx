import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, MessageCircle, ChevronDown, HelpCircle, Phone, Search, ExternalLink, Sparkles, BookOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpSupportPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: "How do I list an item for sale or swap?",
      a: "Go to your Dashboard and click on 'List an Item' (or the + icon). Fill in the necessary details, upload at least 3 clear images, set your estimated price in Credits, and hit submit. Your item will be reviewed and listed shortly.",
      category: "Selling"
    },
    {
      q: "How do I earn and use Credits?",
      a: "You earn credits by listing items, successfully completing deals, and getting good ratings. 1 Credit is equivalent to ₹1. You can use these credits to 'buy' items from other users instead of doing a direct item-for-item swap.",
      category: "Currency"
    },
    {
      q: "How exactly does the swapping process work?",
      a: "Browse the feed and find an item you want. Click 'Make Offer' to send a swap proposal using your own listed items, or offer Credits. If the seller accepts your offer, a private chat will open so you both can coordinate the exchange.",
      category: "Trading"
    },
    {
      q: "What are Aura Points and why do they matter?",
      a: "Aura is your community trust score. It increases when you complete deals successfully, receive positive reviews, and verify your profile. Users with high Aura get a badge and more visibility on their listings.",
      category: "Account"
    },
    {
      q: "How is shipping or pickup handled?",
      a: "Currently, users coordinate the pickup or delivery method privately via the in-app chat after a deal is accepted. Always ensure your pickup address is updated in your Account Details to make the process smoother.",
      category: "Logistics"
    },
    {
      q: "Is it safe to trade with strangers?",
      a: "We recommend checking a user's Aura score and past reviews before trading. Always prefer meeting in public places for local swaps, or use trusted courier services with tracking if shipping.",
      category: "Safety"
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7fb] pb-12 font-sans relative overflow-x-hidden">
      
      {/* Dynamic Purple Header Background */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-br from-[#553c9a] via-[#6B46C1] to-[#805ad5] rounded-b-[2.5rem] z-0 overflow-hidden"
      >
        {/* Subtle Background Patterns */}
        <div className="absolute -top-24 -right-10 w-64 h-64 bg-white/5 rounded-full blur-[2rem]"></div>
        <div className="absolute top-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-[2rem]"></div>
        
        {/* Animated Particles */}
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 text-white/20"
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Sticky Top Nav */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-transparent py-4 sm:py-5 px-4 md:px-8">
        <div className="max-w-md mx-auto md:max-w-4xl flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto md:max-w-4xl px-4 md:px-8 relative z-10 -mt-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Hello, how can we help?</h1>
          <p className="text-purple-100 text-sm sm:text-base font-medium">Search our knowledge base or get in touch.</p>
        </motion.div>

        {/* Search Bar - CHANGED for better visibility */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
          className="relative mb-10"
        >
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 shadow-lg rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#805ad5] focus:border-transparent transition-all font-medium"
          />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          
         
          <section>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Phone className="w-4 h-4 text-white/90" />
             
              <h2 className="text-xs font-bold text-white/90 uppercase tracking-widest">Get Direct Support</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.a 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href="mailto:support@dealit.com" 
                className="bg-white rounded-[1.5rem] p-5 border border-gray-100/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-[#6B46C1] group-hover:bg-[#6B46C1] group-hover:text-white transition-colors duration-300 mb-4 shadow-sm z-10">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <h3 className="font-bold text-gray-900 text-lg">Email Us</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">Send us a detailed message. We usually reply within 24 hours.</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B46C1]">
                    <span>support@dealit.com</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.a>

              <motion.a 
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                href="https://wa.me/919619649668"
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-[1.5rem] p-5 border border-gray-100/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300 mb-4 shadow-sm z-10">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <h3 className="font-bold text-gray-900 text-lg">WhatsApp Chat</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">Need a quick fix? Chat directly with our support team.</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Available Now</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.a>
            </div>
          </section>

          {/* FAQs Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1 mt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                {/* CHANGED: Text color for visibility if it falls off the purple background */}
                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Knowledge Base</h2>
              </div>
              {searchQuery && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-bold">
                  {filteredFaqs.length} results
                </span>
              )}
            </div>
            
            <motion.div variants={itemVariants} className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className="border-b border-gray-50 last:border-0 relative">
                      {/* Decorative Line on Active */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div 
                            initial={{ height: 0 }} 
                            animate={{ height: "100%" }} 
                            exit={{ height: 0 }} 
                            className="absolute left-0 top-0 w-1 bg-[#6B46C1] rounded-r-md" 
                          />
                        )}
                      </AnimatePresence>

                      <button 
                        onClick={() => toggleFaq(index)}
                        className={`w-full flex items-center justify-between p-5 text-left transition-colors focus:outline-none ${isOpen ? 'bg-purple-50/30' : 'hover:bg-gray-50/50'}`}
                      >
                        <div className="flex flex-col gap-1 pr-4">
                          <span className="text-[10px] font-bold text-[#A388E1] uppercase tracking-wider">{faq.category}</span>
                          <span className={`text-[14px] sm:text-[15px] font-bold transition-colors ${isOpen ? 'text-[#6B46C1]' : 'text-gray-800'}`}>
                            {faq.q}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0, backgroundColor: isOpen ? '#6B46C1' : '#f3f4f6', color: isOpen ? '#ffffff' : '#9ca3af' }}
                          transition={{ duration: 0.3, ease: "backOut" }}
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                            className="overflow-hidden bg-purple-50/30"
                          >
                            <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed pl-5">
                              <motion.div 
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                {faq.a}
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-[15px]">No results found</h3>
                  <p className="text-xs text-gray-500 mt-1">We couldn't find any FAQs matching "{searchQuery}"</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-xs font-bold text-[#6B46C1] bg-purple-50 px-4 py-2 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </motion.div>
          </section>

          {/* Additional Help Link */}
          <motion.div variants={itemVariants} className="text-center pt-4 pb-8">
            <p className="text-xs text-gray-500 mb-2">Still can't find what you're looking for?</p>
            <button className="text-sm font-bold text-[#6B46C1] hover:text-[#553c9a] flex items-center justify-center gap-1.5 mx-auto transition-colors">
              <FileText className="w-4 h-4" />
              Read our full Terms & Policies
            </button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default HelpSupportPage;