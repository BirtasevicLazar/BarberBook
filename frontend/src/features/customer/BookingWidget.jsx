import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { api } from '../../lib/api.js';

function Pill({ selected, children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg border text-sm font-medium ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : selected 
            ? 'bg-gray-900 text-white border-gray-900' 
            : 'bg-white text-gray-700 border-gray-300'
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
    { id: 1, name: 'Frizer' },
    { id: 2, name: 'Usluga' },
    { id: 3, name: 'Datum' },
    { id: 4, name: 'Termin' },
    { id: 5, name: 'Podaci' },
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

  const canBook = useMemo(
    () => !!(selectedBarber && selectedService && selectedSlot && customer.name),
    [selectedBarber, selectedService, selectedSlot, customer.name]
  );

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
          customer_name: customer.name,
          customer_phone: customer.phone || undefined,
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

  return (
    <div className="space-y-8">
      <Card>
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Rezervacija termina</div>
          <div className="text-gray-600">Vodimo vas kroz 5 jednostavnih koraka</div>
        </div>

        {/* Step indicator */}
        <div className="mb-8 bg-gray-50 rounded-lg p-4">
          <ol className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {steps.map((s, index) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full text-sm font-semibold flex items-center justify-center ${
                        done
                          ? 'bg-green-600 text-white'
                          : active
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {done ? '✓' : s.id}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${active ? 'text-gray-900' : done ? 'text-green-600' : 'text-gray-500'}`}>
                      {s.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden lg:block w-8 h-0.5 mx-4 ${done ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Step 1: Barber */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">1. Odaberite frizera</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {barbers.map((b) => (
              <Pill key={b.id} selected={selectedBarber === b.id} onClick={() => handleSelectBarber(b.id)}>
                {b.display_name}
              </Pill>
            ))}
          </div>
        </div>

        {/* Step 2: Service */}
        {selectedBarber && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">2. Odaberite uslugu</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectService(s.id)}
                  className={`p-4 rounded-lg border cursor-pointer ${
                    selectedService === s.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  <div className="font-medium mb-2">{s.name}</div>
                  <div className="flex items-center justify-between text-sm opacity-75">
                    <span>{s.price} {s.currency || ''}</span>
                    <span>{s.duration_min} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date */}
        {selectedService && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">3. Odaberite datum</h3>
            </div>
            <div>
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: Time slots */}
        {selectedService && date && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">4. Odaberite termin</h3>
            </div>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-600">Učitavanje termina...</div>
              </div>
            ) : (
              <div>
                {slots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600">Nema dostupnih termina za odabrani datum</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
          </div>
        )}

        {/* Step 5: Customer Info */}
        {selectedSlot && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">5. Vaši podaci</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Ime"
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
              />
              <Input
                placeholder="Telefon (opciono)"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
              />
            </div>
          </div>
        )}        {/* Summary & confirm */}
        {selectedBarber && selectedService && selectedSlot && customer.name && (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pregled rezervacije
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-600 font-medium mb-1">Frizer</div>
                  <div className="text-gray-900 font-medium">
                    {barbers.find((b) => b.id === selectedBarber)?.display_name}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-600 font-medium mb-1">Usluga</div>
                  <div className="text-gray-900 font-medium">
                    {services.find((s) => s.id === selectedService)?.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {services.find((s) => s.id === selectedService)?.price} {services.find((s) => s.id === selectedService)?.currency} • {services.find((s) => s.id === selectedService)?.duration_min} min
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-600 font-medium mb-1">Termin</div>
                  <div className="text-gray-900 font-medium">
                    {new Date(selectedSlot).toLocaleDateString('sr-RS')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(selectedSlot)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => book(selectedSlot)} 
                disabled={!customer.name || booking}
              >
                {booking ? 'Potvrđujem rezervaciju...' : 'Potvrdi rezervaciju'}
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-8 p-8 rounded-lg bg-green-50 border border-green-200">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-900 mb-2">Rezervacija uspešna!</h3>
              <p className="text-green-700 mb-6">Vaš termin je uspešno rezervisan. Primićete potvrdu uskoro.</p>
              
              <div className="bg-white rounded-lg p-6 mb-6 text-left border border-green-200">
                <h4 className="font-medium text-gray-900 mb-3">Detalji rezervacije:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div><span className="font-medium">ID rezervacije:</span> {success.id}</div>
                  <div><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">Potvrđeno</span></div>
                  <div><span className="font-medium">Kreirano:</span> {new Date(success.created_at).toLocaleString('sr-RS')}</div>
                </div>
              </div>
              
              <Button
                variant="secondary"
                onClick={() => {
                  // Reset for a new booking
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
        )}
      </Card>
    </div>
  );
}
