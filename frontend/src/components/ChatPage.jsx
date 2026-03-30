import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Send, User, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const ChatPage = ({ user }) => {
  const { barterId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  if (!user) return <Navigate to="/login" />;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API_URL}/messages/${barterId}`, {
          withCredentials: true
        });
        setMessages(response.data.data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Not authorized or request not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [barterId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await axios.post(
        `${API_URL}/messages`,
        {
          barterRequestId: barterId,
          content: newMessage
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, response.data.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString([], options);
  };

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl inline-block">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Cannot Access Chat</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <Link to="/swaps" className="bg-gray-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-700 transition">
            Back to Swaps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[85vh] flex flex-col">
      <div className="bg-gray-800 border border-gray-700 rounded-t-3xl p-4 flex items-center gap-4 shadow-lg z-10">
        <Link to="/swaps" className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">Trade Discussion</h1>
          <p className="text-xs text-gray-400 font-mono">ID: {barterId.substring(0, 8)}</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border-x border-gray-700 overflow-y-auto p-4 space-y-4 shadow-inner">
        {loading ? (
          <div className="text-center text-emerald-400 mt-10 animate-pulse font-medium">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <User className="w-12 h-12 mb-3 opacity-20" />
            <p>No messages yet.</p>
            <p className="text-sm">Say hi to start the negotiation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender._id === user._id || msg.sender._id === user.id;
            
            return (
              <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mb-1">
                      <span className="text-xs font-bold text-gray-400">
                        {msg.sender.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className={`px-5 py-3 rounded-2xl ${
                    isMe 
                      ? 'bg-emerald-500 text-white rounded-br-sm shadow-lg shadow-emerald-500/20' 
                      : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm shadow-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-10">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-b-3xl p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-full pl-6 pr-14 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`absolute right-2 top-1.5 p-2 rounded-full transition flex items-center justify-center ${
              !newMessage.trim() || sending 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;