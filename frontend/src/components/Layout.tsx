import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen relative p-8">
                {/* Topbar / Profile Corner */}
                <div className="absolute top-6 right-8 z-50">
                    <div 
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-3 cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md transition-all shadow-lg"
                    >
                        <UserAvatar src={user?.profilePhoto} name={user?.name} className="w-8 h-8 rounded-full" />

                        <span className="font-bold text-sm tracking-wide">{user?.name}</span>
                    </div>
                </div>
                
                {children}
            </main>
        </div>
    );
};

export default Layout;
