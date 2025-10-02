import { useEffect, useMemo, useState } from 'react';
import { api, getToken } from '../lib/api.js';
import BarbersSection from '../features/owner/BarbersSection.jsx';
import SalonDetailsSection from '../features/owner/SalonDetailsSection.jsx';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/ui/Button.jsx';

export default function OwnerDashboardPage() {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barberCount, setBarberCount] = useState(0);

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

  const highlightCards = useMemo(() => {
    const teamLabel = (() => {
      if (!barberCount) return 'Nema frizera';
      if (barberCount === 1) return '1 frizer';
      if (barberCount === 2 || barberCount === 3 || barberCount === 4) return `${barberCount} frizera`;
      return `${barberCount} frizera`;
    })();

    return [
      {
        label: 'Adresa',
        value: salon?.address || 'Nije uneto',
        helper: 'Lokacija vašeg salona',
        icon: '📍',
      },
      {
        label: 'Kontakt',
        value: salon?.phone || 'Nije unet',
        helper: 'Telefon za klijente',
        icon: '☎️',
      },
      {
        label: 'Tim',
        value: teamLabel,
        helper: 'Aktivni frizeri u sistemu',
        icon: '💈',
      },
    ];
  }, [salon?.address, salon?.phone, barberCount]);

  if (loading) {
    return (
      <Layout>
  <div className="min-h-screen bg-white flex items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">Učitavanje kontrolne table…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
  <div className="min-h-screen bg-white flex items-center justify-center px-6">
          <div className="max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              !
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900">Potrebna je prijava</h2>
              <p className="text-sm text-zinc-500">{error}</p>
            </div>
            <div className="grid gap-3">
              <Button as="a" href="/owner/login" className="w-full">
                Prijavite se
              </Button>
              <Button as="a" href="/register-salon" variant="secondary" className="w-full">
                Registrujte salon
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="px-6 py-8 sm:px-10 sm:py-9">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-[0.35em] text-zinc-400">
                      Kontrolna tabla
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
                      {salon?.name}
                    </h1>
                    <p className="max-w-xl text-sm text-zinc-500">
                      Pregledajte rezultate salona, upravljajte timom i osvežite podatke sa istog mesta.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <Button
                      as="a"
                      href={`/s/${salon.id}`}
                      target="_blank"
                      rel="noreferrer"
                      variant="primary"
                      className="justify-center"
                    >
                      Otvori javnu stranicu
                    </Button>
                  </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {highlightCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-zinc-100 bg-white px-5 py-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-lg">
                          {card.icon}
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">{card.label}</p>
                          <p className="mt-2 text-base font-semibold text-zinc-900 break-words">{card.value}</p>
                          <p className="mt-1 text-xs text-zinc-400">{card.helper}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-zinc-900">Podaci o salonu</h2>
                <p className="text-sm text-zinc-500">Brzo osvežite osnovne informacije o salonu.</p>
              </div>
              <SalonDetailsSection salon={salon} />
            </section>

            <section className="space-y-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-zinc-900">Tim frizera</h2>
                <p className="text-sm text-zinc-500">Upravljajte nalozima frizera i njihovom aktivnošću.</p>
              </div>
              <BarbersSection salonId={salon.id} onCountChange={setBarberCount} />
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
