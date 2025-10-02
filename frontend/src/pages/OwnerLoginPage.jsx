import { useState } from 'react';
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

  async function onSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { access_token } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(access_token);
      try {
        const salon = await api('/owner/me/salon', { token: access_token });
        if (salon?.id) localStorage.setItem('salon_id', salon.id);
      } catch { /* ignore if not found yet */ }
      window.location.assign('/owner/dashboard');
    } catch (e) {
      setError(e.message || 'Greška pri logovanju');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Container>
        <div className="min-h-[500px] flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Prijava
              </h1>
              <p className="text-gray-600">
                Pristupite vašem salon dashboard-u
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <form onSubmit={onSubmit} className="space-y-6">
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
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Prijavljivanje...' : 'Prijavi se'}
                </Button>
              </form>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm">
                    {error}
                  </div>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-4">Nemate salon još uvek?</p>
                  <a 
                    href="/register-salon"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium"
                  >
                    Registrujte salon
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
