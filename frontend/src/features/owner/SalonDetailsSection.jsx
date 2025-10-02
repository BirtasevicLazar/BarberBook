import { useState } from 'react';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { api, getToken } from '../../lib/api.js';

export default function SalonDetailsSection({ salon }) {
  const token = getToken();
  const [form, setForm] = useState({
    name: salon.name || '',
    phone: salon.phone || '',
    address: salon.address || '',
    timezone: salon.timezone || 'Europe/Belgrade',
    currency: salon.currency || 'RSD',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); setSaved(false); }

  async function onSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api(`/salons/${salon.id}`, { method: 'PUT', token, body: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Auto hide success message
    } catch (e) {
      setError(e.message || 'Greška pri snimanju');
    } finally { setSaving(false); }
  }

  return (
    <Card>
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          Detalji salona
        </h4>
        <p className="text-gray-600">Uredite osnovne informacije o vašem salonu</p>
      </div>
      
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input 
            label="🏪 Naziv salona" 
            required 
            value={form.name} 
            onChange={e=>update('name', e.target.value)}
            placeholder="Salon 'Stil'"
          />
          <Input 
            label="📞 Telefon salona" 
            value={form.phone} 
            onChange={e=>update('phone', e.target.value)}
            placeholder="+381 xx xxx xxxx"
          />
          <Input 
            label="📍 Adresa" 
            value={form.address} 
            onChange={e=>update('address', e.target.value)} 
            className="sm:col-span-2"
            placeholder="Knez Mihailova 15, Beograd 11000"
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
        
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Čuvanje...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>💾</span>
                Sačuvaj izmene
              </div>
            )}
          </Button>
          
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-xl border border-green-200">
              <span>✅</span>
              <span className="font-medium">Uspešno sačuvano!</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
      </form>
    </Card>
  );
}
