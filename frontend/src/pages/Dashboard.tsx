import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Award, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../lib/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [content, setContent] = React.useState('');
    const [crushModal, setCrushModal] = React.useState<{ isOpen: boolean, confessionId: string }>({ isOpen: false, confessionId: '' });
    const [crushMessage, setCrushMessage] = React.useState('');

    const themeMap: Record<string, any> = {
        male: {
            activeBtn: 'bg-blue-600/20 text-white border border-white/10',
            profileBorder: 'from-blue-500 to-white/10',
            icon: 'text-blue-500',
            accentBg: 'bg-blue-500/20',
            btnGradient: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
        },
        female: {
            activeBtn: 'bg-pink-600/20 text-white border border-white/10',
            profileBorder: 'from-pink-500 to-white/10',
            icon: 'text-pink-500',
            accentBg: 'bg-pink-500/20',
            btnGradient: 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600'
        },
        other: {
            activeBtn: 'bg-purple-600/20 text-white border border-white/10',
            profileBorder: 'from-purple-500 to-white/10',
            icon: 'text-purple-500',
            accentBg: 'bg-purple-500/20',
            btnGradient: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
        }
    };

    const theme = themeMap[user?.gender?.toLowerCase()] || themeMap.other;

    const { data: confessions, isLoading } = useQuery({
        queryKey: ['confessions'],
        queryFn: async () => {
            const { data } = await api.get('/confessions');
            return data;
        },
    });

    const { data: topUsersSide } = useQuery({
        queryKey: ['leaderboard-side'],
        queryFn: async () => {
            const { data } = await api.get('/users/leaderboard');
            return data.slice(0, 2);
        },
    });

    const mutation = useMutation({
        mutationFn: async (newConfession: { content: string }) => {
            const { data } = await api.post('/confessions', newConfession);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['confessions'] });
            setContent('');
        },
    });

    const reactMutation = useMutation({
        mutationFn: async ({ id, emoji }: { id: string, emoji: string }) => {
            const { data } = await api.post(`/confessions/${id}/react`, { emoji });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['confessions'] });
        },
    });

    const handlePost = () => {
        if (!content.trim()) return;
        mutation.mutate({ content });
    };

    const crushFromConfessionMutation = useMutation({
        mutationFn: async ({ message, receiverId }: { message: string, receiverId: string }) => {
            return api.post('/crushes', { message, receiverId });
        },
        onSuccess: () => {
            alert('Your secret crush message has been sent!');
            setCrushModal({ isOpen: false, confessionId: '' });
            setCrushMessage('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to send crush message');
        }
    });

    const handleSendCrush = () => {
        const confession = confessions?.find((c: any) => c._id === crushModal.confessionId);
        if (!confession || !crushMessage.trim()) return;
        
        if (!confession.author) {
            alert("This confession doesn't have an author to crush on (it might be an older post).");
            setCrushModal({ isOpen: false, confessionId: '' });
            return;
        }

        crushFromConfessionMutation.mutate({ 
            message: crushMessage, 
            receiverId: confession.author 
        });
    };

    return (
        <div className="flex-1 p-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                            placeholder="Search campus crushes..." 
                            className="pl-11 h-12 bg-white/5 border-white/5 rounded-2xl focus:ring-pink-500/20"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right mr-2">
                            <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Visit Count: {user?.visitCount || 0}</p>
                        </div>
                        <div 
                            onClick={() => navigate('/profile')}
                            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.profileBorder} p-[1px] cursor-pointer hover:scale-105 transition-transform`}
                        >
                            <div className="w-full h-full rounded-[15px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                {user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : <User className="w-6 h-6 text-gray-400" />}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-3 gap-8">
                    {/* Confession Post Box */}
                    <div className="col-span-2 space-y-8">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6">
                            <CardContent className="p-0">
                                <textarea 
                                    className="w-full bg-transparent border-0 focus:ring-0 text-lg placeholder:text-gray-600 resize-none h-24 text-white"
                                    placeholder="Share a campus confession anonymously..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                ></textarea>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                                    <div className="flex space-x-2">
                                        {['❤️', '😂', '🔥', '😲'].map(emoji => (
                                            <button 
                                                key={emoji} 
                                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center grayscale hover:grayscale-0"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                    <Button 
                                        onClick={handlePost}
                                        disabled={mutation.isPending}
                                        className={`bg-gradient-to-r ${theme.btnGradient} text-white rounded-xl px-8 shadow-lg shadow-black/20`}
                                    >
                                        {mutation.isPending ? 'Posting...' : 'Post Anonymously'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feed */}
                        <div className="space-y-6">
                            {isLoading ? (
                                <p className="text-center text-gray-500">Loading campus confessions...</p>
                            ) : confessions?.map((confession: any) => (
                                <motion.div
                                    key={confession._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 hover:border-white/20 transition-all">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Sparkles className="w-4 h-4 text-pink-500" />
                                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Anonymous Confession</span>
                                            <span className="text-[10px] text-gray-700">• {new Date(confession.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-xl font-light leading-relaxed text-gray-200">
                                            "{confession.content}"
                                        </p>
                                        <div className="mt-8 flex items-center space-x-4">
                                            <button 
                                                onClick={() => reactMutation.mutate({ id: confession._id, emoji: 'love' })}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 text-sm hover:bg-pink-500/20 transition-all"
                                            >
                                                <span>❤️ {confession.reactions.love}</span>
                                            </button>
                                            <button 
                                                onClick={() => reactMutation.mutate({ id: confession._id, emoji: 'fire' })}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm hover:bg-blue-500/20 transition-all"
                                            >
                                                <span>🔥 {confession.reactions.fire}</span>
                                            </button>
                                            <button 
                                                onClick={() => setCrushModal({ isOpen: true, confessionId: confession._id })}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600/20 to-blue-600/20 border border-white/10 text-white text-sm hover:border-white/20 transition-all ml-auto"
                                            >
                                                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                                                <span className="font-bold">Crush</span>
                                            </button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Widgets */}
                    <div className="space-y-8">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                                Campus Popularity
                            </h3>
                            <div className="space-y-4">
                                {topUsersSide?.map((top: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-xs font-black">#{i+1}</div>
                                            <span className="text-sm font-medium">{top.name}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 font-bold border border-blue-500/30`}>
                                            Elite
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className={`border-white/10 bg-gradient-to-br ${user?.gender === 'Male' ? 'from-blue-600/10 to-blue-400/5' : 'from-pink-600/10 to-pink-400/5'} backdrop-blur-xl rounded-[2rem] p-8 border-dashed border-2`}>
                             <div className="text-center">
                                <div className={`w-16 h-16 ${theme.accentBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                    <Heart className={`w-8 h-8 ${theme.icon}`} />
                                </div>
                                <h4 className="text-xl font-black mb-2">Secret Match?</h4>
                                <p className="text-sm text-gray-400 font-light mb-6">Send a crush message to find your campus match anonymously.</p>
                                <Button 
                                    onClick={() => navigate('/crushes')} 
                                    className="w-full bg-white text-black hover:bg-white/90 rounded-xl font-bold"
                                >
                                    Try Now
                                </Button>
                             </div>
                        </Card>
                    </div>
                </div>

                {/* Crush Modal */}
                <AnimatePresence>
                    {crushModal.isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-lg bg-[#111114] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-600 to-blue-600" />
                                <h2 className="text-3xl font-black mb-2 flex items-center">
                                    <Heart className="w-8 h-8 mr-3 text-pink-500 fill-pink-500" />
                                    Secret Crush
                                </h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8 italic">Say something sweet anonymously...</p>
                                
                                <div className="space-y-6">
                                    <div>
                                        <textarea 
                                            value={crushMessage}
                                            onChange={(e) => setCrushMessage(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:gray-700 text-white"
                                            placeholder="What's on your mind?..."
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setCrushModal({ isOpen: false, confessionId: '' })}
                                            className="flex-1 h-14 rounded-2xl text-gray-500 font-bold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={handleSendCrush}
                                            disabled={!crushMessage.trim() || crushFromConfessionMutation.isPending}
                                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-pink-600/10"
                                        >
                                            {crushFromConfessionMutation.isPending ? 'Sending...' : 'Send Message'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
        </div>
    );
};

export default Dashboard;
