import React, { useState } from 'react';
import { 
  Shield, Users, Package, X, List, Image as ImageIcon, 
  Layers, Settings, IndianRupee, Truck, ChevronRight, LayoutDashboard, ChevronDown, ChevronUp,
  Bot // ADDED: Imported Bot icon for AI Logs
} from 'lucide-react';

const AdminSidebar = ({
  user,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  activeTab,
  setActiveTab,
  data,
  searchQuery,
  setData,
  setLoading,
  setCurrentPage,
  setSearchQuery,
  setDebouncedSearch
}) => {
  // Settings dropdown ko open/close karne ke liye state
  const [isSettingsOpen, setIsSettingsOpen] = useState(activeTab.startsWith('settings'));

  const navItems = [
    { id: 'overview', name: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'pending', name: 'Pending Approvals', icon: Package },
    { id: 'items', name: 'Manage Items', icon: List },
    { id: 'users', name: 'Manage Users', icon: Users },
    { id: 'orders', name: 'Deliveries & Swaps', icon: Truck },
    { id: 'offers', name: 'Offers / Banners', icon: ImageIcon },
    { id: 'categories', name: 'Categories', icon: Layers },
    { id: 'transactions', name: 'Transactions', icon: IndianRupee },
    { id: 'ai-logs', name: 'AI Training Logs', icon: Bot }, // ADDED: New tab for AI Logs
    { 
      id: 'settings', 
      name: 'System Settings', 
      icon: Settings,
      subItems: [
        { id: 'settings-credits', name: 'Credits & Bonus' },
        { id: 'settings-referrals', name: 'Refer & Earn' },
        { id: 'settings-shipping', name: 'Shipping Rules' },
        { id: 'settings-orders', name: 'Orders & Aura' },
      ]
    },
  ];

  const handleTabClick = (item) => {
    if (item.subItems) {
      setIsSettingsOpen(!isSettingsOpen);
      // Agar setting khol rahe hain aur koi sub-tab active nahi hai, toh pehle wale pe bhej do
      if (!activeTab.startsWith('settings')) {
        setActiveTab(item.subItems[0].id);
      }
      return;
    }

    setActiveTab(item.id);
    setData([]);
    setLoading(true);
    setCurrentPage(1);
    setSearchQuery('');
    setDebouncedSearch('');
    setIsMobileSidebarOpen(false); 
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 w-64 md:w-72 flex-shrink-0 border-r border-white/5 bg-[#0B0F19]/95 md:bg-white/[0.01] backdrop-blur-2xl flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] md:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-5 md:p-6 pb-6 md:pb-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Admin Portal</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mt-0.5">Premium Workspace</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 admin-scroll">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isParentActive = activeTab === item.id || (item.subItems && activeTab.startsWith('settings'));

            return (
              <div key={item.id}>
                <button
                  onClick={() => handleTabClick(item)}
                  className={`w-full flex items-center justify-between px-4 py-3 md:py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                    isParentActive && !item.subItems
                      ? 'bg-white/10 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/10' 
                      : isParentActive && item.subItems
                      ? 'bg-white/5 text-white border border-white/10'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-colors ${isParentActive ? (item.id === 'offers' ? 'text-[#A388E1]' : item.id === 'transactions' ? 'text-yellow-400' : item.id === 'orders' ? 'text-blue-400' : item.id === 'ai-logs' ? 'text-cyan-400' : 'text-emerald-400') : 'group-hover:text-white'}`} />
                    {item.name}
                  </div>
                  
                  {item.id === 'pending' && activeTab === 'pending' && Array.isArray(data) && data.length > 0 && !searchQuery && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] tracking-wider">
                      {data.length}
                    </span>
                  )}

                  {/* Handle arrows for nested menu */}
                  {item.subItems ? (
                    isSettingsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    !isParentActive && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity translate-x-[-10px] group-hover:translate-x-0 hidden md:block" />
                  )}
                </button>

                {/* Render Sub Items */}
                {item.subItems && isSettingsOpen && (
                  <div className="mt-1.5 ml-4 pl-4 border-l border-white/10 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setActiveTab(sub.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
                            isSubActive 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm' 
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {sub.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-5 md:p-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-xl bg-white/5 border border-white/10">
            <img src={user?.profilePic || `https://ui-avatars.com/api/?name=Admin&background=random`} alt="Admin" className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover border border-white/20" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;