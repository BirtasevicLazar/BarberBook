import { useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { api, getToken } from '../../lib/api.js';

export default function SalonDetailsSection({ salon }) {
  const token = getToken();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: salon.name || '',
    phone: salon.phone || '',
    address: salon.address || '',
    currency: salon.currency || 'RSD',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(k, v) { 
    setForm(p => ({ ...p, [k]: v })); 
  }

  function startEdit() {
    setIsEditing(true);
    setError('');
    setForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      currency: salon.currency || 'RSD',
    });
  }

  function cancelEdit() {
    setIsEditing(false);
    setError('');
    setForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      currency: salon.currency || 'RSD',
    });
  }

  async function onSave(e) {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    
    try {
      await api(`/salons/${salon.id}`, { 
        method: 'PUT', 
        token, 
        body: {
          ...form,
          timezone: 'Europe/Belgrade' // Always Belgrade
        }
      });
      
      // Update salon object
      Object.assign(salon, form);
      setIsEditing(false);
      
    } catch (e) {
      setError(e.message || 'Greška pri snimanju');
    } finally { 
      setSaving(false); 
    }
  }

  if (!isEditing) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{salon?.name}</h3>
            <p className="text-sm text-gray-600 font-light">Osnovne informacije o salonu</p>
          </div>
          <Button 
            onClick={startEdit}
            variant="secondary"
            size="sm"
            className="self-start"
          >
            Izmeni
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-500 font-light mb-1">Naziv</div>
            <div className="text-sm font-medium text-gray-900">{salon?.name || 'Nije uneto'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-light mb-1">Telefon</div>
            <div className="text-sm font-medium text-gray-900">{salon?.phone || 'Nije uneto'}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500 font-light mb-1">Adresa</div>
            <div className="text-sm font-medium text-gray-900">{salon?.address || 'Nije uneto'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-light mb-1">Valuta</div>
            <div className="text-sm font-medium text-gray-900">{salon?.currency || 'RSD'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Izmena podataka</h3>
        <p className="text-sm text-gray-600 font-light">Uredite osnovne informacije o salonu</p>
      </div>
      
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Input 
            label="Naziv salona *" 
            required 
            value={form.name} 
            onChange={e=>update('name', e.target.value)}
            placeholder="Salon 'Stil'"
          />
          <Input 
            label="Telefon salona" 
            value={form.phone} 
            onChange={e=>update('phone', e.target.value)}
            placeholder="+381 xx xxx xxxx"
          />
          <Input 
            label="Adresa" 
            value={form.address} 
            onChange={e=>update('address', e.target.value)} 
            className="sm:col-span-2"
            placeholder="Knez Mihailova 15, Beograd 11000"
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
              <option value="RSD">RSD - Srpski dinar</option>
              <option value="EUR">EUR - Evro</option>
              <option value="USD">USD - Američki dolar</option>
            </select>
          </div>
        </div>
        
        {error && (
          <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl">
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
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button type="submit" disabled={saving} size="md">
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Čuvanje...</span>
              </div>
            ) : (
              <span>Sačuvaj</span>
            )}
          </Button>
          <Button 
            type="button" 
            onClick={cancelEdit} 
            variant="secondary" 
            size="md"
            disabled={saving}
          >
            Otkaži
          </Button>
        </div>
      </form>
    </div>
  );
}
