import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { ShieldAlert, Users, MessageSquare, Plus, Globe, Lock, Flag, Loader2, XCircle, Speaker, Activity } from 'lucide-react';
import api from '../lib/api';
import UserAvatar from '../components/UserAvatar';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await fetchAnalytics();
            setLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'reports') fetchReports();
    }, [activeTab]);

    const handleUserAction = async (userId: string, action: string, durationDays?: number) => {
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await api.put(`/admin/users/${userId}/action`, { action, durationDays });
            fetchUsers();
        } catch (error) {
            alert('Failed to execute action');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-white space-x-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <span className="text-xl font-bold tracking-widest text-gray-500 uppercase">System Initializing</span>
        </div>
    );

    const SidebarItem = ({ icon: Icon, label, id }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all font-black text-sm uppercase tracking-tighter ${activeTab === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-72 bg-white/[0.02] border-r border-white/5 p-8 flex flex-col space-y-6">
                <div>
                    <h1 className="text-2xl font-black flex flex-col mb-8">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">
                            Command
                        </span>
                        <span className="tracking-widest uppercase text-xs text-gray-500 mt-1">Center</span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
                    <SidebarItem icon={Activity} label="Overview" id="overview" />
                    <SidebarItem icon={Users} label="User Control" id="users" />
                    <SidebarItem icon={Flag} label="Reports & Logs" id="reports" />
                    <SidebarItem icon={MessageSquare} label="Rooms Setup" id="rooms" />
                    <SidebarItem icon={Speaker} label="Ads Setup" id="ads" />
                    <SidebarItem icon={ShieldAlert} label="System Control" id="settings" />
                </nav>

                <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center font-black">
                            D
                        </div>
                        <div>
                            <p className="text-sm font-bold">Devil Boss</p>
                            <p className="text-[10px] text-red-500 uppercase tracking-widest font-black">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-12">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-3xl font-black">System Status</h2>
                            <p className="text-gray-500 text-sm mt-1">Live metrics from the College-Crush core.</p>
                        </header>

                        <div className="grid grid-cols-4 gap-6">
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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black">User Matrix</h2>
                                <p className="text-gray-500 text-sm mt-1">Total dominion over {users.length} accounts.</p>
                            </div>
                        </header>

                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5 text-xs uppercase tracking-widest text-gray-400">
                                        <th className="p-4 font-black">User</th>
                                        <th className="p-4 font-black">Status</th>
                                        <th className="p-4 font-black">Warnings</th>
                                        <th className="p-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 flex items-center space-x-4">
                                                <UserAvatar src={user.profilePhoto} name={user.name} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-bold">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>

                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.banStatus !== 'none' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {user.banStatus === 'none' ? 'Active' : user.banStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 font-black text-red-500">{user.warnings > 0 ? `${user.warnings} Strikes` : '-'}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => handleUserAction(user._id, 'warn')} className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-black uppercase hover:bg-yellow-500/20">Warn</button>
                                                <button onClick={() => handleUserAction(user._id, 'banTemp', 3)} className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-xs font-black uppercase hover:bg-orange-500/20">Ban (3d)</button>
                                                <button onClick={() => handleUserAction(user._id, 'banPerm')} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-black uppercase hover:bg-red-500/20">Perm Ban</button>
                                                {user.banStatus !== 'none' && (
                                                    <button onClick={() => handleUserAction(user._id, 'unban')} className="px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 text-xs font-black uppercase hover:bg-gray-500/20">Unban</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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

                                        <div className="grid grid-cols-2 gap-8 mb-6">
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
                        <header>
                            <h2 className="text-3xl font-black">Hub Requests</h2>
                            <p className="text-gray-500 text-sm mt-1">Pending student groups requesting to open a campus chat room.</p>
                        </header>
                        <div className="grid grid-cols-2 gap-6">
                            {/* In a real app, map over actual pending rooms. Mocking 1 for UI representation */}
                            <Card className="border-white/5 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Pending</span>
                                </div>
                                <h3 className="text-xl font-bold mb-1">ECE Department Freshers</h3>
                                <p className="text-sm text-gray-400 mb-6">Requested by Rahul Sharma (3rd Year)</p>
                                <div className="flex space-x-3">
                                    <button className="flex-1 py-2 bg-green-500/20 text-green-500 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-500/30">Approve</button>
                                    <button className="flex-1 py-2 bg-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-red-500/30">Reject</button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* 5. ADS TAB */}
                {activeTab === 'ads' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black">Advertising Engine</h2>
                                <p className="text-gray-500 text-sm mt-1">Deploy and control campus-wide native advertisements.</p>
                            </div>
                            <button className="px-6 py-3 bg-pink-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-pink-600 transition-colors flex items-center">
                                <Plus className="w-4 h-4 mr-2" /> Create Campaign
                            </button>
                        </header>

                        <div className="grid grid-cols-2 gap-8">
                            {/* Mock Ad Form representing complex ad configurations */}
                            <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent p-8 rounded-3xl">
                                <h3 className="text-xl font-black mb-6">New Campaign</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2 block">Campaign Title</label>
                                        <input type="text" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500 transition-colors" placeholder="e.g. College Fest 2026" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2 block">Max Views / User</label>
                                            <input type="number" className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500" placeholder="1" />
                                        </div>
                                         <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-2 block">Target Audience</label>
                                            <select className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-gray-400">
                                                <option>All Users</option>
                                                <option>1st Year Only</option>
                                                <option>Male Citizens</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 mt-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                        Deploy Ad Network
                                    </button>
                                </div>
                            </Card>

                            {/* Active Ads Mocks */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Active Deployments</h3>
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
                    </div>
                )}

                {/* 6. SYSTEM SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <header>
                            <h2 className="text-3xl font-black">System Override</h2>
                            <p className="text-gray-500 text-sm mt-1">Global platform controls and notifications.</p>
                        </header>

                        <div className="grid grid-cols-2 gap-8">
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
            </main>
        </div>
    );
};

export default AdminDashboard;
