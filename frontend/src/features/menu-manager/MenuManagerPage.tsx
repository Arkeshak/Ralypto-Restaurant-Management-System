import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menuApi } from '../../api/endpoints/menu';
import { MoneyText } from '../../components/common/MoneyText';
import { BigButton } from '../../components/common/BigButton';
import { BookOpen, Plus, Search } from 'lucide-react';

export const MenuManagerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.getCategories,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu-items', selectedCat, searchTerm],
    queryFn: () =>
      menuApi.getItems({
        categoryId: selectedCat === 'all' ? undefined : selectedCat,
        search: searchTerm || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-brand-950/80 text-brand-500 border border-brand-800/60">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Menu Catalog Manager</h1>
            <p className="text-xs text-zinc-400">Categories, dishes, pricing in LKR, and kitchen modifiers</p>
          </div>
        </div>

        <BigButton variant="brand" size="sm" icon={<Plus className="w-4 h-4" />}>
          Add Menu Item
        </BigButton>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === c.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-500">Loading dishes...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl glass-panel border border-zinc-800 flex flex-col justify-between"
            >
              <div>
                {item.imageUrl && (
                  <div className="h-36 w-full rounded-xl overflow-hidden mb-3 bg-zinc-950">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-base">{item.name}</h3>
                  <MoneyText cents={item.priceCents} className="text-brand-400 text-sm whitespace-nowrap" />
                </div>
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Cost: <MoneyText cents={item.costCents} showCurrency={false} className="text-zinc-400" /></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.isAvailable ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                  {item.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
