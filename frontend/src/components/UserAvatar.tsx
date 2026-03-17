import React from 'react';

interface UserAvatarProps {
    src?: string;
    name?: string;
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, className = "w-8 h-8 rounded-full" }) => {
    if (src) {
        return <img src={src} className={`${className} object-cover`} alt={name || "User"} />;
    }

    const initials = name 
        ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
        : '?';

    return (
        <div className={`${className} flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-black tracking-widest text-xs shadow-inner`}>
            {initials}
        </div>
    );
};

export default UserAvatar;
