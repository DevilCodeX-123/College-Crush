import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { QrCode, Image as ImageIcon, Video, Link as LinkIcon, Settings, RefreshCw, Save, CheckCircle2 } from 'lucide-react';

import api from '../../lib/api';
import { useToast } from '../../components/ui/use-toast';

const AdminQRRevealTab = () => {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [tokens, setTokens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/qr/settings');
            setSettings(data);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch settings', variant: 'destructive' });
        }
    };

    const fetchTokens = async () => {
        try {
            const { data } = await api.get('/qr/tokens');
            setTokens(data);
        } catch (error) {
            console.error('Failed to fetch tokens');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchSettings(), fetchTokens()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/qr/settings', settings);
            toast({ title: 'Success', description: 'Settings updated successfully' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateTokens = async () => {
        if (!confirm('This will invalidate all current QR codes. Continue?')) return;
        setGenerating(true);
        try {
            await api.post('/qr/tokens');
            await fetchTokens();
            toast({ title: 'Success', description: 'Generated 4 new tokens' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to generate tokens', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    const getRevealUrl = (token: string) => {
        // Absolute URL for the reveal endpoint that the QR will scan
        // In a real app, this would be your production URL
        return `${window.location.origin}/qr-reveal?token=${token}`;
    };

    if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-white">QR Reveal Control</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage the multi-part surprise reveal experience.</p>
                </div>
                <div className="flex space-x-4">
                    <button 
                        onClick={handleGenerateTokens}
                        disabled={generating}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-colors flex items-center shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-50"
                    >
                        {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                        Regenerate Tokens
                    </button>
                    <button 
                        form="qr-settings-form"
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors flex items-center shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save All Changes
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Forms */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-white/5 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl">
                        <form id="qr-settings-form" onSubmit={handleSaveSettings} className="space-y-10">
                            {/* Feature Status Toggle */}
                            <section className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center">
                                        <QrCode className="w-5 h-5 mr-2 text-blue-500" /> Feature Active Status
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">If enabled, the Surprise Reveal will be the main page (/).</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.settings.isActive}
                                        onChange={(e) => setSettings({...settings, settings: {...settings.settings, isActive: e.target.checked}})}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-xl"></div>
                                </label>
                            </section>

                            <div className="h-px bg-white/5"></div>

                            {/* Media Assets */}

                            <section>
                                <h3 className="text-lg font-bold text-blue-500 mb-6 flex items-center">
                                    <ImageIcon className="w-5 h-5 mr-2" /> Media Assets
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">Top Banner Image URL</label>
                                        <input 
                                            type="text" 
                                            value={settings.bannerImage} 
                                            onChange={(e) => setSettings({...settings, bannerImage: e.target.value})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white" 
                                            placeholder="https://example.com/banner.jpg" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">Full QR Image (Hidden until revealed)</label>
                                        <input 
                                            type="text" 
                                            value={settings.fullQRImage}
                                            onChange={(e) => setSettings({...settings, fullQRImage: e.target.value})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white" 
                                            placeholder="https://example.com/qr-full.png" 
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-white/5"></div>

                            {/* Video Control */}
                            <section>
                                <h3 className="text-lg font-bold text-pink-500 mb-6 flex items-center">
                                    <Video className="w-5 h-5 mr-2" /> Final Reveal Video
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">YouTube/Video Direct URL</label>
                                        <input 
                                            type="text" 
                                            value={settings.videoUrl}
                                            onChange={(e) => setSettings({...settings, videoUrl: e.target.value})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-white" 
                                            placeholder="https://youtube.com/watch?v=..." 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">Autoplay Delay (seconds)</label>
                                        <input 
                                            type="number" 
                                            value={settings.videoAutoplayDelay}
                                            onChange={(e) => setSettings({...settings, videoAutoplayDelay: parseInt(e.target.value)})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-pink-500 text-white" 
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3 pt-8">
                                        <input 
                                            type="checkbox" 
                                            checked={settings.isAutoplayEnabled}
                                            onChange={(e) => setSettings({...settings, isAutoplayEnabled: e.target.checked})}
                                            className="w-4 h-4 accent-pink-500" 
                                        />
                                        <span className="text-sm text-gray-300">Enable Autoplay</span>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-white/5"></div>

                            {/* CTA Section */}
                            <section>
                                <h3 className="text-lg font-bold text-green-500 mb-6 flex items-center">
                                    <LinkIcon className="w-5 h-5 mr-2" /> Call To Action (Post-Reveal)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">Button Text</label>
                                        <input 
                                            type="text" 
                                            value={settings.cta.text}
                                            onChange={(e) => setSettings({...settings, cta: {...settings.cta, text: e.target.value}})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500 text-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 font-medium mb-2 block">Registration/Target URL</label>
                                        <input 
                                            type="text" 
                                            value={settings.cta.url}
                                            onChange={(e) => setSettings({...settings, cta: {...settings.cta, url: e.target.value}})}
                                            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500 text-white" 
                                            placeholder="https://forms.gle/..." 
                                        />
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.cta.visible}
                                                onChange={(e) => setSettings({...settings, cta: {...settings.cta, visible: e.target.checked}})}
                                                className="w-4 h-4 accent-green-500" 
                                            />
                                            <span className="text-sm text-gray-300">Show Button</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.cta.openInNewTab}
                                                onChange={(e) => setSettings({...settings, cta: {...settings.cta, openInNewTab: e.target.checked}})}
                                                className="w-4 h-4 accent-green-500" 
                                            />
                                            <span className="text-sm text-gray-300">Open in New Tab</span>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <div className="h-px bg-white/5"></div>

                            {/* Advanced Settings */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-400 mb-6 flex items-center">
                                    <Settings className="w-5 h-5 mr-2" /> Advanced Polish
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <label className="flex flex-col items-center p-4 bg-[#0a0a0a]/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Confetti</span>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.settings.confetti}
                                            onChange={(e) => setSettings({...settings, settings: {...settings.settings, confetti: e.target.checked}})}
                                            className="w-5 h-5 accent-pink-500" 
                                        />
                                    </label>
                                    <label className="flex flex-col items-center p-4 bg-[#0a0a0a]/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Sound FX</span>
                                        <input 
                                            type="checkbox" 
                                            checked={settings.settings.sound}
                                            onChange={(e) => setSettings({...settings, settings: {...settings.settings, sound: e.target.checked}})}
                                            className="w-5 h-5 accent-blue-500" 
                                        />
                                    </label>
                                </div>
                            </section>
                        </form>
                    </Card>
                </div>

                {/* Token Preview / QR Generation */}
                <div className="space-y-6">
                    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-6 rounded-3xl">
                        <h3 className="text-lg font-bold text-purple-400 mb-6 flex items-center">
                            <QrCode className="w-5 h-5 mr-2" /> Live QR Tokens
                        </h3>
                        <div className="space-y-4">
                            {tokens.length > 0 ? tokens.map((t, i) => (
                                <div key={t._id} className="p-4 bg-white/5 rounded-2xl border border-white/10 group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase text-purple-500">Part {i + 1}</span>
                                        <span className={`text-[10px] font-black uppercase ${t.isUsed ? 'text-green-500' : 'text-gray-500'}`}>
                                            {t.isUsed ? 'Accessed' : 'Active'}
                                        </span>
                                    </div>
                                    <code className="text-xs text-gray-300 break-all font-mono block bg-black/30 p-2 rounded-lg">
                                        {t.token}
                                    </code>
                                    <div className="mt-3 hidden group-hover:flex space-x-2 animate-in fade-in zoom-in-95 duration-200">
                                        <button 
                                            onClick={() => window.open(getRevealUrl(t.token), '_blank')}
                                            className="text-[10px] font-black uppercase text-white/50 hover:text-white"
                                        >
                                            Preview Link
                                        </button>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(getRevealUrl(t.token));
                                                toast({ title: 'Copied', description: 'Reveal URL copied to clipboard' });
                                            }}
                                            className="text-[10px] font-black uppercase text-white/50 hover:text-white"
                                        >
                                            Copy Link
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-500 text-sm font-medium">
                                    No tokens active. <br /> Click Generate to start.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="border-blue-500/20 bg-blue-500/5 p-6 rounded-3xl">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Production Tip</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Use the copied reveal links with any QR generator (or your own implementation) to print or display the 4 parts.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminQRRevealTab;
