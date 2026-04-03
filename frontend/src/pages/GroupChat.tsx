import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Send, Hash, LogOut, Settings, CheckCircle2, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import api from '../lib/api';

const GroupChat = () => {
    const { user } = useAuth();
    const { id: urlRoomId } = useParams();
    const navigate = useNavigate();
    
    // State
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoomId, setActiveRoomId] = useState(urlRoomId || '');
    const [historyLoading, setHistoryLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageRequests, setManageRequests] = useState<any[]>([]);

    // Refs
    const socketRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Effects
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            setSocketConnected(true);
            console.log('Group socket connected');
            // Using a closure-safe way to get the latest activeRoomId if needed, 
            // but the re-join effect below handles it best.
        });

        socketRef.current.on('disconnect', () => {
            setSocketConnected(false);
            console.log('Group socket disconnected');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Re-join when room changes or connection restores
    useEffect(() => {
        if (socketRef.current?.connected && activeRoomId) {
            console.log('Joining room:', activeRoomId);
            socketRef.current.emit('join_room', activeRoomId);
            fetchHistory(activeRoomId);
        }
    }, [activeRoomId, socketConnected]);

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/chat/groups');
            const myRooms = data.filter((r: any) =>
                r.members.some((m: any) => m.toString() === user._id.toString() || m === user._id)
            );
            setRooms(myRooms);
            
            // If we have no activeRoomId yet, or the one we have isn't in our joined rooms
            if (!activeRoomId && myRooms.length > 0) {
                setActiveRoomId(myRooms[0]._id);
                navigate(`/groups/${myRooms[0]._id}`, { replace: true });
            }
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        }
    };

    const fetchHistory = async (roomId: string) => {
        if (!roomId) return;
        setHistoryLoading(true);
        try {
            const { data } = await api.get(`/messages/${roomId}`);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (urlRoomId) {
            setActiveRoomId(urlRoomId);
        }
    }, [urlRoomId]);

    // Handle incoming messages
    useEffect(() => {
        if (!socketRef.current) return;

        const handleReceiveMessage = (data: any) => {
            console.log('Received message event:', data);
            if (data.room === activeRoomId) {
                setMessages((prev) => {
                    const exists = prev.some(m => m._id === data._id);
                    if (exists) return prev;
                    return [...prev, data];
                });
            }
        };

        socketRef.current.on('receive_message', handleReceiveMessage);

        return () => {
            if (socketRef.current) {
                socketRef.current.off('receive_message', handleReceiveMessage);
            }
        };
    }, [activeRoomId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim() || !activeRoomId || !socketRef.current?.connected) {
            console.error('[CHAT] Cannot send message:', { 
                hasContent: !!message.trim(), 
                roomId: activeRoomId, 
                socketConnected: socketRef.current?.connected 
            });
            return;
        }

        const messageData = {
            room: activeRoomId,
            senderId: user._id,
            sender: {
                _id: user._id,
                name: user.name,
                profilePhoto: user.profilePhoto
            },
            content: message,
            isGroup: true,
            createdAt: new Date().toISOString(),
        };

        console.log('[CHAT] Emitting send_message:', messageData);
        socketRef.current.emit('send_message', messageData);
        // Optimistic update
        setMessages((prev) => [...prev, messageData]);
        setMessage('');
    };

    const activeRoomData = rooms.find(r => r._id === activeRoomId);
    const isAdmin = activeRoomData?.admin?.toString() === user._id?.toString();

    const fetchManageRequests = async (groupId: string) => {
        try {
            const { data } = await api.get(`/chat/groups/${groupId}/requests`);
            setManageRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
        }
    };

    const handleRequestDecision = async (requestId: string, status: string) => {
        try {
            await api.put(`/chat/groups/requests/${requestId}/decision`, { status });
            if (activeRoomData) {
                fetchManageRequests(activeRoomData._id);
                fetchRooms(); 
            }
        } catch (error) {
            console.error('Decision failed', error);
        }
    };

    const handleLeaveRoom = async () => {
        if (!activeRoomData) return;
        if (!confirm('Are you sure you want to leave this room? If you are the last member, it will be deleted.')) return;
        try {
            await api.post(`/chat/groups/${activeRoomData._id}/leave`);
            setActiveRoomId('');
            navigate('/groups');
        } catch (error) {
            console.error('Failed to leave room', error);
        }
    };

    useEffect(() => {
        if (isManageOpen && activeRoomData && isAdmin) {
            fetchManageRequests(activeRoomData._id);
        }
    }, [isManageOpen, activeRoomData, isAdmin]);

    return (
        <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] md:m-4 bg-[#0a0a0c] text-white overflow-hidden md:rounded-[2.5rem] border border-white/5">
            {/* Rooms Sidebar */}
            <aside className="w-16 sm:w-48 md:w-72 border-r border-white/5 bg-white/[0.02] p-3 md:p-6 flex flex-col">
                <h2 className="hidden md:block text-xl font-black mb-4 md:mb-8 px-2">Joined Hubs</h2>
                <div className="space-y-1 md:space-y-2 overflow-y-auto custom-scrollbar">
                    {rooms.length === 0 ? (
                      <p className="hidden md:block text-[10px] text-gray-600 uppercase tracking-widest px-2">No joined hubs yet</p>
                    ) : (
                      rooms.map((room) => (
                          <button
                              key={room._id}
                              onClick={() => {
                                  navigate(`/groups/${room._id}`);
                              }}
                              className={`w-full flex items-center space-x-0 md:space-x-3 px-2 md:px-4 py-2 md:py-3 rounded-2xl transition-all ${activeRoomId === room._id
                                      ? 'bg-gradient-to-r from-blue-600/20 to-pink-600/20 text-white border border-white/10'
                                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                                  }`}
                          >
                              <Hash className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium text-sm hidden sm:block ml-3 truncate">{room.name}</span>
                          </button>
                      ))
                    )}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col">
                <header className="p-6 border-b border-white/5 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center relative">
                            <Hash className="w-5 h-5 text-pink-500" />
                            {/* Connection Status Dot */}
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0c] ${socketConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title={socketConnected ? 'Connected' : 'Disconnected'} />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-bold">{activeRoomData?.name || 'Loading...'}</h3>
                                {!socketConnected && <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Offline</span>}
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                {activeRoomData?.description || 'Active Campus Discussion'}
                            </p>
                        </div>
                    </div>

                    {activeRoomData && (
                        <div className="flex items-center space-x-3">
                            {isAdmin && (
                                <button
                                    onClick={() => setIsManageOpen(!isManageOpen)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center ${isManageOpen ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage
                                </button>
                            )}
                            <button
                                onClick={handleLeaveRoom}
                                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave
                            </button>
                        </div>
                    )}
                </header>

                {isManageOpen && isAdmin && (
                    <div className="p-6 border-b border-white/5 bg-black/40 shadow-inner z-0 animate-in slide-in-from-top-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">Pending Join Requests</h4>
                        {manageRequests.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No pending requests.</p>
                        ) : (
                            <div className="space-y-3">
                                {manageRequests.map(req => (
                                    <div key={req._id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                                {req.requester.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{req.requester.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{req.requester.branch} • {req.requester.year}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleRequestDecision(req._id, 'approved')}
                                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleRequestDecision(req._id, 'rejected')}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {!activeRoomId ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center px-4">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest mb-2 text-xs">No Room Selected</p>
                        <p className="text-sm italic">Join a hub or select one from the sidebar to start chatting!</p>
                      </div>
                    ) : historyLoading ? (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">
                          <Loader2 className="w-8 h-8 animate-spin mr-3" />
                          Loading conversation...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">No messages yet. Break the ice!</div>
                    ) : (
                      messages.map((msg, i) => {
                        const senderId = msg.sender?._id || msg.senderId || msg.sender;
                        const isOwn = senderId === user._id;
                        const senderName = msg.sender?.name || (isOwn ? 'You' : 'Anonymous');
                        
                        return (
                            <div key={msg._id || i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                <p className="text-[10px] text-gray-600 mb-1 px-2 font-bold uppercase tracking-widest">{isOwn ? 'You' : senderName}</p>
                                <div className={`max-w-[75%] p-4 rounded-3xl shadow-xl ${isOwn
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                    }`}>
                                    <p className="text-sm font-light leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        );
                      })
                    )}
                    <div ref={scrollRef} />
                </div>

                <footer className="p-6 bg-[#0a0a0c]">
                    <div className="relative">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={!activeRoomId}
                            placeholder={activeRoomId ? `Message #${activeRoomData?.name || '...'}` : "Join a hub to chat"}
                            className="bg-white/5 border-white/10 h-14 pl-6 pr-16 rounded-2xl focus:ring-pink-500/20"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!activeRoomId || !message.trim()}
                            className="absolute right-2 top-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

// End of file cleanup
export default GroupChat;

