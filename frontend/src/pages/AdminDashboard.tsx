import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/card';
import { ShieldAlert, Users, MessageSquare, Plus, Globe, Lock, Flag, Loader2, XCircle, Speaker, Activity, Search, Sparkles, Heart } from 'lucide-react';
import api from '../lib/api';
import UserAvatar from '../components/UserAvatar';
import AdminQRRevealTab from '../components/admin/AdminQRRevealTab';


const AdminDashboard = ({ initialTab = 'overview' }: { initialTab?: string }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingAd, setIsCreatingAd] = useState(false);
    const [rooms, setRooms] = useState<any[]>([]);
    const [roomRequests, setRoomRequests] = useState<any[]>([]);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomTabMode, setRoomTabMode] = useState<'active' | 'requests'>('active');
    const [newRoomData, setNewRoomData] = useState({ name: '', description: '', type: 'public', adminEmail: '' });

    const fetchAnalytics = async () => {
        try {
            const { data } = await api.get('/admin/analytics');
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics');
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users');
        }
    };

    const fetchReports = async () => {
        try {
            const { data } = await api.get('/admin/reports');
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports');
        }
    };

    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/admin/rooms');
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms');
        }
    };

    const fetchRoomRequests = async () => {
        try {
            const { data } = await api.get('/admin/room-requests');
            setRoomRequests(data);
        } catch (error) {
            console.error('Error fetching room requests');
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchAnalytics();
            setLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'reports') fetchReports();
        if (activeTab === 'rooms') {
            fetchRooms();
            fetchRoomRequests();
        }
    }, [activeTab]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/rooms', newRoomData);
            setNewRoomData({ name: '', description: '', type: 'public', adminEmail: '' });
            setIsCreatingRoom(false);
            fetchRooms();
        } catch (error) {
            alert('Failed to create room. Please check the details or make sure the admin email exists.');
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Are you sure you want to permanently delete this room?')) return;
        try {
            await api.delete(`/admin/rooms/${roomId}`);
            fetchRooms();
        } catch (error) {
            alert('Failed to delete room');
        }
    };

    const handleApproveRequest = async (id: string) => {
        try {
            await api.put(`/admin/room-requests/${id}/approve`);
            fetchRoomRequests();
            fetchRooms();
        } catch (error) {
            alert('Error approving request');
        }
    };

    const handleRejectRequest = async (id: string) => {
        try {
            await api.put(`/admin/room-requests/${id}/reject`);
            fetchRoomRequests();
        } catch (error) {
            alert('Error rejecting request');
        }
    };

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserAction = async (userId: string, action: string, durationDays?: number) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await api.put(`/admin/users/${userId}/action`, { action, durationDays });
            await fetchUsers(); // Refresh the list
            
            // If we're inspecting this user, update it
            if (selectedUser?._id === userId) {
                const updatedUser = users.find(u => u._id === userId);
                if (updatedUser) setSelectedUser(updatedUser);
            }
        } catch (error) {
            alert('Failed to execute action');
        }
    };

    const UserCard = ({ user }: { user: any }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => setSelectedUser(user)}
            className="group relative cursor-pointer"
        >
            <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 hover:border-pink-500/30 transition-all flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-3xl group-hover:bg-pink-500/10 transition-all"></div>
                
                <div className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${user.gender === 'Female' ? 'from-pink-500' : 'from-blue-500'} to-white/10 p-[2px] mb-6 shadow-xl`}>
                    <div className="w-full h-full rounded-[30px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                        <UserAvatar src={user.profilePhoto} name={user.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                </div>

                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] uppercase tracking-widest font-black text-gray-500 mb-3">
                    <Sparkles className="w-3 h-3 mr-2 text-yellow-500" /> Campus Elite
                </div>

                <h4 className="font-black text-xl mb-1 tracking-tight group-hover:text-pink-500 transition-colors uppercase">{user.name}</h4>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest truncate max-w-full opacity-60 italic mb-6">
                    {user.bio || 'Whispering mysteries...'}
                </p>

                <div className="flex items-center space-x-6 w-full px-4 pt-4 border-t border-white/5">
                    <div className="flex-1 text-center">
                        <p className="text-xl font-black">{user.visitCount || 0}</p>
                        <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Visits</p>
                    </div>
                    <div className="w-px h-8 bg-white/5"></div>
                    <div className="flex-1 text-center">
                        <p className="text-xl font-black">{user.crushCount || 0}</p>
                        <p className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">Crushes</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    const UserInspector = ({ user }: { user: any }) => {
        const themeMap: any = {
            male: 'from-blue-500',
            female: 'from-pink-500',
            other: 'from-purple-500'
        };
        const theme = themeMap[user.gender?.toLowerCase()] || themeMap.other;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 animate-in fade-in"
            >
                <header className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                    <button onClick={() => setSelectedUser(null)} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all group">
                        <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10">
                            <Plus className="w-4 h-4 rotate-45" /> 
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Matrix</span>
                    </button>
                    <div className="flex items-center space-x-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Inspecting Citizen:</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{user._id}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Ditto User Profile View */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 overflow-hidden relative border-t-white/20 shadow-2xl">
                             <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12">
                                <div className={`w-44 h-44 rounded-[2.5rem] bg-gradient-to-br ${theme} to-white/20 p-[2px] shadow-2xl`}>
                                    <div className="w-full h-full rounded-[38px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                        <UserAvatar src={user.profilePhoto} name={user.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left pt-2">
                                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-black text-gray-400 mb-4">
                                        <Sparkles className="w-3 h-3 mr-2 text-blue-500" /> Elite Persona
                                    </div>
                                    <h1 className="text-6xl font-black mb-4 tracking-tighter leading-none">{user.name}</h1>
                                    <p className="text-gray-400 text-lg font-light leading-relaxed max-w-lg">
                                        {user.bio || "This soul hasn't whispered their story yet..."}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-8 justify-center md:justify-start">
                                        {user.interests?.map((interest: string, i: number) => (
                                            <span key={i} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-12 justify-center md:justify-start">
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    await api.post('/crushes', { receiverId: user._id, message: 'I have a crush on you! ❤️' });
                                                    alert('Crush sent from Admin persona! ✨');
                                                } catch (err: any) {
                                                    alert(err.response?.data?.message || 'Error sending crush');
                                                }
                                            }}
                                            className="bg-pink-600 hover:bg-pink-500 rounded-2xl px-10 h-16 text-lg font-black shadow-xl shadow-black/20 border border-t-white/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                                        >
                                            <Heart className="w-5 h-5 mr-3 fill-white" /> Send Crush
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/chat/anonymous?userId=${user._id}`)}
                                            className="border-white/10 bg-white/5 backdrop-blur-md rounded-2xl px-10 h-16 text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center"
                                        >
                                            <MessageSquare className="w-5 h-5 mr-3" /> Anonymous DM
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </Card>

                        {/* Admin Command Console */}
                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border-t-white/20 shadow-2xl">
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-8 flex items-center">
                                <ShieldAlert className="w-4 h-4 mr-3 text-red-500" /> Tactical Override Console
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={() => handleUserAction(user._id, 'warn')} className="flex flex-col items-center justify-center p-6 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-3xl transition-all group">
                                    <ShieldAlert className="w-8 h-8 mb-3 text-yellow-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Issue Strike</span>
                                </button>
                                <button onClick={() => handleUserAction(user._id, 'banTemp', 3)} className="flex flex-col items-center justify-center p-6 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-3xl transition-all group">
                                    <Activity className="w-8 h-8 mb-3 text-orange-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Ban (3d)</span>
                                </button>
                                <button onClick={() => handleUserAction(user._id, 'banPerm')} className="flex flex-col items-center justify-center p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-3xl transition-all group">
                                    <XCircle className="w-8 h-8 mb-3 text-red-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Perm Ban</span>
                                </button>
                                {user.banStatus !== 'none' ? (
                                    <button onClick={() => handleUserAction(user._id, 'unban')} className="flex flex-col items-center justify-center p-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-3xl transition-all group">
                                        <Plus className="w-8 h-8 mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Restitute</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl opacity-30 grayscale cursor-not-allowed">
                                        <Plus className="w-8 h-8 mb-3 text-gray-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">No Action</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 text-center border-t-white/20 shadow-2xl space-y-12">
                            <div>
                                <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-yellow-500/20">
                                    <Sparkles className="w-8 h-8 text-yellow-500" />
                                </div>
                                <p className="text-5xl font-black tracking-tighter">{user.visitCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-extrabold mt-3">Elite Power</p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div>
                                <div className="w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-pink-500/20">
                                    <Heart className="w-8 h-8 text-pink-500" />
                                </div>
                                <p className="text-5xl font-black tracking-tighter">{user.crushCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-extrabold mt-3">Total Crushes</p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div className="text-left space-y-6 pt-4">
                                <div>
                                    <p className="text-[8px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Status Designation</p>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.banStatus !== 'none' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                        {user.banStatus === 'none' ? 'Active Network Citizen' : `${user.banStatus} Restricted`}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[8px] uppercase tracking-[0.2em] font-black text-gray-500 mb-1">Affiliation</p>
                                    <p className="font-bold text-gray-200">{user.branch} • Year {user.year}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Reputation Card */}
                        <Card className="border-white/10 bg-gradient-to-br from-white/5 to-white/10 rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-xl">
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                             <h5 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-2">Campus Reputation</h5>
                             <div className="text-2xl font-black bg-gradient-to-r from-yellow-500 via-white to-yellow-500 bg-clip-text text-transparent uppercase tracking-tighter">Campus Legend</div>
                        </Card>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-white space-x-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <span className="text-xl font-bold tracking-widest text-gray-500 uppercase">System Initializing</span>
        </div>
    );

    return (
        <div className="w-full text-white animate-in fade-in zoom-in-95 duration-300">
            {/* Main Content Area */}
            <main className="w-full">

                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-3xl font-black">System Status</h2>
                            <p className="text-gray-500 text-sm mt-1">Live metrics from the College-Crush core.</p>
                        </header>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            <Card className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl">
                                <Users className="w-6 h-6 text-blue-500 mb-4" />
                                <p className="text-4xl font-black">{analytics?.totalUsers || 0}</p>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mt-2 font-bold">Total Citizens</p>
                            </Card>
                            <Card className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl">
                                <Activity className="w-6 h-6 text-green-500 mb-4" />
                                <p className="text-4xl font-black">{analytics?.activeUsers || 0}</p>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mt-2 font-bold">24h Active</p>
                            </Card>
                            <Card className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl">
                                <MessageSquare className="w-6 h-6 text-pink-500 mb-4" />
                                <p className="text-4xl font-black">{analytics?.chatsToday || 0}</p>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mt-2 font-bold">Messages Today</p>
                            </Card>
                            <Card className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl">
                                <Flag className="w-6 h-6 text-red-500 mb-4" />
                                <p className="text-4xl font-black">{analytics?.totalReports || 0}</p>
                                <p className="text-xs uppercase tracking-widest text-gray-500 mt-2 font-bold">Pending Reports</p>
                            </Card>
                        </div>
                    </div>
                )}
                {/* 2. USERS TAB */}
                {activeTab === 'users' && (
                    <AnimatePresence mode="wait">
                        {!selectedUser ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black">User Matrix</h2>
                                        <p className="text-gray-500 text-sm mt-1">Total dominion over {users.length} accounts.</p>
                                    </div>
                                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 items-center">
                                         <Search className="w-4 h-4 m-2 text-gray-500" />
                                         <input 
                                            type="text" 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search citizens..." 
                                            className="bg-transparent border-0 outline-none text-xs w-48 placeholder:text-gray-600 text-white" 
                                         />
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredUsers.map((user: any) => (
                                        <UserCard key={user._id} user={user} />
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-[3rem]">
                                            Zero citizens detected in the core.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <UserInspector key="inspector" user={selectedUser} />
                        )}
                    </AnimatePresence>
                )}

                {/* 3. REPORTS TAB */}
                {activeTab === 'reports' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-3xl font-black">Intelligence Logs</h2>
                            <p className="text-gray-500 text-sm mt-1">Review intercepted reports and unmasked chat history.</p>
                        </header>

                        <div className="space-y-6">
                            {reports.map((report) => (
                                <Card key={report._id} className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShieldAlert className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center space-x-3 mb-6">
                                            <span className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-full">
                                                {report.type} Report
                                            </span>
                                            <span className="text-xs text-gray-500 font-bold">{new Date(report.createdAt).toLocaleString()}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-6">
                                            <div className="bg-white/5 p-4 rounded-xl">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Reporter</p>
                                                <p className="font-bold">{report.reporter?.name}</p>
                                                <p className="text-xs text-gray-400">{report.reporter?.email}</p>
                                            </div>
                                            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                                <p className="text-[10px] text-red-400 uppercase tracking-widest font-black mb-2">Target Suspect</p>
                                                <p className="font-bold text-red-500">{report.target?.name || 'Unknown'}</p>
                                                <p className="text-xs text-red-400">{report.target?.email || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2">Reason Issued</p>
                                            <p className="text-lg font-medium">"{report.reason}"</p>
                                        </div>

                                        {/* Intercepted Chat Logs Context */}
                                        {report.chatLogs && report.chatLogs.length > 0 && (
                                            <div className="mt-8">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3 flex items-center">
                                                    <Lock className="w-3 h-3 mr-2" />
                                                    Intercepted Chat Logs
                                                </p>
                                                <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-3 font-mono text-sm border border-white/5 h-48 overflow-y-auto">
                                                    {report.chatLogs.map((log: any, idx: number) => (
                                                        <div key={idx} className="flex">
                                                            <span className={`w-24 shrink-0 font-bold ${log.sender?._id === report.target?._id ? 'text-red-500' : 'text-blue-500'}`}>
                                                                [{log.sender?.name || 'Ghost'}]:
                                                            </span>
                                                            <span className="text-gray-300 ml-2">{log.content}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex space-x-4 mt-8 pt-6 border-t border-white/10">
                                            <button className="flex-1 py-3 bg-red-500/20 text-red-500 hover:bg-red-500 leading-none hover:text-white rounded-xl font-black uppercase tracking-tighter transition-all">
                                                Perm Ban Target
                                            </button>
                                            <button className="flex-1 py-3 bg-white/5 text-gray-400 hover:bg-white/10 rounded-xl font-black uppercase tracking-tighter transition-all">
                                                Dismiss Record
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. ROOMS TAB */}
                {activeTab === 'rooms' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {!isCreatingRoom ? (
                            <>
                                <header className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                                    <div>
                                        <h2 className="text-3xl font-black">{roomTabMode === 'active' ? 'Rooms Control Matrix' : 'Hub Requests'}</h2>
                                        <p className="text-gray-500 text-sm mt-1">{roomTabMode === 'active' ? 'Manage public and private campus chat hubs.' : 'Pending student groups requesting to open a campus chat room.'}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-white/5 rounded-xl p-1 flex items-center shadow-inner">
                                            <button onClick={() => setRoomTabMode('active')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${roomTabMode === 'active' ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Active Rooms</button>
                                            <button onClick={() => setRoomTabMode('requests')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${roomTabMode === 'requests' ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'} flex items-center`}>
                                                Requests
                                                {roomRequests.length > 0 && <span className="ml-2 bg-pink-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none">{roomRequests.length}</span>}
                                            </button>
                                        </div>
                                        <button onClick={() => setIsCreatingRoom(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors flex items-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                            <Plus className="w-4 h-4 mr-2" /> New Room
                                        </button>
                                    </div>
                                </header>

                                {roomTabMode === 'active' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {rooms.map((room) => (
                                            <Card key={room._id} className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${room.type === 'private' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                                        {room.type} Room
                                                    </span>
                                                </div>
                                                <div className="relative z-10 flex flex-col h-[calc(100%-4rem)]">
                                                    <div>
                                                        <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                                                        <p className="text-sm text-gray-400 mb-6 line-clamp-2 min-h-[40px]">{room.description || 'No description provided.'}</p>
                                                    </div>

                                                    <div className="mt-auto">
                                                        {room.type === 'private' && room.admin && (
                                                            <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-inner">
                                                                    {room.admin.name ? room.admin.name.charAt(0) : 'A'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Room Admin</p>
                                                                    <p className="font-bold text-sm text-gray-200">{room.admin.name}</p>
                                                                    <p className="text-xs text-gray-500">{room.admin.email}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleDeleteRoom(room._id)} className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                                                                Delete Room
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {rooms.length === 0 && (
                                            <div className="col-span-2 py-20 text-center text-gray-500 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-3xl">
                                                No rooms initialized in the matrix.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                                        {roomRequests.map((req) => (
                                            <Card key={req._id} className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent p-6 rounded-3xl relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="w-12 h-12 bg-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center border border-pink-500/30">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-[10px] text-pink-500 font-black uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 shadow-inner">Requires Approval</span>
                                                </div>
                                                <div className="relative z-10 flex flex-col h-[calc(100%-4rem)]">
                                                    <div>
                                                        <h3 className="text-xl font-bold mb-1 text-white">{req.groupData?.name || 'Unnamed Hub'}</h3>
                                                        <p className="text-xs font-black uppercase tracking-widest text-pink-400 mb-3">{req.groupData?.type} Room</p>
                                                        <p className="text-sm text-gray-400 mb-6 italic line-clamp-2 min-h-[40px]">"{req.groupData?.description}"</p>
                                                    </div>

                                                    <div className="mt-auto">
                                                        <div className="mb-6 p-4 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 flex items-center space-x-3 backdrop-blur-sm">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-md">
                                                                {req.requester?.name ? req.requester.name.charAt(0) : 'U'}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Requested By</p>
                                                                <p className="font-bold text-sm text-gray-200">{req.requester?.name}</p>
                                                                <p className="text-[10px] text-gray-400 uppercase font-black">{req.requester?.year} • {req.requester?.branch || 'General'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex space-x-3">
                                                            <button onClick={() => handleApproveRequest(req._id)} className="flex-1 py-3 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white transition-all font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">Approve</button>
                                                            <button onClick={() => handleRejectRequest(req._id)} className="flex-1 py-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-xs rounded-xl ">Reject</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {roomRequests.length === 0 && (
                                            <div className="col-span-2 py-20 text-center text-gray-500 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                                                No pending requests at this time.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Card className="border-blue-500/20 bg-[#0a0a0a]/80 backdrop-blur-xl p-8 rounded-3xl animate-in zoom-in-95 duration-300">
                                <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                                    <h2 className="text-2xl font-black flex items-center">
                                        <Globe className="w-6 h-6 mr-3 text-blue-500" />
                                        Initialize New Room
                                    </h2>
                                    <button onClick={() => setIsCreatingRoom(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </header>

                                <form onSubmit={handleCreateRoom} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-400 font-medium mb-2 block">Room Designation (Name)</label>
                                            <input required type="text" value={newRoomData.name} onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })} className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white" placeholder="e.g. Code Masters Hub" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm text-gray-400 font-medium mb-2 block">Operational Purpose (Description)</label>
                                            <textarea value={newRoomData.description} onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })} className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors h-24 resize-none text-white" placeholder="Brief about the room's activities..."></textarea>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-400 font-medium mb-2 block">Security Clearance (Type)</label>
                                            <select value={newRoomData.type} onChange={(e) => setNewRoomData({ ...newRoomData, type: e.target.value })} className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white [&>option]:bg-[#0a0a0a]">
                                                <option value="public">Public (Open to All)</option>
                                                <option value="private">Private (Invite & Admin Only)</option>
                                            </select>
                                        </div>
                                        {newRoomData.type === 'private' && (
                                            <div className="animate-in fade-in slide-in-from-left-2">
                                                <label className="text-sm text-purple-400 font-medium mb-2 block">Room Admin Email</label>
                                                <input required type="email" value={newRoomData.adminEmail} onChange={(e) => setNewRoomData({ ...newRoomData, adminEmail: e.target.value })} className="w-full bg-purple-500/5 border border-purple-500/30 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors placeholder:text-purple-500/30 text-purple-100" placeholder="admin@student.edu" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end space-x-4 pt-6 border-t border-white/10 mt-8">
                                        <button type="button" onClick={() => setIsCreatingRoom(false)} className="px-8 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors uppercase tracking-widest text-xs">
                                            Abort
                                        </button>
                                        <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] uppercase tracking-widest text-xs">
                                            Deploy Room
                                        </button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                )}

                {/* 5. ADS TAB */}
                {activeTab === 'ads' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {!isCreatingAd ? (
                            <>
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black">Advertising Engine</h2>
                                        <p className="text-gray-500 text-sm mt-1">Deploy and control campus-wide native advertisements.</p>
                                    </div>
                                    <button onClick={() => setIsCreatingAd(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors flex items-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                        <Plus className="w-4 h-4 mr-2" /> Create Campaign
                                    </button>
                                </header>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Active Deployments</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-white/5 bg-white/[0.02] p-6 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl"></div>
                                                <div>
                                                    <p className="font-bold">CS Hackathon Registration</p>
                                                    <p className="text-xs text-green-500 font-black tracking-widest uppercase mt-1">Live • 1.2k reach</p>
                                                </div>
                                            </div>
                                            <button className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500/20">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </Card>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Card className="border-blue-500/20 bg-[#0a0a0a]/80 backdrop-blur-xl p-8 rounded-3xl animate-in zoom-in-95 duration-300">
                                <header className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                                    <h2 className="text-2xl font-black flex items-center">
                                        <Speaker className="w-6 h-6 mr-3 text-blue-500" />
                                        Create New Advertisement
                                    </h2>
                                    <button onClick={() => setIsCreatingAd(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </header>

                                <div className="space-y-10">
                                    {/* Basic Information */}
                                    <section>
                                        <h3 className="text-lg font-bold text-blue-500 mb-6 flex items-center">
                                            Basic Information
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Title</label>
                                                <input type="text" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" placeholder="Campaign Title" />
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Description (Internal)</label>
                                                <textarea className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-none" placeholder="Internal notes about this ad..."></textarea>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm text-gray-400 font-medium mb-2 block">Ad Type</label>
                                                    <select className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white [&>option]:bg-[#0a0a0a]">
                                                        <option>Image Ad</option>
                                                        <option>Video Ad</option>
                                                        <option>Text Ad</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-400 font-medium mb-2 block">Total Duration (seconds)</label>
                                                    <input type="number" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" defaultValue={5} />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Media URL (Image or Video)</label>
                                                <input type="text" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" placeholder="https://example.com/ad.jpg" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm text-gray-400 font-medium mb-2 block">Max Views Per User</label>
                                                    <input type="number" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" defaultValue={1} />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-400 font-medium mb-2 block">Hours Between Views (Per User)</label>
                                                    <input type="number" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" defaultValue={24} />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Total Reach Limit (Global Views)</label>
                                                <input type="number" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" defaultValue={1000} />
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Click-through Link (Learn More)</label>
                                                <input type="text" className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" placeholder="https://example.com/landing-page" />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="h-px bg-white/10 w-full"></div>

                                    {/* Targeting */}
                                    <section>
                                        <h3 className="text-lg font-bold text-blue-500 mb-6">Targeting</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-2 block">Targeting Type</label>
                                                <select className="w-full bg-transparent border border-white/20 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white [&>option]:bg-[#0a0a0a]">
                                                    <option>Worldwide (All Users)</option>
                                                    <option>Specific Branches</option>
                                                    <option>Specific Interests</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-3 block">Target Specific Branches (Optional)</label>
                                                <div className="grid grid-cols-2 gap-4 border border-white/10 rounded-xl p-5 bg-white/[0.01]">
                                                    {['Computer Science', 'Information Technology', 'Electronics (ECE)', 'Mechanical', 'Civil', 'Electrical'].map((club) => (
                                                        <label key={club} className="flex items-center space-x-3 cursor-pointer group">
                                                            <input type="checkbox" className="w-4 h-4 accent-blue-500 rounded bg-transparent border-white/20" />
                                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{club}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-gray-400 font-medium mb-3 block">Select Target Pages</label>
                                                <div className="grid grid-cols-3 gap-4 border border-white/10 rounded-xl p-5 bg-white/[0.01]">
                                                    <label className="flex items-center space-x-3 cursor-pointer group">
                                                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500 rounded bg-transparent border-white/20" />
                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">All Pages</span>
                                                    </label>
                                                    {['Dashboard', 'Crushes', 'Confessions', 'Groups', 'Leaderboard', 'Profile', 'Match'].map((page) => (
                                                        <label key={page} className="flex items-center space-x-3 cursor-pointer group">
                                                            <input type="checkbox" className="w-4 h-4 accent-blue-500 rounded bg-transparent border-white/20" />
                                                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{page}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                                        <button onClick={() => setIsCreatingAd(false)} className="px-8 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={() => setIsCreatingAd(false)} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                                            Create Ad Campaign
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* 6. SYSTEM SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-3xl font-black">System Override</h2>
                            <p className="text-gray-500 text-sm mt-1">Global platform controls and notifications.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Global Announcements */}
                            <Card className="border-white/5 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl">
                                <h3 className="text-xl font-black mb-6 flex items-center">
                                    <Speaker className="w-6 h-6 mr-3 text-blue-500" />
                                    Global Announcement
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2 block">Title</label>
                                        <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500" placeholder="e.g. Server Maintenance" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2 block">Message</label>
                                        <textarea className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 h-24 resize-none" placeholder="We will be down for 10 minutes..."></textarea>
                                    </div>
                                    <button className="w-full py-4 rounded-xl bg-blue-500/10 text-blue-500 font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                                        Broadcast to All Devices
                                    </button>
                                </div>
                            </Card>

                            <div className="space-y-8">
                                {/* Leaderboard Control */}
                                <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-6 rounded-3xl">
                                    <h3 className="text-lg font-black mb-2 text-orange-500">Leaderboard Season Reset</h3>
                                    <p className="text-sm text-gray-400 mb-6">Wipe all popularity scores and crush counts. This action is irreversible.</p>
                                    <button className="w-full py-3 border-2 border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl font-black tracking-widest uppercase transition-all">
                                        Initiate Season Reset
                                    </button>
                                </Card>

                                {/* Emergency Lockdown */}
                                <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent p-6 rounded-3xl">
                                    <h3 className="text-lg font-black mb-2 text-red-500">Emergency Lockdown</h3>
                                    <p className="text-sm text-gray-400 mb-6">Instantly freeze all new signups, confessions, and chat messages across the network.</p>
                                    <button className="w-full py-3 bg-red-500 text-white rounded-xl font-black tracking-widest uppercase hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all">
                                        Engage Lockdown Mode
                                    </button>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. QR REVEAL TAB */}
                {activeTab === 'qr' && <AdminQRRevealTab />}

            </main>
        </div>
    );
};

export default AdminDashboard;
