'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UserIcon, CameraIcon, CheckIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { UserAPI } from '@/services/api';
import { normalizeImageUrl } from '@/utils/imageUrl';

const DELETE_PHRASE = 'apagar conta permanentemente';

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [fullUser, setFullUser] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      try {
        const res = await UserAPI.getById(user.id);
        setFullUser(res.data);
        setName(res.data.name ?? '');
      } catch {
        setName(user.name ?? '');
      }
    };
    fetchUser();
  }, [user]);

  // Reset modal state when closed
  const closeModal = () => {
    setShowDeleteModal(false);
    setDeletePhrase('');
    setDeleteError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
    e.target.value = '';
  };

  const handleRevertAvatar = () => {
    setPendingFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
  };

  const handleConfirmAvatar = async () => {
    if (!user || !pendingFile) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      await UserAPI.uploadAvatar(user.id, pendingFile);
      await refreshUser();
      setPendingFile(null);
      setAvatarPreview(null);
    } catch {
      setAvatarError('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await UserAPI.update(user.id, { name: name.trim() });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deletePhrase !== DELETE_PHRASE) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await UserAPI.delete(user.id);
      await logout();
    } catch {
      setDeleteError('Erro ao excluir conta. Tente novamente.');
      setDeleting(false);
    }
  };

  const currentAvatar = avatarPreview ?? normalizeImageUrl(user?.avatarUrl) ?? null;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar perfil de <span className="underline">usuário</span></h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie as informações da sua conta.</p>

        <div className="mt-8 space-y-6">
          {/* Avatar */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Foto de perfil</h2>

            <div className="mt-4 flex items-center gap-5">
              <div className="relative">
                {currentAvatar ? (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Ver foto em tamanho maior"
                  >
                    <Image
                      src={currentAvatar}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                      unoptimized
                    />
                  </button>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                )}
                {!pendingFile && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    aria-label="Trocar foto"
                  >
                    <CameraIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {pendingFile ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConfirmAvatar}
                      disabled={uploadingAvatar}
                      className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {uploadingAvatar ? 'Enviando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={handleRevertAvatar}
                      disabled={uploadingAvatar}
                      className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Reverter
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Escolher foto
                  </button>
                )}
                {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Name */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Nome</h2>
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaveSuccess(false); setSaveError(null); }}
                placeholder="Seu nome"
                maxLength={100}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !name.trim() || name.trim() === (fullUser?.name ?? user.name)}
                className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveSuccess && <CheckIcon className="h-4 w-4" />}
                {saving ? 'Salvando...' : saveSuccess ? 'Salvo' : 'Salvar'}
              </button>
            </div>
            {saveError && <p className="mt-2 text-sm text-red-600">{saveError}</p>}
          </div>

          {/* Account info */}
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Informações da conta</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">E-mail</dt>
                <dd className="font-medium text-gray-800">{user.email}</dd>
              </div>
              {fullUser?.createdAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Conta criada em</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(fullUser.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Delete button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Apagar conta
            </button>
          </div>
        </div>
      </div>

      {/* Avatar lightbox */}
      {showAvatarModal && currentAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentAvatar}
              alt="Foto de perfil"
              width={400}
              height={400}
              className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-2xl"
              unoptimized
            />
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Excluir conta</h2>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Esta ação é <strong>permanente e irreversível</strong>. Todos os seus dados serão removidos e não será possível recuperar a conta.
            </p>

            <div className="mt-5 space-y-3">
              <label className="block text-sm text-gray-700">
                Para confirmar, digite{' '}
                <span className="font-mono font-semibold text-red-700">"{DELETE_PHRASE}"</span>:
              </label>
              <input
                type="text"
                value={deletePhrase}
                onChange={(e) => { setDeletePhrase(e.target.value); setDeleteError(null); }}
                placeholder={DELETE_PHRASE}
                autoFocus
                className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletePhrase !== DELETE_PHRASE || deleting}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Excluindo...' : 'Excluir minha conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
