import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { api } from '../../lib/api.js';

export default function OwnerCreateSalonForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    name: '', salon_phone: '', address: '', timezone: 'Europe/Belgrade', currency: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const totalSteps = 2;

  function update(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  function nextStep() {
    setError('');
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!form.email.trim() || !form.password || !form.full_name.trim() || !form.phone.trim()) {
        setError('Molimo unesite sve obavezne podatke');
        return;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError('Molimo unesite validnu email adresu');
        return;
      }
      
      if (form.password.length < 6) {
        setError('Lozinka mora imati najmanje 6 karaktera');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  }

  function prevStep() {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  async function onSubmit(e) {
    e.preventDefault(); 
    
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    // Final step - validate salon info and submit
    if (!form.name || !form.salon_phone || !form.address || !form.currency) {
      setError('Molimo unesite sve obavezne podatke');
      return;
    }

    setError(''); setResult(null); setLoading(true);
    try {
      const res = await api('/salons', { method: 'POST', body: {
        email: form.email.trim().toLowerCase(), 
        password: form.password, 
        full_name: form.full_name.trim(), 
        phone: form.phone.trim(),
        name: form.name.trim(), 
        salon_phone: form.salon_phone.trim(), 
        address: form.address.trim(),
        timezone: form.timezone, 
        currency: form.currency
      }});
      setResult(res);
      if (res?.salon?.id) {
        localStorage.setItem('salon_id', res.salon.id);
      }
    } catch (err) {
      setError(err.message || 'Greška');
    } finally { setLoading(false); }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Spacer for navbar */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-lg mx-auto -mt-16">
            {/* Success Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-4 sm:mb-6 tracking-tight">
              Salon je uspešno registrovan
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 mb-8 sm:mb-12 font-light leading-relaxed">
              Vaš salon je kreiran i spreman za rad. Prijavite se da biste počeli sa upravljanjem.
            </p>
            
            {/* Login Button */}
            <a 
              href="/owner/login"
              className="inline-block px-8 sm:px-12 py-3 sm:py-4 text-sm sm:text-base font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all duration-300 shadow-sm"
            >
              Prijavite se
            </a>
            
            {/* Additional Info */}
            <p className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 font-light">
              Koristite email i lozinku koje ste upravo uneli
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="text-center mb-8 md:mb-12 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3 md:mb-4 tracking-tight">
          Kreirajte svoj salon
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-light px-2">
          Digitalizujte svoj frizerski salon za manje od 5 minuta
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 md:mb-12 px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {[1, 2].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 ${
                currentStep >= step 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {step < totalSteps && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-all duration-300 ${
                  currentStep > step ? 'bg-gray-900' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {/* Step 1: Owner Information */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center mb-6 md:mb-8 px-4">
              <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 tracking-tight">
                Podaci o vlasniku
              </h2>
              <p className="text-sm sm:text-base text-gray-600 font-light">
                Unesite vaše osnovne podatke za pristup sistemu
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
              <Input 
                label="Email adresa *"
                type="email" 
                required
                value={form.email} 
                onChange={e=>update('email', e.target.value)}
                placeholder="owner@example.com"
                className="md:col-span-2"
              />
              <Input 
                label="Lozinka *" 
                type="password" 
                required
                value={form.password} 
                onChange={e=>update('password', e.target.value)}
                placeholder="Minimum 6 karaktera"
              />
              <Input 
                label="Ime i prezime *" 
                required
                value={form.full_name} 
                onChange={e=>update('full_name', e.target.value)}
                placeholder="Marko Petrović"
              />
              <Input 
                label="Telefon *" 
                required
                value={form.phone} 
                onChange={e=>update('phone', e.target.value)}
                placeholder="+381 xx xxx xxxx"
                className="md:col-span-2"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salon Information */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center mb-6 md:mb-8 px-4">
              <h2 className="text-xl sm:text-2xl font-light text-gray-900 mb-2 tracking-tight">
                Podaci o salonu
              </h2>
              <p className="text-sm sm:text-base text-gray-600 font-light">
                Osnovne informacije o vašem salonu
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
              <Input 
                label="Naziv salona *" 
                required
                value={form.name} 
                onChange={e=>update('name', e.target.value)} 
                placeholder="Salon 'Stil'"
                className="md:col-span-2"
              />
              <Input 
                label="Telefon salona *" 
                required
                value={form.salon_phone} 
                onChange={e=>update('salon_phone', e.target.value)}
                placeholder="+381 xx xxx xxxx"
              />
              <Input 
                label="Adresa *" 
                required
                value={form.address} 
                onChange={e=>update('address', e.target.value)}
                placeholder="Knez Mihailova 15, Beograd"
              />
              <div>
                <label className="block text-xs sm:text-sm font-light text-gray-700 mb-2 sm:mb-3">
                  Valuta *
                </label>
                <select
                  required
                  value={form.currency}
                  onChange={e=>update('currency', e.target.value)}
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white font-light transition-all duration-200 text-sm sm:text-base"
                >
                  <option value="">Izaberite valutu</option>
                  <option value="RSD">RSD - Srpski dinar</option>
                  <option value="EUR">EUR - Evro</option>
                  <option value="USD">USD - Američki dolar</option>
                </select>
              </div>
            </div>
          </div>
        )}        {error && (
          <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl mt-6 sm:mt-8 max-w-2xl mx-auto mx-4">
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

        {/* Navigation Buttons */}
        <div className="pt-8 sm:pt-12 max-w-2xl mx-auto px-4">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-light mb-4">
                Korak {currentStep} od {totalSteps}
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              size="md"
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Kreiranje...</span>
                </div>
              ) : currentStep === totalSteps ? (
                <span>Kreiraj salon</span>
              ) : (
                <span>Sledeći korak</span>
              )}
            </Button>

            {currentStep > 1 && (
              <Button 
                type="button"
                onClick={prevStep}
                variant="secondary"
                size="md"
                className="w-full"
              >
                Nazad
              </Button>
            )}
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1">
              {currentStep > 1 && (
                <Button 
                  type="button"
                  onClick={prevStep}
                  variant="secondary"
                  size="md"
                  className="px-6"
                >
                  Nazad
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 font-light mb-2">
                Korak {currentStep} od {totalSteps}
              </p>
            </div>

            <div className="flex-1 text-right">
              <Button 
                type="submit" 
                disabled={loading}
                size="md"
                className="px-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kreiranje...</span>
                  </div>
                ) : currentStep === totalSteps ? (
                  <span>Kreiraj salon</span>
                ) : (
                  <span>Sledeći korak</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {currentStep === totalSteps && (
          <div className="text-center mt-4 sm:mt-6 px-4">
            <p className="text-xs sm:text-sm text-gray-500 font-light">
              Besplatno kreiranje • Bez mesečnih troškova
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
