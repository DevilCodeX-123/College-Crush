import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

interface LayoutProps {
    children: React.ReactNode;
    isSurpriseActive?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, isSurpriseActive }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex">
            <Sidebar isSurpriseActive={isSurpriseActive} />
            {/* On desktop offset for sidebar, on mobile no offset (hamburger menu) */}
            <main className="flex-1 md:ml-64 min-h-screen relative">
                {/* Topbar / Profile Corner */}
                <div className="sticky top-0 z-30 flex justify-end px-4 md:px-8 py-4 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5">
                    {/* Spacer for mobile hamburger */}
                    <div className="flex-1 md:hidden" />
                    <div
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 md:gap-3 cursor-pointer bg-white/5 hover:bg-white/10 px-3 md:px-4 py-2 rounded-full border border-white/10 backdrop-blur-md transition-all shadow-lg"
                    >
                        <UserAvatar src={user?.profilePhoto} name={user?.name} className="w-7 h-7 md:w-8 md:h-8 rounded-full" />
                        <span className="font-bold text-xs md:text-sm tracking-wide max-w-[120px] truncate">{user?.name}</span>
                    </div>
                </div>

                {/* Page content */}
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
