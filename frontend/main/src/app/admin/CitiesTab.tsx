'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CityAPI } from '@/services/api';

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

function toSlug(name: string) {
  return name.trim().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ── inline edit row ───────────────────────────────────────────────────────────

function EditRow({ city, onSave, onCancel }: {
  city: any;
  onSave: (data: { name: string; state: string; slug: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(city.name);
  const [state, setState] = useState(city.state);
  const [slug, setSlug] = useState(city.slug);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(toSlug(v));
  };

  const submit = async () => {
    if (!name.trim() || !state || !slug.trim()) return;
    setSaving(true);
    try { await onSave({ name: name.trim(), state, slug: slug.trim() }); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Nome"
        className="rounded-lg border border-gray-200 px-2.5 py-1 text-sm text-gray-800 focus:border-blue-400 focus:outline-none w-40"
      />
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
      >
        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug"
        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 focus:border-blue-400 focus:outline-none w-36 font-mono"
      />
      <button
        onClick={submit}
        disabled={saving || !name.trim() || !slug.trim()}
        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {saving ? '...' : <CheckIcon className="h-4 w-4" />}
      </button>
      <button
        onClick={onCancel}
        className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── add row ───────────────────────────────────────────────────────────────────

function AddRow({ onSave, onCancel }: {
  onSave: (data: { name: string; state: string; slug: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [state, setState] = useState('SP');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(toSlug(v));
  };

  const submit = async () => {
    if (!name.trim() || !state || !slug.trim()) return;
    setSaving(true);
    try { await onSave({ name: name.trim(), state, slug: slug.trim() }); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap border-t border-blue-100 bg-blue-50 px-4 py-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Nome da cidade"
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 focus:border-blue-400 focus:outline-none w-44"
      />
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
      >
        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug"
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500 font-mono focus:border-blue-400 focus:outline-none w-36"
      />
      <button
        onClick={submit}
        disabled={saving || !name.trim() || !slug.trim()}
        className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {saving ? '...' : <><CheckIcon className="h-3.5 w-3.5" /> Salvar</>}
      </button>
      <button onClick={onCancel} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-white transition-colors">
        Cancelar
      </button>
    </div>
  );
}

// ── main tab ──────────────────────────────────────────────────────────────────

export default function CitiesTab() {
  const [cities, setCities] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CityAPI.getAll({ limit: 9999 });
      const data = res.data.data ?? res.data ?? [];
      setCities(data);
      setFiltered(data);
    } catch {
      setCities([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = search.trim().toLowerCase();
      setFiltered(
        q ? cities.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)) : cities
      );
    }, 200);
  }, [search, cities]);

  const saveEdit = async (id: string, data: { name: string; state: string; slug: string }) => {
    await CityAPI.update(id, data);
    setCities((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
    setEditingId(null);
  };

  const saveNew = async (data: { name: string; state: string; slug: string }) => {
    const res = await CityAPI.create(data);
    setCities((prev) => [...prev, res.data]);
    setAdding(false);
  };

  const confirmDelete = async (id: string) => {
    await CityAPI.remove(id);
    setCities((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cidade ou estado..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nova cidade
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {filtered.length === 0 && !adding ? (
              <p className="py-10 text-center text-sm text-gray-400">Nenhuma cidade encontrada</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Cidade</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Estado</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Slug</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((city) => (
                    <tr key={city.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      {editingId === city.id ? (
                        <td colSpan={4} className="px-4 py-1">
                          <EditRow
                            city={city}
                            onSave={(data) => saveEdit(city.id, data)}
                            onCancel={() => setEditingId(null)}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{city.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{city.state}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{city.slug}</td>
                          <td className="px-4 py-2.5 text-right">
                            {deletingId === city.id ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <p className="text-xs font-semibold text-red-700">Tem certeza que deseja apagar <span className="underline">{city.name}</span>?</p>
                                <ul className="text-xs text-red-600 list-disc list-inside text-right">
                                  {(city._count?.providers ?? 0) > 0 && (
                                    <li>{city._count.providers} prestador{city._count.providers !== 1 ? 'es' : ''} perderá a cidade vinculada</li>
                                  )}
                                  {(city._count?.users ?? 0) > 0 && (
                                    <li>{city._count.users} usuário{city._count.users !== 1 ? 's' : ''} perderá a cidade vinculada</li>
                                  )}
                                  {(city._count?.providers ?? 0) === 0 && (city._count?.users ?? 0) === 0 && (
                                    <li>Nenhum registro vinculado — exclusão segura.</li>
                                  )}
                                </ul>
                                <div className="flex gap-2 mt-0.5">
                                  <button onClick={() => confirmDelete(city.id)} className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors">Apagar</button>
                                  <button onClick={() => setDeletingId(null)} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => { setEditingId(city.id); setAdding(false); setDeletingId(null); }}
                                  className="rounded-full p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="Editar"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => { setDeletingId(city.id); setEditingId(null); }}
                                  className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Apagar"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {adding && (
              <AddRow
                onSave={saveNew}
                onCancel={() => setAdding(false)}
              />
            )}
          </>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">{cities.length} cidade{cities.length !== 1 ? 's' : ''} cadastrada{cities.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
