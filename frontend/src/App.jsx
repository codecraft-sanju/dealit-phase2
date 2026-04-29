import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Dummy Data
const initialPrompt = "Analyze today's queue for TrimGo, block 3:00 PM slot for staff lunch, and generate payment links for pending customers.";

const calendarData = [
  { day: 'Sun', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: false }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: true }] },
  { day: 'Mon', slots: [{ time: '9:00 AM', available: false }, { time: '10:00 AM', available: false }, { time: '11:00 AM', available: true }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: false }, { time: '2:00 PM', available: true }] },
  { day: 'Tue', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: false }, { time: '12:00 PM', available: false }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: true }] },
  { day: 'Wed', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: true }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: false }] },
  { day: 'Thu', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: true }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: true }] },
  { day: 'Fri', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: false }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: false }] },
  { day: 'Sat', slots: [{ time: '9:00 AM', available: true }, { time: '10:00 AM', available: true }, { time: '11:00 AM', available: true }, { time: '12:00 PM', available: true }, { time: '1:00 PM', available: true }, { time: '2:00 PM', available: true }] },
];

const initialActivityData = [
  { id: 1, action: 'Queue Data Analyzed', user: 'System', time: '1m ago', status: 'Success' },
  { id: 2, action: 'Staff Roster Sync', user: 'Sanjay', time: '3m ago', status: 'Success' },
  { id: 3, action: 'Draft Payment Links', user: 'API Gateway', time: '5m ago', status: 'Success' },
  { id: 4, action: 'Send WhatsApp Alerts', user: 'System', time: '8m ago', status: 'Pending' },
];

const workflowData = [
  { id: 1, action: 'Analyze Live Queue', status: 'Success' },
  { id: 2, action: 'Block Calendar Slots', status: 'In Progress' },
  { id: 3, action: 'Generate Payment Links', status: 'In Progress' },
  { id: 4, action: 'Dispatch WhatsApp API', status: 'Pending' },
];

const reportData = {
  title: "TrimGo Daily Operations Summary.pdf",
  sections: [
    { name: "Live Queue Status", content: "12 Customers served, 4 Waiting in lobby." },
    { name: "Schedule Updates", content: "3:00 PM slot successfully blocked for inventory check." },
    { name: "Revenue Tracking", content: "₹4,500 Collected, ₹1,200 Pending via UPI links." },
    { name: "Staff Allocation", content: "Vishesh and Parth assigned to active workstations." },
  ]
};

const analyticsChartData = [40, 70, 45, 90, 65, 80, 100, 55, 75, 85, 60, 95];

// Main App Component
function App() {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activities, setActivities] = useState(initialActivityData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [activeTab, setActiveTab] = useState('home');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings State
  const [autoExecute, setAutoExecute] = useState(true);

  const promptRef = useRef(null);
  const panelsRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsGenerating(true);
      setShowResults(false);
      
      setTimeout(() => {
        setIsGenerating(false);
        setShowResults(true);
        const newActivity = { id: Date.now(), action: 'Dynamic UI Rendered', user: 'Aether Engine', time: 'Just now', status: 'Success' };
        setActivities(prev => [newActivity, ...prev]);
      }, 1500);
    }
  };

  useEffect(() => {
    if (showResults && panelsRef.current && activeTab === 'home') {
      gsap.from(panelsRef.current.children, { 
        opacity: 0, 
        y: 40, 
        scale: 0.98,
        duration: 0.8, 
        ease: 'power3.out', 
        stagger: 0.15 
      });
    }
  }, [showResults, activeTab]);

  const nextOnboardingStep = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const openActionModal = (title, content) => {
    setModalConfig({ isOpen: true, title, content });
  };

  const closeActionModal = () => {
    setModalConfig({ isOpen: false, title: '', content: '' });
  };

  const filteredActivities = activities.filter(act => 
    act.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
    act.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0a0c10] text-white min-h-screen font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#12141c]/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_40px_rgba(0,255,255,0.15)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">Welcome to Aether AI</h2>
                <span className="text-gray-500 text-sm font-medium border border-gray-700 px-3 py-1 rounded-full">Step {onboardingStep} of 3</span>
              </div>
              
              <div className="min-h-[120px] mb-6 text-gray-300 text-lg leading-relaxed">
                {onboardingStep === 1 && <p>General AI is for chatting. Aether AI is built for <span className="text-white font-semibold">Business Operations</span>. It translates commands into functional interfaces.</p>}
                {onboardingStep === 2 && <p>Type your request in the input box. The engine will instantly build dynamic components like Calendars and Payment Dashboards tailored to your data.</p>}
                {onboardingStep === 3 && <p>Interact directly with the generated UI to trigger Razorpay links, WhatsApp API alerts, or database syncs automatically. Ready?</p>}
              </div>

              <div className="flex justify-between items-center mt-8">
                <button onClick={() => setShowOnboarding(false)} className="text-gray-500 hover:text-gray-300 font-medium transition">Skip Tutorial</button>
                <button onClick={nextOnboardingStep} className="bg-cyan-500 text-[#0f1118] px-6 py-2.5 rounded-lg font-bold hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                  {onboardingStep === 3 ? "Initialize Workspace" : "Next Step"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeActionModal}
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12141c] border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-cyan-400 mb-4">{modalConfig.title}</h3>
              <p className="text-gray-300 mb-6">{modalConfig.content}</p>
              <button onClick={closeActionModal} className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition font-medium">Dismiss</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto p-4 lg:p-6 flex flex-col space-y-6 relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-[#12141c]/80 backdrop-blur-lg rounded-2xl border border-gray-800/60 shadow-xl">
          <div className="flex items-center space-x-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-full border-[3px] border-cyan-500 border-dashed flex items-center justify-center bg-cyan-500/10">
              <span className="text-xl font-bold text-cyan-400">Ae</span>
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-wide">Aether AI</h1>
              <p className="text-xs text-cyan-500/70 uppercase tracking-widest font-semibold mt-0.5">Business Operations Hub</p>
            </div>
          </div>
          <div className="flex items-center space-x-5">
            <div className="relative cursor-pointer group" onClick={() => openActionModal('Notifications', 'System update 1.3 is scheduled for tonight.')}>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Profile" className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-cyan-500 transition duration-300" onClick={() => openActionModal('Profile', 'Logged in as Sanjay. Role permissions: Super Admin.')} />
            <div className="bg-[#1f222e] p-2.5 rounded-xl cursor-pointer hover:bg-gray-700 transition duration-300" onClick={() => setActiveTab('settings')}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
        </header>

        {/* Prompt Input */}
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className={`bg-[#12141c]/90 backdrop-blur-md rounded-2xl border ${isGenerating ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'border-cyan-500/30 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(0,255,255,0.05)]'} p-6 flex flex-col space-y-4 transition-all duration-300 z-10 relative`}>
          <div className="flex items-center space-x-3">
             <div className={`w-2.5 h-2.5 rounded-full ${isGenerating ? 'bg-yellow-500' : 'bg-cyan-500'} animate-pulse shadow-lg`}></div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isGenerating ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {isGenerating ? 'Synthesizing layout from intent...' : 'Command Interface'}
            </h2>
          </div>
          <textarea
            ref={promptRef}
            rows="2"
            className="bg-transparent text-gray-100 p-2 rounded-lg focus:outline-none text-xl w-full resize-none placeholder-gray-600 leading-relaxed"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruct the AI to manage queue, payments, or scheduling..."
          ></textarea>
          <div className="flex justify-end">
            <span className="text-xs text-gray-600 font-medium bg-gray-800/50 px-2 py-1 rounded">Press Enter to execute</span>
          </div>
        </motion.div>
        
        {/* Main Content Area */}
        <div className="flex space-x-6">
          
          {/* Side Bar Navigation */}
          <aside className="w-20 flex flex-col items-center space-y-4 p-4 bg-[#12141c]/80 backdrop-blur-lg rounded-2xl border border-gray-800/60 shadow-xl h-fit">
             {[
               { icon: '⌘', id: 'home', label: 'Workspace' }, 
               { icon: '📈', id: 'stats', label: 'Metrics' }, 
               { icon: '⚙️', id: 'settings', label: 'Config' }
             ].map((item) => (
               <motion.div 
                 key={item.id} 
                 whileHover={{ scale: 1.1, backgroundColor: 'rgba(31, 41, 55, 1)' }} 
                 onClick={() => setActiveTab(item.id)}
                 className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${activeTab === item.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-transparent text-gray-400 border border-transparent'}`}
                 title={item.label}
               >
                  <span className="text-2xl">{item.icon}</span>
               </motion.div>
             ))}
          </aside>

          {/* Dynamic Render based on Active Tab */}
          <div className="flex-1 min-h-[500px]">
            {activeTab === 'home' && !showResults && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800/60 rounded-2xl bg-[#12141c]/30">
                <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <p className="font-medium">Awaiting operational command...</p>
              </div>
            )}

            {activeTab === 'home' && showResults && (
              <div ref={panelsRef} className="flex flex-col space-y-6 w-full">
                <div className="flex space-x-6">
                  
                  {/* Calendar Panel */}
                  <motion.div className="flex-1 p-6 bg-[#12141c]/90 backdrop-blur-md rounded-2xl border border-gray-800/60 shadow-xl" whileHover={{ borderColor: 'rgba(0,255,255,0.3)' }}>
                    <h3 className="text-lg font-bold mb-6 text-cyan-400 flex items-center space-x-3">
                       <div className="p-1.5 bg-cyan-500/10 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                      <span>Staff Calendar Matcher</span>
                    </h3>
                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {calendarData.map((data, index) => (
                         <div key={index} className="flex flex-col items-center">
                            <p className="text-xs text-gray-500 font-bold mb-3 uppercase">{data.day}</p>
                            <div className="grid grid-cols-1 gap-1.5 w-full">
                              {data.slots.map((slot, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => slot.available && openActionModal('Slot Action', `Slot selected: ${data.day} at ${slot.time}. Booking API will be updated.`)}
                                  className={`w-full h-9 rounded-md flex items-center justify-center transition-all duration-200 border ${slot.available ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 hover:border-cyan-500/50 cursor-pointer' : 'bg-gray-800/30 border-transparent text-gray-600 cursor-not-allowed'}`}
                                >
                                   <p className="text-[10px] font-semibold">{slot.time}</p>
                                </div>
                              ))}
                            </div>
                         </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => openActionModal('Execution Triggered', 'Calendar blocked! Changes synced with primary database.')}
                      className="bg-cyan-500 hover:bg-cyan-400 text-[#0f1118] px-6 py-3 rounded-xl font-bold w-full transition duration-300 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]"
                    >
                      Confirm Schedule Fix
                    </button>
                  </motion.div>
                  
                  {/* Report Panel */}
                  <motion.div className="flex-1 p-6 bg-[#12141c]/90 backdrop-blur-md rounded-2xl border border-gray-800/60 shadow-xl flex flex-col justify-between" whileHover={{ borderColor: 'rgba(0,255,255,0.3)' }}>
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-cyan-400 flex items-center space-x-3">
                           <div className="p-1.5 bg-cyan-500/10 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                           <span>Generated Output</span>
                        </h3>
                         <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/30">Auto-Generated</span>
                      </div>
                       <p className="text-sm font-semibold text-gray-200 mb-5 pb-3 border-b border-gray-800/60">{reportData.title}</p>
                      <div className="space-y-5">
                        {reportData.sections.map((section, index) => (
                           <div key={index}>
                              <p className="text-[11px] text-cyan-500 font-bold mb-1.5 uppercase tracking-wider">{section.name}</p>
                              <p className="text-sm text-gray-300 leading-snug">{section.content}</p>
                           </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6 pt-5 border-t border-gray-800/60">
                       <button 
                          onClick={() => openActionModal('Payment Gateway', 'Triggering Razorpay links to 4 pending customers.')}
                          className="flex-1 bg-[#1f222e] border border-gray-700 text-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition duration-300"
                       >
                         Request Payments
                       </button>
                       <button 
                          onClick={() => openActionModal('WhatsApp API', 'Executing bulk message dispatch via WhatsApp Business API.')}
                          className="flex-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-500/20 transition duration-300"
                       >
                         Send Alerts
                       </button>
                    </div>
                  </motion.div>
                </div>

                {/* Workflow Panel */}
                <motion.div className="p-6 bg-[#12141c]/90 backdrop-blur-md rounded-2xl border border-gray-800/60 shadow-xl">
                  <h3 className="text-lg font-bold mb-8 text-cyan-400 flex items-center space-x-3">
                     <div className="p-1.5 bg-cyan-500/10 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg></div>
                    <span>Execution Pipeline</span>
                  </h3>
                  <div className="flex items-center justify-between space-x-4 relative px-4">
                    <div className="absolute top-1.5 left-8 right-8 h-0.5 bg-gray-800 -z-10"></div>
                    {workflowData.map((item, index) => (
                       <div key={item.id} className="flex-1 flex flex-col items-center bg-[#12141c] px-2 relative">
                          <div className={`w-full h-1.5 rounded-full ${item.status === 'Success' ? 'bg-cyan-500 shadow-[0_0_12px_rgba(0,255,255,0.6)]' : item.status === 'In Progress' ? 'bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`}></div>
                           <p className="text-sm font-semibold mt-4 text-center text-gray-300">{item.action}</p>
                           <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${item.status === 'Success' ? 'text-cyan-400' : item.status === 'In Progress' ? 'text-yellow-400' : 'text-gray-600'}`}>{item.status}</p>
                       </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Analytics Tab Rendering */}
            {activeTab === 'stats' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-6">
                <div className="grid grid-cols-3 gap-6">
                   <div className="p-6 bg-[#12141c]/90 rounded-2xl border border-gray-800/60 shadow-xl">
                      <p className="text-gray-400 text-sm font-medium mb-2">Daily Bookings</p>
                      <h2 className="text-4xl font-bold text-white">42</h2>
                      <p className="text-green-400 text-xs mt-3 font-bold flex items-center"><span className="mr-1">↑</span> +12% from yesterday</p>
                   </div>
                   <div className="p-6 bg-[#12141c]/90 rounded-2xl border border-gray-800/60 shadow-xl">
                      <p className="text-gray-400 text-sm font-medium mb-2">Avg Wait Time</p>
                      <h2 className="text-4xl font-bold text-white">14<span className="text-lg text-gray-500 ml-1 font-medium">mins</span></h2>
                      <p className="text-green-400 text-xs mt-3 font-bold flex items-center"><span className="mr-1">↓</span> -2 mins optimal</p>
                   </div>
                   <div className="p-6 bg-[#12141c]/90 rounded-2xl border border-gray-800/60 shadow-xl">
                      <p className="text-gray-400 text-sm font-medium mb-2">Automated Tasks</p>
                      <h2 className="text-4xl font-bold text-white">128</h2>
                      <p className="text-cyan-400 text-xs mt-3 font-bold flex items-center">Engine performing optimally</p>
                   </div>
                </div>

                <div className="p-6 bg-[#12141c]/90 rounded-2xl border border-gray-800/60 shadow-xl flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-lg font-bold text-cyan-400">Customer Footfall (Last 12 Hrs)</h3>
                     <span className="bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-bold text-cyan-400 flex items-center"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 animate-pulse"></div> Live Sync</span>
                  </div>
                  <div className="flex items-end space-x-4 h-56 border-b border-gray-800/60 pb-3">
                    {analyticsChartData.map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className="w-full bg-gradient-to-t from-cyan-900/40 to-cyan-700/60 rounded-t-lg group-hover:from-cyan-600 group-hover:to-cyan-400 transition-all duration-300 cursor-pointer" 
                          style={{ height: `${val}%` }}
                        >
                           <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[#1f222e] border border-gray-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-none">{val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 text-xs font-medium text-gray-500 px-2">
                    <span>Opening</span>
                    <span>Mid-Day</span>
                    <span>Closing</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab Rendering */}
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-6">
                <div className="p-6 bg-[#12141c]/90 rounded-2xl border border-gray-800/60 shadow-xl">
                  <h2 className="text-xl font-bold text-cyan-400 mb-8 border-b border-gray-800/60 pb-4">Business Logic Configuration</h2>
                  
                  <div className="space-y-8">
                     {/* Model Selection */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-300 mb-3">Core Processing Model</label>
                       <select className="w-full bg-[#0a0c10] border border-gray-700/80 rounded-xl p-3.5 text-gray-200 focus:outline-none focus:border-cyan-500 transition shadow-inner">
                         <option>Business Nano (Optimized for Speed)</option>
                         <option>Aether Pro (Complex Analytics)</option>
                         <option>Custom Finetune (TrimGo Data)</option>
                       </select>
                     </div>

                     {/* API Key */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-300 mb-3">Razorpay / Communication API Key</label>
                       <div className="flex space-x-3">
                         <input type="password" value="rzp_live_xxxxxxxxxxxxxxxx" readOnly className="flex-1 bg-[#0a0c10] border border-gray-700/80 rounded-xl p-3.5 text-gray-400 focus:outline-none shadow-inner font-mono text-sm" />
                         <button className="bg-[#1f222e] border border-gray-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition">Reveal</button>
                       </div>
                     </div>

                     {/* Webhook Configuration */}
                     <div>
                       <label className="block text-sm font-semibold text-gray-300 mb-3">Database Webhook URL</label>
                       <input type="text" placeholder="https://api.trimgo.co.in/v1/webhook" className="w-full bg-[#0a0c10] border border-gray-700/80 rounded-xl p-3.5 text-gray-200 focus:outline-none focus:border-cyan-500 transition shadow-inner" />
                     </div>

                     {/* Toggles */}
                     <div className="pt-6 border-t border-gray-800/60 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-200">Autonomous WhatsApp Dispatch</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Allow AI to send booking confirmations without manual click.</p>
                          </div>
                          <div 
                            className={`w-14 h-7 rounded-full flex items-center px-1.5 cursor-pointer transition-colors duration-300 ${autoExecute ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            onClick={() => setAutoExecute(!autoExecute)}
                          >
                            <motion.div layout className={`w-5 h-5 bg-white rounded-full shadow-md ${autoExecute ? 'ml-auto' : ''}`} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-200">Strict JSON Output Validation</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium">Ensures AI output strictly matches UI component props.</p>
                          </div>
                          <div className="w-14 h-7 rounded-full flex items-center px-1.5 bg-cyan-500 cursor-not-allowed opacity-80">
                            <div className="w-5 h-5 bg-white rounded-full shadow-md ml-auto" />
                          </div>
                        </div>
                     </div>

                     <div className="pt-6">
                       <button onClick={() => openActionModal('Settings Saved', 'Business logic configurations synced to cloud.')} className="bg-cyan-500 text-[#0f1118] px-8 py-3 rounded-xl font-bold hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(0,255,255,0.3)]">Save Configuration</button>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Persistent Right Sidebar: Activity */}
          <div className="w-80 flex flex-col">
            <motion.div className="flex-1 p-5 bg-[#12141c]/90 backdrop-blur-md rounded-2xl border border-gray-800/60 shadow-xl flex flex-col h-full max-h-[800px]">
              <h3 className="text-lg font-bold mb-5 text-cyan-400 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Activity Logs</span>
              </h3>
              
              <div className="mb-5 relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-gray-700/80 rounded-xl p-2.5 pl-9 text-sm focus:outline-none focus:border-cyan-500 transition shadow-inner" 
                  placeholder="Filter operations..." 
                />
                <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="space-y-3.5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredActivities.length > 0 ? filteredActivities.map((activity) => (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     key={activity.id} 
                     className="flex flex-col p-3.5 bg-[#1f222e]/50 rounded-xl border border-gray-700/30 hover:border-cyan-500/30 hover:bg-[#1f222e] transition-all duration-200 cursor-pointer group"
                     onClick={() => openActionModal('Execution Details', `Trace ID: TX-${activity.id}\nAction: ${activity.action}\nActor: ${activity.user}\nTimestamp: ${activity.time}`)}
                   >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-2 h-2 rounded-full ${activity.status === 'Success' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(0,255,255,0.8)]' : 'bg-yellow-500 animate-pulse'}`}></div>
                          <p className="text-sm font-semibold text-gray-200 truncate max-w-[140px] group-hover:text-cyan-400 transition">{activity.action}</p>
                        </div>
                        <p className="text-[10px] font-medium text-gray-500">{activity.time}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium pl-4.5 ml-4">Source: {activity.user}</p>
                   </motion.div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    <p className="text-sm font-medium">No logs found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}} />
    </div>
  );
}

export default App;