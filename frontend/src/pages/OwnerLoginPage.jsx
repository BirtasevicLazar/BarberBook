import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { api, setToken } from '../lib/api.js';
import Layout from '../components/layout/Layout.jsx';
import Container from '../components/layout/Container.jsx';

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault(); 
    setError(''); 
    setLoading(true);
    
    try {
      const { access_token } = await api('/auth/owner/login', { 
        method: 'POST', 
        body: { 
          email: email.trim().toLowerCase(), 
          password 
        } 
      });
      setToken(access_token);
      
      try {
        const salon = await api('/owner/me/salon', { token: access_token });
        if (salon?.id) localStorage.setItem('salon_id', salon.id);
      } catch { /* ignore if not found yet */ }
      
      navigate('/owner/dashboard');
    } catch (e) {
      setError(e.message || 'Neispravni podaci za prijavu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm mx-auto -mt-16">
            
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3 sm:mb-4 tracking-tight">
                Prijava
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-light">
                Pristupite vašem salon dashboard-u
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
              <Input 
                label="Email adresa" 
                type="email" 
                required 
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                placeholder="owner@salon.com"
              />
              
              <Input 
                label="Lozinka" 
                type="password" 
                required 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
              />
              
              {error && (
                <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-red-800 font-medium text-sm sm:text-base">{error}</span>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full"
                size="md"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Prijavljivanje...</span>
                  </div>
                ) : (
                  <span>Prijavi se</span>
                )}
              </Button>
            </form>
            
            {/* Register Link */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-500 mb-4 font-light">
                  Nemate salon još uvek?
                </p>
                <a 
                  href="/register-salon"
                  className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 text-sm font-light text-zinc-600 bg-transparent border border-zinc-300 rounded-full hover:border-zinc-900 hover:text-zinc-900 hover:scale-[1.02] transition-all duration-200"
                >
                  Registrujte salon
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
