import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Loader2, ChevronRight, Camera, Image as ImageIcon, X, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import api from '../lib/api';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';

const QRRevealPage = () => {
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [settings, setSettings] = useState<any>(null);
    const [unlockedParts, setUnlockedParts] = useState<number[]>([]); // Array of indices (0-3)
    const [isMerging, setIsMerging] = useState(false);
    const [scanMode, setScanMode] = useState<'camera' | 'image' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [revealed, setRevealed] = useState(false);
    const [showSurpriseText, setShowSurpriseText] = useState(false);
    
    const qrInstanceRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Crackers/Sparkles Effect Component (Fireworks)
    const SparkleEmitter = ({ active }: { active: boolean }) => {
        if (!active) return null;
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                        animate={{ 
                            opacity: [0, 1, 0], 
                            scale: [0, 1.2, 0],
                            x: [`50%`, `${50 + (Math.random() - 0.5) * 120}%`],
                            y: [`50%`, `${50 + (Math.random() - 0.5) * 120}%`]
                        }}
                        transition={{ 
                            duration: 1.2, 
                            repeat: Infinity, 
                            delay: Math.random() * 2,
                            ease: "easeOut"
                        }}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_8px_#fbbf24]"
                    />
                ))}
            </div>
        );
    };

    // Animated Background Blobs
    const BackgroundBlobs = () => (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <motion.div 
                animate={{ 
                    x: [0, 100, 0], 
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"
            />
            <motion.div 
                animate={{ 
                    x: [0, -80, 0], 
                    y: [0, 100, 0],
                    scale: [1, 1.3, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 -right-20 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px]"
            />
            <motion.div 
                animate={{ 
                    x: [0, 50, 0], 
                    y: [0, -100, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px]"
            />
        </div>
    );

    useEffect(() => {
        return () => {
            if (qrInstanceRef.current) {
                qrInstanceRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/qr/settings');
            setSettings(data);
            
            const saved = localStorage.getItem('qr_reveal_progress');
            if (saved) {
                const parsed = JSON.parse(saved);
                setUnlockedParts(parsed);
                if (parsed.length === 4) setRevealed(true);
            }
        } catch (error) {
            console.error('Failed to fetch QR settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const token = searchParams.get('token');
        if (token && !loading) {
            handleReveal(token);
        }
    }, [searchParams, loading]);

    const handleReveal = async (token: string) => {
        try {
            const { data } = await api.post('/qr/reveal', { token });
            const partIndex = data.partIndex;
            
            if (!unlockedParts.includes(partIndex)) {
                const newProgress = [...unlockedParts, partIndex];
                setUnlockedParts(newProgress);
                localStorage.setItem('qr_reveal_progress', JSON.stringify(newProgress));
                
                setShowSurpriseText(true);
                setTimeout(() => setShowSurpriseText(false), 2000);
                
                if (newProgress.length === 4) {
                    setTimeout(() => {
                        setIsMerging(true);
                    }, 800);
                }
                toast({ title: 'Success!', description: `Unlocked Part ${partIndex + 1}` });
            } else {
                toast({ title: 'Already Unlocked', description: 'This part is already revealed.' });
            }
        } catch (error) {
            toast({ title: 'Invalid Code', description: 'This QR code is not part of the surprise.', variant: 'destructive' });
        }
    };

    const stopScanning = async () => {
        if (qrInstanceRef.current) {
            try {
                await qrInstanceRef.current.stop();
            } catch (e) {}
            qrInstanceRef.current = null;
        }
        setScanMode(null);
        setIsProcessing(false);
    };

    const startCamera = async () => {
        setScanMode('camera');
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                qrInstanceRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { 
                        fps: 30, 
                        qrbox: undefined,
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        let token = decodedText;
                        if (decodedText.includes('token=')) {
                            token = decodedText.split('token=')[1].split('&')[0];
                        }
                        handleReveal(token);
                        stopScanning();
                    },
                    () => {} 
                );
            } catch (err) {
                toast({ title: 'Camera Error', description: 'Please allow camera access.', variant: 'destructive' });
                setScanMode(null);
            }
        }, 100);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setScanMode('image');
        
        try {
            // Helper to add white padding (Quiet Zone) to images that lack it
            const addQuietZone = (file: File): Promise<File> => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const padding = Math.max(img.width, img.height) * 0.15; // 15% padding
                            canvas.width = img.width + (padding * 2);
                            canvas.height = img.height + (padding * 2);
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return resolve(file);
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            // Apply slight sharpening/contrast for better detection
                            ctx.filter = 'contrast(1.2) brightness(1.05)';
                            ctx.drawImage(img, padding, padding);
                            canvas.toBlob((blob) => {

                                if (blob) resolve(new File([blob], file.name, { type: 'image/png' }));
                                else resolve(file);
                            }, 'image/png');
                        };
                        img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                });
            };

            const paddedFile = await addQuietZone(file);
            const html5QrCode = new Html5Qrcode("image-reader-dummy");
            const decodedText = await html5QrCode.scanFile(paddedFile, true);
            let token = decodedText;
            if (decodedText.includes('token=')) {
                token = decodedText.split('token=')[1].split('&')[0];
            }
            await handleReveal(token);
        } catch (err) {
            toast({ title: 'Decode Failed', description: 'No QR code found in this image. Try adding a white border or use a clearer image.', variant: 'destructive' });
        } finally {
            setIsProcessing(false);
            setScanMode(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    const triggerFinalReveal = () => {
        setRevealed(true);
        if (settings?.settings?.confetti) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#f43f5e', '#3b82f6', '#fbbf24', '#a855f7']
            });
        }
    };

    const getGridStyles = (idx: number) => {
        const isUnlocked = unlockedParts.includes(idx);
        const bgPos = [
            '0% 0%', '100% 0%',
            '0% 100%', '100% 100%'
        ][idx];
        
        return {
            backgroundImage: settings?.bannerImage ? `url(${settings.bannerImage})` : 'none',
            backgroundSize: '200% 200%',
            backgroundPosition: bgPos,
            filter: isUnlocked ? 'none' : 'blur(20px) brightness(0.2) grayscale(100%)',
            opacity: isUnlocked ? 1 : 0.4,
            transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        };
    };

    if (loading) return (
        <div className="min-h-screen bg-[#060608] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="w-12 h-12 text-pink-500" />
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#060608] text-white selection:bg-pink-500/30 overflow-x-hidden relative pb-20 font-sans">
            <BackgroundBlobs />
            <SparkleEmitter active={!revealed && unlockedParts.length > 0} />

            {/* Top Banner Image */}
            {settings?.bannerImage && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="flex justify-center pt-12">
                    <div className="w-40 h-40 md:w-56 md:h-56 relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] group">
                        <motion.img animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity }} src={settings.bannerImage} className="w-full h-full object-cover" alt="Banner" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                </motion.div>
            )}

            {/* Header Area */}
            <div className="relative pt-8 pb-12 px-6 text-center">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-4">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
                        See The <br className="md:hidden" />
                        <span className="bg-gradient-to-r from-blue-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent">Surprise</span>
                    </h1>
                    <div className="flex items-center justify-center space-x-2">
                        <QrCode className="w-4 h-4 text-white/40" />
                        <p className="text-gray-400 font-black tracking-[0.4em] text-[8px] md:text-[10px] uppercase italic opacity-60">Unlock all 4 quadrants to reveal</p>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-4xl mx-auto px-6 space-y-12 pb-10">
                
                {/* Win Animation Overlay */}
                <AnimatePresence>
                    {showSurpriseText && (
                        <motion.div initial={{ opacity: 0, scale: 0.5, rotate: -10 }} animate={{ opacity: 1, scale: 1.5, rotate: 5 }} exit={{ opacity: 0, scale: 2, rotate: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                            <h2 className="text-7xl md:text-9xl font-black text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.6)] italic uppercase text-center">WIN!</h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 2x2 Reveal Grid */}
                <div className="relative max-w-[220px] mx-auto aspect-square rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl bg-black/40">
                    <div className={`grid grid-cols-2 gap-0 w-full h-full transition-all duration-1000 ${isMerging && !revealed ? 'scale-90 opacity-50 blur-sm' : ''}`}>
                        {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className="relative aspect-square overflow-hidden">
                                <div className="absolute inset-0 bg-no-repeat" style={getGridStyles(idx)} />
                                {!unlockedParts.includes(idx) && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] border-[0.5px] border-white/5 pointer-events-none">
                                        <Lock className="w-5 h-5 text-white/20 mb-1" />
                                        <span className="text-[8px] font-black text-white/10 tracking-[0.3em] uppercase">{idx + 1}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Reveal Overlay Part */}
                <AnimatePresence>
                    {isMerging && !revealed && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
                            <button onClick={triggerFinalReveal} className="group relative px-6 py-3 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-tighter text-xl shadow-[0_0_60px_rgba(250,204,21,0.6)] hover:scale-105 active:scale-95 transition-all">
                                <Sparkles className="w-5 h-5 mr-2 animate-bounce inline-block" /> REVEAL
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress bars */}
                {!revealed && !isMerging && (
                    <div className="max-w-xs mx-auto text-center space-y-6">
                        <div className="flex justify-center space-x-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`w-12 h-1 rounded-full overflow-hidden bg-white/5`}>
                                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: unlockedParts.includes(i) ? 1 : 0 }} className={`w-full h-full origin-left bg-gradient-to-r from-yellow-400 to-orange-500`} transition={{ duration: 1 }} />
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">
                             {unlockedParts.length === 0 ? 'READY FOR SCAN' : `PROGRESS: ${unlockedParts.length}/4`}
                        </p>
                    </div>
                )}

                {/* Full Reveal Section */}
                <AnimatePresence>
                    {revealed && (
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 py-10">
                            <header className="text-center space-y-4">
                                <h2 className="text-5xl md:text-8xl font-black bg-gradient-to-r from-yellow-300 via-white to-gray-400 bg-clip-text text-transparent italic tracking-tighter">SURPRISE!</h2>
                            </header>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
                                <div className="relative rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10 bg-black aspect-video">
                                    {settings?.videoUrl ? (
                                        <video className="w-full h-full object-contain" controls autoPlay={settings.isAutoplayEnabled} src={settings.videoUrl} playsInline />
                                    ) : (
                                        <img src={settings?.bannerImage} alt="Surprise" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </motion.div>
                            {settings?.cta?.visible && (
                                <div className="text-center pt-8">
                                    <motion.a href={settings.cta.url} target={settings.cta.openInNewTab ? "_blank" : "_self"} rel="noopener noreferrer" className="inline-flex items-center px-14 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-tighter text-2xl hover:bg-yellow-400 transition-colors">
                                        {settings.cta.text} <ChevronRight className="w-8 h-8 ml-3" />
                                    </motion.a>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CUSTOM SCANNER OPTIONS */}
                {!revealed && (
                    <div className="pt-8 flex flex-col items-center space-y-8">
                        <AnimatePresence>

                            {!scanMode ? (
                                <motion.div key="choice" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                                    <button onClick={startCamera} className="group relative p-8 bg-blue-600/10 border border-white/10 rounded-[2.5rem] flex flex-col items-center hover:bg-blue-600/20 transition-all overflow-hidden">
                                        <Camera className="w-10 h-10 mb-4 text-blue-400" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Scan via Camera</span>
                                    </button>
                                    <button onClick={() => fileInputRef.current?.click()} className="group relative p-8 bg-pink-600/10 border border-white/10 rounded-[2.5rem] flex flex-col items-center hover:bg-pink-600/20 transition-all overflow-hidden">
                                        <ImageIcon className="w-10 h-10 mb-4 text-pink-400" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white/80">Scan via Image</span>
                                    </button>
                                </motion.div>
                            ) : scanMode === 'camera' ? (
                                <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
                                    <Card className="bg-black/60 backdrop-blur-2xl border border-white/20 rounded-[3rem] overflow-hidden p-3 relative">
                                        <style dangerouslySetInnerHTML={{ __html: `
                                            #reader video { 
                                                border-radius: 2rem !important; 
                                                width: 90% !important; 
                                                height: 90% !important;
                                                margin: auto !important;
                                                position: absolute !important;
                                                top: 50% !important;
                                                left: 50% !important;
                                                transform: translate(-50%, -50%) !important;
                                                object-fit: cover !important;
                                            }
                                        ` }} />
                                        <div id="reader" className="w-full relative rounded-[2.5rem] overflow-hidden bg-black/40 aspect-square" />
                                        <motion.div animate={{ y: [0, 250, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-4 left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,1)] z-10 pointer-events-none" />
                                        <button onClick={stopScanning} className="w-full py-6 text-red-500 font-black uppercase tracking-[0.4em] text-[10px] flex items-center justify-center hover:text-red-400 transition-colors">
                                            <X className="w-4 h-4 mr-2" /> Stop Camera
                                        </button>
                                    </Card>
                                </motion.div>
                            ) : scanMode === 'image' && isProcessing ? (
                                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center space-y-4">

                                    <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-pink-500 italic">Decoding Fragment...</p>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        <div id="image-reader-dummy" className="hidden" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRRevealPage;
