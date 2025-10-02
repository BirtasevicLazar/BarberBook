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
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 font-light">Učitavanje dashboard-a...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-900 mb-4 tracking-tight">Potrebna je prijava</h2>
            <p className="text-sm text-gray-600 mb-8 font-light">{error}</p>
            <div className="space-y-3">
              <a 
                className="block px-8 py-3 text-base font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all duration-300"
                href="/owner/login"
              >
                Prijavite se
              </a>
              <a 
                className="block px-8 py-3 text-base font-medium text-gray-600 bg-transparent border border-gray-300 rounded-full hover:border-gray-900 hover:text-gray-900 transition-all duration-300"
                href="/register-salon"
              >
                Registrujte salon
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <Container>
          <div className="py-6 sm:py-8 lg:py-12">
            
            {/* Dashboard Header */}
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-2 tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 font-light">
                    {salon?.name}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a 
                    href={`/s/${salon.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium text-gray-600 bg-transparent border border-gray-300 rounded-full hover:border-gray-900 hover:text-gray-900 transition-all duration-300 text-center"
                  >
                    Pogledaj salon
                  </a>
                </div>
              </div>
              
            </div>

            {/* Main Content */}
            <div className="space-y-8 lg:space-y-12">
                
                {/* Salon Details Section */}
                <div>
                  <div className="mb-6 lg:mb-8">
                    <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 tracking-tight">
                      Podaci o salonu
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 font-light">
                      Osnovne informacije o vašem salonu
                    </p>
                  </div>
                  <SalonDetailsSection salon={salon} />
                </div>

                {/* Barbers Section */}
                <div>
                  <div className="mb-6 lg:mb-8">
                    <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 tracking-tight">
                      Frizeri
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 font-light">
                      Upravljajte frizerima i njihovim uslugama
                    </p>
                  </div>
                  <BarbersSection salonId={salon.id} />
                </div>
                
              </div>
            
          </div>
        </Container>
      </div>
    </Layout>
  );
}
