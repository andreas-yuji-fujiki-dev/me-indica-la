'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ProviderAPI } from '@/services/api';

const PAGE_SIZE = 15;

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  APPROVED:  { label: 'Aprovado',  className: 'bg-green-100 text-green-700' },
  PENDING:   { label: 'Pendente',  className: 'bg-yellow-100 text-yellow-700' },
  REJECTED:  { label: 'Recusado', className: 'bg-red-100 text-red-700' },
  SUSPENDED: { label: 'Suspenso', className: 'bg-gray-100 text-gray-600' },
};

function DeleteModal({ provider, onConfirm, onCancel }: {
  provider: any;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const name = provider.user?.name || '—';
  const reviews   = provider._count?.reviews   ?? 0;
  const favorites = provider._count?.favoritedBy ?? 0;
  const gallery   = provider._count?.galleryImages ?? 0;
  const services  = provider.services?.length ?? 0;

  const confirm = async () => {
    setDeleting(true);
    try { await onConfirm(); }
    finally { setDeleting(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Apagar prestador</h2>
              <p className="text-xs text-gray-500">{name}</p>
            </div>
          </div>
          <button onClick={onCancel} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-3">
          Esta ação <strong>desativa permanentemente</strong> o perfil do prestador. Os seguintes dados serão afetados:
        </p>

        <ul className="space-y-1 text-sm text-gray-600 mb-5">
          <li className={reviews > 0 ? 'text-red-600' : 'text-gray-400'}>
            • {reviews} avaliação{reviews !== 1 ? 'ões' : ''} {reviews > 0 ? '— serão removidas' : ''}
          </li>
          <li className={favorites > 0 ? 'text-red-600' : 'text-gray-400'}>
            • {favorites} favorito{favorites !== 1 ? 's' : ''} {favorites > 0 ? '— serão removidos' : ''}
          </li>
          <li className={gallery > 0 ? 'text-red-600' : 'text-gray-400'}>
            • {gallery} imagem{gallery !== 1 ? 'ns' : ''} da galeria {gallery > 0 ? '— serão removidas' : ''}
          </li>
          <li className={services > 0 ? 'text-orange-600' : 'text-gray-400'}>
            • {services} serviço{services !== 1 ? 's' : ''} vinculado{services !== 1 ? 's' : ''} {services > 0 ? '— serão desvinculados' : ''}
          </li>
        </ul>

        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Apagando...' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllProvidersTab() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingProvider, setDeletingProvider] = useState<any | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await ProviderAPI.getAll({ page: p, limit: PAGE_SIZE, search: q || undefined });
      setProviders(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(query, page); }, [load, query, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setQuery(value); setPage(1); }, 400);
  };

  const toggleStatus = async (p: any) => {
    const next = p.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    setTogglingId(p.id);
    try {
      if (next === 'APPROVED') {
        await ProviderAPI.approve(p.id);
      } else {
        await ProviderAPI.update(p.id, { status: 'PENDING' });
      }
      setProviders((prev) => prev.map((x) => x.id === p.id ? { ...x, status: next } : x));
    } finally {
      setTogglingId(null);
    }
  };

  const doDelete = async () => {
    if (!deletingProvider) return;
    await ProviderAPI.remove(deletingProvider.id);
    setProviders((prev) => prev.filter((p) => p.id !== deletingProvider.id));
    setTotal((t) => t - 1);
    setDeletingProvider(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar prestador..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none"
          />
        </div>
        <span className="text-sm text-gray-400">{total} prestador{total !== 1 ? 'es' : ''}</span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : providers.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Nenhum prestador encontrado</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Prestador</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Cidade</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Plano</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Avaliações</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const statusInfo = STATUS_LABELS[p.status] ?? { label: p.status, className: 'bg-gray-100 text-gray-600' };
                const avatar = p.logoUrl || p.user?.avatarUrl;
                const name = p.user?.name || '—';
                const city = p.City ? `${p.City.name} – ${p.City.state}` : (p.cityName ?? '—');
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {avatar ? (
                          <Image src={avatar} alt={name} width={28} height={28} className="h-7 w-7 rounded-full object-cover shrink-0" unoptimized />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                            {name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{city}</td>
                    <td className="px-4 py-2.5">
                      {(p.status === 'APPROVED' || p.status === 'PENDING') ? (
                        <button
                          onClick={() => toggleStatus(p)}
                          disabled={togglingId === p.id}
                          title={p.status === 'APPROVED' ? 'Clique para definir como Pendente' : 'Clique para aprovar'}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40 ${statusInfo.className}`}
                        >
                          {togglingId === p.id ? '...' : statusInfo.label}
                        </button>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{p.plan ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{p._count?.reviews ?? 0}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.whatsappBusiness && (
                          <a
                            href={`https://wa.me/${p.whatsappBusiness.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="WhatsApp"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.122 1.523 5.855L.057 23.885a.5.5 0 0 0 .611.61l6.101-1.456A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.946 9.946 0 0 1-5.073-1.382l-.362-.214-3.761.898.926-3.674-.235-.375A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                            </svg>
                          </a>
                        )}
                        <button
                          onClick={() => setDeletingProvider(p)}
                          className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Apagar prestador"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
          <span>Página {page} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {deletingProvider && (
        <DeleteModal
          provider={deletingProvider}
          onConfirm={doDelete}
          onCancel={() => setDeletingProvider(null)}
        />
      )}
    </div>
  );
}
