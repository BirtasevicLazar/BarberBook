import { useEffect, useState } from 'react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { api, getToken } from '../../lib/api.js';

export default function BarbersSection({ salonId, onCountChange }) {
  const token = getToken();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', phone: '', display_name: '', slot_duration_minutes: 30,
  });
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '', slot_duration_minutes: 30
  });
  const [savingEdit, setSavingEdit] = useState(false);

  function update(key, value) { setForm(p => ({ ...p, [key]: value })); }

  async function fetchList() {
    setLoading(true); setListError('');
    try {
      const data = await api(`/salons/${salonId}/barbers`, { token });
      setItems(data);
      onCountChange?.(data?.length || 0);
    } catch (e) {
      setListError(e.message || 'Greška pri učitavanju frizera');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (salonId && token) {
      fetchList();
    } else {
      onCountChange?.(0);
    }
  }, [salonId, token]);

  async function onCreate(e) {
    e.preventDefault(); setFormError(''); setCreating(true);
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
      setShowAddModal(false);
      await fetchList();
    } catch (e) {
      setFormError(e.message || 'Greška pri kreiranju');
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
    } catch (e) { setListError(e.message || 'Greška pri izmeni'); }
  }

  function startEdit(barber) {
    setEditingBarber(barber);
    setEditForm({
      display_name: barber.display_name || '',
      slot_duration_minutes: barber.slot_duration_minutes || 30
    });
    setEditError('');
  }

  function cancelEdit() {
    if (savingEdit) return;
    setEditingBarber(null);
    setEditForm({ display_name: '', slot_duration_minutes: 30 });
    setEditError('');
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingBarber) return;
    setEditError('');
    setSavingEdit(true);
    try {
      await api(`/salons/${salonId}/barbers/${editingBarber.id}`, { 
        method: 'PUT', 
        token, 
        body: {
          display_name: editForm.display_name.trim(),
          active: true,
          slot_duration_minutes: Number(editForm.slot_duration_minutes) || 30,
        }
      });
      setEditingBarber(null);
      setEditForm({ display_name: '', slot_duration_minutes: 30 });
      await fetchList();
    } catch (e) { 
      setEditError(e.message || 'Greška pri snimanju'); 
    } finally {
      setSavingEdit(false);
    }
  }

  function openAddModal() {
    setForm({ email: '', password: '', full_name: '', phone: '', display_name: '', slot_duration_minutes: 30 });
    setFormError('');
    setShowAddModal(true);
  }

  function closeAddModal() {
    if (creating) return;
    setShowAddModal(false);
    setFormError('');
    setForm({ email: '', password: '', full_name: '', phone: '', display_name: '', slot_duration_minutes: 30 });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          <span>Učitavanje frizera…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-zinc-900">Tim frizera</h3>
              {items.length > 0 && (
                <span className="inline-flex h-6 items-center rounded-full bg-zinc-100 px-3 text-xs font-medium text-zinc-600">
                  {items.length}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500">Dodajte nove članove tima i upravljajte postojećim nalozima.</p>
          </div>
          <Button onClick={openAddModal} size="sm">
            Dodaj frizera
          </Button>
        </div>

        {listError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        <div className="grid gap-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                +
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">Dodajte svog prvog frizera</h3>
              <p className="mt-2 text-sm text-zinc-500">Kreirajte nalog i počnite da dodeljujete termine.</p>
              {listError && (
                <p className="mt-4 text-sm text-red-600">{listError}</p>
              )}
              <Button className="mt-6" onClick={openAddModal}>
                Otvori modal
              </Button>
            </div>
          ) : (
            items.map((barber) => (
              <div key={barber.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white">
                      {barber.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                        <span className="text-base font-semibold text-zinc-900">{barber.display_name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            barber.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${barber.active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {barber.active ? 'Aktivan' : 'Neaktivan'}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 sm:text-sm">
                        <p>Trajanje termina: {barber.slot_duration_minutes} min</p>
                        <p className="truncate">{barber.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(barber)}>
                      Izmeni
                    </Button>
                    <Button variant={barber.active ? 'danger' : 'success'} size="sm" onClick={() => onToggleActive(barber)}>
                      {barber.active ? 'Deaktiviraj' : 'Aktiviraj'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        open={showAddModal}
        onClose={closeAddModal}
        title="Dodaj novog frizera"
        description="Popunite osnovne podatke kako bi frizer mogao da prima rezervacije."
      >
        <form onSubmit={onCreate} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email adresa *" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="frizer@salon.com" />
            <Input label="Lozinka *" type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Minimum 6 karaktera" />
            <Input label="Ime i prezime *" required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Marko Petrović" />
            <Input label="Telefon" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+381 xx xxx xxxx" />
            <Input label="Prikazno ime *" required value={form.display_name} onChange={(e) => update('display_name', e.target.value)} placeholder="Marko" />
            <Input label="Trajanje slota (min)" type="number" min="1" value={form.slot_duration_minutes} onChange={(e) => update('slot_duration_minutes', e.target.value)} placeholder="30" />
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={creating}>
              {creating ? 'Kreiranje…' : 'Dodaj frizera'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeAddModal} disabled={creating}>
              Otkaži
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingBarber)}
        onClose={cancelEdit}
        title="Izmeni frizera"
        description={editingBarber ? `Ažurirajte podatke za ${editingBarber.display_name}.` : ''}
      >
        <form onSubmit={saveEdit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Prikazno ime *" required value={editForm.display_name} onChange={(e) => setEditForm((prev) => ({ ...prev, display_name: e.target.value }))} placeholder="Marko" />
            <Input label="Trajanje slota (min)" type="number" min="1" value={editForm.slot_duration_minutes} onChange={(e) => setEditForm((prev) => ({ ...prev, slot_duration_minutes: e.target.value }))} placeholder="30" />
          </div>

          {editError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? 'Čuvanje…' : 'Sačuvaj promene'}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={savingEdit}>
              Otkaži
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
