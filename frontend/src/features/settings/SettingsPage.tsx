import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Receipt,
  Percent,
  QrCode,
  LayoutGrid,
  Globe,
  RefreshCw,
  Info,
  Save,
  Printer,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/stores/ui.store';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n';
import { db } from '@/offline/db';
import { processSyncQueue } from '@/offline/syncQueue';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { tablesApi } from '@/api/endpoints/tables';
import type { Table } from '@/api/types';

type SettingsTab =
  | 'restaurant'
  | 'tax'
  | 'receipt'
  | 'tables'
  | 'qr'
  | 'theme'
  | 'sync'
  | 'about';

interface TableSetting {
  id: string;
  number: string;
  area: string;
  seats: number;
}

export function SettingsPage() {
  const { restaurant, plan } = useAuth();
  const { themeMode, setThemeMode } = useUiStore();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('restaurant');

  // 1. Restaurant Profile
  const [restName, setRestName] = useState(restaurant?.name || 'Ralypto Bistro');
  const [restAddress, setRestAddress] = useState('Galle Road, Colombo 03, Sri Lanka');
  const [restPhone, setRestPhone] = useState('+94 11 234 5678');

  // 2. Tax & Service
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [serviceRate, setServiceRate] = useState(10);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState(10);

  // 3. Receipt Settings
  const [receiptHeader, setReceiptHeader] = useState(
    'Welcome to Ralypto Bistro · Fresh & Authentic'
  );
  const [receiptFooter, setReceiptFooter] = useState(
    'Thank you for dining with us! Powered by Ralypto'
  );
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);

  // 4. Tables & Areas
  const [tablesList, setTablesList] = useState<TableSetting[]>([]);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableArea, setNewTableArea] = useState('Indoor Dining');
  const [newTableSeats, setNewTableSeats] = useState(4);

  // 5. QR Codes
  const [allowSelfOrder, setAllowSelfOrder] = useState(true);

  // 7. Sync Problems
  const [failedOrders, setFailedOrders] = useState<any[]>([]);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  const loadFailedSync = async () => {
    try {
      const all = await db.offlineOrders.toArray();
      const failed = all.filter((item) => item.retryCount > 0 || item.syncStatus === 'failed');
      setFailedOrders(failed);
    } catch {
      setFailedOrders([]);
    }
  };

  useEffect(() => {
    loadFailedSync();
  }, []);

  const reloadTables = useCallback(async () => {
    const rows = await tablesApi.getTables();
    setTablesList(rows.map((t: Table) => ({ id: t.id, number: t.number, area: t.areaName, seats: t.capacity })));
  }, []);
  useEffect(() => {
    void Promise.all([apiClient<any[]>('/showcase/settings'), reloadTables()]).then(([saved]) => {
      const config = saved.find((item) => item.key === 'restaurant');
      if (!config) return;
      setRestName(config.restName ?? restaurant?.name ?? ''); setRestAddress(config.restAddress ?? ''); setRestPhone(config.restPhone ?? '');
      setServiceEnabled(config.serviceEnabled ?? true); setServiceRate(config.serviceRate ?? 10);
      setTaxEnabled(config.taxEnabled ?? true); setTaxRate(config.taxRate ?? 10);
      setReceiptHeader(config.receiptHeader ?? ''); setReceiptFooter(config.receiptFooter ?? '');
      setShowLogoOnReceipt(config.showLogoOnReceipt ?? true); setAllowSelfOrder(config.allowSelfOrder ?? true);
    }).catch(() => toast.error('Could not load settings'));
  }, [reloadTables, restaurant?.name]);

  const handleSaveAll = async () => {
    try {
      await apiClient('/showcase/settings', { method: 'POST', body: JSON.stringify({ restName, restAddress, restPhone, serviceEnabled, serviceRate, taxEnabled, taxRate, receiptHeader, receiptFooter, showLogoOnReceipt, allowSelfOrder }) });
      toast.success('Settings saved to the restaurant account');
    } catch { toast.error('Could not save settings'); }
  };

  const handlePrintTestReceipt = () => {
    window.print();
    toast.success('Test receipt dispatched to 80mm print queue');
  };

  const handlePrintAllQr = () => {
    window.print();
    toast.success('Dispatched A4 QR Codes print sheet');
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;
    try {
      await tablesApi.createTable({ number: newTableNum.trim().toUpperCase(), areaName: newTableArea, capacity: newTableSeats });
      await reloadTables(); setNewTableNum(''); toast.success(`Added table ${newTableNum.trim().toUpperCase()}`);
    } catch { toast.error('Could not add table. Check for duplicate table number or active-session permission.'); }
  };

  const handleDeleteTable = async (id: string) => {
    try { await apiClient(`/tables/${id}`, { method: 'DELETE' }); await reloadTables(); toast.info('Table removed from layout'); }
    catch { toast.error('Cannot remove this table while it has an active order'); }
  };

  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    try {
      await processSyncQueue();
      await loadFailedSync();
      toast.success('Offline sync queue processed');
    } catch {
      toast.error('Sync retry encountered errors');
    } finally {
      setIsRetryingSync(false);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'restaurant', label: 'Restaurant Profile', icon: <Store className="h-4 w-4" /> },
    { id: 'tax', label: 'Tax & Service', icon: <Percent className="h-4 w-4" /> },
    { id: 'receipt', label: 'Receipt Template', icon: <Receipt className="h-4 w-4" /> },
    { id: 'tables', label: 'Tables & Areas', icon: <LayoutGrid className="h-4 w-4" /> },
    { id: 'qr', label: 'QR Codes & Ordering', icon: <QrCode className="h-4 w-4" /> },
    { id: 'theme', label: 'Language & Theme', icon: <Globe className="h-4 w-4" /> },
    { id: 'sync', label: 'Sync Problems', icon: <RefreshCw className="h-4 w-4" /> },
    { id: 'about', label: 'About & Diagnostics', icon: <Info className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title="Settings & Hardware"
        description="Configure restaurant profile, receipt branding, QR ordering, taxes, and tables."
        action={{
          label: 'Save All Settings',
          icon: Save,
          onClick: handleSaveAll,
        }}
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Vertical Tab Selector */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-brand text-surface shadow-sm'
                  : 'bg-surface border border-border text-text hover:bg-bg'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'sync' && failedOrders.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-500 text-surface text-[10px]">
                  {failedOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Active Content Panel */}
        <div className="flex-1 rounded-3xl border border-border bg-surface p-6 shadow-card">
          {/* 1. RESTAURANT PROFILE */}
          {activeTab === 'restaurant' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-text">Restaurant Profile</h3>
              <p className="text-xs text-muted">
                These details appear on your printed bills, digital receipts, and customer QR menus.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Restaurant Trading Name
                  </label>
                  <input
                    type="text"
                    value={restName}
                    onChange={(e) => setRestName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Street Address & City
                  </label>
                  <input
                    type="text"
                    value={restAddress}
                    onChange={(e) => setRestAddress(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={restPhone}
                    onChange={(e) => setRestPhone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. TAX & SERVICE */}
          {activeTab === 'tax' && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-text">Taxes & Service Charges</h3>
              <p className="text-xs text-muted">
                Configured rates apply to order subtotal calculations across POS and QR menus.
              </p>

              {/* Service Charge */}
              <div className="p-4 rounded-2xl border border-border bg-bg/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-text block">Restaurant Service Charge</span>
                  <span className="text-xs text-muted">
                    Typically 10% in Sri Lankan dine-in restaurants
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={serviceRate}
                      onChange={(e) => setServiceRate(Number(e.target.value))}
                      className="w-16 h-9 px-2 rounded-lg border border-border bg-surface text-center font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-muted">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServiceEnabled(!serviceEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      serviceEnabled
                        ? 'bg-brand text-surface'
                        : 'bg-surface border border-border text-muted'
                    }`}
                  >
                    {serviceEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Govt Tax / VAT */}
              <div className="p-4 rounded-2xl border border-border bg-bg/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-text block">Government VAT / Tax</span>
                  <span className="text-xs text-muted">Applied after discounts and service charge</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-16 h-9 px-2 rounded-lg border border-border bg-surface text-center font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-muted">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTaxEnabled(!taxEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      taxEnabled
                        ? 'bg-brand text-surface'
                        : 'bg-surface border border-border text-muted'
                    }`}
                  >
                    {taxEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. RECEIPT TEMPLATE */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text">80mm Receipt Formatting</h3>
                  <p className="text-xs text-muted">Customize thermal printer receipt layout and notes</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrintTestReceipt}
                  className="px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-bg text-text text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Test Receipt
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Receipt Header Note</label>
                  <input
                    type="text"
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Receipt Footer Message</label>
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-bg text-sm text-text focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-bg/50">
                  <span className="text-xs font-bold text-text">Display Restaurant Logo on Receipt</span>
                  <button
                    type="button"
                    onClick={() => setShowLogoOnReceipt(!showLogoOnReceipt)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      showLogoOnReceipt
                        ? 'bg-brand text-surface'
                        : 'bg-surface border border-border text-muted'
                    }`}
                  >
                    {showLogoOnReceipt ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. TABLES & AREAS */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-text">Tables and Dining Areas</h3>
              <p className="text-xs text-muted">Configure floor seating, table numbers, and dining zones.</p>

              {/* Add Table Row */}
              <form onSubmit={handleAddTable} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Table (e.g. T7)"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-border bg-bg text-xs font-bold text-text"
                />
                <select
                  value={newTableArea}
                  onChange={(e) => setNewTableArea(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-border bg-bg text-xs font-semibold text-text"
                >
                  <option value="Indoor Dining">Indoor Dining</option>
                  <option value="Outdoor Patio">Outdoor Patio</option>
                  <option value="Rooftop Bar">Rooftop Bar</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(Number(e.target.value))}
                  className="h-10 px-3 rounded-xl border border-border bg-bg text-xs font-bold text-text"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-brand text-surface text-xs font-bold flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Add Table
                </button>
              </form>

              {/* Tables Table */}
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden mt-3">
                {tablesList.map((t) => (
                  <div key={t.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-text w-12">{t.number}</span>
                      <span className="font-medium text-muted">{t.area}</span>
                      <span className="text-muted">· {t.seats} seats</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(t.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. QR CODES & DIGITAL MENU */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-text">Table QR Codes</h3>
                  <p className="text-xs text-muted">
                    Instant contactless digital menu QR codes for each table.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrintAllQr}
                  className="px-4 py-2 rounded-2xl bg-brand text-surface text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition-all self-start"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print All (A4 Sheet)</span>
                </button>
              </div>

              {/* Self order switch */}
              <div className="p-4 rounded-2xl border border-border bg-bg/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-text block">Allow Customer Self-Ordering</span>
                  <span className="text-xs text-muted">
                    When disabled, the QR code shows a view-only digital menu.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowSelfOrder(!allowSelfOrder)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    allowSelfOrder
                      ? 'bg-brand text-surface'
                      : 'bg-surface border border-border text-muted'
                  }`}
                >
                  {allowSelfOrder ? 'Self Order Enabled' : 'View Only Menu'}
                </button>
              </div>

              {/* Grid of QR Codes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {tablesList.map((table) => {
                  const qrUrl = `${window.location.origin}/qr/CEY101/${table.number}`;
                  return (
                    <div
                      key={table.id}
                      className="p-4 rounded-2xl border border-border bg-bg/40 flex flex-col items-center text-center gap-2"
                    >
                      <div className="p-2.5 bg-white rounded-xl shadow-sm border border-border">
                        <QRCodeSVG value={qrUrl} size={110} level="M" />
                      </div>
                      <span className="font-extrabold text-sm text-text mt-1">{table.number}</span>
                      <span className="text-[11px] text-muted">{table.area}</span>
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline mt-1"
                      >
                        <span>Open Menu</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. LANGUAGE & THEME */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-text">Language & Visual Theme</h3>
              <p className="text-xs text-muted">Set default interface language and color mode.</p>

              {/* Language Selection */}
              <div>
                <label className="text-xs font-semibold text-muted block mb-2">Display Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English (EN)' },
                    { code: 'si', label: 'සිංහල (Sinhala)' },
                    { code: 'ta', label: 'தமிழ் (Tamil)' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code as any)}
                      className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                        i18n.language.startsWith(lang.code)
                          ? 'border-brand bg-brand text-surface shadow-sm'
                          : 'border-border bg-surface text-text hover:bg-bg'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-muted block mb-2">Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: 'auto', label: 'System (Auto)' },
                    { mode: 'light', label: 'Light Mode' },
                    { mode: 'dark', label: 'Dark Mode' },
                  ].map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => setThemeMode(t.mode as any)}
                      className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                        themeMode === t.mode
                          ? 'border-brand bg-brand text-surface shadow-sm'
                          : 'border-border bg-surface text-text hover:bg-bg'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. SYNC PROBLEMS */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text">Offline Sync Problems</h3>
                  <p className="text-xs text-muted">Inspect orders stored locally in IndexedDB</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetrySync}
                  disabled={isRetryingSync}
                  className="px-3.5 py-2 rounded-xl bg-brand text-surface text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetryingSync ? 'animate-spin' : ''}`} />
                  <span>{isRetryingSync ? 'Syncing...' : 'Retry All Sync'}</span>
                </button>
              </div>

              {failedOrders.length === 0 ? (
                <div className="py-12 text-center text-muted border border-dashed border-border rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-text">All orders synchronized!</p>
                  <p className="text-xs mt-1">No pending offline orders or failed retry queues.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {failedOrders.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-text block">
                          Client UUID: {item.clientCreatedUuid}
                        </span>
                        <span className="text-rose-600 block mt-0.5">
                          Attempts: {item.retryCount} · Next backoff:{' '}
                          {new Date(item.nextRetryAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRetrySync}
                        className="px-3 py-1 rounded-lg border border-border bg-surface text-text font-bold"
                      >
                        Retry
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. ABOUT & DIAGNOSTICS */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-text">System Information</h3>
              <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden text-xs">
                <div className="p-3.5 flex justify-between">
                  <span className="text-muted">Application:</span>
                  <span className="font-bold text-text">Ralypto Restaurant OS</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-muted">Frontend Version:</span>
                  <span className="font-mono text-text">2.0.0-rc1</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-muted">Subscription Plan:</span>
                  <span className="font-bold text-brand uppercase">{plan?.name || 'Standard Plan'}</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-muted">Storage Engine:</span>
                  <span className="font-semibold text-text">IndexedDB (Dexie v4)</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span className="text-muted">Thermal Printer Standard:</span>
                  <span className="font-semibold text-text">ESC/POS 80mm Standard</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default SettingsPage;
