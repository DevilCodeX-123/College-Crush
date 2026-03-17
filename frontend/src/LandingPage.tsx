import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Sparkles, Users } from 'lucide-react';
import { Button } from './components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] text-white">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            clgcrush
          </span>
        </div>
        <div className="space-x-4">
          <Button variant="ghost" onClick={() => navigate('/login')} className="text-white hover:bg-white/10">Login</Button>
          <Button onClick={() => navigate('/signup')} className="bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-pink-500/20">
            Join Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-pink-300">
            <Sparkles className="w-4 h-4 mr-2" />
            Connect with your campus anonymously
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-none bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
            Share Your <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Campus Crush
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10 leading-relaxed font-light">
            The modern social platform for college students. Express your feelings, 
            share anonymous confessions, and find your secret match without the pressure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="h-14 px-10 text-lg font-bold bg-white text-black hover:bg-white/90 rounded-2xl transition-all hover:scale-105"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-14 px-10 text-lg font-bold border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-sm"
            >
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Floating Cards (Visual) */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { icon: Heart, title: 'Secret Crushes', desc: 'Send anonymous requests and reveal only when matched.', color: 'text-pink-500' },
            { icon: MessageCircle, title: 'Confession Wall', desc: 'Share your thoughts anonymously on the campus feed.', color: 'text-blue-500' },
            { icon: Users, title: 'Campus Groups', desc: 'Join discussions based on your actual interests.', color: 'text-purple-500' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-8 rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-xl hover:border-white/20 transition-all group"
            >
              <feature.icon className={`w-12 h-12 mb-6 ${feature.color} group-hover:scale-110 transition-transform`} />
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-10 border-t border-white/5 text-center text-gray-500 text-sm font-light">
        © 2026 clgcrush. Built for the modern student.
      </footer>
    </div>
  );
};

export default LandingPage;
