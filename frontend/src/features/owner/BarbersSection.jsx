import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { api, getToken } from '../../lib/api.js';

export default function BarbersSection({ salonId }) {
  const token = getToken();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', display_name: '', slot_duration_minutes: 30,
  });
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    display_name: '', slot_duration_minutes: 30
  });
  const [savingId, setSavingId] = useState(null);

  function update(key, value) { setForm(p => ({ ...p, [key]: value })); }

  async function fetchList() {
    setLoading(true); setError('');
    try {
      const data = await api(`/salons/${salonId}/barbers`, { token });
      setItems(data);
    } catch (e) {
      setError(e.message || 'Greška');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (salonId && token) fetchList(); }, [salonId]);

  async function onCreate(e) {
    e.preventDefault(); setError(''); setCreating(true);
    try {
      await api(`/salons/${salonId}/barbers`, { method: 'POST', token, body: {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
        display_name: form.display_name,
        slot_duration_minutes: Number(form.slot_duration_minutes) || 30,
      }});
      setForm({ email: '', password: '', full_name: '', phone: '', display_name: '', slot_duration_minutes: 30 });
      await fetchList();
    } catch (e) {
      setError(e.message || 'Greška pri kreiranju');
    } finally {
      setCreating(false);
    }
  }

  async function onToggleActive(barber) {
    try {
      await api(`/salons/${salonId}/barbers/${barber.id}`, { method: 'PUT', token, body: {
        display_name: barber.display_name,
        active: !barber.active,
        slot_duration_minutes: barber.slot_duration_minutes,
      }});
      await fetchList();
    } catch (e) { setError(e.message || 'Greška pri izmeni'); }
  }

  function startEdit(barber) {
    setEditingId(barber.id);
    setEditForm({
      display_name: barber.display_name || '',
      slot_duration_minutes: barber.slot_duration_minutes || 30
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ display_name: '', slot_duration_minutes: 30 });
    setError('');
  }

  async function saveEdit(id) {
    setSavingId(id);
    try {
      await api(`/salons/${salonId}/barbers/${id}`, { 
        method: 'PUT', 
        token, 
        body: {
          display_name: editForm.display_name.trim(),
          active: true,
          slot_duration_minutes: Number(editForm.slot_duration_minutes) || 30,
        }
      });
      setEditingId(null);
      setEditForm({ display_name: '', slot_duration_minutes: 30 });
      await fetchList();
    } catch (e) { 
      setError(e.message || 'Greška pri snimanju'); 
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-600 font-light">Učitavanje frizera...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">Frizeri</h3>
            {items.length > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {items.length}
              </span>
            )}
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="sm"
          variant={showForm ? "secondary" : "primary"}
        >
          {showForm ? 'Otkaži' : 'Dodaj frizera'}
        </Button>
      </div>

            {/* Add Barber Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Dodaj novog frizera
            </h4>
            <p className="text-sm text-gray-600 font-light">Unesite podatke za novog frizera koji će raditi u vašem salonu</p>
          </div>
          
          <form onSubmit={onCreate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Input 
                label="Email adresa *" 
                type="email" 
                required 
                value={form.email} 
                onChange={e=>update('email', e.target.value)}
                placeholder="frizer@salon.com"
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
                label="Telefon" 
                value={form.phone} 
                onChange={e=>update('phone', e.target.value)}
                placeholder="+381 xx xxx xxxx"
              />
              <Input 
                label="Prikazno ime *" 
                required 
                value={form.display_name} 
                onChange={e=>update('display_name', e.target.value)}
                placeholder="Marko"
              />
              <Input 
                label="Trajanje slota (min)" 
                type="number" 
                min="1" 
                value={form.slot_duration_minutes} 
                onChange={e=>update('slot_duration_minutes', e.target.value)}
                placeholder="30"
              />
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
              <Button type="submit" disabled={creating} size="md">
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kreiranje...</span>
                  </div>
                ) : (
                  <span>Dodaj frizera</span>
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowForm(false)}
                size="md"
                disabled={creating}
              >
                Otkaži
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Barbers List */}
      <div>
        {items.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nema frizera</h3>
            <p className="text-sm text-gray-600 mb-6 font-light">Dodajte prvi frizera da počnete da primate rezervacije</p>
            <Button onClick={() => setShowForm(true)} size="md">
              Dodaj prvog frizera
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((barber) => (
              <div key={barber.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-sm transition-all">
                {editingId === barber.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input 
                        label="Prikazno ime *" 
                        required
                        value={editForm.display_name} 
                        onChange={e=>setEditForm(prev => ({...prev, display_name: e.target.value}))} 
                        placeholder="Marko"
                      />
                      <Input 
                        label="Trajanje slota (min)" 
                        type="number" 
                        min="1" 
                        value={editForm.slot_duration_minutes} 
                        onChange={e=>setEditForm(prev => ({...prev, slot_duration_minutes: e.target.value}))} 
                        placeholder="30"
                      />
                    </div>
                    
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-red-800 font-medium text-sm">{error}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => saveEdit(barber.id)} 
                        size="sm"
                        disabled={savingId === barber.id}
                      >
                        {savingId === barber.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Čuvanje...</span>
                          </div>
                        ) : (
                          <span>Sačuvaj</span>
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={cancelEdit}
                        disabled={savingId === barber.id}
                      >
                        Otkaži
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {barber.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="font-medium text-gray-900">{barber.display_name}</span>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            barber.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              barber.active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            {barber.active ? 'Aktivan' : 'Neaktivan'}
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 space-y-1">
                          <div>Slot: {barber.slot_duration_minutes} min</div>
                          <div className="truncate">{barber.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => startEdit(barber)}
                        className="text-xs sm:text-sm"
                      >
                        Izmeni
                      </Button>
                      <Button 
                        variant={barber.active ? "danger" : "success"} 
                        size="sm"
                        onClick={() => onToggleActive(barber)}
                        className="text-xs sm:text-sm"
                      >
                        {barber.active ? 'Deaktiviraj' : 'Aktiviraj'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
