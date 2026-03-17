import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Heart, Sparkles, UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const themePresets: Record<string, { orb1: string, orb2: string, heart: string, shadow: string, button: string }> = {
    Male: {
      orb1: 'bg-blue-500/10',
      orb2: 'bg-blue-400/5',
      heart: 'text-blue-500 fill-blue-500',
      shadow: 'shadow-blue-500/5',
      button: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-500/20'
    },
    Female: {
      orb1: 'bg-pink-500/10',
      orb2: 'bg-pink-400/5',
      heart: 'text-pink-500 fill-pink-500',
      shadow: 'shadow-pink-500/5',
      button: 'from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 shadow-pink-500/20'
    },
    Other: {
      orb1: 'bg-purple-500/10',
      orb2: 'bg-purple-400/5',
      heart: 'text-purple-500 fill-purple-500',
      shadow: 'shadow-purple-500/5',
      button: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-purple-500/20'
    },
    default: {
      orb1: 'bg-blue-500/10',
      orb2: 'bg-pink-500/10',
      heart: 'text-pink-500 fill-pink-500',
      shadow: 'shadow-pink-500/5',
      button: 'from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 shadow-pink-500/20'
    }
  };

  const currentTheme = themePresets[formData.gender as keyof typeof themePresets] || themePresets.default;
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/users', formData);
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] overflow-hidden">
      {/* Background Orbs */}
      <div className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full ${currentTheme.orb1} blur-[120px] transition-all duration-1000`}></div>
      <div className={`absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full ${currentTheme.orb2} blur-[120px] transition-all duration-1000`}></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <Card className={`border-white/10 bg-white/5 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl ${currentTheme.shadow} transition-all duration-500`}>
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                <Heart className={`w-8 h-8 ${currentTheme.heart} animate-pulse transition-all duration-500`} />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-white">Join the Community</CardTitle>
            <CardDescription className="text-gray-400 font-light">
              Start sharing your anonymous crushes today
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300 ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 font-light"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300 ml-1">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 font-light"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-300 ml-1">Gender</Label>
                  <Select onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-white focus:ring-pink-500/20">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151518] border-white/10 text-white rounded-xl">
                      <SelectItem value="Male" className="focus:bg-blue-500/20">Male</SelectItem>
                      <SelectItem value="Female" className="focus:bg-pink-500/20">Female</SelectItem>
                      <SelectItem value="Other" className="focus:bg-purple-500/20">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300 ml-1">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 font-light pr-10"
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300 ml-1">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-11 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-pink-500/20 focus:border-pink-500/50 font-light pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-opacity"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5 opacity-70" /> : <Eye className="w-5 h-5 opacity-70" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className={`w-full h-12 mt-4 bg-gradient-to-r ${currentTheme.button} text-white border-0 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] font-bold duration-500`}
                disabled={loading}
              >
                {loading ? 'Creating account...' : (
                  <span className="flex items-center justify-center">
                    Get Started <UserPlus className="w-4 h-4 ml-2" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-8 pt-4 flex flex-col space-y-4 text-center">
            <p className="text-gray-400 text-sm font-light">
              Already have an account?{' '}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
                Sign In
              </Link>
            </p>
            <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-600 uppercase tracking-widest font-black">
              <Sparkles className="w-3 h-3" />
              <span>secure & anonymous</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
