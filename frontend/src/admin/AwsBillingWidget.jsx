import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CloudRain, BellRing, DollarSign, Info, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';

const AwsBillingWidget = () => {
  const [billingData, setBillingData] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Naye states timer ke liye
  const [nextFetchTime, setNextFetchTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const [alertEmail, setAlertEmail] = useState(() => localStorage.getItem('dealit_aws_email') || '');
  const [alertLimit, setAlertLimit] = useState(() => localStorage.getItem('dealit_aws_limit') || '0.50'); 
  const [settingBudget, setSettingBudget] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  // Real-time Timer Logic
  useEffect(() => {
    if (!nextFetchTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = nextFetchTime - now;

      if (diff <= 0) {
        setTimeLeft("Updating soon...");
        // Auto-refresh data when timer hits 0
        fetchBillingData(); 
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextFetchTime]);

  const fetchBillingData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/aws-billing`, {
        withCredentials: true 
      });
      if (response.data.success) {
        setBillingData(response.data.data.dailyCosts);
        setTotalCost(response.data.data.totalCost);
        setNextFetchTime(response.data.data.nextFetchTime); // Backend se time set karo
      }
    } catch (error) {
      toast.error('Failed to load AWS billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (!alertEmail) return toast.error('Please enter an email');
    if (!alertLimit || isNaN(alertLimit) || Number(alertLimit) <= 0) {
      return toast.error('Please enter a valid dollar amount');
    }
    
    setSettingBudget(true);
    try {
      const response = await axios.post(`${API_BASE}/api/admin/aws-budget`, { 
        email: alertEmail,
        budgetLimit: alertLimit 
      }, {
        withCredentials: true
      });
      if (response.data.success) {
        toast.success(`Alert set at $${alertLimit} successfully! 🛡️`);
        localStorage.setItem('dealit_aws_email', alertEmail);
        localStorage.setItem('dealit_aws_limit', alertLimit);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set budget alert');
    } finally {
      setSettingBudget(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            <p className="text-sm font-bold text-white">${payload[0].value.toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl md:rounded-3xl mt-6">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-3 animate-pulse">Fetching AWS Data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/5 shadow-lg backdrop-blur-md flex flex-col mt-6 md:mt-8 relative z-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shrink-0 hidden sm:block">
            <CloudRain className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                AWS Cost Explorer
              </h3>
              {/* LIVE TIMER UI */}
              {timeLeft && (
                <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-inner">
                  <Clock className="w-3 h-3" />
                  Next sync: {timeLeft}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">Current Month Total Spend</p>
            <h4 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mt-1">
              ${totalCost.toFixed(2)}
            </h4>
          </div>
        </div>

        <div className="flex flex-col w-full lg:w-auto gap-1.5">
          <form onSubmit={handleSetBudget} className="flex flex-col sm:flex-row w-full gap-2">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1 lg:w-48">
                 <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="Alert Email"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all shadow-inner"
                />
              </div>
              <div className="relative w-24 sm:w-32 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={alertLimit}
                  onChange={(e) => setAlertLimit(e.target.value)}
                  placeholder="Limit"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 transition-all shadow-inner"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={settingBudget}
              className="bg-cyan-500/10 hover:bg-cyan-500 hover:text-white text-cyan-400 border border-cyan-500/30 transition-all px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-50 shrink-0"
            >
              {settingBudget ? 'Setting...' : <><BellRing className="w-4 h-4" /> <span>Set Alarm</span></>}
            </button>
          </form>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-medium px-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-500/70" /> 
            You will receive a warning email if monthly AWS costs exceed this limit.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] md:h-[250px] w-full mt-2">
        {billingData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={billingData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAwsCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(5)} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} dx={-5} width={45} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="amount" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorAwsCost)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs md:text-sm">No spend data found for this month</div>
        )}
      </div>
    </div>
  );
};

export default AwsBillingWidget;