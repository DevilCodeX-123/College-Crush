import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sparkles, Shield, Zap, UserCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const socket = io(SOCKET_URL);

const AnonymousChat = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [isMatching, setIsMatching] = useState(false);
    const [match, setMatch] = useState<any>(null);
    const [interests, setInterests] = useState<string[]>([]);
    const [newInterest, setNewInterest] = useState('');

    const [revealed, setRevealed] = useState(false);
    const [revealSuccess, setRevealSuccess] = useState(false);
    const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'sent' | 'received' | 'accepted'>('none');
    
    // Chat state
    const [messageInput, setMessageInput] = useState('');

    const startMatch = async () => {
        setIsMatching(true);
        setMatch(null);
        
        try {
            const { data } = await api.post('/chat/match', { interests });
            setMatch(data);
            setIsMatching(false);
        } catch (error) {
            console.error('Matching failed', error);
            setIsMatching(false);
            alert('No one is online right now. Try again in a bit! ✨');
        }
    };

    const { data: messages, refetch: refetchMessages } = useQuery({
        queryKey: ['messages', match?.matchId],
        queryFn: async () => {
            if (!match?.matchId) return [];
            const { data } = await api.get(`/messages/${match.matchId}`);
            return data;
        },
        enabled: !!match?.matchId
    });

    useEffect(() => {
        if (match?.matchId) {
            socket.emit('join_room', match.matchId);
            
            socket.on('receive_message', (data) => {
                if (data.room === match.matchId) {
                    refetchMessages();
                }
            });

            return () => {
                socket.emit('leave_room', match.matchId);
                socket.off('receive_message');
            };
        }
    }, [match?.matchId, refetchMessages]);

    const handleSend = async () => {
        if (!messageInput.trim() || !match?.matchId) return;
        
        const messageData = {
            room: match.matchId,
            senderId: currentUser._id,
            content: messageInput,
            isGroup: false,
            timestamp: new Date().toLocaleTimeString()
        };

        try {
            socket.emit('send_message', messageData);
            setMessageInput('');
            refetchMessages();
        } catch (error) {
            console.error('Send failed', error);
        }
    };


    const handleSendFriendRequest = async () => {
        if (!match?.matchId) return;
        try {
            await api.post(`/chat/friend-request/${match.matchId}`);
            setFriendRequestStatus('sent');
        } catch (error) {
            console.error('Friend request failed', error);
            alert('Could not send friend request. Try again.');
        }
    };

    const handleAcceptFriendRequest = async () => {
        if (!match?.matchId) return;
        try {
            const { data } = await api.post(`/chat/accept-friend/${match.matchId}`);
            setFriendRequestStatus('accepted');
            // If revealed logic is tied to friendship, update match data
            if (data.revealedToA && data.revealedToB) {
                setRevealSuccess(true);
                setMatch((prev: any) => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Accept friend failed', error);
        }
    };

    const handleRejectFriendRequest = async () => {
        if (!match?.matchId) return;
        try {
            await api.post(`/chat/reject-friend/${match.matchId}`);
            setFriendRequestStatus('none');
        } catch (error) {
            console.error('Reject friend failed', error);
        }
    };

    useEffect(() => {
        let interval: any;
        if (match?.matchId && friendRequestStatus !== 'accepted') {
            interval = setInterval(async () => {
                try {
                    const { data: m } = await api.get(`/chat/match/${match.matchId}`);
                    
                    // Update friend request status
                    if (m.status === 'friends') {
                        setFriendRequestStatus('accepted');
                    } else if (m.status === 'requesting_friendship') {
                        if (m.friendRequestSentBy === currentUser?._id) {
                            setFriendRequestStatus('sent');
                        } else {
                            setFriendRequestStatus('received');
                        }
                    } else {
                        setFriendRequestStatus('none');
                    }

                    // Update reveal status
                    const isUserA = m.userA?._id === currentUser?._id;
                    const imRevealed = isUserA ? m.revealedToA : m.revealedToB;

                    
                    setRevealed(imRevealed);
                    setRevealSuccess(m.revealedToA && m.revealedToB);

                    if (m.revealedToA && m.revealedToB) {
                        setMatch(m);
                    }
                } catch (e) {
                    console.error('Status check failed', e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [match?.matchId, friendRequestStatus, currentUser?._id]);

    const handleReveal = async () => {
        if (!match?.matchId) return;
        try {
            // First send a system message notify
            const systemMsg = {
                room: match.matchId,
                senderId: null, // System sender
                content: `${currentUser.name} has requested to reveal identities! 🕵️`,
                isGroup: false
            };
            socket.emit('send_message', systemMsg);

            const { data } = await api.put(`/chat/reveal/${match.matchId}`);
            setRevealed(true);
            if (data.revealedToA && data.revealedToB) {
                setRevealSuccess(true);
                setMatch((prev: any) => ({ ...prev, ...data }));
                
                // Success system message
                socket.emit('send_message', {
                    room: match.matchId,
                    senderId: null,
                    content: "Identity Mutual Revelation Successful! ✨ You can now connect in the Elite Circle.",
                    isGroup: false
                });
            }
            refetchMessages();
        } catch (error) {
            console.error('Reveal failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 relative overflow-hidden flex items-center justify-center">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-1000"></div>

             <div className="max-w-4xl w-full z-10 transition-all duration-700">
                <AnimatePresence mode="wait">
                    {!isMatching && !match ? (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto"
                        >
                            <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 text-center border-t-white/20 shadow-2xl">
                                <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-500/20 rotate-12">
                                    <Shield className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter mb-4">Shadow Match</h1>
                                <p className="text-gray-400 mb-12 font-light">Find your campus twin. No names, no faces. Just pure vibes until you both agree to reveal.</p>
                                
                                <div className="space-y-6 text-left mb-12">
                                    <label className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-500 ml-1">Your Interests</label>
                                    <div className="flex flex-wrap gap-3">
                                        {interests.map((it, i) => (
                                            <span key={i} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold flex items-center">
                                                {it}
                                                <button onClick={() => setInterests(interests.filter(x => x !== it))} className="ml-3 text-gray-600 hover:text-red-400">×</button>
                                            </span>
                                        ))}
                                        <div className="flex-1 min-w-[150px] relative">
                                            <Input 
                                                value={newInterest}
                                                onChange={(e) => setNewInterest(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (setInterests([...interests, newInterest]), setNewInterest(''))}
                                                placeholder="Add interest..."
                                                className="bg-transparent border-dashed border-white/20 rounded-xl h-10 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={startMatch}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 h-20 rounded-3xl font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Zap className="w-6 h-6 mr-3 fill-white" /> Start Anonymous Match
                                </Button>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-[85vh] flex flex-col"
                        >
                             <Card className="flex-1 border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] p-10 border-t-white/20 shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"></div>
                                
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-4xl font-black text-gray-700 shadow-inner overflow-hidden relative">
                                            {match ? '?' : (
                                                <motion.div 
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 bg-blue-500/10 flex items-center justify-center"
                                                >
                                                    <Sparkles className="w-8 h-8 text-blue-500/30" />
                                                </motion.div>
                                            )}
                                        </div>
                                        <div>
                                             <p className="text-3xl font-black tracking-tight">
                                                {!match ? 'Finding Match...' : (revealSuccess ? 
                                                    (( (match.userA?._id || match.userA)?.toString() === currentUser?._id?.toString() ? match.userB?.name : match.userA?.name) || 'Revealed Soul') 
                                                    : 'Anonymous Soul')}
                                            </p>
                                            <div className="flex items-center mt-2 space-x-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${match ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div> 
                                                    {match ? 'Active Jam' : 'Global Search Active'}
                                                </p>
                                                {match && match.commonInterests?.length > 0 && (
                                                    <>
                                                        <span className="text-gray-800 text-xs font-black">•</span>
                                                        <div className="flex gap-2">
                                                            {match.commonInterests.map((it: string) => (
                                                                <span key={it} className="text-[10px] py-1 px-3 bg-white/5 border border-white/5 rounded-full font-bold text-blue-400">{it}</span>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {match && (
                                        <div className="flex gap-4">
                                            <Button 
                                                onClick={() => setMatch(null)}
                                                className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-xl"
                                            >
                                                <Zap className="w-5 h-5 rotate-180" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Chat / Finding Area */}
                                <div className="flex-1 overflow-y-auto mb-8 pr-4 space-y-6 scrollbar-hide flex flex-col pt-4">
                                    <AnimatePresence mode="wait">
                                        {!match ? (
                                            <div className="h-full flex flex-col items-center justify-center space-y-8">
                                                <div className="relative">
                                                    <div className="w-32 h-32 border-4 border-dashed border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Sparkles className="w-12 h-12 text-blue-500 animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-center">
                                                    <p className="text-xl font-bold tracking-tight text-gray-300">Filtering the noise...</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Connecting you with the best vibe</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full space-y-6">
                                                {/* Action Bar at the TOP of messages */}
                                                <div className="mb-6 space-y-4 px-2">
                                                    <AnimatePresence mode="popLayout">
                                                        {friendRequestStatus === 'received' && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, scale: 0.9, y: -20 }} 
                                                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                                                className="flex flex-col items-center py-6 space-y-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent animate-pulse"></div>
                                                                <div className="text-center relative z-10 px-6">
                                                                    <p className="text-[10px] text-purple-300 font-black uppercase tracking-[0.3em] mb-1">Destiny Calling! ✨</p>
                                                                    <p className="text-sm font-black text-white leading-tight">They want to join your Elite Circle</p>
                                                                </div>
                                                                <div className="flex gap-3 w-full px-6 relative z-10">
                                                                    <Button 
                                                                        onClick={handleAcceptFriendRequest} 
                                                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl h-10 font-black uppercase tracking-widest text-[9px]"
                                                                    >Accept</Button>
                                                                    <Button 
                                                                        onClick={handleRejectFriendRequest} 
                                                                        className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl h-10 font-black uppercase tracking-widest text-[9px] border border-white/5 text-gray-400"
                                                                    >Decline</Button>
                                                                </div>
                                                            </motion.div>
                                                        )}

                                                        {!revealed && (
                                                            <motion.div 
                                                                key="reveal-button"
                                                                initial={{ opacity: 0, y: -10 }} 
                                                                animate={{ opacity: 1, y: 0 }} 
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                            >
                                                                <Button 
                                                                    onClick={handleReveal}
                                                                    className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-[10px] font-black uppercase tracking-[0.2em] h-14 shadow-lg border border-white/10 group relative overflow-hidden"
                                                                >
                                                                    <Zap className="w-4 h-4 mr-3 fill-white animate-pulse" />
                                                                    Reveal My Name
                                                                </Button>
                                                            </motion.div>
                                                        )}

                                                        {!revealSuccess && revealed && (
                                                            <motion.div 
                                                                key="await-reveal"
                                                                initial={{ opacity: 0, scale: 0.9 }} 
                                                                animate={{ opacity: 1, scale: 1 }} 
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                className="w-full py-4 bg-white/5 border border-dashed border-white/10 rounded-2xl backdrop-blur-md text-center"
                                                            >
                                                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">
                                                                    { ( (match?.userA?._id === currentUser?._id && match?.revealedToB) || (match?.userB?._id === currentUser?._id && match?.revealedToA) ) 
                                                                        ? "THEY REVEALED! ✨ Reveal back to connect." 
                                                                        : "AWAITING MUTUAL REVEAL... 🔒"}
                                                                </p>
                                                            </motion.div>
                                                        )}

                                                        {revealSuccess && friendRequestStatus === 'none' && (
                                                            <motion.div 
                                                                key="add-friend"
                                                                initial={{ opacity: 0, scale: 0.9 }} 
                                                                animate={{ opacity: 1, scale: 1 }} 
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                className="flex flex-col items-center py-6 space-y-4 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-[2.5rem] border border-white/10 text-center"
                                                            >
                                                                <p className="text-sm font-black text-white">{(match.userA?._id === currentUser?._id ? match.userB?.name : match.userA?.name) || 'Identity'} Unlocked! ✨</p>
                                                                <Button 
                                                                    onClick={handleSendFriendRequest}
                                                                    className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] px-8 h-10"
                                                                >
                                                                    <Users className="w-4 h-4 mr-2" /> Add Friend
                                                                </Button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black italic">Anonymous whispers are active. Keep it wavy. ✨</p>
                                                </div>
                                                {messages?.map((msg: any) => {
                                                    const isSystem = !msg.sender;
                                                    const senderId = msg.sender?._id || msg.sender;
                                                    const isOwn = !isSystem && (senderId?.toString() === currentUser?._id?.toString());
                                                    
                                                    const userAID = match?.userA?._id || match?.userA;
                                                    const isUserA = userAID?.toString() === currentUser?._id?.toString();
                                                    const otherUser = isUserA ? match?.userB : match?.userA;
                                                    const otherUserName = otherUser?.name || "Anonymous Soul";
                                                    
                                                    const displayName = isOwn ? "You" : (revealSuccess ? (msg.sender?.name || otherUserName) : "Anonymous Soul");

                                                    if (isSystem) {
                                                        return (
                                                            <div key={msg._id} className="flex justify-center my-4">
                                                                <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                                                                    {msg.content}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div key={msg._id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                            <p className="text-[10px] text-gray-600 mb-1 px-2 font-bold uppercase tracking-widest">{displayName}</p>
                                                            <div className={`max-w-[85%] p-4 ${isOwn ? 'bg-gradient-to-br from-purple-600 to-blue-600 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'} rounded-3xl text-sm text-gray-100 shadow-xl`}>
                                                                <p className="leading-relaxed">{msg.content}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                 })}
                                             </div>
                                         )}
                                    </AnimatePresence>
                                </div>


                                {/* Footer */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-6">
                                        <Input 
                                            disabled={!match}
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder={match ? "Whisper anonymously..." : "Waiting for connection..."}
                                            className="bg-white/5 border-white/10 h-16 rounded-3xl focus:ring-purple-500/20 px-8 text-lg disabled:opacity-50"
                                        />
                                        <Button 
                                            disabled={!match}
                                            onClick={handleSend}
                                            className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20"
                                        >
                                            <Zap className={`w-6 h-6 fill-white ${!match ? 'animate-pulse' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                                
                                {friendRequestStatus === 'accepted' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-8 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 border border-green-500/20 p-8 rounded-[3rem] text-center backdrop-blur-xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-400"></div>
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                                <UserCheck className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xl font-black text-white uppercase tracking-tight">Elite Circle Connection Forged</p>
                                                <p className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em]">Destiny has found its match</p>
                                            </div>
                                            <Button 
                                                onClick={() => navigate('/friends')} 
                                                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all"
                                            >
                                                Enter Friends Hub
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                             </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
        </div>
    );
};

export default AnonymousChat;
