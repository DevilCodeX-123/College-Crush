import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, Lock, Globe, Search, Plus, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const Groups = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', type: 'public' });
    const [requestSent, setRequestSent] = useState<string | null>(null);

    const { data: groups, isLoading, refetch } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/chat/groups');
            return data;
        }
    });

    const createRequestMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/chat/groups/create', data);
        },
        onSuccess: () => {
            setIsCreateModalOpen(false);
            setNewGroup({ name: '', description: '', type: 'public' });
            alert('Your group creation request has been sent to the admin for approval!');
        }
    });

    const joinRequestMutation = useMutation({
        mutationFn: async (groupId: string) => {
            return api.post(`/chat/groups/join/${groupId}`);
        },
        onSuccess: (data: any, groupId) => {
            if (data.data?.message?.includes('successfully')) {
                // For public groups joined immediately
                refetch();
            } else {
                setRequestSent(groupId);
                setTimeout(() => setRequestSent(null), 3000);
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error joining hub';
            alert(message);
        }
    });

    const filteredGroups = (groups || []).filter((g: any) =>
        g.type === activeTab &&
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 overflow-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px]"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-1 md:mb-2">Campus Hubs</h1>
                        <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-[0.2em] font-bold">Find your tribe or start a movement</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 h-14 px-8 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-pink-500/10"
                    >
                        <Plus className="w-5 h-5 mr-3" /> Create Group
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                    {/* ... (Sidebar remains similar) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                placeholder="Search hubs..."
                                className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus:ring-blue-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="p-2 bg-white/5 border border-white/10 rounded-[2rem] flex flex-col">
                            <button
                                onClick={() => setActiveTab('public')}
                                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'public' ? 'bg-blue-600/20 text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="font-bold">Public Lounges</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('private')}
                                className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'private' ? 'bg-pink-600/20 text-white shadow-lg border border-white/10' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Lock className="w-5 h-5" />
                                <span className="font-bold">Private Circles</span>
                            </button>
                        </div>
                    </div>

                    {/* Groups Grid */}
                    <div className="lg:col-span-9">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                <p className="font-bold animate-pulse">Materializing campus hubs...</p>
                            </div>
                        ) : (
                            <motion.div
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                            >
                                {filteredGroups.map((group: any) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={group._id}
                                    >
                                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 hover:border-white/20 transition-all group cursor-pointer border-t-white/10 shadow-2xl">
                                            <CardHeader className="p-0 mb-6">
                                                <div className="flex justify-between items-start">
                                                    <div className={`w-14 h-14 rounded-2xl ${group.type === 'public' ? 'bg-blue-600/20' : 'bg-pink-600/20'} flex items-center justify-center transition-all group-hover:scale-110`}>
                                                        {group.type === 'public' ? <Globe className="w-7 h-7 text-blue-500" /> : <Lock className="w-7 h-7 text-pink-500" />}
                                                    </div>
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                        {new Date(group.lastActivity).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardTitle className="text-2xl font-black mb-3">{group.name}</CardTitle>
                                            <p className="text-gray-400 text-sm font-light mb-8 line-clamp-2">
                                                {group.description || "No description provided."}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 text-xs font-bold text-gray-500">
                                                    <Users className="w-4 h-4" />
                                                    <span>{group.members?.length || 0} Campus Souls</span>
                                                </div>

                                                {group.members?.some((m: any) => m?.toString() === user?._id?.toString()) ? (
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => navigate(`/groups/${group._id}`)}
                                                        className="group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent"
                                                    >
                                                        <span className="mr-2 text-xs font-black uppercase tracking-widest text-[#00f0ff]">Enter Hub</span>
                                                        <Plus className="w-6 h-6 text-[#00f0ff]" />
                                                    </Button>
                                                ) : activeTab === 'private' ? (
                                                    <Button
                                                        disabled={requestSent === group._id}
                                                        onClick={() => joinRequestMutation.mutate(group._id)}
                                                        className={`rounded-xl h-12 px-6 font-black text-xs uppercase tracking-widest ${requestSent === group._id ? 'bg-green-600/20 text-green-500' : 'bg-white/5 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {requestSent === group._id ? (
                                                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Requested</>
                                                        ) : (
                                                            'Request to Join'
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        disabled={joinRequestMutation.isPending}
                                                        onClick={() => joinRequestMutation.mutate(group._id)}
                                                        className="group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent"
                                                    >
                                                        {joinRequestMutation.isPending && joinRequestMutation.variables === group._id ? (
                                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                        ) : (
                                                            <Plus className="w-6 h-6 text-white" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                        {/* ... (filteredGroups.length === 0 remains similar) */}
                        {!isLoading && filteredGroups.length === 0 && (
                            <div className="text-center py-24">
                                <MessageSquare className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-gray-700">No hubs found</h3>
                                <p className="text-gray-500 mt-2">Try searching for something else or request your own circle.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Group Request Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-[#111114] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-pink-600" />
                            <h2 className="text-3xl font-black mb-2">Request Group</h2>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Admin approval required for new hubs</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Name of Hub</label>
                                    <Input
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                        placeholder="e.g. Campus Coders"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Story / Description</label>
                                    <textarea
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mt-2 h-32 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:gray-600"
                                        placeholder="What is this hub about?"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewGroup({ ...newGroup, type: 'public' })}
                                        className={`h-14 rounded-2xl border transition-all flex items-center justify-center space-x-2 ${newGroup.type === 'public' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                    >
                                        <Globe className="w-4 h-4" />
                                        <span className="text-xs font-bold">Public Lounge</span>
                                    </button>
                                    <button
                                        onClick={() => setNewGroup({ ...newGroup, type: 'private' })}
                                        className={`h-14 rounded-2xl border transition-all flex items-center justify-center space-x-2 ${newGroup.type === 'private' ? 'bg-pink-600/20 border-pink-500/50 text-pink-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                    >
                                        <Lock className="w-4 h-4" />
                                        <span className="text-xs font-bold">Private Circle</span>
                                    </button>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 h-14 rounded-2xl text-gray-500 font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => createRequestMutation.mutate(newGroup)}
                                        disabled={!newGroup.name || createRequestMutation.isPending}
                                        className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-pink-600 text-white font-black uppercase tracking-widest"
                                    >
                                        {createRequestMutation.isPending ? 'Sending...' : 'Send Request'}
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

export default Groups;
