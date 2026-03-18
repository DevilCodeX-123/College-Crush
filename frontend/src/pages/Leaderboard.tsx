import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Award, TrendingUp, Crown } from 'lucide-react';
import api from '../lib/api';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await api.get('/users/leaderboard');
                setTopUsers(data);
            } catch (error) {
                console.error('Error fetching leaderboard', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading campus fame...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black mb-2 flex items-center">
                        <Award className="w-10 h-10 mr-4 text-yellow-500" />
                        Campus Elite
                    </h1>
                    <p className="text-gray-500 font-light">The most viewed and popular personalities of the week.</p>
                </div>
                <div className="flex items-center space-x-2 text-pink-500 font-black uppercase tracking-widest text-[10px] bg-pink-500/10 px-4 py-2 rounded-full border border-pink-500/20">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live Standings</span>
                </div>
            </header>

            <div className="relative">
                {/* Top 3 Podium (Conceptual realization) */}
                <div className="grid grid-cols-3 gap-8 items-end mb-12">
                    {/* Rank 2 */}
                    {topUsers[1] && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 text-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl"></div>
                                <div className="text-2xl font-black text-gray-500 mb-4">#2</div>
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-white/10 p-[1px] mx-auto mb-4">
                                    <div className="w-full h-full rounded-[15px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                        <img src={topUsers[1].profilePhoto} alt="" />
                                    </div>
                                </div>
                                <h4 className="font-bold mb-1">{topUsers[1].name}</h4>
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{topUsers[1].visitCount} Visits</p>
                            </Card>
                        </motion.div>
                    )}

                    {/* Rank 1 */}
                    {topUsers[0] && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="z-10">
                            <Card className="border-pink-500/30 bg-gradient-to-b from-pink-500/[0.08] to-white/5 backdrop-blur-2xl rounded-[3rem] p-10 text-center relative overflow-hidden ring-4 ring-pink-500/10 scale-110">
                                <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-pink-500 to-white/10 p-[2px] mx-auto mb-6">
                                    <div className="w-full h-full rounded-[30px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                        <img src={topUsers[0].profilePhoto} alt="" />
                                    </div>
                                </div>
                                <h4 className="text-xl font-black mb-1">{topUsers[0].name}</h4>
                                <p className="text-xs text-pink-500 font-black uppercase tracking-widest">{topUsers[0].visitCount} Visits</p>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50"></div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Rank 3 */}
                    {topUsers[2] && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card className="border-white/10 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 text-center relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl"></div>
                                <div className="text-2xl font-black text-gray-500 mb-4">#3</div>
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-white/10 p-[1px] mx-auto mb-4">
                                    <div className="w-full h-full rounded-[15px] bg-[#0a0a0c] flex items-center justify-center overflow-hidden">
                                        <img src={topUsers[2].profilePhoto} alt="" />
                                    </div>
                                </div>
                                <h4 className="font-bold mb-1">{topUsers[2].name}</h4>
                                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{topUsers[2].visitCount} Visits</p>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Remaining List */}
                <div className="space-y-4">
                    {topUsers.slice(3).map((u, i) => (
                        <motion.div key={u._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (i + 4) * 0.05 }}>
                            <Card className="border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-3xl p-4 flex items-center justify-between group">
                                <div className="flex items-center space-x-6">
                                    <span className="w-8 text-center font-black text-gray-600 group-hover:text-white transition-colors">#{i + 4}</span>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-white/20">
                                        <img src={u.profilePhoto} alt="" />
                                    </div>
                                    <span className="font-bold text-gray-200">{u.name}</span>
                                </div>
                                <div className="flex items-center space-x-8 px-6">
                                    <div className="text-right">
                                        <p className="text-sm font-black">{u.visitCount}</p>
                                        <p className="text-[8px] uppercase tracking-widest text-gray-500 font-black">Profile Visits</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all`}>
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
