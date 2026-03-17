import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Heart, MessageSquare, Sparkles, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [crushMessage] = useState('I have a crush on you! ❤️');
    const [sendingCrush, setSendingCrush] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/users/${id}`);
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id]);

    const handleAddCrush = async () => {
        setSendingCrush(true);
        try {
            await api.post('/crushes', {
                receiverId: id,
                message: crushMessage
            });
            alert('Crush sent anonymously! If they like you back, it\'s a match! ✨');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error sending crush');
        } finally {
            setSendingCrush(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">Loading...</div>;
    if (!profile) return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">User not found</div>;

    const themeMap: Record<string, any> = {
        male: {
            text: 'text-blue-500',
            bg: 'bg-blue-600',
            hover: 'hover:bg-blue-500',
            orb: 'bg-blue-500/10',
            border: 'from-blue-500',
            accent: 'text-blue-400'
        },
        female: {
            text: 'text-pink-500',
            bg: 'bg-pink-600',
            hover: 'hover:bg-pink-500',
            orb: 'bg-pink-500/10',
            border: 'from-pink-500',
            accent: 'text-pink-400'
        },
        other: {
            text: 'text-purple-500',
            bg: 'bg-purple-600',
            hover: 'hover:bg-purple-500',
            orb: 'bg-purple-500/10',
            border: 'from-purple-500',
            accent: 'text-purple-400'
        }
    };

    const theme = themeMap[profile.gender?.toLowerCase()] || themeMap.other;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full ${theme.orb} blur-[150px] opacity-20 transition-all duration-1000`}></div>
            <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full ${theme.orb} blur-[150px] opacity-10 transition-all duration-1000`}></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="mb-12 text-gray-500 hover:text-white group transition-all"
                >
                    <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" /> 
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black">Leave Profile</span>
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Main Profile Info */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 space-y-8"
                    >
                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-16 overflow-hidden relative border-t-white/20 shadow-2xl">
                            <div className={`absolute top-0 right-0 w-80 h-80 ${theme.orb} blur-[120px] -mr-40 -mt-40`}></div>
                            
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12">
                                    <div className={`w-44 h-44 rounded-[2.5rem] bg-gradient-to-br ${theme.border} to-white/20 p-[2px] shadow-2xl shadow-black/50 ring-1 ring-white/10`}>
                                        <div className="w-full h-full rounded-[38px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                            {profile.profilePhoto ? (
                                                <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" />
                                            ) : (
                                                <User className="w-16 h-16 text-gray-700" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left pt-4">
                                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest font-black text-gray-400 mb-4">
                                            <Sparkles className={`w-3 h-3 mr-2 ${theme.text}`} /> Elite Persona
                                        </div>
                                        <h1 className="text-6xl font-black mb-4 tracking-tighter leading-none">{profile.name}</h1>
                                        <p className="text-gray-400 text-lg font-light leading-relaxed max-w-lg">
                                            {profile.bio || "This soul hasn't whispered their story yet..."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 mt-12 justify-center md:justify-start">
                                    <Button 
                                        onClick={handleAddCrush}
                                        disabled={sendingCrush}
                                        size="lg"
                                        className={`${theme.bg} ${theme.hover} rounded-2xl px-10 h-16 text-lg font-black shadow-xl shadow-black/20 border border-t-white/10 transition-all hover:scale-105 active:scale-95`}
                                    >
                                        <Heart className="w-5 h-5 mr-3 fill-white" /> 
                                        {sendingCrush ? 'Sending Secret...' : 'Send Crush'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="lg"
                                        className="border-white/10 bg-white/5 backdrop-blur-md rounded-2xl px-10 h-16 text-lg font-bold hover:bg-white/10 transition-all"
                                    >
                                        <MessageSquare className="w-5 h-5 mr-3" /> Anonymous DM
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Additional Info / About */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <Card className="border-white/5 bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] p-10 border-t-white/10 shadow-xl">
                                 <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-6">Interests & Vibes</h4>
                                 <div className="flex flex-wrap gap-2">
                                     {profile.interests?.length > 0 ? profile.interests.map((interest: string, i: number) => (
                                         <span key={i} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                                             {interest}
                                         </span>
                                     )) : (
                                         <p className="text-gray-600 text-xs font-light py-2 italic">No interests listed yet.</p>
                                     )}
                                 </div>
                             </Card>
                             <Card className="border-white/5 bg-white/[0.02] backdrop-blur-2xl rounded-[2.5rem] p-10 border-t-white/10 shadow-xl flex flex-col justify-center items-center text-center">
                                 <p className="text-gray-500 text-xs font-light mb-2 italic">Joined ClgCrush</p>
                                 <p className="text-lg font-black">{new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
                             </Card>
                        </div>
                    </motion.div>

                    {/* Stats Sidebar */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 space-y-8"
                    >
                        <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 text-center border-t-white/20 shadow-2xl space-y-12">
                            <div>
                                <div className={`w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-yellow-500/20`}>
                                    <Sparkles className="w-8 h-8 text-yellow-500" />
                                </div>
                                <p className="text-5xl font-black tracking-tighter">{profile.visitCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-extrabold mt-3">Elite Power</p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div>
                                <div className={`w-16 h-16 rounded-3xl bg-pink-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-pink-500/20`}>
                                    <Heart className="w-8 h-8 text-pink-500" />
                                </div>
                                <p className="text-5xl font-black tracking-tighter">{profile.crushCount || 0}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-extrabold mt-3">Total Crushes</p>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                            <div>
                                <div className={`w-16 h-16 rounded-3xl ${theme.accentBg || 'bg-white/5'} flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/10`}>
                                    <User className={`w-8 h-8 ${theme.text}`} />
                                </div>
                                <p className="text-lg font-black tracking-tight">{profile.gender || 'Unknown'}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-extrabold mt-3">Gender Reveal</p>
                            </div>
                        </Card>

                        {/* Reputation Card */}
                        <Card className="border-white/10 bg-gradient-to-br from-white/5 to-white/10 rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-xl">
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                             <h5 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-2">Campus Reputation</h5>
                             <div className="text-2xl font-black bg-gradient-to-r from-yellow-500 via-white to-yellow-500 bg-clip-text text-transparent">CAMPUS LEGEND</div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
