'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  TagIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { CategoryAPI, ServiceAPI } from '@/services/api';

// ── Service Row (second level) ────────────────────────────────────────────────

function ServiceRow({ service, onServicesUpdated }: { service: any; onServicesUpdated?: () => void }) {
  const svcName = service.name || '—';
  const description = service.description || '';
  const rawKeywords = service.keywords;
  const keywordsList: string[] = Array.isArray(rawKeywords)
    ? rawKeywords
    : typeof rawKeywords === 'string' && rawKeywords.trim()
      ? rawKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : [];

  // edit service modal state
  const [showEditSvc, setShowEditSvc] = useState(false);
  const [editSvcName, setEditSvcName] = useState('');
  const [editSvcDescription, setEditSvcDescription] = useState('');
  const [editSvcKeywords, setEditSvcKeywords] = useState('');
  const [editSvcSaving, setEditSvcSaving] = useState(false);
  const [editSvcError, setEditSvcError] = useState('');

  // delete service state
  const [showDeleteSvc, setShowDeleteSvc] = useState(false);
  const [deletingSvc, setDeletingSvc] = useState(false);
  const [deleteSvcError, setDeleteSvcError] = useState('');
  const svcProviderCount = service._count?.providers ?? 0;

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditSvcName(service.name || '');
    setEditSvcDescription(service.description || '');
    const kw = Array.isArray(service.keywords)
      ? service.keywords.join(', ')
      : typeof service.keywords === 'string'
        ? service.keywords
        : '';
    setEditSvcKeywords(kw);
    setEditSvcError('');
    setShowEditSvc(true);
  };

  const handleEditSave = async () => {
    if (!editSvcName.trim()) return;
    setEditSvcSaving(true);
    setEditSvcError('');
    try {
      const keywordsArr = editSvcKeywords
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean);
      await ServiceAPI.update(service.id, {
        name: editSvcName.trim(),
        description: editSvcDescription.trim() || undefined,
        keywords: keywordsArr.length > 0 ? keywordsArr : undefined,
      });
      setShowEditSvc(false);
      onServicesUpdated?.();
    } catch (err: any) {
      setEditSvcError(err?.response?.data?.message || 'Erro ao salvar serviço');
    } finally {
      setEditSvcSaving(false);
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 shrink-0 mt-0.5">
          <WrenchScrewdriverIcon className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800">{svcName}</p>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={openEdit}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Editar serviço"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteSvcError(''); setShowDeleteSvc(true); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Excluir serviço"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              <p className="text-xs text-gray-400 ml-1">
                {svcProviderCount} prestador{svcProviderCount !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
          )}
          {keywordsList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {keywordsList.map((kw, i) => (
                <span
                  key={i}
                  className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* delete service confirmation */}
      {showDeleteSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteSvc(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Excluir serviço "{svcName}"?</h2>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Esta ação <strong>excluirá permanentemente</strong> o serviço e removerá seu vínculo com as categorias. Esta operação não pode ser desfeita.
              </p>
              <p className="text-sm text-gray-600">
                {svcProviderCount > 0
                  ? <>Os dados de <strong>{svcProviderCount} prestador{svcProviderCount !== 1 ? 'es' : ''}</strong> vinculado{svcProviderCount !== 1 ? 's' : ''} a este serviço <strong>não serão afetados</strong>, mas o vínculo deles com este serviço será removido.</>
                  : 'Nenhum prestador está vinculado a este serviço no momento.'
                }
              </p>
            </div>

            {deleteSvcError && (
              <p className="mt-3 text-sm text-red-600">{deleteSvcError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteSvc(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeletingSvc(true);
                  setDeleteSvcError('');
                  try {
                    await ServiceAPI.remove(service.id);
                    setShowDeleteSvc(false);
                    onServicesUpdated?.();
                  } catch (err: any) {
                    setDeleteSvcError(err?.response?.data?.message || 'Erro ao excluir serviço');
                  } finally {
                    setDeletingSvc(false);
                  }
                }}
                disabled={deletingSvc}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingSvc ? 'Excluindo...' : 'Sim, excluir serviço'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* edit service modal */}
      {showEditSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowEditSvc(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar serviço</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={editSvcName}
                  onChange={(e) => setEditSvcName(e.target.value)}
                  placeholder="Nome do serviço"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={editSvcDescription}
                  onChange={(e) => setEditSvcDescription(e.target.value)}
                  placeholder="Descrição opcional do serviço"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                <input
                  type="text"
                  value={editSvcKeywords}
                  onChange={(e) => setEditSvcKeywords(e.target.value)}
                  placeholder="separadas por vírgula: ex: clínico, consulta, saúde"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {editSvcError && (
              <p className="mt-3 text-sm text-red-600">{editSvcError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditSvc(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editSvcName.trim() || editSvcSaving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {editSvcSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Row (first level) ────────────────────────────────────────────────

function CategoryRow({ category, onUpdate }: { category: any; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name || '');
  const [editDescription, setEditDescription] = useState(category.description || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [services, setServices] = useState<any[]>([]);
  const [servicePage, setServicePage] = useState(1);
  const [serviceTotal, setServiceTotal] = useState(0);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceError, setServiceError] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const SERVICE_PAGE_SIZE = 10;
  const serviceSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // add service modal state
  const [showAddService, setShowAddService] = useState(false);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcDescription, setNewSvcDescription] = useState('');
  const [newSvcKeywords, setNewSvcKeywords] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [addServiceError, setAddServiceError] = useState('');

  const loadServices = useCallback(async (catId: string, page: number, search?: string) => {
    setLoadingServices(true);
    setServiceError(false);
    try {
      const res = await CategoryAPI.getServicesByCategory(catId, {
        page,
        limit: SERVICE_PAGE_SIZE,
        search: search || undefined,
      });
      const svcData = res.data.data || [];
      setServices((prev) => {
        const merged = page === 1 ? [] : prev;
        const existing = new Set(merged.map((s: any) => s.id));
        for (const s of svcData) {
          if (!existing.has(s.id)) {
            merged.push(s);
            existing.add(s.id);
          }
        }
        return merged;
      });
      setServiceTotal(res.data.meta?.total || 0);
    } catch {
      setServiceError(true);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  const toggle = () => {
    if (!open && services.length === 0 && !loadingServices) {
      loadServices(category.id, 1, serviceSearch);
    }
    setOpen((v) => !v);
  };

  const handleServiceSearchChange = (value: string) => {
    setServiceSearch(value);
    if (serviceSearchTimeout.current) {
      clearTimeout(serviceSearchTimeout.current);
    }
    serviceSearchTimeout.current = setTimeout(() => {
      setServicePage(1);
      loadServices(category.id, 1, value);
    }, 350);
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleAddService = async () => {
    if (!newSvcName.trim()) return;
    setAddingService(true);
    setAddServiceError('');
    try {
      const keywordsArr = newSvcKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      await ServiceAPI.create({
        name: newSvcName.trim(),
        slug: slugify(newSvcName.trim()),
        description: newSvcDescription.trim() || undefined,
        keywords: keywordsArr.length > 0 ? keywordsArr : undefined,
        categoryIds: [category.id],
      });
      setShowAddService(false);
      setNewSvcName('');
      setNewSvcDescription('');
      setNewSvcKeywords('');
      setServicePage(1);
      setServiceSearch('');
      loadServices(category.id, 1);
    } catch (err: any) {
      setAddServiceError(err?.response?.data?.message || 'Erro ao criar serviço');
    } finally {
      setAddingService(false);
    }
  };

  const canLoadMore = services.length < serviceTotal;
  const loadMoreServices = () => {
    const nextPage = servicePage + 1;
    setServicePage(nextPage);
    loadServices(category.id, nextPage, serviceSearch);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(category.name || '');
    setEditDescription(category.description || '');
    setSaveError('');
    setEditing(true);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(false);
    setSaveError('');
  };

  const confirmEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await CategoryAPI.update(category.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    setDeleteError('');
    try {
      await CategoryAPI.remove(category.id);
      setShowDeleteConfirm(false);
      onUpdate();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || 'Erro ao excluir categoria');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    setDeleteError('');
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* category header */}
      <div
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        {category.icon ? (
          <Image
            src={category.icon}
            alt={category.name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <TagIcon className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da categoria"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
              {saveError && (
                <p className="text-xs text-red-600">{saveError}</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={confirmEdit}
                  disabled={!editName.trim() || saving}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                {category.isFeatured && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700 uppercase tracking-wider">
                    Destaque
                  </span>
                )}
                {!category.isActive && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 uppercase tracking-wider">
                    Inativo
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{category.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {category._count?.services ?? 0} serviço{category._count?.services !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <>
              <button
                onClick={startEditing}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Editar categoria"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Excluir categoria"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </>
          )}
          {open ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
          )}
        </div>
      </div>

      {/* delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-medium text-red-800">
              Excluir categoria "{category.name}"?
            </p>
            <p className="text-xs text-gray-600">
              Esta ação removerá permanentemente o vínculo da categoria com seus serviços.
              Prestadores que possuem esta categoria cadastrada como "Categoria principal" também serão desvinculados.
              {category._count?.services > 0 && (
                <> A categoria possui <strong>{category._count.services} serviço(s)</strong> vinculado(s).</>
              )}
            </p>
            {deleteError && (
              <p className="text-xs text-red-600">{deleteError}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
              <button
                onClick={handleDeleteCancel}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* services */}
      {open && (
        <div className="border-t border-gray-100 px-2 pb-3 pt-1">
          {/* service search + add button */}
          <div className="flex items-center gap-2 mx-2 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => handleServiceSearchChange(e.target.value)}
                placeholder="Buscar serviço..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {serviceSearch && (
                <button
                  onClick={() => handleServiceSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setShowAddService(true);
                setAddServiceError('');
                setNewSvcName('');
                setNewSvcDescription('');
                setNewSvcKeywords('');
              }}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              title="Adicionar serviço"
            >
              + Novo
            </button>
          </div>

          {/* add service modal */}
          {showAddService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddService(false)}>
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Novo serviço em "{category.name}"</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input
                      type="text"
                      value={newSvcName}
                      onChange={(e) => setNewSvcName(e.target.value)}
                      placeholder="Ex: Clínico Geral"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={newSvcDescription}
                      onChange={(e) => setNewSvcDescription(e.target.value)}
                      placeholder="Descrição opcional do serviço"
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                    <input
                      type="text"
                      value={newSvcKeywords}
                      onChange={(e) => setNewSvcKeywords(e.target.value)}
                      placeholder="separadas por vírgula: ex: clínico, consulta, saúde"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {addServiceError && (
                  <p className="mt-3 text-sm text-red-600">{addServiceError}</p>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowAddService(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddService}
                    disabled={!newSvcName.trim() || addingService}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {addingService ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loadingServices && services.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : serviceError ? (
            <p className="py-6 text-center text-xs text-red-400">
              Erro ao carregar serviços
            </p>
          ) : services.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Nenhum serviço encontrado para esta categoria
            </p>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                  {services.map((svc) => (
                  <ServiceRow key={svc.id} service={svc} onServicesUpdated={() => loadServices(category.id, 1, serviceSearch)} />
                ))}
              </div>

              {/* pagination for services */}
              {canLoadMore && (
                <div className="flex justify-center pt-3">
                  <button
                    onClick={loadMoreServices}
                    disabled={loadingServices}
                    className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    {loadingServices ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-t-2 border-gray-400" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        Carregar mais serviços ({serviceTotal - services.length} restantes)
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await CategoryAPI.getAll({
        page: p,
        limit: PAGE_SIZE,
        search: q || undefined,
      });
      setCategories(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      setError(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [load, page, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await CategoryAPI.create({
        name: newName.trim(),
        slug: slugify(newName.trim()),
        description: newDescription.trim() || undefined,
      });
      setShowAddModal(false);
      setNewName('');
      setNewDescription('');
      // Recarregar a primeira página
      setPage(1);
      setSearch('');
      load(1, '');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Erro ao criar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* search + add button */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar categoria..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setSubmitError('');
            setNewName('');
            setNewDescription('');
          }}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Adicionar categoria
        </button>
      </div>

      {/* add category modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova categoria</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Saúde & Bem-estar"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descrição opcional da categoria"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </div>

            {submitError && (
              <p className="mt-3 text-sm text-red-600">{submitError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || submitting}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} categoria{total !== 1 ? 's' : ''}
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

      {/* list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-red-400">
          <p className="text-sm">Erro ao carregar categorias</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <TagIcon className="h-12 w-12 mb-3" />
          <p className="text-sm">Nenhuma categoria encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryRow key={cat.id} category={cat} onUpdate={() => load(page, search)} />
          ))}
        </div>
      )}
    </div>
  );
}