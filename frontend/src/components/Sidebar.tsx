import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, Users, Award, User, Zap, Star, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const themeMap: Record<string, any> = {
        male: {
            activeBtn: 'bg-blue-600/20 text-white border border-white/10',
            icon: 'text-blue-500',
        },
        female: {
            activeBtn: 'bg-pink-600/20 text-white border border-white/10',
            icon: 'text-pink-500',
        },
        other: {
            activeBtn: 'bg-purple-600/20 text-white border border-white/10',
            icon: 'text-purple-500',
        }
    };

    const theme = themeMap[user?.gender?.toLowerCase()] || themeMap.other;

    const navItems = [
        { icon: MessageSquare, label: 'Confessions', path: '/confessions' },
        { icon: Heart, label: 'Crushes', path: '/crushes' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Zap, label: 'Shadow Match', path: '/match' },
        { icon: Star, label: 'Elite Circle', path: '/friends' },
        { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ icon: ShieldAlert, label: 'Admin Panel', path: '/admin' });
    }

    return (
        <aside className="w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl flex flex-col p-6 fixed h-full z-20">
            <div className="flex items-center space-x-2 mb-12">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
                    clgcrush
                </span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item, i) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={i}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                                isActive 
                                ? theme.activeBtn
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? theme.icon : ''}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-white/5 mt-auto">
                <button 
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-500 hover:text-red-400 transition-colors"
                >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
