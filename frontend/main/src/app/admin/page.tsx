'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { TagIcon, BuildingStorefrontIcon, ChatBubbleLeftEllipsisIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import ReviewsTab from './ReviewsTab';
import ProvidersTab from './ProvidersTab';
import CategoriesTab from './CategoriesTab';
import CitiesTab from './CitiesTab';
import AllProvidersTab from './AllProvidersTab';

const TABS = [
  { id: 'categories', label: 'Categorias e Serviços', icon: TagIcon },
  { id: 'cities', label: 'Cidades', icon: MapPinIcon },
  { id: 'all-providers', label: 'Prestadores', icon: UsersIcon },
  { id: 'providers', label: 'Solicitações de prestadores', icon: BuildingStorefrontIcon },
  { id: 'reviews', label: 'Solicitações de comentários', icon: ChatBubbleLeftEllipsisIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('categories');

  if (isLoading) return null;
  if (!user || user.role !== 'ADMIN') notFound();

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white sticky top-16 self-start h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Painel Admin</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">{active.label}</h1>
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'cities' && <CitiesTab />}
        {activeTab === 'all-providers' && <AllProvidersTab />}
        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
      </main>
    </div>
  );
}
