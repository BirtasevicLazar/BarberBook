import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { api } from '../../lib/api.js';

function Pill({ selected, children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors duration-150 ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : selected
          ? 'bg-zinc-900 text-white border-transparent'
          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-900 hover:text-zinc-900'
      }`}
    >
      {children}
    </button>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function formatPrice(price, currency) {
  const numeric = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  const code = (currency || '').toUpperCase();
  if (!code) {
    return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numeric);
  }
  try {
    return new Intl.NumberFormat('sr-RS', { style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numeric);
  } catch {
    return `${numeric} ${code}`.trim();
  }
}

export default function BookingWidget({ salonId }) {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', notes: '' });
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1); // 1-Frizer, 2-Usluga, 3-Datum, 4-Termin, 5-Podaci

  const steps = [
    { id: 1, name: 'Frizer', description: 'Izaberite frizera koji vam najviše odgovara' },
    { id: 2, name: 'Usluga', description: 'Odaberite uslugu koju želite da rezervišete' },
    { id: 3, name: 'Datum', description: 'Izaberite datum dolaska u salon' },
    { id: 4, name: 'Termin', description: 'Odaberite vreme koje vam najviše odgovara' },
    { id: 5, name: 'Podaci', description: 'Unesite kontakt podatke i potvrdite rezervaciju' },
  ];

  // List barbers
  useEffect(() => {
    let mounted = true;
    setError('');
    api(`/public/salons/${salonId}/barbers`)
      .then((data) => {
        if (mounted) setBarbers(data);
      })
      .catch((e) => setError(e.message || 'Greška pri učitavanju frizera'));
    return () => {
      mounted = false;
    };
  }, [salonId]);

  // When barber changes, fetch services
  useEffect(() => {
    if (!selectedBarber) {
      setServices([]);
      setSelectedService(null);
      return;
    }
    let mounted = true;
    setError('');
    api(`/public/barbers/${selectedBarber}/services`)
      .then((data) => {
        if (mounted) setServices(data);
      })
      .catch((e) => setError(e.message || 'Greška pri učitavanju usluga'));
    return () => {
      mounted = false;
    };
  }, [selectedBarber]);

  // Fetch availability when barber, service, or date changes
  useEffect(() => {
    if (!selectedBarber || !selectedService || !date) {
      setSlots([]);
      return;
    }
    let mounted = true;
    setLoadingSlots(true);
    setError('');
    api(`/public/barbers/${selectedBarber}/services/${selectedService}/availability?date=${date}`)
      .then((data) => {
        if (mounted) setSlots(data || []);
      })
      .catch((e) => setError(e.message || 'Greška pri učitavanju termina'))
      .finally(() => mounted && setLoadingSlots(false));
    return () => {
      mounted = false;
    };
  }, [selectedBarber, selectedService, date]);

  const canBook = useMemo(() => {
    const name = customer.name.trim();
    const phone = customer.phone.trim();
    return !!(selectedBarber && selectedService && selectedSlot && name && phone);
  }, [selectedBarber, selectedService, selectedSlot, customer.name, customer.phone]);

  const activeStep = steps.find((s) => s.id === step);
  const selectedBarberData = useMemo(
    () => barbers.find((b) => b.id === selectedBarber),
    [barbers, selectedBarber]
  );
  const selectedServiceData = useMemo(
    () => services.find((s) => s.id === selectedService),
    [services, selectedService]
  );

  const canGoForward = useMemo(() => {
    if (step === 1) return !!selectedBarber;
    if (step === 2) return !!selectedService;
    if (step === 3) return !!date;
    if (step === 4) return !!selectedSlot;
    return true;
  }, [step, selectedBarber, selectedService, date, selectedSlot]);

  // Handlers for step transitions with dependent resets
  function handleSelectBarber(id) {
    if (id === selectedBarber) return;
  setSelectedBarber(id);
  setSelectedService(null);
  setSlots([]);
  setSelectedSlot(null);
  setCustomer({ name: '', phone: '', notes: '' });
    setStep(2);
  }

  function handleSelectService(id) {
    if (id === selectedService) return;
    setSelectedService(id);
    setSelectedSlot(null);
    setStep(3);
  }

  function handleDateChange(v) {
    setDate(v);
    setSelectedSlot(null);
    setStep(4);
  }

  function handleSelectSlot(startIso) {
    setSelectedSlot(startIso);
    setStep(5);
  }

  async function book(startAt) {
    if (!selectedBarber || !selectedService) return;
    const trimmedName = customer.name.trim();
    const trimmedPhone = customer.phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setError('Molimo unesite ime i prezime i broj telefona.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setBooking(true);
    setError('');
    setSuccess(null);
    try {
      const res = await api('/public/appointments', {
        method: 'POST',
        body: {
          salon_id: salonId,
          barber_id: selectedBarber,
          barber_service_id: selectedService,
          customer_name: trimmedName,
          customer_phone: trimmedPhone,
          start_at: startAt,
          notes: customer.notes || undefined,
        },
      });
      setSuccess(res);
    } catch (e) {
      setError(e.message || 'Greška pri rezervaciji');
    } finally {
      setBooking(false);
    }
  }

  if (success) {
    return (
      <div className="px-4 sm:px-6">
        <div className="min-h-[70vh] mx-auto flex max-w-xl items-center justify-center">
          <div className="w-full space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-medium text-green-700">
                ✓
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-zinc-900">Rezervacija je potvrđena</h2>
                <p className="text-sm text-zinc-500">Poslali smo potvrdu i detalje termina na ostavljene kontakt podatke.</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Frizer</span>
                <span className="font-medium text-zinc-900">{selectedBarberData?.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Usluga</span>
                <span className="font-medium text-zinc-900">{selectedServiceData?.name}</span>
              </div>
              {selectedServiceData && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Cena i trajanje</span>
                  <span>
                    {selectedServiceData.price} {selectedServiceData.currency} • {selectedServiceData.duration_min} min
                  </span>
                </div>
              )}
              {selectedSlot && (
                <div className="flex justify-between">
                  <span>Termin</span>
                  <span className="font-medium text-zinc-900">
                    {new Date(selectedSlot).toLocaleDateString('sr-RS')} • {formatTime(selectedSlot)}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                setSelectedSlot(null);
                setCustomer({ name: '', phone: '', notes: '' });
                setSuccess(null);
                setStep(1);
                setSelectedBarber(null);
                setSelectedService(null);
              }}
            >
              Nova rezervacija
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="p-6 sm:p-8 space-y-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">Korak {step} od {steps.length}</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900">{activeStep?.name}</h2>
              <p className="text-sm text-zinc-500 max-w-md">{activeStep?.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {steps.map((s) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <div
                    key={s.id}
                    className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                      done ? 'bg-zinc-900' : active ? 'bg-zinc-900/80' : 'bg-zinc-100'
                    }`}
                  ></div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="relative">
            <div className="grid">
              {step === 1 && (
                <div key="step-1" className="space-y-5">
                  <div className="grid gap-2">
                    {barbers.map((b) => {
                      const isActive = selectedBarber === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleSelectBarber(b.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                            isActive
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 hover:border-zinc-900'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{b.display_name}</p>
                            <p className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>Frizer</p>
                          </div>
                          <span className={`text-xs ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                            {isActive ? 'Izabrano' : 'Izaberi'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div key="step-2" className="space-y-4">
                  <div className="grid gap-3">
                    {services.map((s) => {
                      const isActive = selectedService === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectService(s.id)}
                          className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                            isActive
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 hover:border-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span>{s.name}</span>
                            <span>{formatPrice(s.price, s.currency)}</span>
                          </div>
                          <p className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-zinc-500'}`}>
                            Trajanje {s.duration_min} min
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div key="step-3" className="space-y-5">
                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-0"
                    value={date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>
              )}

              {step === 4 && (
                <div key="step-4" className="space-y-5">
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                      Nema dostupnih termina za odabrani datum. Pokušajte drugi dan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((t) => (
                        <Pill
                          key={`${t.start}-${t.end}`}
                          selected={selectedSlot === t.start}
                          onClick={() => handleSelectSlot(t.start)}
                        >
                          {formatTime(t.start)}
                        </Pill>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div key="step-5" className="space-y-6">
                  <div className="grid gap-4">
                    <label className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                      Podaci o klijentu
                    </label>
                    <Input
                      label="Ime i prezime *"
                      placeholder="Unesite ime i prezime"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Telefon *"
                      placeholder="Unesite broj telefona"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      required
                    />
                    <div>
                      <label className="mb-2 block text-xs sm:text-sm font-light text-gray-700">Napomena (opciono)</label>
                      <textarea
                        className="min-h-[96px] w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-0"
                        placeholder="Dodatne informacije za frizera"
                        value={customer.notes}
                        onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600 space-y-3">
                    <div className="flex justify-between">
                      <span>Frizer</span>
                      <span className="text-zinc-900 font-medium">{selectedBarberData?.display_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usluga</span>
                      <span className="text-zinc-900 font-medium">{selectedServiceData?.name}</span>
                    </div>
                    {selectedServiceData && (
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Cena i trajanje</span>
                        <span>
                          {formatPrice(selectedServiceData.price, selectedServiceData.currency)} • {selectedServiceData.duration_min} min
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Termin</span>
                      <span className="text-zinc-900 font-medium">
                        {new Date(selectedSlot).toLocaleDateString('sr-RS')} • {formatTime(selectedSlot)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => book(selectedSlot)}
                    disabled={!canBook || booking}
                    className="w-full"
                  >
                    {booking ? 'Potvrđujem…' : 'Potvrdi rezervaciju'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between text-xs text-zinc-400">
            <button
              disabled={step === 1}
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className={`transition-colors ${
                step === 1 ? 'cursor-not-allowed opacity-50' : 'hover:text-zinc-600'
              }`}
            >
              Prethodni korak
            </button>
            <button
              disabled={step === steps.length || !canGoForward}
              onClick={() => setStep((prev) => Math.min(steps.length, prev + 1))}
              className={`transition-colors ${
                step === steps.length || !canGoForward
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:text-zinc-600'
              }`}
            >
              Sledeći korak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
