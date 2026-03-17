import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

const EditProfile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [gender, setGender] = useState(user?.gender || 'other');
    const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
    const [loading, setLoading] = useState(false);

    const themePresets: Record<string, { gradient: string, button: string }> = {
        Male: {
            gradient: 'from-blue-400 to-blue-600',
            button: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-500/20'
        },
        Female: {
            gradient: 'from-pink-400 to-pink-600',
            button: 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 shadow-pink-500/20'
        },
        Other: {
            gradient: 'from-purple-400 to-purple-600',
            button: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-purple-500/20'
        }
    };

    const currentTheme = themePresets[gender as keyof typeof themePresets] || themePresets.Other;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put('/users/profile', {
                name, bio, gender, profilePhoto
            });
            setUser(data);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error updating profile', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 overflow-hidden relative">
            {/* Background Orbs */}
            <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full ${gender === 'Male' ? 'bg-blue-500/10' : gender === 'Female' ? 'bg-pink-500/10' : 'bg-purple-500/10'} blur-[120px] transition-all duration-1000`}></div>
            <div className={`absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full ${gender === 'Male' ? 'bg-blue-400/5' : gender === 'Female' ? 'bg-pink-400/5' : 'bg-purple-400/5'} blur-[120px] transition-all duration-1000`}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg z-10"
            >
                <Card className="border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden relative border-t-white/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <CardHeader className="pt-12 pb-8">
                        <CardTitle className={`text-4xl font-black text-center bg-gradient-to-r ${currentTheme.gradient} bg-clip-text text-transparent transition-all duration-500 tracking-tighter`}>
                            Elite Persona
                        </CardTitle>
                        <p className="text-center text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black mt-2 opacity-50">Customize your identity</p>
                    </CardHeader>
                    <CardContent className="px-10 pb-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <Label className="text-gray-400 text-[10px] uppercase tracking-widest font-black ml-1">Display Name</Label>
                                <Input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-pink-500/20 text-lg font-medium px-6 transition-all"
                                    placeholder="Your Campus Alias"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-gray-400 text-[10px] uppercase tracking-widest font-black ml-1">Your Story (Bio)</Label>
                                <textarea 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-32 text-sm focus:ring-pink-500/20 text-gray-200 font-light resize-none transition-all placeholder:text-gray-700"
                                    placeholder="What's your vibe today?"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-gray-400 text-[10px] uppercase tracking-widest font-black ml-1">Identity (Theme)</Label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-pink-500/20 px-6">
                                            <SelectValue placeholder="Identity" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0c] border-white/10 text-white rounded-2xl">
                                            <SelectItem value="Male" className="focus:bg-blue-500/20">Male (Blue)</SelectItem>
                                            <SelectItem value="Female" className="focus:bg-pink-500/20">Female (Pink)</SelectItem>
                                            <SelectItem value="Other" className="focus:bg-purple-500/20">Other (Purple)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-gray-400 text-[10px] uppercase tracking-widest font-black ml-1">Avatar URL</Label>
                                    <Input 
                                        value={profilePhoto}
                                        onChange={(e) => setProfilePhoto(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-pink-500/20 px-6"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 space-y-4">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full bg-gradient-to-r ${currentTheme.button} h-16 rounded-2xl font-black text-lg shadow-2xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] border border-white/10`}
                                >
                                    {loading ? 'Saving Changes...' : 'Save Elite Profile'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full h-12 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Back to Campus
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default EditProfile;
