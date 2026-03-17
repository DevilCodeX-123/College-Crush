import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/ui/card';
import { Heart, Sparkles, User, ShieldCheck, MessageSquare, Send, X } from 'lucide-react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const socket = io(SOCKET_URL);

const Crushes = () => {
    const { user: currentUser } = useAuth();
    const [sent, setSent] = useState<any[]>([]);
    const [received, setReceived] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [messageInput, setMessageInput] = useState('');

    const queryClient = useQueryClient();
    const { data: messages, refetch: refetchMessages } = useQuery({
        queryKey: ['crush-messages', selectedMatch?.chatRoom],
        queryFn: async () => {
            if (!selectedMatch?.chatRoom) return [];
            const { data } = await api.get(`/messages/${selectedMatch.chatRoom}`);
            return data;
        },
        enabled: !!selectedMatch?.chatRoom,
        refetchInterval: 3000
    });

    const revealMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.put(`/crushes/${id}/reveal`);
        },
        onSuccess: () => {
            alert('Identity reveal request sent!');
            queryClient.invalidateQueries({ queryKey: ['crushes'] });
        }
    });

    useEffect(() => {
        if (selectedMatch?.chatRoom) {
            socket.emit('join_room', selectedMatch.chatRoom);
            
            socket.on('receive_message', (data) => {
                if (data.room === selectedMatch.chatRoom) {
                    refetchMessages();
                }
            });

            return () => {
                socket.off('receive_message');
            };
        }
    }, [selectedMatch?.chatRoom]);

    const handleSend = async () => {
        if (!messageInput.trim() || !selectedMatch?.chatRoom) return;
        
        const messageData = {
            room: selectedMatch.chatRoom,
            senderId: currentUser._id,
            content: messageInput,
            isGroup: false,
            timestamp: new Date().toLocaleTimeString()
        };

        try {
            socket.emit('send_message', messageData);
            setMessageInput('');
            // Optimistically update or just let the socket listener refetch
            refetchMessages();
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    useEffect(() => {
        const fetchCrushes = async () => {
            try {
                const { data } = await api.get('/crushes');
                setSent(data.sent);
                setReceived(data.received);
            } catch (error) {
                console.error('Error fetching crushes', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCrushes();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your crushes...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            <div>
                <h1 className="text-3xl font-black mb-2 flex items-center">
                    <Heart className="w-8 h-8 mr-3 text-pink-500 fill-pink-500" />
                    Crush Wall
                </h1>
                <p className="text-gray-500 font-light">Anonymous feelings, secret matches, and campus connections.</p>
            </div>

            <div className="grid grid-cols-2 gap-12">
                {/* Received Crushes */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center text-pink-400">
                        <Sparkles className="w-5 h-5 mr-2" /> Who Crushes on You?
                    </h2>
                    {received.length === 0 ? (
                        <Card className="border-white/10 bg-white/5 p-8 text-center rounded-[2rem]">
                            <p className="text-gray-500">No secret crushes yet. Be a little more active on campus! 😉</p>
                        </Card>
                    ) : received.map((crush) => (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            <Card className={`border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 hover:border-pink-500/30 transition-all ${crush.isMatch ? 'ring-2 ring-pink-500/50' : ''}`}>
                                <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-white/10 p-[1px]">
                                            <div className="w-full h-full rounded-[11px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                                {crush.sender.profilePhoto ? <img src={crush.sender.profilePhoto} className="w-full h-full object-cover rounded-lg" /> : <User className="w-5 h-5 text-gray-600" />}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{crush.sender.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{crush.revealedToReceiver && crush.revealedToSender ? 'Matched & Revealed' : (crush.isMatch ? 'It\'s a Match! ✨' : 'Secret Admirer')}</p>
                                        </div>
                                    </div>
                                    {(crush.isMatch || crush.chatRoom) && <ShieldCheck className="w-5 h-5 text-blue-400" />}
                                </CardHeader>
                                <p className="text-gray-300 font-light italic">"{crush.message}"</p>
                                {crush.chatRoom && (
                                    <button 
                                        onClick={() => setSelectedMatch(crush)}
                                        className="mt-4 w-full py-2 bg-gradient-to-r from-pink-600 to-blue-600 rounded-xl text-xs font-black uppercase tracking-tighter hover:scale-[1.02] transition-transform"
                                    >
                                        Open Secret Chat
                                    </button>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Sent Crushes */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center text-blue-400">
                        <Heart className="w-5 h-5 mr-2" /> Your Secret Crushes
                    </h2>
                    {sent.length === 0 ? (
                        <Card className="border-white/10 bg-white/5 p-8 text-center rounded-[2rem]">
                            <p className="text-gray-500">You haven't sent any anonymous crushes yet. Take a leap of faith!</p>
                        </Card>
                    ) : sent.map((crush) => (
                        <motion.div key={crush._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <Card className={`border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 hover:border-blue-500/30 transition-all ${crush.isMatch ? 'ring-2 ring-blue-500/50' : ''}`}>
                                <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-white/10 p-[1px]">
                                            <div className="w-full h-full rounded-[11px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                                {crush.receiver.profilePhoto ? <img src={crush.receiver.profilePhoto} className="w-full h-full object-cover shadow-2xl" alt="" /> : <User className="w-5 h-5 text-gray-600" />}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{crush.receiver.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{crush.revealedToReceiver && crush.revealedToSender ? 'Identities Revealed' : (crush.isMatch ? 'Matched!' : 'Sent Anonymously')}</p>
                                        </div>
                                    </div>
                                    {crush.chatRoom && (
                                        <button 
                                            onClick={() => setSelectedMatch(crush)}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 text-blue-400" />
                                        </button>
                                    )}
                                </CardHeader>
                                <p className="text-gray-300 font-light italic">"{crush.message}"</p>
                                {crush.chatRoom && (
                                    <button 
                                        onClick={() => setSelectedMatch(crush)}
                                        className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-xs font-black uppercase tracking-tighter hover:scale-[1.02] transition-transform"
                                    >
                                        Chat Secretly
                                    </button>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Private Chat Overlay */}
            <AnimatePresence>
                {selectedMatch && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-end p-8 pointer-events-none"
                    >
                        <motion.div 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="w-[450px] h-full bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl flex flex-col pointer-events-auto"
                        >
                            {/* Chat Header */}
                            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-blue-500 p-[1px]">
                                        <div className="w-full h-full rounded-[11px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                            {/* Logic: if fully revealed, show photo. Else show icon */}
                                            {selectedMatch.revealedToReceiver && selectedMatch.revealedToSender ? (
                                                <img 
                                                    src={selectedMatch.sender?._id === selectedMatch.receiver?._id ? selectedMatch.receiver?.profilePhoto : (selectedMatch.sender?.name === 'Anonymous Soul' ? selectedMatch.receiver?.profilePhoto : selectedMatch.sender?.profilePhoto)} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Sparkles className="w-6 h-6 text-pink-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black">
                                            {selectedMatch.revealedToReceiver && selectedMatch.revealedToSender ? 'Secret Match Unveiled' : 'Secret Chat'}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mt-1">
                                            {selectedMatch.revealedToReceiver && selectedMatch.revealedToSender ? 'Connection Established' : 'Shadow Whisper'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {/* Reveal Button Logic */}
                                    {(!(selectedMatch.revealedToReceiver && selectedMatch.revealedToSender)) && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => revealMutation.mutate(selectedMatch._id)}
                                            className="h-9 px-4 rounded-xl border-pink-500/50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Sparkles className="w-3 h-3 mr-2" />
                                            Reveal Name
                                        </Button>
                                    )}
                                    <button 
                                        onClick={() => setSelectedMatch(null)}
                                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </CardHeader>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide flex flex-col-reverse">
                                <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5 mt-auto">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black italic">What happens in Secret Chat stays here.</p>
                                </div>
                                {messages?.slice().reverse().map((msg: any) => {
                                    const isOwn = msg.sender?._id === currentUser?._id;
                                    const isRevealed = selectedMatch.revealedToReceiver && selectedMatch.revealedToSender;
                                    
                                    let displayName = "Anonymous Soul";
                                    if (isOwn) {
                                        displayName = "You";
                                    } else if (isRevealed) {
                                        displayName = msg.sender?.name;
                                    }

                                    return (
                                        <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                            <p className="text-[10px] text-gray-600 mb-1 px-2 font-bold uppercase tracking-widest">{displayName}</p>
                                            <div className={`max-w-[85%] p-4 ${isOwn ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'} rounded-3xl text-sm text-gray-100 shadow-xl`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chat Input */}
                            <div className="p-8 border-t border-white/5">
                                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-4">
                                    <Input 
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Whisper something..."
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-blue-500/20"
                                    />
                                    <Button 
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="h-14 w-14 rounded-2xl bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-500/20"
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Crushes;
