'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import {
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ReviewAPI, ProviderAPI } from '@/services/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rating ? (
          <StarIcon key={n} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarOutline key={n} className="h-4 w-4 text-gray-300" />
        ),
      )}
    </div>
  );
}

// ── pending reviews ───────────────────────────────────────────────────────────

function PendingSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, 'approving' | 'rejecting'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReviewAPI.getPending();
      setReviews(res.data.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setActing((p) => ({ ...p, [id]: 'approving' }));
    try {
      await ReviewAPI.approve(id);
      setReviews((p) => p.filter((r) => r.id !== id));
    } finally {
      setActing((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const reject = async (id: string) => {
    setActing((p) => ({ ...p, [id]: 'rejecting' }));
    try {
      await ReviewAPI.reject(id);
      setReviews((p) => p.filter((r) => r.id !== id));
    } finally {
      setActing((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Solicitações pendentes
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400">
          <CheckIcon className="h-5 w-5" />
          Nenhuma avaliação pendente
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const author = review.user?.name || review.authorName || 'Anônimo';
            const providerName = review.provider?.user?.name || '—';
            const busy = acting[review.id];
            return (
              <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <UserCircleIcon className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="font-medium text-gray-900">{author}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-gray-500">para <span className="font-medium text-gray-700">{providerName}</span></span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="mt-1.5"><Stars rating={review.rating} /></div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => approve(review.id)}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {busy === 'approving' ? '...' : 'Aprovar'}
                    </button>
                    <button
                      onClick={() => reject(review.id)}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {busy === 'rejecting' ? '...' : 'Recusar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── provider row (expandable) ─────────────────────────────────────────────────

function ProviderRow({ provider }: { provider: any }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const res = await ReviewAPI.getByProvider(provider.id);
      setReviews(res.data.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [provider.id]);

  const toggle = () => {
    if (!open && reviews.length === 0) loadReviews();
    setOpen((v) => !v);
  };

  const deleteReview = async (id: string) => {
    setConfirmId(null);
    setDeleting((p) => ({ ...p, [id]: true }));
    try {
      await ReviewAPI.delete(id);
      setReviews((p) => p.filter((r) => r.id !== id));
    } finally {
      setDeleting((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const name = provider.user?.name || '—';
  const avatar = provider.logoUrl || provider.user?.avatarUrl;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        {avatar ? (
          <Image src={avatar} alt={name} width={36} height={36} className="h-9 w-9 rounded-full object-cover shrink-0" unoptimized />
        ) : (
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
            {name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400">{provider._count?.reviews ?? 0} avaliações</p>
        </div>
        {open ? (
          <ChevronUpIcon className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDownIcon className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {loadingReviews ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">Nenhuma avaliação</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const author = review.user?.name || review.authorName || 'Anônimo';
                return (
                  <div key={review.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-gray-800">{author}</span>
                        <Stars rating={review.rating} />
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {review.isApproved ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                    {confirmId === review.id ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                        >
                          Apagar
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(review.id)}
                        disabled={deleting[review.id]}
                        className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
                        title="Apagar avaliação"
                      >
                        {deleting[review.id] ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-red-500" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── providers list ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function ProvidersSection() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
    debounceRef.current = setTimeout(() => {
      setQuery(value);
      setPage(1);
    }, 400);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Todos os prestadores e seus comentários
      </h2>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar prestador..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : providers.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Nenhum prestador encontrado</p>
      ) : (
        <>
          <div className="space-y-2">
            {providers.map((p) => <ProviderRow key={p.id} provider={p} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>{total} prestadores</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span>{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── root ──────────────────────────────────────────────────────────────────────

export default function ReviewsTab() {
  return (
    <div className="space-y-10">
      <PendingSection />
      <ProvidersSection />
    </div>
  );
}
