import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Heart, Sparkles, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/users/login', { email, password });
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-500/10 blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl shadow-pink-500/5">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-pink-500/20 border border-white/10 backdrop-blur-sm">
                <Heart className="w-8 h-8 text-pink-500 fill-pink-500 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400 font-light">
              Reconnect with your campus community
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300 ml-1">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all font-light"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" name="password" className="text-sm font-medium text-gray-300 ml-1">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all font-light pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-opacity"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5 opacity-70" /> : <Eye className="w-5 h-5 opacity-70" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white border-0 rounded-xl shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold"
                disabled={loading}
              >
                {loading ? 'Entering...' : (
                  <span className="flex items-center justify-center">
                    Enter <LogIn className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-8 pt-4 flex flex-col space-y-4 text-center">
            <p className="text-gray-400 text-sm font-light">
              Don't have an account?{' '}
              <Link to="/signup" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
                Sign Up
              </Link>
            </p>
            <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-600 uppercase tracking-widest font-black">
              <Sparkles className="w-3 h-3" />
              <span>clgcrush anonymous</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
