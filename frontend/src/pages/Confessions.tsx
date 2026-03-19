import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Sparkles, ShieldAlert, Smile, Zap, Flame, Ghost } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

const Confessions = () => {
  const [content, setContent] = useState('');
  const [confessions, setConfessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfessions = async () => {
    try {
      const { data } = await api.get('/confessions');
      setConfessions(data);
    } catch (err) {
      console.error('Failed to fetch confessions', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchConfessions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await api.post('/confessions', { content });
      setContent('');
      toast({
        title: "Confession Shared! ✨",
        description: "Your secret is safe on the wall.",
      });
      fetchConfessions();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to share confession.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (id: string, emoji: string) => {
    try {
      await api.post(`/confessions/${id}/react`, { emoji });
      fetchConfessions();
    } catch (err: any) {
      toast({
        title: "Action Denied",
        description: err.response?.data?.message || "Failed to react.",
        variant: "destructive",
      });
    }
  };


  const handleReport = async (id: string) => {
    const reason = window.prompt("Why are you reporting this confession?");
    if (!reason) return;

    try {
      await api.post(`/confessions/${id}/report`, { reason });
      toast({
        title: "Report Submitted",
        description: "Admin will review this confession.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit report.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-transparent">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 to-pink-500/10 border border-white/5 backdrop-blur-xl mb-4"
          >
            <Ghost className="w-10 h-10 text-white animate-bounce" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Confession <small className="text-pink-500">Wall</small>
          </h1>
          <p className="text-gray-400 font-light text-lg">
            Speak your truth, anonymously. What's on your mind today?
          </p>
        </section>

        {/* Create Confession */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="The secret I've never told anyone is..."
                  className="min-h-[150px] relative bg-black/40 border-white/5 rounded-2xl p-6 text-white text-lg font-light placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/30 transition-all resize-none"
                  maxLength={500}
                />
                <div className="absolute bottom-4 right-4 text-gray-600 text-xs font-mono">
                  {content.length}/500
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs text-gray-500 uppercase tracking-widest font-black">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>100% Anonymous</span>
                </div>
                <Button
                  disabled={loading || !content.trim()}
                  className="h-12 px-8 bg-white text-black hover:bg-white/90 rounded-xl font-bold shadow-xl shadow-white/5"
                >
                  {loading ? 'Manifesting...' : (
                    <span className="flex items-center">
                      Post Anonymously <Send className="w-4 h-4 ml-2" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Confessions Feed */}
        <div className="space-y-8">
          <AnimatePresence>
            {fetching ? (
              <div className="flex justify-center p-20">
                <Sparkles className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : confessions.length === 0 ? (
              <div className="text-center py-20 text-gray-500 font-light italic">
                The wall is quiet... for now.
              </div>
            ) : (
              confessions.map((confession: any, idx: number) => (
                <motion.div
                  key={confession._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-white/5 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] hover:border-white/10 transition-all group overflow-hidden">
                    <CardHeader className="pb-4 pt-8 px-8 flex flex-row items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                          <Zap className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">Anonymous Student</p>
                          <p className="text-[10px] text-gray-600 uppercase tracking-wider font-black">
                            {formatDistanceToNow(new Date(confession.createdAt))} ago
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReport(confession._id)}
                          className="text-gray-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-full"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                      <p className="text-xl text-gray-200 leading-relaxed font-light">
                        {confession.content}
                      </p>
                    </CardContent>

                    <CardFooter className="px-8 pb-8 pt-0 flex border-t border-white/5 mt-4">
                      <div className="flex items-center space-x-6 mt-6">
                        <button
                          onClick={() => handleReact(confession._id, 'love')}
                          className="flex items-center space-x-2 text-pink-500/60 hover:text-pink-500 transition-colors group/btn"
                        >
                          <div className="p-2 rounded-full group-hover/btn:bg-pink-500/10 transition-colors">
                            <Heart className={`w-5 h-5 ${confession.reactedUsers?.some((r: any) => r.user === user?._id && r.emoji === 'love') ? 'fill-pink-500' : ''}`} />
                          </div>
                          <span className="text-sm font-bold">{confession.reactions?.love || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReact(confession._id, 'funny')}
                          className="flex items-center space-x-2 text-blue-500/60 hover:text-blue-500 transition-colors group/btn"
                        >
                          <div className="p-2 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                            <Smile className={`w-5 h-5 ${confession.reactedUsers?.some((r: any) => r.user === user?._id && r.emoji === 'funny') ? 'fill-blue-500' : ''}`} />
                          </div>
                          <span className="text-sm font-bold">{confession.reactions?.funny || 0}</span>
                        </button>

                        <button
                          onClick={() => handleReact(confession._id, 'fire')}
                          className="flex items-center space-x-2 text-orange-500/60 hover:text-orange-500 transition-colors group/btn"
                        >
                          <div className="p-2 rounded-full group-hover/btn:bg-orange-500/10 transition-colors">
                            <Flame className={`w-5 h-5 ${confession.reactedUsers?.some((r: any) => r.user === user?._id && r.emoji === 'fire') ? 'fill-orange-500' : ''}`} />
                          </div>
                          <span className="text-sm font-bold">{confession.reactions?.fire || 0}</span>
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Confessions;
