'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProviderAPI, ProviderEditRequestAPI, FavoriteAPI, ReviewAPI } from '@/services/api';
import {
  HeartIcon as OutlineHeartIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as SolidHeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/context/AuthContext';

export default function ProviderPageClient() {
  const params = useParams();
  const providerId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [cancellingReview, setCancellingReview] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [pendingEditRequest, setPendingEditRequest] = useState<any>(null);
  const [cancellingEdit, setCancellingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) {
        setError('Prestador inválido.');
        setLoading(false);
        return;
      }
      try {
        const response = await ProviderAPI.getById(providerId);
        setProvider(response.data);
      } catch (err) {
        console.error('Failed to load provider', err);
        setError('Não foi possível carregar este prestador no momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [providerId]);

  useEffect(() => {
    if (!provider || !user) return;
    if (provider.status === 'REJECTED' && user.id === provider.userId) {
      ProviderAPI.remove(provider.id).finally(() => {
        router.replace('/provider/register');
      });
    }
  }, [provider, user, router]);

  useEffect(() => {
    const fetchFavorite = async () => {
      if (!isAuthenticated || !user || !providerId) return;
      try {
        const response = await FavoriteAPI.checkProviderFavorite(user.id, providerId);
        setIsFavorite(response.data.isFavorited);
      } catch {
        // silently ignore
      }
    };
    fetchFavorite();
  }, [isAuthenticated, user, providerId]);

  useEffect(() => {
    if (!providerId) return;
    ProviderEditRequestAPI.getPending(providerId)
      .then((res) => setPendingEditRequest(res.data ?? null))
      .catch(() => setPendingEditRequest(null));
  }, [providerId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    if (lightboxOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxOpen]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    try {
      if (isFavorite) {
        await FavoriteAPI.removeProviderFavorite(user.id, providerId!);
        setIsFavorite(false);
      } else {
        await FavoriteAPI.addProviderFavorite(user.id, providerId!);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const submitReview = async () => {
    if (reviewRating === 0) return;
    const trimmed = reviewComment.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      setReviewError('O comentário deve ter pelo menos 10 caracteres.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const response = await ReviewAPI.create({
        providerId: providerId!,
        userId: user!.id,
        rating: reviewRating,
        ...(trimmed.length > 0 && { comment: trimmed }),
      });
      setProvider((prev: any) => ({
        ...prev,
        reviews: [...(prev.reviews ?? []), response.data],
      }));
      setReviewRating(0);
      setReviewComment('');
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setReviewError('Você já avaliou este prestador.');
      } else {
        setReviewError('Erro ao enviar avaliação. Tente novamente.');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const cancelReview = async (reviewId: string) => {
    setCancellingReview(true);
    try {
      await ReviewAPI.delete(reviewId);
      setProvider((prev: any) => ({
        ...prev,
        reviews: (prev.reviews ?? []).filter((r: any) => r.id !== reviewId),
      }));
    } catch {
      // silently ignore — user can try again
    } finally {
      setCancellingReview(false);
    }
  };

  const renderRatingStars = (rating?: number) => {
    if (rating == null || rating <= 0) return null;
    const clamped = Math.min(Math.max(rating, 0), 5);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const fillPercent = Math.min(Math.max((clamped - index) * 100, 0), 100);
          return (
            <span key={index} className="relative inline-block text-slate-300 text-lg leading-none">
              <span className="text-yellow-500 absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>★</span>
              <span>★</span>
            </span>
          );
        })}
      </div>
    );
  };

  const formatWhatsApp = (raw: string) => raw.replace(/\D/g, '');

  const formatInstagram = (raw: string) => {
    if (raw.startsWith('http')) return raw;
    return `https://instagram.com/${raw.replace('@', '')}`;
  };

  const formatWebsite = (raw: string) => {
    if (raw.startsWith('http')) return raw;
    return `https://${raw}`;
  };

  const cancelProviderRequest = async () => {
    if (!provider) return;
    setCancellingRequest(true);
    try {
      await ProviderAPI.remove(provider.id);
      router.push('/');
    } catch {
      setCancellingRequest(false);
    }
  };

  const galleryImages = provider?.galleryImages ?? [];
  const approvedReviews = provider?.reviews?.filter((r: any) => r.isApproved) ?? [];
  const isOwnProfile = isAuthenticated && user && provider && user.id === provider.userId;
  const isPending = provider && provider.status === 'PENDING';
  const canReview = isAuthenticated && user && provider && !isOwnProfile;
  const pendingUserReview = canReview
    ? provider?.reviews?.find((r: any) => r.userId === user?.id && !r.isApproved) ?? null
    : null;

  const galleryPrev = () => setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
  const galleryNext = () => setGalleryIndex((i) => (i + 1) % galleryImages.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-3xl bg-white p-10 shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </div>
        ) : isPending && !isOwnProfile ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-700">Página não encontrada</p>
            <p className="mt-2 text-sm text-gray-400">Este perfil não está disponível.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {isPending && isOwnProfile && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="font-semibold text-amber-800">
                  Sua solicitação de cadastro de negócio foi enviada para avaliação.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Só você pode ver essa página por enquanto. Nossa equipe irá revisar e aprovar em breve.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/provider/register?edit=${provider?.id}`)}
                    className="rounded-full bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                  >
                    Editar solicitação
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Tem certeza que deseja cancelar sua solicitação? Essa ação não pode ser desfeita.')) return;
                      await cancelProviderRequest();
                    }}
                    disabled={cancellingRequest}
                    className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {cancellingRequest ? 'Cancelando...' : 'Cancelar solicitação'}
                  </button>
                </div>
              </div>
            )}

            {!isPending && isOwnProfile && pendingEditRequest && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <p className="font-semibold text-amber-800">
                  Sua solicitação de edição está em análise.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  As informações desta página permanecem como estão até a equipe aprovar as alterações.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      if (!window.confirm('Cancelar a solicitação de edição? As alterações enviadas serão descartadas.')) return;
                      setCancellingEdit(true);
                      try {
                        await ProviderEditRequestAPI.cancel(pendingEditRequest.id);
                        setPendingEditRequest(null);
                      } finally {
                        setCancellingEdit(false);
                      }
                    }}
                    disabled={cancellingEdit}
                    className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {cancellingEdit ? 'Cancelando...' : 'Cancelar solicitação de edição'}
                  </button>
                </div>
              </div>
            )}

            {!isPending && isOwnProfile && !pendingEditRequest && (
              <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => { setDeleteConfirmInput(''); setShowDeleteModal(true); }}
                  className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Deletar perfil
                </button>
                <button
                  onClick={() => router.push(`/provider/register?edit=${provider?.id}&editRequest=true`)}
                  className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Editar informações
                </button>
              </div>
            )}

            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                  <h2 className="text-lg font-semibold text-gray-900">Deletar perfil de negócio</h2>
                  <p className="mt-3 text-sm text-gray-600">
                    Essa ação é <span className="font-semibold text-red-600">irreversível</span>. Para confirmar, digite exatamente:
                  </p>
                  <p className="mt-2 rounded-xl bg-gray-100 px-4 py-2 font-mono text-sm text-gray-800">
                    deletar meu negócio {provider?.user?.name}
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={`deletar meu negócio ${provider?.user?.name}`}
                    className="text-black mt-4 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                      className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={deleteConfirmInput !== `deletar meu negócio ${provider?.user?.name}` || deleting}
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await ProviderAPI.remove(provider.id);
                          router.push('/');
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                    >
                      {deleting ? 'Deletando...' : 'Deletar permanentemente'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              {provider?.coverImageUrl ? (
                <div className="relative h-36 w-full sm:h-48 md:h-64">
                  <Image
                    src={provider.coverImageUrl}
                    alt={`Capa de ${provider.user?.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 960px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-32 w-full bg-linear-to-br from-blue-50 to-blue-100" />
              )}

              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    {(provider?.logoUrl || provider?.user?.avatarUrl) ? (
                      <div className="relative -mt-14 shrink-0">
                        <Image
                          src={provider.logoUrl || provider.user.avatarUrl}
                          alt={provider.user?.name}
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="-mt-14 shrink-0 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-2xl font-bold border-4 border-white shadow">
                        {provider?.user?.name?.charAt(0) || 'P'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{provider?.user?.name}</h1>
                        {provider?.isVerified && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            <CheckBadgeIcon className="h-3.5 w-3.5" />
                            Verificado
                          </span>
                        )}
                      </div>
                      {(provider?.City || provider?.cityName) && (
                        <p className="mt-1 text-sm text-gray-500">
                          {provider.City
                            ? `${provider.City.name}${provider.City.state ? ` - ${provider.City.state}` : ''}`
                            : `${provider.cityName}${provider.cityState ? ` - ${provider.cityState}` : ''}`}
                        </p>
                      )}

                      {provider?.address === 'Somente Online' && (
                        <p className="mt-1 text-sm text-gray-500">
                          Atendimento somente online
                        </p>
                      )}
                      {(provider?.averageRating ?? 0) > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          {renderRatingStars(provider.averageRating)}
                          <span className="text-sm text-gray-500">
                            {provider.averageRating.toFixed(1)} · {provider._count?.reviews ?? provider.totalReviews ?? 0} avaliações
                          </span>
                        </div>
                      ) : (
                        <p className="mt-2 mb-2 text-sm text-gray-400">
                          Ainda não avaliado - Conte-nos sobre os serviços deste prestador!
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={toggleFavorite}
                    className="shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    {isFavorite
                      ? <SolidHeartIcon className="h-6 w-6 text-red-500" />
                      : <OutlineHeartIcon className="h-6 w-6 text-gray-400 hover:text-red-500" />}
                  </button>
                </div>

                {(provider?.whatsappBusiness || provider?.instagram || provider?.website) && (
                  <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                    {provider.whatsappBusiness && (
                      <a
                        href={`https://wa.me/${formatWhatsApp(provider.whatsappBusiness)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-green-50 px-4 py-2 sm:py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                      >
                        Contatar via WhatsApp {'>'}
                      </a>
                    )}
                    {provider.instagram && (
                      <a
                        href={formatInstagram(provider.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-pink-50 px-4 py-2 sm:py-2.5 text-sm font-medium text-pink-700 hover:bg-pink-100 transition-colors"
                      >
                        Contatar via Instagram {'>'}
                      </a>
                    )}
                    {provider.address && provider.address !== 'Somente Online' && (
                      <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(`${provider.address}${provider.City ? `, ${provider.City.name} ${provider.City.state}` : ''}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-red-50 px-4 py-2 sm:py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Google Maps {'>'}
                      </a>
                    )}
                    {provider.website && (
                      <a
                        href={formatWebsite(provider.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-blue-50 px-4 py-2 sm:py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Site {'>'}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* About */}
            {(provider?.description || (provider?.keywords?.length ?? 0) > 0 || provider?.address) && (
              <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Sobre</h2>
                {provider.description && (
                  <p className="mt-2 text-gray-600">{provider.description}</p>
                )}

                {(provider?.keywords?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="mt-5 text-xl font-semibold text-gray-900">Palavras-chave</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.keywords.map((kw: string) => (
                        <span key={kw} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Services offered */}
            {((provider?.services?.length ?? 0) > 0 || (provider?.customServiceNames?.length ?? 0) > 0) && (
              <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Serviços oferecidos</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(provider?.services ?? []).map((ps: any) => (
                    <div
                      key={ps.service?.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="font-medium text-gray-900">{ps.service?.name}</p>
                      {(ps.service?.categories?.length ?? 0) > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ps.service.categories.map((sc: any) => (
                            <span
                              key={sc.category?.id}
                              className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm"
                            >
                              {sc.category?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(provider?.customServiceNames ?? []).map((name: string) => {
                    const categoryLabel = provider.category?.name ?? provider.customCategory;
                    return (
                      <div
                        key={name}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <p className="font-medium text-gray-900">{name}</p>
                        {categoryLabel && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm">
                              {categoryLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gallery carousel */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Fotos
                {galleryImages.length > 0 && (
                  <span className="ml-2 text-base font-normal text-gray-400">({galleryImages.length})</span>
                )}
              </h2>
              {galleryImages.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">Nenhuma foto adicionada ainda.</p>
              ) : (
                <div className="mt-4">
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100">
                    {imgErrors.has(galleryImages[galleryIndex]?.id) ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
                        </svg>
                        <span className="text-sm">Imagem indisponível</span>
                      </div>
                    ) : (
                      <img
                        key={galleryImages[galleryIndex]?.id}
                        src={galleryImages[galleryIndex]?.imageUrl}
                        alt={`Foto ${galleryIndex + 1}`}
                        className="h-full w-full object-cover cursor-zoom-in"
                        onClick={() => setLightboxOpen(true)}
                        onError={() => {
                          const id = galleryImages[galleryIndex]?.id;
                          if (id) setImgErrors((prev) => new Set(prev).add(id));
                        }}
                      />
                    )}

                    <button
                      onClick={galleryPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={galleryNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
                      aria-label="Próxima foto"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">
                      {galleryIndex + 1}/{galleryImages.length}
                    </span>
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((img: any, i: number) => (
                        <button
                          key={img.id}
                          onClick={() => setGalleryIndex(i)}
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === galleryIndex ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          aria-label={`Ir para foto ${i + 1}`}
                        >
                          {imgErrors.has(img.id) ? (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          ) : (
                            <img
                              src={img.imageUrl}
                              alt={`Miniatura ${i + 1}`}
                              className="h-full w-full object-cover"
                              onError={() => setImgErrors((prev) => new Set(prev).add(img.id))}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Business hours */}
            {(() => {
              const DAYS_ORDER = [
                { key: 'mon', label: 'Segunda-feira' },
                { key: 'tue', label: 'Terça-feira' },
                { key: 'wed', label: 'Quarta-feira' },
                { key: 'thu', label: 'Quinta-feira' },
                { key: 'fri', label: 'Sexta-feira' },
                { key: 'sat', label: 'Sábado' },
                { key: 'sun', label: 'Domingo' },
              ];
              const hours = provider?.businessHours as Record<string, { open: boolean; start: string; end: string; allDay?: boolean }> | undefined;
              const hasAnyHourInfo = hours && Object.keys(hours).length > 0;

              return (
                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900">Horários de funcionamento</h2>

                  {!hasAnyHourInfo ? (
                    <p className="mt-4 text-sm text-gray-400">Horários de funcionamento não informados</p>
                  ) : (
                    <div className="mt-4 divide-y divide-gray-100">
                      {DAYS_ORDER.map(({ key, label }) => {
                        const day = hours[key];
                        return (
                          <div key={key} className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-gray-700">{label}</span>
                            {day?.open ? (
                              <span className="text-sm font-medium text-gray-900">
                                {day.allDay ? '24 horas' : `${day.start} – ${day.end}`}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Fechado</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Upcoming events */}
            {(provider?.events?.length ?? 0) > 0 && (
              <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Eventos</h2>
                <div className="mt-4 space-y-4">
                  {provider.events.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      {event.coverImageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <Image src={event.coverImageUrl} alt={event.name} fill className="object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{event.name}</p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {new Date(event.eventDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {event.location && ` · ${event.location}`}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                        )}
                        {(event.whatsapp || event.instagram || event.externalLink) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {event.whatsapp && (
                              <a href={`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline">
                                WhatsApp
                              </a>
                            )}
                            {event.instagram && (
                              <a href={formatInstagram(event.instagram)} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-700 hover:underline">
                                Instagram
                              </a>
                            )}
                            {event.externalLink && (
                              <a href={formatWebsite(event.externalLink)} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:underline">
                                Saiba mais
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leave a review */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                {pendingUserReview ? 'Sua avaliação' : 'Deixar avaliação'}
              </h2>

              {isOwnProfile ? (
                <p className="mt-4 text-sm text-gray-400">Você não pode avaliar seu próprio negócio.</p>
              ) : !isAuthenticated ? (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Faça login para deixar uma avaliação.</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-3 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Entrar
                  </button>
                </div>
              ) : pendingUserReview ? (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-800">Avaliação em análise</p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Sua avaliação foi recebida e está aguardando aprovação. Ela aparecerá neste perfil em breve.
                  </p>
                  {pendingUserReview.comment && (
                    <p className="mt-2 text-sm text-gray-600 italic">"{pendingUserReview.comment}"</p>
                  )}
                  <button
                    onClick={() => cancelReview(pendingUserReview.id)}
                    disabled={cancellingReview}
                    className="mt-3 rounded-full border border-yellow-400 px-4 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancellingReview ? 'Cancelando...' : 'Cancelar solicitação de avaliação'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Nota</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="text-3xl leading-none transition-colors"
                          aria-label={`Nota ${star}`}
                        >
                          <span className={star <= (hoverRating || reviewRating) ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="ml-2 text-sm text-gray-500">{reviewRating}/5</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Comentário (opcional, mínimo 10 caracteres)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Descreva sua experiência com este prestador..."
                      rows={3}
                      maxLength={1000}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-sm text-red-600">{reviewError}</p>
                  )}

                  <button
                    onClick={submitReview}
                    disabled={reviewRating === 0 || reviewSubmitting}
                    className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {reviewSubmitting ? 'Enviando...' : 'Enviar avaliação'}
                  </button>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Avaliações ({provider._count?.reviews ?? approvedReviews.length})
              </h2>
              {approvedReviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">Nenhuma avaliação ainda.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {approvedReviews.map((review: any) => (
                    <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {review.user?.avatarUrl ? (
                            <Image
                              src={review.user.avatarUrl}
                              alt={review.user.name || review.authorName || 'Usuário'}
                              width={36}
                              height={36}
                              className="h-9 w-9 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                              {(review.user?.name || review.authorName || 'U').charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {review.user?.name || review.authorName || 'Anônimo'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {renderRatingStars(review.rating)}
                          <span className="text-sm text-gray-500">{review.rating}/5</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); galleryPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <img
            src={galleryImages[galleryIndex]?.imageUrl}
            alt={`Foto ${galleryIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); galleryNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
            aria-label="Próxima foto"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
            {galleryIndex + 1} / {galleryImages.length}
          </span>
        </div>
      )}
    </div>
  );
}
