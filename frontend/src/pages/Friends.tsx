import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MessageSquare, User, Heart, Sparkles, Search, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

// Socket initialized inside component with robust auth now

const FriendCard = ({ friend, selected, onSelect, onCrush, onRemove }: { friend: any, selected: boolean, onSelect: () => void, onCrush: () => void, onRemove: () => void }) => (
    <Card
        onClick={onSelect}
        className={`border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-3xl p-5 cursor-pointer transition-all group border-t-white/10 ${selected ? 'ring-2 ring-blue-500/50 bg-white/5' : ''}`}
    >
        <div className="flex items-center space-x-4">
            <div className="relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden ${friend.isRevealed ? 'bg-gradient-to-br from-blue-500/20 to-pink-500/20' : 'bg-gray-800'}`}>
                    {friend.photo ? <img src={friend.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-500" />}
                </div>
                {friend.status === 'Online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0a0a0c]"></div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-black tracking-tight text-sm truncate">{friend.name}</h3>
                    <span className={`text-[8px] uppercase tracking-widest font-black ${friend.isRevealed ? 'text-blue-500' : 'text-purple-500'}`}>{friend.matchType}</span>
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{friend.lastMessage}</p>
            </div>
            {!friend.isCrush && (
                <button
                    onClick={(e) => { e.stopPropagation(); onCrush(); }}
                    className="p-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Heart className="w-4 h-4 fill-pink-500" />
                </button>
            )}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-gray-600 transition-all opacity-0 group-hover:opacity-100"
                title="Disconnect from this match"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    </Card>
);

const Friends = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [crushModal, setCrushModal] = useState<{ isOpen: boolean, friendId: string }>({ isOpen: false, friendId: '' });
    const [crushMessage, setCrushMessage] = useState('');

    const { data: friends, isLoading } = useQuery({
        queryKey: ['friends'],
        queryFn: async () => {
            const { data } = await api.get('/chat/friends');
            return data;
        },
    });

    const { data: messages, refetch: refetchMessages } = useQuery({
        queryKey: ['messages', selectedFriend?.id],
        queryFn: async () => {
            if (!selectedFriend) return [];
            const { data } = await api.get(`/messages/${selectedFriend.id}`);
            return data;
        },
        enabled: !!selectedFriend
    });

    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token }
        });

        socketRef.current.on('connect', () => {
            setSocketConnected(true);
            if (selectedFriend?.id) {
                socketRef.current.emit('join_room', selectedFriend.id);
            }
        });

        socketRef.current.on('disconnect', () => {
            setSocketConnected(false);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (!socketRef.current) return;

        if (selectedFriend?.id) {
            socketRef.current.emit('join_room', selectedFriend.id);

            socketRef.current.on('receive_message', (data: any) => {
                if (data.room === selectedFriend.id) {
                    refetchMessages();
                }
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.off('receive_message');
                }
            };
        }
    }, [selectedFriend?.id, refetchMessages, socketConnected]);

    const handleSend = async () => {
        if (!message.trim() || !selectedFriend || !socketRef.current?.connected) return;

        const messageData = {
            room: selectedFriend.id,
            senderId: currentUser._id,
            content: message,
            isGroup: false,
            timestamp: new Date().toLocaleTimeString()
        };

        try {
            socketRef.current.emit('send_message', messageData);
            setMessage('');
            refetchMessages();
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    const crushFromFriendMutation = useMutation({
        mutationFn: async ({ message, receiverId }: { message: string, receiverId: string }) => {
            return api.post('/crushes', { message, receiverId });
        },
        onSuccess: () => {
            alert('Your secret crush message has been sent to your friend!');
            setCrushModal({ isOpen: false, friendId: '' });
            setCrushMessage('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to send crush message');
        }
    });

    const handleSendCrush = () => {
        if (!crushMessage.trim()) return;
        crushFromFriendMutation.mutate({
            message: crushMessage,
            receiverId: crushModal.friendId
        });
    };

    const removeFriendMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/chat/remove-friend/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            if (selectedFriend) setSelectedFriend(null);
        }
    });

    const handleRemoveFriend = (id: string) => {
        if (window.confirm('Are you sure you want to disconnect from this connection? All chats will be lost.')) {
            removeFriendMutation.mutate(id);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your inner circle...</div>;

    const filteredFriends = friends?.filter((f: any) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent)]"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 md:mb-4">Elite Circle</h1>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black opacity-60">Your revealed connections &amp; whispers</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Friends List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                placeholder="Search friends..."
                                className="w-full bg-white/5 border border-white/10 h-14 pl-12 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-8">
                            {/* Revealed Section */}
                            {filteredFriends?.some((f: any) => f.isRevealed) && (
                                <div className="space-y-4">
                                    <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-blue-500/60 px-2">Elite Connections</h2>
                                    <div className="space-y-3">
                                        {filteredFriends.filter((f: any) => f.isRevealed).map((friend: any) => (
                                            <FriendCard
                                                key={friend.friendshipId || friend.id}
                                                friend={friend}
                                                selected={selectedFriend?.id === friend.id}
                                                onSelect={() => setSelectedFriend(friend)}
                                                onCrush={() => setCrushModal({ isOpen: true, friendId: friend.id })}
                                                onRemove={() => handleRemoveFriend(friend.friendshipId || friend.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Anonymous Section */}
                            {filteredFriends?.some((f: any) => !f.isRevealed) && (
                                <div className="space-y-4">
                                    <h2 className="text-[10px] uppercase tracking-[0.4em] font-black text-purple-500/60 px-2">Shadow Matches</h2>
                                    <div className="space-y-3">
                                        {filteredFriends.filter((f: any) => !f.isRevealed).map((friend: any) => (
                                            <FriendCard
                                                key={friend.friendshipId || friend.id}
                                                friend={friend}
                                                selected={selectedFriend?.id === friend.id}
                                                onSelect={() => setSelectedFriend(friend)}
                                                onCrush={() => setCrushModal({ isOpen: true, friendId: friend.id })}
                                                onRemove={() => handleRemoveFriend(friend.friendshipId || friend.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredFriends?.length === 0 && (
                                <div className="text-center py-20 opacity-20">
                                    <p className="text-xs font-black uppercase tracking-widest">No connections found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-8">
                        {selectedFriend ? (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] h-auto min-h-[500px] lg:h-[700px] flex flex-col p-6 md:p-8 border-t-white/10 overflow-hidden">
                                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-white/10">
                                            {selectedFriend.photo ? <img src={selectedFriend.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-500" />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight">{selectedFriend.name}</h2>
                                            <p className="text-[10px] text-green-500 uppercase tracking-widest font-black leading-none mt-1">Chatting Now</p>
                                        </div>
                                    </div>
                                    <Sparkles className="w-6 h-6 text-blue-500 opacity-30" />
                                </div>

                                <div className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-hide">
                                    {messages?.length === 0 ? (
                                        <p className="text-center text-gray-600 text-sm italic py-20">Start your secret whisper here...</p>
                                    ) : messages?.map((msg: any) => {
                                        const isOwn = msg.sender?._id === currentUser?._id;
                                        const displayName = isOwn ? "You" : (selectedFriend.isRevealed ? selectedFriend.name : "Anonymous Soul");

                                        return (
                                            <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                <p className="text-[10px] text-gray-600 mb-1 px-2 font-bold uppercase tracking-widest">{displayName}</p>
                                                <div className={`max-w-[75%] p-4 rounded-3xl shadow-xl ${isOwn
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                                    }`}>
                                                    <p className="text-sm font-light leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center space-x-4">
                                    <input
                                        className="flex-1 bg-white/5 border border-white/10 h-14 px-6 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-sm"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button
                                        onClick={handleSend}
                                        className="h-14 w-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] h-[700px] flex flex-col items-center justify-center text-center p-12 border-t-white/10">
                                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10">
                                    <MessageSquare className="w-10 h-10 text-gray-700" />
                                </div>
                                <h2 className="text-3xl font-black mb-4 tracking-tighter">Your Secret Whisper</h2>
                                <p className="text-gray-500 max-w-sm font-light">Select a friend to continue your conversation. Remember, what happens in ClgCrush stays in ClgCrush.</p>

                                <div className="mt-12 grid grid-cols-2 gap-6 opacity-30">
                                    <Heart className="w-8 h-8 text-pink-500" />
                                    <Sparkles className="w-8 h-8 text-blue-500" />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Secret Crush Modal */}
                <AnimatePresence>
                    {crushModal.isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-md bg-[#111114] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-600 to-blue-600" />
                                <h2 className="text-3xl font-black mb-2 flex items-center">
                                    <Heart className="w-8 h-8 mr-3 text-pink-500 fill-pink-500" />
                                    Secret Crush
                                </h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8 italic">Start an anonymous whisper...</p>

                                <div className="space-y-6">
                                    <textarea
                                        value={crushMessage}
                                        onChange={(e) => setCrushMessage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:gray-700 text-white"
                                        placeholder="What's your secret message?..."
                                    />
                                    <div className="flex gap-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCrushModal({ isOpen: false, friendId: '' })}
                                            className="flex-1 h-14 rounded-2xl text-gray-500 font-bold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSendCrush}
                                            disabled={!crushMessage.trim() || crushFromFriendMutation.isPending}
                                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-black uppercase tracking-widest"
                                        >
                                            {crushFromFriendMutation.isPending ? 'Sending...' : 'Send'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Friends;
