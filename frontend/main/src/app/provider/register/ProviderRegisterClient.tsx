'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { CategoryAPI, CityAPI, ProviderAPI, ProviderEditRequestAPI, ServiceAPI, UserAPI } from '@/services/api';
import { normalizeImageUrl } from '@/utils/imageUrl';

const DAYS = [
  { key: 'mon', label: 'Segunda-feira' },
  { key: 'tue', label: 'Terça-feira' },
  { key: 'wed', label: 'Quarta-feira' },
  { key: 'thu', label: 'Quinta-feira' },
  { key: 'fri', label: 'Sexta-feira' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
] as const;

type DayKey = (typeof DAYS)[number]['key'];
type DayHours = { open: boolean; start: string; end: string; allDay?: boolean };
type BusinessHours = Record<DayKey, DayHours>;

const DEFAULT_HOURS: BusinessHours = {
  mon: { open: true, start: '08:00', end: '18:00' },
  tue: { open: true, start: '08:00', end: '18:00' },
  wed: { open: true, start: '08:00', end: '18:00' },
  thu: { open: true, start: '08:00', end: '18:00' },
  fri: { open: true, start: '08:00', end: '18:00' },
  sat: { open: false, start: '08:00', end: '12:00' },
  sun: { open: false, start: '', end: '' },
};

type FormErrors = {
  businessName?: string;
  description?: string;
  keywords?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  logo?: string;
  category?: string;
  services?: string;
  address?: string;
  number?: string;
  cityId?: string;
  coordinates?: string;
  businessHours?: string;
  hoursDetail?: Partial<Record<DayKey, string>>;
};

const VALID_DDDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

function isValidBrazilianPhone(digits: string): boolean {
  if (digits.length !== 10 && digits.length !== 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (!VALID_DDDS.has(ddd)) return false;
  if (digits.length === 11 && digits[2] !== '9') return false;
  if (digits.length === 10) {
    const third = parseInt(digits[2], 10);
    if (third < 2 || third > 8) return false;
  }
  return true;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeStr(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function formatSuggestion(s: any): string {
  const a = s.address || {};
  const road = a.road || a.pedestrian || a.street || a.footway || '';
  const hood = a.suburb || a.neighbourhood || a.quarter || '';
  const city = a.city || a.town || a.village || a.municipality || '';
  const iso: string = a['ISO3166-2-lvl4'] ?? '';
  const stateCode = iso.split('-')[1] || '';
  const parts = [road, hood, city && stateCode ? `${city} - ${stateCode}` : city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : s.display_name;
}

export default function ProviderRegisterClient() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    ProviderAPI.getByUserId(user.id)
      .then((res) => {
        const p = res.data;
        const params = new URLSearchParams(window.location.search);
        const editParam = params.get('edit');
        const editRequestParam = params.get('editRequest') === 'true';
        if (p.status === 'APPROVED') {
          if (editRequestParam && editParam === p.id) return;
          router.replace(`/provider/${p.id}`);
          return;
        }
        if (!editParam || editParam !== p.id) { router.replace(`/provider/${p.id}`); }
      })
      .catch(() => {});
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [customServiceNames, setCustomServiceNames] = useState<string[]>([]);

  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [cityId, setCityId] = useState('');
  const [cityName, setCityName] = useState('');
  const [cityState, setCityState] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [cities, setCities] = useState<any[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lockedByAutocomplete, setLockedByAutocomplete] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditRequest = searchParams.get('editRequest') === 'true';
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);

  const suggestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    CityAPI.getAll()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setCities(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    CategoryAPI.getAll()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setCategories(data.filter((c: any) => c.isActive !== false));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOtherCategory) {
      ServiceAPI.getAll()
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setServices(data.filter((s: any) => s.isActive !== false));
        })
        .catch(() => {});
      return;
    }
    if (!selectedCategoryId) { setServices([]); return; }
    CategoryAPI.getServicesByCategory(selectedCategoryId)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        const normalized = raw.map((item: any) => item.service ?? item).filter((s: any) => s?.isActive !== false);
        setServices(normalized);
      })
      .catch(() => {});
  }, [selectedCategoryId, isOtherCategory]);

  useEffect(() => {
    if (user && !businessName && !editId) setBusinessName(user.name ?? '');
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!editId) return;
    ProviderAPI.getById(editId).then((res) => {
      const p = res.data;
      setBusinessName(p.user?.name ?? '');
      setDescription(p.description ?? '');
      setWhatsapp((p.whatsappBusiness ?? '').replace('+55', ''));
      setInstagram((p.instagram ?? '').replace('@', ''));
      setWebsite(p.website ?? '');
      setKeywords(p.keywords ?? []);
      if (p.businessHours && typeof p.businessHours === 'object') {
        setBusinessHours(p.businessHours as BusinessHours);
      }
      if (p.categoryId) {
        setSelectedCategoryId(p.categoryId);
        setIsOtherCategory(false);
      } else if (p.customCategory) {
        setIsOtherCategory(true);
        setCustomCategory(p.customCategory);
      }
      setSelectedServiceIds((p.services ?? []).map((ps: any) => ps.serviceId));
      setCustomServiceNames(p.customServiceNames ?? []);
      if (p.address === 'Somente Online') {
        setIsOnlineOnly(true);
      } else {
        setIsOnlineOnly(false);
        const parts = (p.address ?? '').split(', ');
        if (parts.length > 1) {
          setNumber(parts[parts.length - 1]);
          setAddress(parts.slice(0, -1).join(', '));
        } else {
          setAddress(p.address ?? '');
        }
        if (p.City) { setCityId(p.City.id); setCityName(p.City.name); setCityState(p.City.state ?? ''); }
      }
      const logoUrl = normalizeImageUrl(p.logoUrl || p.user?.avatarUrl || null);
      if (logoUrl) { setExistingLogoUrl(logoUrl); setLogoPreview(logoUrl); }
      const coverUrl = normalizeImageUrl(p.coverImageUrl);
      if (coverUrl) { setExistingBannerUrl(coverUrl); setBannerPreview(coverUrl); }
      if ((p.galleryImages ?? []).length > 0) {
        const urls = p.galleryImages.map((gi: any) => normalizeImageUrl(gi.imageUrl) ?? gi.imageUrl);
        setExistingGalleryUrls(urls);
        setGalleryPreviews(urls);
      }
    }).catch(() => {});
  }, [editId]); // eslint-disable-line react-hooks/exhaustive-deps


  const searchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 5) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=br`,
        { headers: { 'Accept-Language': 'pt-BR' } },
      );
      const data = await res.json();
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionLoading(false);
    }
  }, []);

  const handleCepChange = async (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setCep(digits);
    setLockedByAutocomplete(false);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const streetPart = [data.logradouro, data.bairro].filter(Boolean).join(', ');
        setAddress(streetPart);
        setErrors((p) => ({ ...p, address: undefined }));
        if (data.localidade) {
          setCityName(data.localidade);
          setCityState(data.uf || '');
          const matched = cities.find(
            (c) =>
              normalizeStr(c.name) === normalizeStr(data.localidade) &&
              c.state.toUpperCase() === (data.uf || '').toUpperCase(),
          );
          setCityId(matched?.id || '');
          if (matched) setErrors((p) => ({ ...p, cityId: undefined }));
        }
      }
    } catch {}
    finally { setCepLoading(false); }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    if (value.trim().length >= 5) {
      suggestionTimerRef.current = setTimeout(() => searchSuggestions(value), 500);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (s: any) => {
    const a = s.address || {};
    const road = a.road || a.pedestrian || a.street || a.footway || '';
    const hood = a.suburb || a.neighbourhood || a.quarter || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const iso: string = a['ISO3166-2-lvl4'] ?? '';
    const stateCode = iso.split('-')[1] || '';

    const parts = [road, hood, city && stateCode ? `${city} - ${stateCode}` : city].filter(Boolean);
    setAddress(parts.join(', '));
    setErrors((p) => ({ ...p, address: undefined }));

    if (a.postcode) setCep((a.postcode as string).replace(/\D/g, '').slice(0, 8));

    if (city) {
      setCityName(city);
      setCityState(stateCode);
      const matched = cities.find(
        (c) =>
          normalizeStr(c.name) === normalizeStr(city) &&
          (stateCode ? c.state.toUpperCase() === stateCode.toUpperCase() : true),
      );
      setCityId(matched?.id || '');
      if (matched) setErrors((p) => ({ ...p, cityId: undefined }));
    }

    setLockedByAutocomplete(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleClearAutofill = () => {
    setLockedByAutocomplete(false);
    setCep('');
    setCityId('');
    setCityName('');
    setCityState('');
    setAddress('');
    setNumber('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setErrors((p) => ({ ...p, logo: undefined }));
    e.target.value = '';
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files].slice(0, 10));
    setGalleryPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))].slice(0, 10));
    e.target.value = '';
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryPreviews((prev) => {
      const url = prev[index];
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setGalleryFiles((prev) => {
      const preview = galleryPreviews[index];
      if (preview?.startsWith('blob:')) return prev.filter((_, i) => i !== index);
      return prev;
    });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw.length < 2) { setKeywordInput(''); return; }
    if (!keywords.includes(kw)) {
      const next = [...keywords, kw];
      setKeywords(next);
      if (next.length > 0 && errors.keywords) setErrors((p) => ({ ...p, keywords: undefined }));
    }
    setKeywordInput('');
  };

  const setDay = (day: DayKey, field: keyof DayHours, value: string | boolean) => {
    setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setErrors((prev) => ({ ...prev, businessHours: undefined, hoursDetail: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    const hoursDetail: Partial<Record<DayKey, string>> = {};

    if (!businessName.trim()) {
      e.businessName = 'Nome do negócio é obrigatório.';
    } else if (businessName.trim().length < 2) {
      e.businessName = 'Nome deve ter pelo menos 2 caracteres.';
    }

    if (!description.trim()) {
      e.description = 'Descrição é obrigatória.';
    } else if (description.trim().length < 10) {
      e.description = 'Descrição deve ter pelo menos 10 caracteres.';
    }

    if (keywords.length === 0) {
      e.keywords = 'Adicione pelo menos uma palavra-chave.';
    }

    if (!whatsapp.trim()) {
      e.whatsapp = 'WhatsApp é obrigatório.';
    } else if (!isValidBrazilianPhone(whatsapp)) {
      e.whatsapp = 'Número inválido. Informe DDD + número (ex: 11999999999 ou 1133334444).';
    }

    if (instagram.trim()) {
      const ig = instagram.replace('@', '').trim();
      if (ig.length < 1 || ig.length > 30) {
        e.instagram = 'O @ do Instagram deve ter entre 1 e 30 caracteres.';
      } else if (!/^[a-zA-Z0-9._]+$/.test(ig)) {
        e.instagram = 'Use apenas letras, números, pontos e underscores.';
      }
    }

    if (website.trim() && !isValidUrl(website.trim())) {
      e.website = 'Informe uma URL válida começando com http:// ou https://.';
    }

    if (!logoFile && !existingLogoUrl) {
      e.logo = 'Logo é obrigatória.';
    }

    if (!selectedCategoryId && !isOtherCategory) {
      e.category = 'Selecione uma categoria ou escolha "Outra".';
    } else if (isOtherCategory && !customCategory.trim()) {
      e.category = 'Informe o nome da categoria.';
    }

    if (selectedServiceIds.length === 0 && customServiceNames.length === 0) {
      e.services = 'Selecione pelo menos um serviço ou adicione um personalizado.';
    }

    if (!isOnlineOnly) {
      if (!address.trim()) e.address = 'Endereço é obrigatório.';
      if (!number.trim()) e.number = 'Número é obrigatório.';
    }

    const openDays = DAYS.filter(({ key }) => businessHours[key].open);
    if (openDays.length === 0) {
      e.businessHours = 'Informe pelo menos um dia de atendimento.';
    } else {
      openDays.forEach(({ key }) => {
        const h = businessHours[key];
        if (h.allDay) return;
        if (!h.start || !h.end) {
          hoursDetail[key] = 'Preencha início e fim.';
        } else if (h.start >= h.end) {
          hoursDetail[key] = 'Início deve ser anterior ao fim.';
        }
      });
      if (Object.keys(hoursDetail).length > 0) e.hoursDetail = hoursDetail;
    }

    return e;
  };

  const handleOpenModal = () => {
    const e = validate();
    setErrors(e);
    const hasErrors =
      Object.keys(e).filter((k) => k !== 'hoursDetail').length > 0 ||
      Object.keys(e.hoursDetail ?? {}).length > 0;
    if (!hasErrors) {
      setSubmitError(null);
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    if (!user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!isEditRequest && businessName.trim() !== user.name) {
        await UserAPI.update(user.id, { name: businessName.trim() });
        await refreshUser();
      }

      let logoUrl: string = existingLogoUrl ?? '';
      if (logoFile) {
        if (isEditRequest) {
          const logoRes = await ProviderAPI.uploadLogo(logoFile);
          logoUrl = logoRes.data.url;
        } else {
          const logoRes = await UserAPI.uploadAvatar(user.id, logoFile);
          logoUrl = logoRes.data.avatarUrl;
          await refreshUser();
        }
      }

      let coverImageUrl: string | undefined = existingBannerUrl ?? undefined;
      if (bannerFile) {
        const r = await ProviderAPI.uploadBanner(bannerFile);
        coverImageUrl = r.data.url;
      }

      const keptExisting = existingGalleryUrls.filter((url) => galleryPreviews.includes(url));
      const newGalleryUrls: string[] = [];
      for (const file of galleryFiles) {
        const r = await ProviderAPI.uploadGalleryImage(file);
        newGalleryUrls.push(r.data.url);
      }
      const galleryImageUrls = [...keptExisting, ...newGalleryUrls];

      const finalAddress = isOnlineOnly ? 'Somente Online' : [address.trim(), number.trim()].filter(Boolean).join(', ');

      const payload: Record<string, any> = {
        ...(isEditRequest && { businessName: businessName.trim() }),
        description: description.trim(),
        whatsappBusiness: `+55${whatsapp.trim()}`,
        address: finalAddress,
        logoUrl,
        businessHours,
        instagram: instagram.trim() ? `@${instagram.trim().replace('@', '')}` : '',
        website: website.trim() || '',
        keywords,
        customServiceNames,
        serviceIds: selectedServiceIds,
        galleryImageUrls,
      };
      if (cityId) payload.cityId = cityId;
      if (cityName) payload.cityName = cityName;
      if (cityState) payload.cityState = cityState;
      if (coverImageUrl) payload.coverImageUrl = coverImageUrl;
      if (!isOtherCategory && selectedCategoryId) payload.categoryId = selectedCategoryId;
      if (isOtherCategory && customCategory.trim()) payload.customCategory = customCategory.trim();

      if (editId && isEditRequest) {
        await ProviderEditRequestAPI.create({ providerId: editId, ...payload });
        setShowModal(false);
        router.push(`/provider/${editId}`);
      } else if (editId) {
        await ProviderAPI.update(editId, payload);
        setShowModal(false);
        router.push(`/provider/${editId}`);
      } else {
        payload.userId = user.id;
        const res = await ProviderAPI.create(payload);
        setShowModal(false);
        router.push(`/provider/${res.data.id}`);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  const cepFormatted = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditRequest ? 'Editar informações do negócio' : editId ? 'Editar solicitação' : 'Cadastrar seu negócio'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditRequest
            ? 'Suas alterações serão enviadas para análise. A página permanece como está até a aprovação.'
            : editId
            ? 'Atualize as informações da sua solicitação. As alterações ficam pendentes de aprovação.'
            : 'Preencha as informações do seu negócio. Após criado, ficará pendente de aprovação.'}
        </p>

        <div className="mt-8 space-y-6">

          {/* ── Identidade ─────────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Identidade</h2>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Nome do negócio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (errors.businessName) setErrors((p) => ({ ...p, businessName: undefined }));
                }}
                placeholder="Ex: Clínica Dr. João"
                maxLength={100}
                className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 ${
                  errors.businessName
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>}
              <p className="mt-1 text-xs text-gray-400">Atualizará o nome de exibição do seu perfil.</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
                }}
                placeholder="Descreva seu negócio, serviços, diferenciais..."
                maxLength={1000}
                rows={4}
                className={`mt-1 w-full resize-none rounded-2xl border px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Palavras-chave<span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); }
                  }}
                  placeholder="Ex: fisioterapia, reabilitação"
                  className={`text-black flex-1 rounded-2xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    errors.keywords
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Mínimo 2 caracteres por palavra-chave.</p>
              {errors.keywords && <p className="mt-1 text-xs text-red-500">{errors.keywords}</p>}
              {keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <span key={kw} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                      {kw}
                      <button type="button" onClick={() => setKeywords((p) => p.filter((k) => k !== kw))} className="text-blue-400 hover:text-blue-600">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Logo — required */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700">
                Logo <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 hover:border-blue-400 transition-colors ${
                    errors.logo ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <PhotoIcon className="h-8 w-8 text-gray-300" />
                  )}
                </button>
                <div className="text-sm">
                  <button type="button" onClick={() => logoRef.current?.click()} className="text-blue-600 hover:underline">
                    {logoPreview ? 'Trocar logo' : 'Escolher logo'}
                  </button>
                  <p className="text-xs text-gray-400">PNG, JPG ou WEBP. Máx 5 MB.</p>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="mt-0.5 block text-xs text-red-500 hover:underline">
                      Remover
                    </button>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
              </div>
              {errors.logo && <p className="mt-1 text-xs text-red-500">{errors.logo}</p>}
            </div>

            {/* Banner */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700">Banner</label>
              <button type="button" onClick={() => bannerRef.current?.click()}
                className="mt-2 w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors">
                {bannerPreview ? (
                  <div className="relative h-36 w-full">
                    <Image src={bannerPreview} alt="Banner" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center gap-2">
                    <PhotoIcon className="h-8 w-8 text-gray-300" />
                    <span className="text-sm text-gray-400">Escolher banner</span>
                  </div>
                )}
              </button>
              {bannerPreview && (
                <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} className="mt-1 text-xs text-red-500 hover:underline">
                  Remover banner
                </button>
              )}
              <input ref={bannerRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={handleBannerChange} />
            </div>
          </section>

          {/* ── Categoria ───────────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              Área de atuação <span className="text-red-500">*</span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">Selecione a categoria que melhor descreve seu negócio.</p>
            {errors.category && <p className="mt-2 text-xs text-red-500">{errors.category}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = !isOtherCategory && selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setIsOtherCategory(false);
                      setCustomCategory('');
                      setSelectedServiceIds([]);
                      setCustomServiceNames([]);
                      setErrors((p) => ({ ...p, category: undefined, services: undefined }));
                    }}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setIsOtherCategory(true);
                  setSelectedCategoryId('');
                  setSelectedServiceIds([]);
                  setCustomServiceNames([]);
                  setErrors((p) => ({ ...p, category: undefined, services: undefined }));
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  isOtherCategory
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                Outra
              </button>
            </div>

            {isOtherCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  if (errors.category) setErrors((p) => ({ ...p, category: undefined }));
                }}
                placeholder="Nome da categoria"
                maxLength={80}
                className={`mt-3 w-full rounded-2xl border px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 ${
                  errors.category
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
            )}
          </section>

          {/* ── Serviços ─────────────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              Serviços oferecidos <span className="text-red-500">*</span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {selectedCategoryId || isOtherCategory
                ? 'Selecione os serviços que você oferece ou adicione um personalizado.'
                : 'Selecione uma categoria acima para ver os serviços disponíveis.'}
            </p>
            {errors.services && <p className="mt-2 text-xs text-red-500">{errors.services}</p>}

            {(selectedCategoryId || isOtherCategory) && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {services.map((svc) => {
                    const selected = selectedServiceIds.includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => {
                          setSelectedServiceIds((prev) =>
                            selected ? prev.filter((id) => id !== svc.id) : [...prev, svc.id],
                          );
                          if (errors.services) setErrors((p) => ({ ...p, services: undefined }));
                        }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {svc.name}
                      </button>
                    );
                  })}
                  {services.length === 0 && !isOtherCategory && (
                    <p className="text-sm text-gray-400">Nenhum serviço cadastrado para esta categoria.</p>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customServiceInput}
                      onChange={(e) => setCustomServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const v = customServiceInput.trim();
                          if (v.length >= 2 && !customServiceNames.includes(v)) {
                            setCustomServiceNames((p) => [...p, v]);
                            if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
                          }
                          setCustomServiceInput('');
                        }
                      }}
                      placeholder="Outro serviço não listado"
                      className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = customServiceInput.trim();
                        if (v.length >= 2 && !customServiceNames.includes(v)) {
                          setCustomServiceNames((p) => [...p, v]);
                          if (errors.services) setErrors((prev) => ({ ...prev, services: undefined }));
                        }
                        setCustomServiceInput('');
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Adicionar
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Mínimo 2 caracteres. Pressione Enter ou vírgula para adicionar.</p>
                </div>

                {customServiceNames.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customServiceNames.map((name) => (
                      <span key={name} className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                        {name}
                        <button
                          type="button"
                          onClick={() => setCustomServiceNames((p) => p.filter((n) => n !== name))}
                          className="text-green-400 hover:text-green-600"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Galeria ──────────────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Galeria</h2>
            <p className="mt-0.5 text-xs text-gray-400">Adicione fotos do seu negócio. Máx. 10 imagens.</p>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {galleryPreviews.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <Image src={src} alt={`Galeria ${i + 1}`} fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {galleryPreviews.length < 10 && (
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  <div className="flex flex-col items-center gap-1">
                    <PlusIcon className="h-6 w-6 text-gray-300" />
                    <span className="text-xs text-gray-400">Adicionar</span>
                  </div>
                </button>
              )}
            </div>
            <input
              ref={galleryRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleGalleryChange}
            />
          </section>

          {/* ── Contato e redes ─────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Contato e redes</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp Business <span className="text-red-500">*</span>
                </label>
                <div className={`mt-1 flex overflow-hidden rounded-2xl border focus-within:ring-2 ${
                  errors.whatsapp
                    ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
                    : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-blue-100'
                }`}>
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">+55</span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 11));
                      if (errors.whatsapp) setErrors((p) => ({ ...p, whatsapp: undefined }));
                    }}
                    placeholder="11999999999"
                    className="text-black flex-1 bg-white px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                {errors.whatsapp ? (
                  <p className="mt-1 text-xs text-red-500">{errors.whatsapp}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">DDD + número (10 ou 11 dígitos)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <div className={`mt-1 flex overflow-hidden rounded-2xl border focus-within:ring-2 ${
                  errors.instagram
                    ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
                    : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-blue-100'
                }`}>
                  <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">@</span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => {
                      setInstagram(e.target.value.replace('@', '').slice(0, 30));
                      if (errors.instagram) setErrors((p) => ({ ...p, instagram: undefined }));
                    }}
                    placeholder="seunegocio"
                    className="text-black flex-1 bg-white px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                {errors.instagram && <p className="mt-1 text-xs text-red-500">{errors.instagram}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Site <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    if (errors.website) setErrors((p) => ({ ...p, website: undefined }));
                  }}
                  placeholder="https://seunegocio.com.br"
                  className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 ${
                    errors.website
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website}</p>}
              </div>
            </div>
          </section>

          {/* ── Localização ─────────────────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Localização</h2>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Atendimento somente online</p>
                <p className="text-xs text-gray-400">Sem endereço físico ou atendimento presencial</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isOnlineOnly;
                  setIsOnlineOnly(next);
                  setCep(''); setAddress(''); setNumber('');
                  setCityId(''); setCityName(''); setCityState('');
                  setLockedByAutocomplete(false);
                  setErrors((p) => ({ ...p, address: undefined, number: undefined, cityId: undefined }));
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${isOnlineOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
                aria-pressed={isOnlineOnly}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${isOnlineOnly ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {isOnlineOnly ? (
              <p className="mt-3 text-sm text-gray-500">
                Seu negócio será cadastrado como <span className="font-medium text-gray-700">somente online</span>, sem endereço físico.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CEP</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={cepFormatted}
                      onChange={(e) => { if (!lockedByAutocomplete) handleCepChange(e.target.value); }}
                      readOnly={lockedByAutocomplete}
                      placeholder="00000-000"
                      maxLength={9}
                      className={`w-full rounded-2xl border px-4 py-2.5 pr-10 text-sm focus:outline-none ${
                        lockedByAutocomplete
                          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
                          : 'text-black border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                    {cepLoading && !lockedByAutocomplete && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      </div>
                    )}
                    {lockedByAutocomplete && cep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <LockClosedIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {!lockedByAutocomplete && (
                    <p className="mt-1 text-xs text-gray-400">Preencha para auto-completar o endereço.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Endereço<span className="text-red-500">*</span>
                  </label>
                  <label className="block text-sm font-medium text-gray-500 mb-3">
                    Informe o CEP no input acima se os resultados da busca não corresponderem.
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
                      onFocus={() => { if (addressSuggestions.length > 0) setShowSuggestions(true); }}
                      placeholder="Rua e bairro (sem número)"
                      className={`w-full rounded-2xl border px-4 py-2.5 pr-10 text-sm text-black focus:outline-none focus:ring-2 ${
                        errors.address
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                    />
                    {suggestionLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      </div>
                    )}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                        {addressSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectSuggestion(s)}
                            className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50"
                          >
                            <span className="block text-gray-800">{formatSuggestion(s)}</span>
                            {s.address?.postcode && (
                              <span className="text-xs text-gray-400">CEP: {s.address.postcode}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                  {lockedByAutocomplete && (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-gray-400">Selecionado da pesquisa.</p>
                      <button type="button" onClick={handleClearAutofill} className="text-xs text-blue-600 hover:underline">
                        Alterar localização
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => {
                      setNumber(e.target.value);
                      if (errors.number) setErrors((p) => ({ ...p, number: undefined }));
                    }}
                    placeholder="Ex: 123 ou S/N"
                    maxLength={20}
                    className={`mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 ${
                      errors.number
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                  {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number}</p>}
                </div>

                {cityName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <div className={`mt-1 flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm ${
                      errors.cityId ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <span className="text-gray-700">{cityName}{cityState ? ` — ${cityState}` : ''}</span>
                      <LockClosedIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    {errors.cityId && <p className="mt-1 text-xs text-red-500">{errors.cityId}</p>}
                  </div>
                )}
                {!cityName && errors.cityId && (
                  <p className="text-xs text-red-500">{errors.cityId}</p>
                )}
              </div>
            )}
          </section>

          {/* ── Horários de funcionamento ────────────────────────── */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              Horários de funcionamento <span className="text-red-500">*</span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">Ative pelo menos um dia e informe os horários.</p>
            {errors.businessHours && <p className="mt-2 text-xs text-red-500">{errors.businessHours}</p>}

            <div className="mt-4 space-y-2">
              {DAYS.map(({ key, label }) => {
                const h = businessHours[key];
                const hourError = errors.hoursDetail?.[key];
                return (
                  <div key={key} className="py-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                      <span className="w-[6.5rem] sm:w-32 shrink-0 text-sm text-gray-600">{label}</span>
                      <button
                        type="button"
                        onClick={() => setDay(key, 'open', !h.open)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${h.open ? 'bg-blue-600' : 'bg-gray-200'}`}
                        aria-pressed={h.open}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${h.open ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      {h.open ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setDay(key, 'allDay', !h.allDay)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                              h.allDay
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            24h
                          </button>
                          {!h.allDay && (
                            <>
                              <input
                                type="time"
                                value={h.start}
                                onChange={(e) => setDay(key, 'start', e.target.value)}
                                className={`rounded-xl border px-2 py-1 text-sm text-black focus:outline-none focus:border-blue-500 ${hourError ? 'border-red-400' : 'border-gray-200'}`}
                              />
                              <span className="text-sm text-gray-400">às</span>
                              <input
                                type="time"
                                value={h.end}
                                onChange={(e) => setDay(key, 'end', e.target.value)}
                                className={`rounded-xl border px-2 py-1 text-sm text-black focus:outline-none focus:border-blue-500 ${hourError ? 'border-red-400' : 'border-gray-200'}`}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">Fechado</span>
                      )}
                    </div>
                    {hourError && <p className="mt-1 text-xs text-red-500">{hourError}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleOpenModal}
              className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              {isEditRequest ? 'Enviar para análise' : editId ? 'Salvar alterações' : 'Criar negócio'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditRequest ? 'Enviar solicitação de edição' : editId ? 'Confirmar alterações' : 'Confirmar criação'}
              </h2>
              {!submitting && (
                <button onClick={() => setShowModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" aria-label="Fechar">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {isEditRequest
                ? <>Você está enviando uma solicitação de edição para <strong className="text-gray-900">"{businessName}"</strong>.</>
                : editId
                ? <>Você está prestes a atualizar a solicitação <strong className="text-gray-900">"{businessName}"</strong>.</>
                : <>Você está prestes a criar o negócio <strong className="text-gray-900">"{businessName}"</strong> na plataforma.</>}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {isEditRequest
                ? <>A página permanece exibindo as informações atuais até a equipe <span className="font-medium text-amber-600">aprovar</span> a edição.</>
                : editId
                ? 'As alterações ficam pendentes até serem revisadas pela equipe.'
                : <>Após criado, o perfil ficará com status <span className="font-medium text-amber-600">pendente de aprovação</span> até ser revisado pela equipe.</>}
            </p>
            {submitError && (
              <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{submitError}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} disabled={submitting} className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleConfirm} disabled={submitting} className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Enviando...' : isEditRequest ? 'Enviar para análise' : editId ? 'Salvar alterações' : 'Criar negócio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
