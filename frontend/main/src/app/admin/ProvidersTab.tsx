'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  TagIcon,
  ClockIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { ProviderAPI, CityAPI, CategoryAPI, ServiceAPI } from '@/services/api';
import { normalizeImageUrl } from '@/utils/imageUrl';

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

function CityField({ provider, onExistsChange }: { provider: any; onExistsChange?: (exists: boolean) => void }) {
  const cityName: string | null = provider.City?.name ?? provider.cityName ?? null;
  const cityState: string | null = provider.City?.state ?? provider.cityState ?? null;
  const linkedToDb: boolean = !!provider.City;

  const [status, setStatus] = useState<'idle' | 'creating' | 'created' | 'undoing'>('idle');
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (linkedToDb || !cityName) return;
    const slug = toSlug(cityName);
    CityAPI.getBySlug(slug).then((res) => {
      setCreatedId(res.data.id);
      setStatus('created');
      onExistsChange?.(true);
    }).catch(() => {});
  }, [linkedToDb, cityName]);

  if (!cityName) return null;

  const displayValue = cityState ? `${cityName} – ${cityState}` : cityName;
  const slug = cityName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const create = async () => {
    setStatus('creating');
    try {
      const res = await CityAPI.create({ name: cityName, state: cityState ?? '', slug });
      setCreatedId(res.data.id);
      setStatus('created');
      onExistsChange?.(true);
    } catch {
      setStatus('idle');
    }
  };

  const undo = async () => {
    if (!createdId) return;
    setStatus('undoing');
    try {
      await CityAPI.remove(createdId);
      setCreatedId(null);
      onExistsChange?.(false);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="col-span-2">
      <p className="text-xs text-gray-400 mb-0.5">Cidade</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-gray-800">{displayValue}</p>
        {!linkedToDb && status === 'idle' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-orange-500">não existe no banco, criar?</span>
            <button
              onClick={create}
              className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Criar
            </button>
          </div>
        )}
        {status === 'creating' && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border border-orange-400 border-t-transparent" />
            <span className="text-xs text-orange-400">Criando...</span>
          </div>
        )}
        {status === 'created' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-green-600">✓ {cityName} criada com sucesso.</span>
            <button
              onClick={undo}
              className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Desfazer
            </button>
          </div>
        )}
        {status === 'undoing' && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
            <span className="text-xs text-gray-400">Desfazendo...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function toSlug(str: string) {
  return str.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function CategoryField({ provider, onExistsChange }: { provider: any; onExistsChange?: (exists: boolean, id?: string) => void }) {
  const linkedToDb = !!provider.category;
  const displayName: string | null = provider.category?.name ?? provider.customCategory ?? null;

  const [status, setStatus] = useState<'idle' | 'creating' | 'created' | 'undoing'>('idle');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (linkedToDb || !displayName) return;
    const slug = toSlug(displayName);
    CategoryAPI.getBySlug(slug).then((res) => {
      setSavedId(res.data.id);
      setStatus('created');
      onExistsChange?.(true, res.data.id);
    }).catch(() => {});
  }, [linkedToDb, displayName]);

  if (!displayName) return null;

  const create = async () => {
    setStatus('creating');
    const slug = toSlug(displayName);
    try {
      const res = await CategoryAPI.create({ name: displayName, slug });
      setSavedId(res.data.id);
      setStatus('created');
      onExistsChange?.(true, res.data.id);
    } catch (err: any) {
      console.error('[CategoryField]', err?.response?.status, err?.response?.data?.message ?? err?.message);
      setStatus('idle');
    }
  };

  const undo = async () => {
    if (!savedId) return;
    setStatus('undoing');
    try {
      await CategoryAPI.remove(savedId);
      setStatus('idle');
      onExistsChange?.(false);
    } catch {
      setStatus('created');
    }
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">Categoria</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-800">{displayName}</span>

        {!linkedToDb && status === 'idle' && (
          <>
            <span className="text-xs text-orange-500">não existe no banco, criar?</span>
            <button
              onClick={create}
              className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Criar
            </button>
          </>
        )}

        {status === 'creating' && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border border-orange-400 border-t-transparent" />
            <span className="text-xs text-orange-400">Criando...</span>
          </div>
        )}

        {status === 'created' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-green-600">✓ criada com sucesso.</span>
            <button
              onClick={undo}
              className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Desfazer
            </button>
          </div>
        )}

        {status === 'undoing' && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
            <span className="text-xs text-gray-400">Desfazendo...</span>
          </div>
        )}

      </div>
    </div>
  );
}

function ServiceItem({ name, categoryExists, categoryId, onCreated }: {
  name: string;
  categoryExists: boolean;
  categoryId: string | null;
  onCreated?: (created: boolean, id?: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'created' | 'undoing'>('idle');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    const slug = toSlug(name);
    ServiceAPI.getBySlug(slug).then((res) => {
      setSavedId(res.data.id);
      setStatus('created');
      onCreated?.(true, res.data.id);
    }).catch(() => {});
  }, [name]);

  const create = async () => {
    setStatus('creating');
    const slug = toSlug(name);
    try {
      const res = await ServiceAPI.create({ name, slug, ...(categoryId ? { categoryIds: [categoryId] } : {}) });
      setSavedId(res.data.id);
      setStatus('created');
      onCreated?.(true, res.data.id);
    } catch (err: any) {
      console.error('[ServiceItem]', err?.response?.status, err?.response?.data?.message ?? err?.message);
      setStatus('idle');
    }
  };

  const undo = async () => {
    if (!savedId) return;
    setStatus('undoing');
    try {
      await ServiceAPI.remove(savedId);
      setStatus('idle');
      onCreated?.(false);
    } catch {
      setStatus('created');
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`rounded-full px-2.5 py-0.5 text-xs ${status === 'created' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        {name}
      </span>

      {status === 'idle' && (
        <>
          <span className="text-xs text-orange-500">não existe no banco, criar?</span>
          <button
            onClick={categoryExists ? create : undefined}
            disabled={!categoryExists}
            title={!categoryExists ? 'Crie a categoria primeiro' : undefined}
            className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Criar
          </button>
        </>
      )}

      {status === 'creating' && (
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 animate-spin rounded-full border border-orange-400 border-t-transparent" />
          <span className="text-xs text-orange-400">Criando...</span>
        </div>
      )}

      {status === 'created' && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-green-600">✓ criado.</span>
          <button
            onClick={undo}
            className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Desfazer
          </button>
        </div>
      )}

      {status === 'undoing' && (
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
          <span className="text-xs text-gray-400">Desfazendo...</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline wrap-break-word">
          {value}
        </a>
      ) : (
        <p className="text-sm text-gray-800 wrap-break-word">{value}</p>
      )}
    </div>
  );
}

// ─── gallery carousel ────────────────────────────────────────────────────────

function Gallery({ images }: { images: { imageUrl: string }[] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <PhotoIcon className="h-4 w-4" /> Galeria ({images.length})
      </p>
      <div className="relative overflow-hidden rounded-xl bg-gray-100" style={{ aspectRatio: '16/5' }}>
        <Image src={normalizeImageUrl(images[idx].imageUrl)!} alt={`Imagem ${idx + 1}`} fill className="object-cover" unoptimized />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── business hours ───────────────────────────────────────────────────────────

function BusinessHours({ hours }: { hours: any }) {
  if (!hours || typeof hours !== 'object') return null;
  const defined = DAYS.filter(({ key }) => hours[key] !== undefined);
  if (!defined.length) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <ClockIcon className="h-4 w-4" /> Horários
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        {defined.map(({ key, label }) => {
          const h = hours[key];
          const isOpen = h?.open === true && h?.start;
          return (
            <span key={key} className="text-gray-700">
              <span className="font-semibold uppercase">{label}:</span>{' '}
              {isOpen
                ? h.allDay ? '24 horas' : `${h.start} - ${h.end}`
                : <span className="text-gray-400">Fechado</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── provider detail card ─────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onDone,
}: {
  provider: any;
  onDone: (id: string) => void;
}) {
  const [full, setFull] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<'approving' | 'rejecting' | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);

  const [cityOk, setCityOk] = useState(!!provider.City);
  const [categoryExists, setCategoryExists] = useState(!!provider.category);
  const [categoryId, setCategoryId] = useState<string | null>(provider.category?.id ?? null);
  const [servicesOk, setServicesOk] = useState<Record<string, boolean>>({});
  const [createdServiceIds, setCreatedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    ProviderAPI.getById(provider.id)
      .then((r) => setFull(r.data))
      .catch(() => setFull(provider))
      .finally(() => setLoading(false));
  }, [provider]);

  const reject = async () => {
    setActing('rejecting');
    try {
      await ProviderAPI.reject(provider.id, rejectReason || undefined);
      onDone(provider.id);
    } finally {
      setActing(null);
      setConfirmReject(false);
    }
  };

  const p = full ?? provider;
  const customServices: string[] = p.customServiceNames ?? [];
  const needsCity = !p.City && !!(p.cityName ?? p.cityState);
  const needsCategory = !p.category && !!p.customCategory;
  const allOk =
    (!needsCity || cityOk) &&
    (!needsCategory || categoryExists) &&
    customServices.every((s: string) => servicesOk[s]);

  const handleApprove = () => {
    if (!allOk) { setShowChecklist(true); return; }
    doApprove();
  };

  const doApprove = async () => {
    setActing('approving');
    try {
      if (createdServiceIds.length > 0) {
        const existingIds = (p.services ?? []).map((s: any) => s.serviceId ?? s.id);
        await ProviderAPI.update(provider.id, { serviceIds: [...existingIds, ...createdServiceIds] });
      }
      await ProviderAPI.approve(provider.id);
      onDone(provider.id);
    } finally {
      setActing(null);
    }
  };

  const name = p.user?.name || '—';
  const logo = p.logoUrl;
  const cover = p.coverImageUrl;
  const gallery: { imageUrl: string }[] = p.galleryImages ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* cover */}
      {cover && (
        <div className="relative h-24 w-full bg-gray-100">
          <Image src={normalizeImageUrl(cover)!} alt="Banner" fill className="object-cover" unoptimized />
        </div>
      )}

      <div className="p-4">
        {/* header row */}
        <div className="flex items-center gap-3 mb-3">
          {logo ? (
            <Image src={normalizeImageUrl(logo)!} alt={name} width={40} height={40} className="h-10 w-10 rounded-xl border border-gray-100 object-cover shrink-0" unoptimized />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
              {name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {p.user?.email && <p className="text-xs text-gray-400">{p.user.email}</p>}
          </div>
          <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Pendente</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* basic info grid */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
              <Field label="Descrição" value={p.description} />
              <Field label="Endereço" value={p.address} />
              <CityField provider={p} onExistsChange={(exists) => setCityOk(exists)} />
              <Field label="Telefone" value={p.user?.phone} />
              <Field label="WhatsApp" value={p.whatsappBusiness} href={p.whatsappBusiness ? `https://wa.me/${p.whatsappBusiness.replace(/\D/g, '')}` : undefined} />
              <Field label="Instagram" value={p.instagram} href={p.instagram ? `https://instagram.com/${p.instagram.replace(/^@/, '')}` : undefined} />
              <Field label="Website" value={p.website} href={p.website} />
              <Field label="Plano" value={p.plan} />
              <Field label="Licença comercial" value={p.businessLicense} />
              <Field label="Plano" value={p.plan} />
            </div>

            {/* categoria + serviços em coluna */}
            <div className="flex flex-col gap-3">
              <CategoryField
                provider={p}
                onExistsChange={(exists, id) => {
                  setCategoryExists(exists);
                  setCategoryId(id ?? null);
                }}
              />

              {(p.services?.length > 0 || p.customServiceNames?.length > 0) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Serviços</p>
                  <div className="flex flex-col gap-1.5">
                    {p.services?.map((s: any) => (
                      <span key={s.serviceId ?? s.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 w-fit">{s.service?.name ?? s.name}</span>
                    ))}
                    {p.customServiceNames?.map((s: string) => (
                      <ServiceItem
                        key={s}
                        name={s}
                        categoryExists={categoryExists}
                        categoryId={categoryId}
                        onCreated={(created, id) => {
                          setServicesOk((prev) => ({ ...prev, [s]: created }));
                          if (created && id) setCreatedServiceIds((prev) => [...prev.filter((x) => x !== id), id]);
                          else if (!created) setCreatedServiceIds((prev) => prev.filter((x) => x !== id));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* palavras-chave */}
            {p.keywords?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Palavras-chave</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.keywords.map((k: string) => (
                    <span key={k} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* gallery */}
            <Gallery images={gallery} />

            {/* business hours */}
            <BusinessHours hours={p.businessHours} />

            {/* checklist pré-aprovação */}
            {showChecklist && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-800">Antes de aprovar, crie os itens pendentes:</p>
                {needsCity && (
                  <div className="flex items-center gap-2 text-xs">
                    {cityOk
                      ? <CheckIcon className="h-4 w-4 shrink-0 text-green-600" />
                      : <XMarkIcon className="h-4 w-4 shrink-0 text-red-500" />}
                    <span className={cityOk ? 'text-green-700' : 'text-gray-700'}>
                      Cidade — clique no botão laranja "Criar" acima
                    </span>
                  </div>
                )}
                {needsCategory && (
                  <div className="flex items-center gap-2 text-xs">
                    {categoryExists
                      ? <CheckIcon className="h-4 w-4 shrink-0 text-green-600" />
                      : <XMarkIcon className="h-4 w-4 shrink-0 text-red-500" />}
                    <span className={categoryExists ? 'text-green-700' : 'text-gray-700'}>
                      Categoria — clique no botão laranja "Criar" acima
                    </span>
                  </div>
                )}
                {customServices.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    {servicesOk[s]
                      ? <CheckIcon className="h-4 w-4 shrink-0 text-green-600" />
                      : <XMarkIcon className="h-4 w-4 shrink-0 text-red-500" />}
                    <span className={servicesOk[s] ? 'text-green-700' : 'text-gray-700'}>
                      Serviço "{s}" — clique no botão laranja "Criar" acima
                    </span>
                  </div>
                ))}
                {allOk && (
                  <button
                    onClick={doApprove}
                    disabled={!!acting}
                    className="mt-1 flex items-center gap-1 rounded-full bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    {acting === 'approving' ? 'Aprovando...' : 'Confirmar aprovação'}
                  </button>
                )}
              </div>
            )}

            {/* footer: date + actions */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">
                {new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>

              {confirmReject ? (
                <div className="flex items-center gap-2">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-800 focus:border-red-400 focus:outline-none w-44"
                  />
                  <button onClick={reject} disabled={!!acting} className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {acting === 'rejecting' ? '...' : 'Confirmar'}
                  </button>
                  <button onClick={() => { setConfirmReject(false); setRejectReason(''); }} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleApprove} disabled={!!acting} className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                    <CheckIcon className="h-3.5 w-3.5" />
                    {acting === 'approving' ? '...' : 'Aprovar'}
                  </button>
                  <button onClick={() => setConfirmReject(true)} disabled={!!acting} className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Recusar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main tab ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

export default function ProvidersTab() {
  const [providers, setProviders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await ProviderAPI.getAll({ status: 'PENDING', page: p, limit: PAGE_SIZE });
      setProviders(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const remove = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
    setTotal((t) => t - 1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} solicitação{total !== 1 ? 'ões' : ''} pendente{total !== 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckIcon className="h-12 w-12 mb-3" />
          <p className="text-sm">Nenhuma solicitação pendente</p>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} onDone={remove} />
          ))}
        </div>
      )}
    </div>
  );
}
