import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Send, Users, Hash } from 'lucide-react';
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

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/chat/groups');
            setRooms(data);
            if (data.length > 0 && !activeRoom) {
                setActiveRoom(data[0].name);
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

    return (
        <div className="flex h-[calc(100vh-2rem)] m-4 bg-[#0a0a0c] text-white overflow-hidden rounded-[2.5rem] border border-white/5">
            {/* Rooms Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-white/[0.02] p-6 flex flex-col">
                <h2 className="text-xl font-black mb-8 px-2">Channels</h2>
                <div className="space-y-2">
                    {rooms.map((room) => (
                        <button
                            key={room._id}
                            onClick={() => {
                                setActiveRoom(room.name);
                                setMessages([]);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                                activeRoom === room.name 
                                ? 'bg-gradient-to-r from-blue-600/20 to-pink-600/20 text-white border border-white/10' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Hash className="w-4 h-4" />
                            <span className="font-medium text-sm">{room.name}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Chat Area */}
            <main className="flex-1 flex flex-col">
                <header className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <h3 className="font-bold">{activeRoom}</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                {rooms.find(r => r.name === activeRoom)?.description || 'Active Campus Discussion'}
                            </p>
                        </div>
                    </div>
                </header>

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
                                <div className={`max-w-[75%] p-4 rounded-3xl shadow-xl ${
                                    isOwn 
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
