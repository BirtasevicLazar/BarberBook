import { useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { api, getToken } from '../../lib/api.js';

export default function SalonDetailsSection({ salon }) {
  const token = getToken();
  const [modalOpen, setModalOpen] = useState(false);
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
    setModalOpen(true);
    setError('');
    setForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      currency: salon.currency || 'RSD',
    });
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
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
      setModalOpen(false);
      
    } catch (e) {
      setError(e.message || 'Greška pri snimanju');
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-900">Osnovni detalji</h3>
            <p className="text-sm text-zinc-500">Najvažnije informacije o vašem salonu.</p>
          </div>
          <Button onClick={startEdit} size="sm" variant="secondary">
            Uredi podatke
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Naziv</p>
            <p className="mt-2 text-base font-medium text-zinc-900">{salon?.name || 'Nije uneto'}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Telefon</p>
            <p className="mt-2 text-base font-medium text-zinc-900">{salon?.phone || 'Nije uneto'}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Adresa</p>
            <p className="mt-2 text-base font-medium text-zinc-900 break-words">{salon?.address || 'Nije uneto'}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Valuta</p>
            <p className="mt-2 text-base font-medium text-zinc-900">{salon?.currency || 'RSD'}</p>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="Izmenite informacije"
        description="Ažurirajte osnovne podatke o salonu."
      >
        <form onSubmit={onSave} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Naziv salona *" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Salon 'Stil'" />
            <Input label="Telefon salona" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+381 xx xxx xxxx" />
            <Input label="Adresa" value={form.address} onChange={(e) => update('address', e.target.value)} className="sm:col-span-2" placeholder="Knez Mihailova 15, Beograd 11000" />
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">Valuta *</label>
              <select
                required
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-0"
              >
                <option value="RSD">RSD - Srpski dinar</option>
                <option value="EUR">EUR - Evro</option>
                <option value="USD">USD - Američki dolar</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Čuvanje…' : 'Sačuvaj promene'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
              Otkaži
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
