import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
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
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editSlot, setEditSlot] = useState(30);

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

  function startEdit(b) {
    setEditingId(b.id);
    setEditDisplayName(b.display_name);
    setEditSlot(b.slot_duration_minutes);
  }

  async function saveEdit(id) {
    try {
      await api(`/salons/${salonId}/barbers/${id}`, { method: 'PUT', token, body: {
        display_name: editDisplayName,
        active: true,
        slot_duration_minutes: Number(editSlot) || 30,
      }});
      setEditingId(null);
      await fetchList();
    } catch (e) { setError(e.message || 'Greška pri snimanju'); }
  }

  return (
    <div className="space-y-8">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Vaši frizeri</h3>
          <p className="text-gray-600">Upravljajte frizerima koji rade u vašem salonu</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3"
        >
          <span className="text-lg mr-2">+</span>
          {showForm ? 'Otkaži' : 'Dodaj frizera'}
        </Button>
      </div>

      {/* Add Barber Form */}
      {showForm && (
        <Card>
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="text-2xl">✂️</span>
              Dodaj novog frizera
            </h4>
            <p className="text-gray-600">Kreiranje naloga za frizera će mu omogućiti pristup dashboard-u</p>
          </div>
          
          <form onSubmit={onCreate} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Input 
                label="📧 Email adresa" 
                type="email" 
                required 
                value={form.email} 
                onChange={e=>update('email', e.target.value)}
                placeholder="frizer@salon.com"
              />
              <Input 
                label="🔐 Lozinka" 
                type="password" 
                required 
                value={form.password} 
                onChange={e=>update('password', e.target.value)}
                placeholder="Minimum 6 karaktera"
              />
              <Input 
                label="👤 Ime i prezime" 
                required 
                value={form.full_name} 
                onChange={e=>update('full_name', e.target.value)}
                placeholder="Marko Petrović"
              />
              <Input 
                label="📞 Telefon" 
                value={form.phone} 
                onChange={e=>update('phone', e.target.value)}
                placeholder="+381 xx xxx xxxx"
              />
              <Input 
                label="🎭 Prikazno ime" 
                required 
                value={form.display_name} 
                onChange={e=>update('display_name', e.target.value)}
                placeholder="Marko (kako će se prikazivati klijentima)"
              />
              <Input 
                label="⏱️ Trajanje slota (min)" 
                type="number" 
                min="1" 
                value={form.slot_duration_minutes} 
                onChange={e=>update('slot_duration_minutes', e.target.value)}
                placeholder="30"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowForm(false)}
              >
                Otkaži
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Kreiranje...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>✂️</span>
                    Dodaj frizera
                  </div>
                )}
              </Button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Barbers List */}
      <Card>
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-800 mb-2">Lista frizera</h4>
          <p className="text-gray-600">Kliknite na frizera da ih uredite ili deaktivirate</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
              <span className="text-gray-600 font-medium">Učitavanje frizera...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <div className="text-5xl mb-4">✂️</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Nema frizera</h3>
                <p className="text-gray-600 mb-4">Dodajte prvi frizera da počnete da primate rezervacije</p>
                <Button onClick={() => setShowForm(true)}>
                  <span className="mr-2">+</span>
                  Dodaj prvog frizera
                </Button>
              </div>
            ) : (
              items.map((b) => (
                <div key={b.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all">
                  {editingId === b.id ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input 
                          label="Prikazno ime" 
                          value={editDisplayName} 
                          onChange={e=>setEditDisplayName(e.target.value)} 
                        />
                        <Input 
                          label="Slot (min)" 
                          type="number" 
                          min="1" 
                          value={editSlot} 
                          onChange={e=>setEditSlot(e.target.value)} 
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => saveEdit(b.id)} size="sm">
                          <span className="mr-1">💾</span>
                          Sačuvaj
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Otkaži
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                          {b.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-lg">{b.display_name}</span>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              b.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {b.active ? '✅ Aktivan' : '🔴 Neaktivan'}
                            </div>
                          </div>
                          <div className="text-gray-600 flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <span>⏱️</span>
                              Slot: {b.slot_duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📧</span>
                              {b.email || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => startEdit(b)}
                        >
                          ✏️ Izmeni
                        </Button>
                        <Button 
                          variant={b.active ? "danger" : "success"} 
                          size="sm"
                          onClick={() => onToggleActive(b)}
                        >
                          {b.active ? '🔴 Deaktiviraj' : '✅ Aktiviraj'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
