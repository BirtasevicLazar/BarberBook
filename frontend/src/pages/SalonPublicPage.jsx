import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import BookingWidget from '../features/customer/BookingWidget.jsx';
import Layout from '../components/layout/Layout.jsx';
import Container from '../components/layout/Container.jsx';

export default function SalonPublicPage() {
  const { salonId } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError('');
    api(`/public/salons/${salonId}`)
      .then((data) => { if (mounted) setSalon(data); })
      .catch((e) => { if (mounted) setError(e.message || 'Greška'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [salonId]);

  if (loading) {
    return (
      <Layout>
        <Container>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje salona...</p>
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Greška</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Pokušaj ponovo
              </button>
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container>
        <div className="py-12">
          {/* Salon Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">{salon.name}</h1>
            <div className="space-y-2 text-gray-600">
              <div>{salon.address}</div>
              <div>{salon.phone}</div>
              <div className="text-sm">
                {salon.timezone} • {salon.currency}
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div className="max-w-4xl mx-auto">
            <BookingWidget salonId={salonId} />
          </div>
        </div>
      </Container>
    </Layout>
  );
}
