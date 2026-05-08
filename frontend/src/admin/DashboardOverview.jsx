// DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Package, ShoppingBag, IndianRupee, TrendingUp, Activity, CheckCircle, AlertCircle, Tag, RefreshCw, Zap, TrendingDown, Info, Rocket, ServerCrash } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#34d399', '#c084fc', '#60a5fa', '#fbbf24', '#f43f5e', '#0ea5e9'];
const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';

// --- Time Formatting Helper Function ---
const timeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return `1 day ago`;
  return `${days} days ago`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-2 md:mb-3">{label}</p>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <p className="text-xs md:text-sm font-bold text-white">₹{(payload[0]?.value || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
            <p className="text-xs md:text-sm font-bold text-white">{payload[1]?.value || 0} Swaps</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const DashboardOverview = ({ data }) => {
  // Dynamic System Health State
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', percent: '...' });

  // Fetch Live System Health
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
        if (isMounted && response.data.success) {
          setSystemHealth({ status: 'online', percent: '100%' });
        }
      } catch (error) {
        if (isMounted) {
          setSystemHealth({ status: 'offline', percent: '0%' });
          console.error("System health check failed:", error.message);
        }
      }
    };

    checkHealth();
    // Auto-refresh health every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data || !data.users) return null;

  const { 
    users, 
    items, 
    orders, 
    revenue, 
    financials,
    recentUsers, 
    performanceData = [], 
    categoryData = [],    
    recentActivity = []   
  } = data;
  
  const calcPercent = (part, total) => total > 0 ? Math.round((part / total) * 100) : 0;

  // --- CHANGED: Removed the sorting logic from frontend since backend handles it now ---

  // --- SHIPROCKET SMART ADVISOR LOGIC ---
  const currentOrders = orders.currentMonth || 0;
  
  // Math Logic: 
  // Lite = ₹66 per order. Business = ₹199 + ₹59 per order.
  // Break-even: 29 orders. (29 * 66 = 1914) vs (199 + 29*59 = 1910). At 29, Business saves ₹4.
  const isBusinessProfitable = currentOrders >= 29;
  const isRefundEligible = currentOrders >= 100;

  let advisorState = {};
  if (isRefundEligible) {
    advisorState = {
      title: "Goal Reached: 100% Free Plan! 🎉",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />,
      message: `Aapne 100 orders cross kar liye hain! Aapko Shiprocket se ₹199 ka full refund mil jayega. Plan effectively FREE ho chuka hai.`,
      progress: 100,
      targetText: "Goal Completed"
    };
  } else if (isBusinessProfitable) {
    advisorState = {
      title: "Switch to Business Plan Now! 🚀",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/30",
      icon: <TrendingDown className="w-5 h-5 text-blue-400 mt-0.5" />,
      message: `Aapke orders 28 cross kar gaye hain. Ab Business Plan (₹199) lene par apki per-shipment cost ₹66 se ghat kar ₹59 ho jayegi, jo ki overall sasta padega.`,
      progress: (currentOrders / 100) * 100,
      targetText: `${100 - currentOrders} orders left for ₹199 Refund`
    };
  } else {
    advisorState = {
      title: "Stay on Lite (Free) Plan 🛡️",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
      icon: <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />,
      message: `Jab tak mahine ke orders 28 cross nahi karte, tab tak Lite plan par hi rehna profit mein hai (No fixed monthly fee).`,
      progress: (currentOrders / 29) * 100,
      targetText: `${29 - currentOrders} orders left to unlock Business Plan`
    };
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto admin-scroll relative">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 md:w-96 md:h-96 bg-emerald-600/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[-5%] w-56 h-56 md:w-80 md:h-80 bg-blue-600/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none"></div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 relative z-10">
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-900/40 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-emerald-500/20 shadow-[0_8px_32px_rgba(16,185,129,0.1)] group flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Net Income</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ₹{financials?.netIncome !== undefined ? financials.netIncome.toLocaleString('en-IN') : (revenue || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-2.5 md:p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <IndianRupee className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-3 border-t border-emerald-500/20 mt-auto">
            <div className="flex-1">
              <p className="text-[8px] md:text-[9px] text-emerald-400/70 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5" /> Gross
              </p>
              <p className="text-xs font-bold text-emerald-300">₹{financials?.totalRevenue ? financials.totalRevenue.toLocaleString('en-IN') : '0'}</p>
            </div>
            <div className="w-px h-6 bg-emerald-500/20"></div>
            <div className="flex-1">
              <p className="text-[8px] md:text-[9px] text-red-400/70 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <TrendingDown className="w-2.5 h-2.5" /> Refunds
              </p>
              <p className="text-xs font-bold text-red-300">₹{financials?.totalRefunds ? financials.totalRefunds.toLocaleString('en-IN') : '0'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg group hover:bg-white/[0.04] transition-all">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{users.total}</h3>
            </div>
            <div className="p-2.5 md:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium">
            <span className="text-blue-400 font-bold">{users.verified}</span> Verified Accounts
          </p>
        </div>

        <div className="bg-white/[0.02] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg group hover:bg-white/[0.04] transition-all">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Listed Items</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{items.total}</h3>
            </div>
            <div className="p-2.5 md:p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium">
            <span className="text-purple-400 font-bold">{items.active}</span> Active • <span className="text-yellow-400 font-bold">{items.pending}</span> Pending
          </p>
        </div>

        <div className="bg-white/[0.02] p-5 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg group hover:bg-white/[0.04] transition-all">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">{orders.total}</h3>
            </div>
            <div className="p-2.5 md:p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
              <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium">
            <span className="text-indigo-400 font-bold">{orders.delivered}</span> Delivered • <span className="text-orange-400 font-bold">{orders.pending}</span> Pending
          </p>
        </div>
      </div>

      {/* --- Middle Row: Area Chart + Category Donut Chart --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 relative z-10">
        
        {/* Main Area Chart */}
        <div className="lg:col-span-2 bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3 md:gap-4 shrink-0">
            <div>
              <h3 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-[#A388E1]" /> Platform Performance
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">Revenue and swap volumes over the last 7 days</p>
            </div>
            <div className="flex gap-3 md:gap-4 self-start sm:self-center">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]"></div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Swaps</span>
              </div>
            </div>
          </div>

          <div className="h-[200px] md:h-[280px] w-full flex-1">
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSwaps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-5} width={45} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dx={5} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
                  <Area yAxisId="right" type="monotone" dataKey="swaps" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorSwaps)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs md:text-sm">Not enough data to display chart</div>
            )}
          </div>
        </div>

        {/* Category Distribution Donut Chart */}
        <div className="bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col">
          <div className="shrink-0">
            <h3 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2 mb-1.5 md:mb-2">
              <Tag className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Category Breakdown
            </h3>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-4 md:mb-6">Distribution of active listings</p>
          </div>
          
          <div className="flex-1 min-h-[180px] md:min-h-[200px] relative">
            {/* --- CHANGED: Using categoryData back directly from props --- */}
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs md:text-sm">No active items</div>
            )}
            
            {/* Center Text inside Donut */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xl md:text-2xl font-black text-white">{items.active}</span>
                 <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Active</span>
              </div>
            )}
          </div>
          
          {/* Category Legend */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-4 overflow-y-auto max-h-32 admin-scroll shrink-0">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 truncate pr-1">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] md:text-xs font-bold text-gray-400 truncate" title={`${item.name} (${item.value})`}>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- Bottom Grid: Progress Bars + Live Activity + Recent Users --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
        
        {/* 1. System Health / Progress Bars */}
        <div className="bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-lg font-black text-white mb-5 md:mb-6 flex items-center gap-2 tracking-tight">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" /> System Metrics
            </h3>
            
            <div className="space-y-5 md:space-y-6">
              
              {/* SMART SHIPROCKET ADVISOR - REPLACES SIMPLE PROGRESS BAR */}
              <div className="p-4 md:p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-4 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-[#A388E1]" />
                    <span className="text-gray-200 font-bold text-[10px] md:text-xs uppercase tracking-widest">Shiprocket Advisor</span>
                  </div>
                  <span className="text-white text-[9px] md:text-[10px] font-bold bg-white/10 px-2 py-1 rounded-md border border-white/10 shadow-inner">
                    {currentOrders} Orders
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  {advisorState.icon}
                  <div className="flex-1">
                    <p className={`${advisorState.color} text-sm md:text-base font-black mb-1 tracking-tight`}>
                      {advisorState.title}
                    </p>
                    <p className="text-gray-400 text-[10px] md:text-xs leading-relaxed mb-3">
                      {advisorState.message}
                    </p>
                    
                    {/* Math Explaination Tooltip/Box */}
                    {!isBusinessProfitable && (
                      <div className="bg-black/30 border border-white/5 rounded-md p-2 mb-3 text-[9px] text-gray-500 font-mono">
                        💡 Math: At 29 orders, savings (29 * ₹7) = ₹203. This covers the ₹199 monthly fee!
                      </div>
                    )}

                    {/* Progress Bar inside Advisor */}
                    <div className="w-full bg-black/40 rounded-full h-1.5 md:h-2 shadow-inner border border-white/5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isRefundEligible ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                          isBusinessProfitable ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' :
                          'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                        }`}
                        style={{ width: `${Math.min(advisorState.progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-right mt-1 font-bold text-gray-500">{advisorState.targetText}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1.5 md:mb-2">
                  <span className="text-gray-400 uppercase tracking-widest">Delivery Success</span>
                  <span className="text-indigo-400">{calcPercent(orders.delivered, orders.total)}%</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 md:h-3 border border-white/5 shadow-inner">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${calcPercent(orders.delivered, orders.total)}%` }}></div>
                </div>
              </div>

            </div>
          </div>
          
          {/* Status Chips with DYNAMIC Health */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-6 md:mt-8 pt-5 md:pt-6 border-t border-white/5">
            <div className="bg-yellow-500/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-yellow-500/10 text-center">
              <p className="text-[8px] md:text-[9px] text-yellow-500/80 font-bold uppercase tracking-widest mb-1">Pending Items</p>
              <div className="flex items-center justify-center gap-1.5 md:gap-2 text-yellow-400 font-black text-lg md:text-xl tracking-tight">
                <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> {items.pending}
              </div>
            </div>
            
            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border text-center transition-colors ${
              systemHealth.status === 'checking' ? 'bg-gray-500/5 border-gray-500/10' :
              systemHealth.status === 'online' ? 'bg-emerald-500/5 border-emerald-500/10' : 
              'bg-red-500/5 border-red-500/10'
            }`}>
              <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-1 ${
                systemHealth.status === 'checking' ? 'text-gray-500/80' :
                systemHealth.status === 'online' ? 'text-emerald-500/80' : 'text-red-500/80'
              }`}>System Health</p>
              
              <div className={`flex items-center justify-center gap-1.5 md:gap-2 font-black text-lg md:text-xl tracking-tight ${
                systemHealth.status === 'checking' ? 'text-gray-400' :
                systemHealth.status === 'online' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {systemHealth.status === 'checking' ? <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> :
                 systemHealth.status === 'online' ? <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> : 
                 <ServerCrash className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                {systemHealth.percent}
              </div>
            </div>
            
          </div>
        </div>

        {/* 2. DYNAMIC: Live Activity Feed */}
        <div className="bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col h-[320px] md:h-[400px]">
          <h3 className="text-base md:text-lg font-black text-white mb-4 md:mb-6 tracking-tight flex items-center justify-between shrink-0">
            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-pink-400" /> Live Activity</span>
            {recentActivity.length > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
            )}
          </h3>
          <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto admin-scroll pr-1 md:pr-2">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border ${activity.bg} shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02]`}>
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${activity.color}`}>{activity.action}</p>
                    <span className="text-[8px] md:text-[9px] text-gray-500 font-bold whitespace-nowrap">{timeAgo(activity.time)}</span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-gray-200 truncate">{activity.item}</p>
                </div>
              ))
            ) : (
              <p className="text-xs md:text-sm text-gray-500 text-center py-4">No recent activity yet.</p>
            )}
          </div>
        </div>

        {/* 3. Recent Signups Feed */}
        <div className="bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col h-[320px] md:h-[400px]">
          <h3 className="text-base md:text-lg font-black text-white mb-4 md:mb-6 tracking-tight flex items-center gap-2 shrink-0">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Recent Users
          </h3>
          <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto admin-scroll pr-1 md:pr-2">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 bg-black/20 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors shadow-inner">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="User" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs md:text-sm font-bold text-gray-200 truncate">{u.full_name}</p>
                    <p className="text-[9px] md:text-[10px] text-gray-500 truncate uppercase tracking-wider">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs md:text-sm text-gray-500 text-center py-4">No recent users found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;