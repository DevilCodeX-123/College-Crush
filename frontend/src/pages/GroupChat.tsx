import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Send, Hash, LogOut, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import api from '../lib/api';

const socket = io(SOCKET_URL);

const GroupChat = () => {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [activeRoom, setActiveRoom] = useState('');
    const [historyLoading, setHistoryLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [isManageOpen, setIsManageOpen] = useState(false);
    const [manageRequests, setManageRequests] = useState<any[]>([]);

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/chat/groups');
            const myRooms = data.filter((r: any) =>
                r.members.some((m: any) => m.toString() === user._id.toString() || m === user._id)
            );
            setRooms(myRooms);
            if (myRooms.length > 0 && (!activeRoom || !myRooms.find((r: any) => r.name === activeRoom))) {
                setActiveRoom(myRooms[0].name);
            } else if (myRooms.length === 0) {
                setActiveRoom('');
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
        if (activeRoom) {
            socket.emit('join_room', activeRoom);
            fetchHistory(activeRoom);
        }

        socket.on('receive_message', (data) => {
            if (data.room === activeRoom) {
                setMessages((prev) => [...prev, data]);
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, [activeRoom]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim()) return;

        const messageData = {
            room: activeRoom,
            sender: user.name,
            content: message,
            senderId: user._id,
            isGroup: true,
            timestamp: new Date().toLocaleTimeString(),
        };

        socket.emit('send_message', messageData);
        setMessages((prev) => [...prev, messageData]);
        setMessage('');
    };

    const activeRoomData = rooms.find(r => r.name === activeRoom);
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
                fetchRooms(); // To reflect new members if accepted
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
            fetchRooms(); // refresh list
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
                <h2 className="hidden md:block text-xl font-black mb-4 md:mb-8 px-2">Channels</h2>
                <div className="space-y-1 md:space-y-2">
                    {rooms.map((room) => (
                        <button
                            key={room._id}
                            onClick={() => {
                                setActiveRoom(room.name);
                                setMessages([]);
                            }}
                            className={`w-full flex items-center space-x-0 md:space-x-3 px-2 md:px-4 py-2 md:py-3 rounded-2xl transition-all ${activeRoom === room.name
                                    ? 'bg-gradient-to-r from-blue-600/20 to-pink-600/20 text-white border border-white/10'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Hash className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium text-sm hidden sm:block ml-3 truncate">{room.name}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col">
                <header className="p-6 border-b border-white/5 flex items-center justify-between shadow-md z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <h3 className="font-bold">{activeRoom}</h3>
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
                    {historyLoading ? (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">Loading conversation...</div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">No messages yet. Break the ice!</div>
                    ) : messages.map((msg, i) => {
                        const isOwn = (msg.senderId || msg.sender?._id) === user._id;
                        const senderName = msg.sender?.name || msg.sender;
                        return (
                            <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                <p className="text-[10px] text-gray-600 mb-1 px-2 font-bold uppercase tracking-widest">{isOwn ? 'You' : senderName}</p>
                                <div className={`max-w-[75%] p-4 rounded-3xl shadow-xl ${isOwn
                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                    }`}>
                                    <p className="text-sm font-light leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>

                <footer className="p-6 bg-[#0a0a0c]">
                    <div className="relative">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder={`Message #${activeRoom}`}
                            className="bg-white/5 border-white/10 h-14 pl-6 pr-16 rounded-2xl focus:ring-pink-500/20"
                        />
                        <button
                            onClick={sendMessage}
                            className="absolute right-2 top-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default GroupChat;
