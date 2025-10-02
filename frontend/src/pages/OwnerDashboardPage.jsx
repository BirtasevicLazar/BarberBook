import { useEffect, useState } from 'react';
import { api, getToken } from '../lib/api.js';
import BarbersSection from '../features/owner/BarbersSection.jsx';
import SalonDetailsSection from '../features/owner/SalonDetailsSection.jsx';
import Layout from '../components/layout/Layout.jsx';
import Container from '../components/layout/Container.jsx';

export default function OwnerDashboardPage() {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Niste prijavljeni. Idite na login.');
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true); setError('');
    api('/owner/me/salon', { token })
      .then((s) => {
        if (!mounted) return;
        setSalon(s);
        if (s?.id) localStorage.setItem('salon_id', s.id);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || 'Greška pri učitavanju salona');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <Layout>
        <Container>
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl">🏪</span>
                </div>
              </div>
              <p className="text-xl text-gray-600 font-medium">Učitavanje dashboard-a...</p>
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container>
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center bg-red-50 border border-red-200 rounded-3xl p-8 max-w-md">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-red-800 mb-4">Potrebna je prijava</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex flex-col gap-3">
                <a 
                  className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium"
                  href="/owner/login"
                >
                  Idi na login
                </a>
                <a 
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  href="/register-salon"
                >
                  Registruj salon
                </a>
              </div>
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <div className="py-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3">
                      <span className="text-4xl">🏪</span>
                      Owner Dashboard
                    </h1>
                    <p className="text-white/90 text-lg">
                      Upravljajte vašim salonom: <span className="font-semibold">{salon?.name}</span>
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href={`/s/${salon.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors font-medium text-center flex items-center gap-2"
                    >
                      <span>🌐</span>
                      Pogledaj javni URL
                    </a>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full"></div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Main Content */}
            <section className="lg:col-span-3 space-y-8">
              <SalonDetailsSection salon={salon} />
              
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-purple-600">✂️</span>
                    Frizeri
                  </h2>
                  <p className="text-gray-600">Upravljajte frizerima i njihovim uslugama</p>
                </div>
                <BarbersSection salonId={salon.id} />
              </div>
            </section>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-blue-600">⚡</span>
                  Brze akcije
                </h3>
                <div className="space-y-3">
                  <a 
                    href="/register-salon"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 text-center font-medium"
                  >
                    <span className="mr-2">🏪</span>
                    Novi salon
                  </a>
                  <a 
                    href={`/s/${salon.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-2xl hover:from-teal-600 hover:to-green-600 transition-all transform hover:scale-105 text-center font-medium"
                  >
                    <span className="mr-2">🌍</span>
                    Otvori javni URL
                  </a>
                </div>
              </div>

              {/* Salon Stats */}
              <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-green-600">📊</span>
                  Statistike
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Aktivni salon</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Aktivan
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Salon ID</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{salon.id}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
