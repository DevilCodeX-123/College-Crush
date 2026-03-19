import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, MessageSquare, Users, Award, User, Zap, Star, Activity, Flag, Speaker, Menu, X, Instagram } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const themeMap: Record<string, any> = {
        male: { activeBtn: 'bg-blue-600/20 text-white border border-white/10', icon: 'text-blue-500' },
        female: { activeBtn: 'bg-pink-600/20 text-white border border-white/10', icon: 'text-pink-500' },
        other: { activeBtn: 'bg-purple-600/20 text-white border border-white/10', icon: 'text-purple-500' },
    };

    const theme = themeMap[user?.gender?.toLowerCase()] || themeMap.other;

    const userNavItems = [
        { icon: MessageSquare, label: 'Confessions', path: '/confessions' },
        { icon: Heart, label: 'Crushes', path: '/crushes' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Zap, label: 'Shadow Match', path: '/match' },
        { icon: Star, label: 'Elite Circle', path: '/friends' },
        { icon: Award, label: 'Leaderboard', path: '/leaderboard' },
    ];

    const adminNavItems = user?.role === 'admin' ? [
        { icon: Activity, label: 'Admin Overview', path: '/admin' },
        { icon: Users, label: 'User Control', path: '/admin/users' },
        { icon: Flag, label: 'Reports & Logs', path: '/admin/reports' },
        { icon: MessageSquare, label: 'Rooms Setup', path: '/admin/rooms' },
        { icon: Speaker, label: 'Ads Setup', path: '/admin/ads' },
    ] : [];

    const goTo = (path: string) => {
        navigate(path);
        setOpen(false);
    };

    const NavItem = ({ item, isAdminStyle = false }: { item: any; isAdminStyle?: boolean }) => {
        const isActive = location.pathname.split('?')[0] === item.path ||
            (item.path === '/admin' && location.pathname === '/admin');
        return (
            <button
                onClick={() => goTo(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all text-left ${isActive
                        ? isAdminStyle
                            ? 'bg-[#0a0a0a]/80 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]'
                            : theme.activeBtn
                        : isAdminStyle
                            ? 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? (isAdminStyle ? 'text-blue-500' : theme.icon) : ''}`} />
                <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
            </button>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-8 px-2">
                <Heart className="w-7 h-7 text-pink-500 fill-pink-500 flex-shrink-0" />
                <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
                    clgcrush
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
                <div className="space-y-1">
                    {userNavItems.map((item, i) => <NavItem key={`u-${i}`} item={item} />)}
                </div>

                {user?.role === 'admin' && (
                    <>
                        <div className="pt-5 pb-2">
                            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Command Center</p>
                        </div>
                        <div className="space-y-1">
                            {adminNavItems.map((item, i) => <NavItem key={`a-${i}`} item={item} isAdminStyle />)}
                        </div>
                    </>
                )}
            </nav>

            {/* Logout */}
            <div className="pt-4 border-t border-white/5">
                <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-gray-500 hover:text-red-400 transition-colors"
                >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>

            {/* Footer Credits */}
            <div className="pt-4 border-t border-white/5 mt-2 space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-2">Powered by</p>
                <a
                    href="https://www.instagram.com/devil_kk_1?igsh=MTlucnpoZnJ1NHhoag=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-2 py-1 rounded-xl hover:bg-pink-500/10 transition-all group"
                >
                    <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
                        DEVIL KK
                    </span>
                </a>
                <p className="text-[9px] text-gray-600 px-2 leading-relaxed font-bold tracking-wide">
                    Special Thanks to<br />
                    <span className="text-gray-500">✨ Devil Sena ✨</span>
                </p>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden bg-white/10 backdrop-blur-md border border-white/10 p-2 rounded-xl text-white shadow-lg"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile sidebar (slide-in) */}
            <aside
                className={`fixed top-0 left-0 h-full z-50 w-64 border-r border-white/5 bg-[#0a0a0c] backdrop-blur-3xl flex flex-col p-6 transition-transform duration-300 md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop sidebar (always visible) */}
            <aside className="hidden md:flex w-64 border-r border-white/5 bg-white/[0.02] backdrop-blur-3xl flex-col p-6 fixed h-full z-20">
                <SidebarContent />
            </aside>
        </>
    );
};

export default Sidebar;
