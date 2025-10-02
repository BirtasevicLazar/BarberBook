import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { api } from '../../lib/api.js';

export default function OwnerCreateSalonForm() {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '',
    name: '', salon_phone: '', address: '', timezone: 'Europe/Belgrade', currency: 'RSD'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function update(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  async function onSubmit(e) {
    e.preventDefault(); setError(''); setResult(null); setLoading(true);
    try {
      const res = await api('/salons', { method: 'POST', body: {
        email: form.email, password: form.password, full_name: form.full_name, phone: form.phone,
        name: form.name, salon_phone: form.salon_phone, address: form.address,
        timezone: form.timezone, currency: form.currency
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
      <div className="text-center py-8">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-green-800 mb-4">Salon uspešno kreiran!</h2>
        <p className="text-lg text-gray-600 mb-8">Vaš salon je spreman za rad. Možete odmah početi sa dodavanjem frizera i usluga.</p>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-green-800 mb-4">Sledeći koraci:</h3>
          <div className="space-y-3 text-green-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>Salon kreiran i aktivan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏪</span>
              <span>Vaš salon ID: <span className="font-mono bg-white px-2 py-1 rounded">{result.salon.id}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <span>Javni URL: <span className="font-mono bg-white px-2 py-1 rounded">barberbook.com/s/{result.salon.id}</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href={`/s/${result.salon.id}`} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-2xl hover:from-teal-600 hover:to-green-600 transition-all transform hover:scale-105 font-medium text-lg"
          >
            <span className="text-2xl">🌍</span>
            Pogledaj javni URL
          </a>
          <a 
            href="/owner/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 font-medium text-lg"
          >
            <span className="text-2xl">🚀</span>
            Idi na dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center gap-2">
          <span className="text-4xl">🏪</span>
          Kreiraj salon
        </h2>
        <p className="text-gray-600">Popunite podatke u nastavku da kreirate vaš salon</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Owner Information */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Podaci o vlasniku
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="📧 Email adresa *" 
              type="email" 
              required 
              value={form.email} 
              onChange={e=>update('email', e.target.value)}
              placeholder="owner@example.com"
            />
            <Input 
              label="🔐 Lozinka *" 
              type="password" 
              required 
              value={form.password} 
              onChange={e=>update('password', e.target.value)}
              placeholder="Minimum 6 karaktera"
            />
            <Input 
              label="👤 Ime i prezime *" 
              required 
              value={form.full_name} 
              onChange={e=>update('full_name', e.target.value)}
              placeholder="Marko Petrović"
            />
            <Input 
              label="📞 Telefon vlasnika" 
              value={form.phone} 
              onChange={e=>update('phone', e.target.value)}
              placeholder="+381 xx xxx xxxx"
            />
          </div>
        </div>

        {/* Salon Information */}
        <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            Podaci o salonu
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              label="🏪 Naziv salona *" 
              required 
              value={form.name} 
              onChange={e=>update('name', e.target.value)} 
              className="sm:col-span-2"
              placeholder="Salon 'Stil'"
            />
            <Input 
              label="📞 Telefon salona" 
              value={form.salon_phone} 
              onChange={e=>update('salon_phone', e.target.value)}
              placeholder="+381 xx xxx xxxx"
            />
            <Input 
              label="📍 Adresa" 
              value={form.address} 
              onChange={e=>update('address', e.target.value)}
              placeholder="Knez Mihailova 15, Beograd"
            />
            <Input 
              label="🌍 Vremenska zona" 
              value={form.timezone} 
              onChange={e=>update('timezone', e.target.value)}
              placeholder="Europe/Belgrade"
            />
            <Input 
              label="💰 Valuta" 
              value={form.currency} 
              onChange={e=>update('currency', e.target.value)}
              placeholder="RSD"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            size="lg"
            className="px-12 py-4 text-lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Kreiranje salona...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Kreiraj salon BESPLATNO
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
