'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Bold, Building2, CalendarClock, CheckCircle2, CircleDashed, Clock, Filter as FilterIcon,
  Hash, Italic, Link as LinkIcon, List, LogOut, MessagesSquare, Plus, Quote, Search, Send, Settings,
  Shield, Smartphone, Sparkles, Trash2, Users, Upload, X
} from 'lucide-react';

/* =========================================================
   TEMA (ajuste de cores)
   ========================================================= */
const theme = {
  bg: '#0b0b0b',
  text: '#f3f3f3',
  textMuted: '#a0a0a0',
  border: '#222',
  panel: '#111',
  panel2: '#0e0e0e',
  // Ambar WJ solicitado:
  accent: '#d6a65c',
  success: '#34d399',
  warn: '#ffd166',
  danger: '#ff6b6b',
};

function WJBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded-full" style={{ background: theme.accent }} />
      <div className="text-sm font-medium">WJ • Painel</div>
    </div>
  );
}

function FontGlobal() {
  return (
    <style>{`
      html, body, #__next { height: 100%; }
      body { color: ${theme.text}; background: ${theme.bg}; }
      .tab { border-bottom: 2px solid transparent; }
      .tab-active { border-bottom-color: ${theme.accent}; color: ${theme.text}; }
      .btn-ghost { background: transparent; border: 1px solid ${theme.border}; }
      .scroll-slim { scrollbar-width: thin; scrollbar-color: ${theme.border} transparent; }
      .scroll-slim::-webkit-scrollbar { height: 8px; width: 8px; }
      .scroll-slim::-webkit-scrollbar-thumb { background: ${theme.border}; }
    `}</style>
  );
}

/* =========================================================
   TIPOS
   ========================================================= */
type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
};

type MetaPhone = { id: string; display: string; status?: string };
type MetaAccount = { id: string; name: string; wabaId: string; phones: MetaPhone[] };

type CampaignStatus = 'Agendada' | 'Em andamento' | 'Concluída';
type Campaign = {
  id: string;
  name: string;
  templateName: string;
  accountName: string;
  phoneDisplay?: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  replied: number;
  startedAt?: string;
  scheduledAt?: string;
  status: CampaignStatus;
};

/* =========================================================
   MOCKS
   ========================================================= */
const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Maria Souza', phone: '5511999990001', email: 'maria@exemplo.com', tags: ['vip', 'loja'] },
  { id: 'c2', name: 'João Lima', phone: '5511988887777', email: 'joao@exemplo.com', tags: ['revenda'] },
  { id: 'c3', name: 'Atendimento Studio', phone: '5511912345678', tags: ['interno'] },
];

const MOCK_ACCOUNTS: MetaAccount[] = [
  {
    id: 'acc_01',
    name: 'Luminárias WJ',
    wabaId: 'WABA_123',
    phones: [
      { id: 'ph_01', display: '+55 11 99999-0000', status: 'connected' },
      { id: 'ph_02', display: '+55 11 88888-7777', status: 'connected' },
    ]
  },
  {
    id: 'acc_02',
    name: 'Estúdio Luz Studio',
    wabaId: 'WABA_456',
    phones: [
      { id: 'ph_03', display: '+55 21 99999-1111', status: 'connected' },
    ]
  },
];

/* =========================================================
   HELPERS
   ========================================================= */
function uniqueTags(contacts: Contact[]): string[] {
  const set = new Set<string>();
  contacts.forEach(c => (c.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort();
}
function safeRate(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
function filterContacts(contacts: Contact[], query: string, tagsOr: string[]): Contact[] {
  const q = query.trim().toLowerCase();
  return contacts.filter(c => {
    const okQuery = !q || [c.name, c.phone, c.email].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    const okTags = !tagsOr.length || (c.tags || []).some(t => tagsOr.includes(t));
    return okQuery && okTags;
  });
}
function parseCsvContacts(csv: string): Contact[] {
  const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idxName = header.indexOf('name');
  const idxEmail = header.indexOf('e-mail') !== -1 ? header.indexOf('e-mail') : header.indexOf('email');
  const idxPhone = header.indexOf('phone');
  const idxTags = header.indexOf('tags');
  const out: Contact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[idxName] || '';
    const email = idxEmail >= 0 ? cols[idxEmail] : undefined;
    const phoneRaw = idxPhone >= 0 ? cols[idxPhone] : '';
    const phone = toE164BR(phoneRaw);
    const tags = idxTags >= 0 ? cols[idxTags].split(/[,;]\s*/).filter(Boolean) : [];
    out.push({ id: `csv_${i}_${Date.now()}`, name, email, phone, tags });
  }
  return out;
}
function toE164BR(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}
function appendSnippet(prev: string, add: string): string {
  return prev ? `${prev}\n${add}` : add;
}

/* =========================================================
   ITENS DE UI MENORES
   ========================================================= */
function StatusBadge({ status }: { status: CampaignStatus }) {
  const map = {
    'Agendada': { bg: '#1f2a00', color: theme.warn, icon: <CalendarClock size={12} /> },
    'Em andamento': { bg: '#0a1f15', color: '#34d399', icon: <CircleDashed size={12} /> },
    'Concluída': { bg: '#0a1a0a', color: theme.success, icon: <CheckCircle2 size={12} /> },
  } as const;
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px]"
      style={{ background: s.bg, color: s.color, border: `1px solid ${theme.border}` }}
    >
      {s.icon}{status}
    </span>
  );
}
function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full" style={{ background: '#1f1f1f', border: `1px solid ${theme.border}` }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="h-full rounded-full"
        style={{ background: theme.accent }}
      />
    </div>
  );
}

/* =========================================================
   PÁGINAS
   ========================================================= */
function TemplatesPage() {
  const [name, setName] = useState('boas_vindas_wj');
  const [lang, setLang] = useState('pt_BR');
  const [category, setCategory] = useState<'UTILITY'|'MARKETING'|'AUTHENTICATION'>('UTILITY');
  const [header, setHeader] = useState<string>('');
  const [body, setBody] = useState<string>('Olá {{1}}, obrigado pelo interesse nas Luminárias WJ. Digite 1-Catálogo 2-Prazos 3-Atendimento.');
  const [footer, setFooter] = useState<string>('WJ · Feito à mão no Brasil');

  const validate = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Nome interno obrigatório');
    if (!/^[a-z0-9_\-]+$/i.test(name)) errors.push('Nome interno: use letras, números, hífen ou underline');
    if (!body.includes('{{1}}')) errors.push('Inclua pelo menos {{1}} no corpo para personalização');
    if (!['UTILITY','MARKETING','AUTHENTICATION'].includes(category)) errors.push('Categoria inválida');
    return errors;
  };
  const errors = validate();
  const wrapSel = (setter: (v: string)=>void, value: string, left: string, right: string) => setter(left + value + right);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center gap-2"><Sparkles size={16}/><div className="text-sm font-medium">Templates para aprovação (Meta)</div></div>
      </div>
      <div className="scroll-slim grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs opacity-70">Nome interno</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Idioma</label>
              <select value={lang} onChange={e=>setLang(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="pt_BR">pt_BR</option><option value="en_US">en_US</option><option value="es_ES">es_ES</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Categoria</label>
              <select value={category} onChange={e=>setCategory(e.target.value as any)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="UTILITY">UTILITY</option><option value="MARKETING">MARKETING</option><option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-[11px] opacity-60">Use variáveis &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; …</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Header (opcional)</label>
            <input value={header} onChange={e=>setHeader(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: WJ — Boas-vindas" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs opacity-70">Body</label>
              <div className="flex items-center gap-1">
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, '*', '*')}><Bold size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, '_', '_')}><Italic size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(prev=>appendSnippet(prev, '> citação'))}><Quote size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(prev=>appendSnippet(prev, '• item'))}><List size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(prev=>appendSnippet(prev, '{{1}}'))}><Hash size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(prev=>prev + ' https://wj.link ')}><LinkIcon size={14}/></button>
              </div>
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Footer (opcional)</label>
            <input value={footer} onChange={e=>setFooter(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: errors.length ? theme.danger : theme.textMuted }}>
              {errors.length ? `Erros: ${errors.join(' | ')}` : 'Pronto para enviar (simulado)'}
            </div>
            <button disabled={!!errors.length} className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: theme.accent, color: '#111' }}>
              Enviar para aprovação (simulado)
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="border-b pb-2 text-xs uppercase tracking-wider" style={{ borderColor: theme.border, color: theme.textMuted }}>Pré-visualização</div>
          <div className="space-y-2 text-sm">
            {header && <div className="opacity-80">{header}</div>}
            <div className="whitespace-pre-wrap">{body}</div>
            {footer && <div className="text-xs opacity-60">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsPage({
  contacts, onAddMany, onDeleteMany, onBulkTagAdd, onBulkTagRemove
}: {
  contacts: Contact[];
  onAddMany: (c: Contact[]) => void;
  onDeleteMany: (ids: string[]) => void;
  onBulkTagAdd: (tag: string, ids: string[]) => void;
  onBulkTagRemove: (tag: string, ids: string[]) => void;
}) {
  // Importação CSV
  const [csvPreview, setCsvPreview] = useState<string>(`name,e-mail,phone,tags
Maria,maria@exemplo.com,11999990000,vip;loja
João,joao@exemplo.com,5511988887777,revenda`);
  const [parsed, setParsed] = useState<Contact[]>([]);
  useEffect(() => { setParsed(parseCsvContacts(csvPreview)); }, []); // ordem estável

  // Filtros / Gestão
  const allTags = useMemo(() => uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState<string>('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [onlyTag, setOnlyTag] = useState<string>('');
  const [excludeTags, setExcludeTags] = useState<string[]>([]);

  const base = useMemo(() => filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(() => base.filter(c => {
    const tags = c.tags || [];
    if (onlyTag && !tags.includes(onlyTag)) return false;
    if (excludeTags.length && tags.some(t => excludeTags.includes(t))) return false;
    return true;
  }), [base, onlyTag, excludeTags]);

  const totalCount = contacts.length;
  const [countTag, setCountTag] = useState<string>('');
  const countByTag = useMemo(() => countTag ? contacts.filter(c => (c.tags || []).includes(countTag)).length : 0, [contacts, countTag]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selectedIds.includes(c.id));
  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.some(c => c.id === id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filtered.map(c => c.id)])));
    }
  };

  const [bulkTag, setBulkTag] = useState<string>('');
  const canBulk = selectedIds.length > 0 && bulkTag.trim().length > 0;
  const doDelete = () => { if (selectedIds.length) { onDeleteMany(selectedIds); setSelectedIds([]); } };
  const doAddTag = () => { if (canBulk) { onBulkTagAdd(bulkTag.trim(), selectedIds); setBulkTag(''); } };
  const doRemoveTag = () => { if (canBulk) { onBulkTagRemove(bulkTag.trim(), selectedIds); setBulkTag(''); } };

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const list = parseCsvContacts(text);
      setParsed(list);
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      {/* Importar */}
      <div className="space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2"><Users size={16}/><div className="text-sm font-medium">Importar contatos (CSV)</div></div>
            <label className="btn-ghost cursor-pointer rounded-md px-3 py-1.5 text-xs">
              <input type="file" accept=".csv" className="hidden" onChange={(e)=>handleFile(e.target.files?.[0])}/>
              <div className="flex items-center gap-1"><Upload size={14}/> Selecionar CSV</div>
            </label>
          </div>
          <div className="space-y-2 p-3 text-sm">
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Formato esperado: <code>name, e-mail, phone, tags</code> (tags separadas por “,” ou “;”). Telefones convertidos para E.164 BR automaticamente (prefixo 55).
            </div>
            <textarea value={csvPreview} onChange={e=>setCsvPreview(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }}/>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: theme.textMuted }}>{`Pré-visualização: ${parsed.length} contato(s)`}</div>
              <button onClick={()=>setParsed(parseCsvContacts(csvPreview))} className="rounded-md px-3 py-1.5 text-xs" style={{ background: theme.accent, color: '#111' }}>Atualizar preview</button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t p-3" style={{ borderColor: theme.border }}>
            <button onClick={()=>onAddMany(parsed)} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: '#111' }}>Adicionar à lista</button>
          </div>
        </div>
      </div>

      {/* Gestão */}
      <div className="space-y-3">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="text-sm font-medium">Base de contatos</div>
            <div className="text-xs" style={{ color: theme.textMuted }}>Total: <strong>{totalCount}</strong></div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Contar contatos com a tag</label>
              <select value={countTag} onChange={e=>setCountTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(selecione)</option>
                {uniqueTags(contacts).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="mt-1 text-xs" style={{ color: theme.textMuted }}>Com “{countTag || '—'}”: <strong>{countTag ? countByTag : 0}</strong></div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Buscar</label>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: theme.border, background: theme.panel2 }}>
                <Search size={14} className="opacity-70"/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={()=>setTagsFilter(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                    className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: theme.border }}>{t}</button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastradа</div>}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={e=>setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={()=>setExcludeTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                    className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: theme.border }}>{t}</button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>Selecionados: {selectedIds.length} · Visíveis: {filtered.length}</div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={bulkTag} onChange={e=>setBulkTag(e.target.value)} placeholder="tag para editar" className="rounded-md border bg-transparent px-2 py-1 text-xs outline-none" style={{ borderColor: theme.border }} />
              <button disabled={!canBulk} onClick={doAddTag} className="btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60">Adicionar tag</button>
              <button disabled={!canBulk} onClick={doRemoveTag} className="btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60">Remover tag</button>
              <button disabled={!selectedIds.length} onClick={doDelete} className="rounded-md px-3 py-1.5 text-xs disabled:opacity-60" style={{ background: '#2a0000', border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-1"><Trash2 size={14}/> Deletar selecionados</div>
              </button>
              <button onClick={toggleAllVisible} className="btn-ghost rounded-md px-3 py-1.5 text-xs">{allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}</button>
              <button onClick={()=>setSelectedIds([])} className="btn-ghost rounded-md px-3 py-1.5 text-xs">Limpar seleção</button>
            </div>
          </div>

          <div className="scroll-slim max-h-[420px] divide-y overflow-auto" style={{ borderColor: theme.border }}>
            {filtered.map(c => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <input type="checkbox" className="h-4 w-4" checked={selectedIds.includes(c.id)} onChange={() => toggleOne(c.id)} />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-xs opacity-70">{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
                    {!!(c.tags && c.tags.length) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags!.map(t => (
                          <span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: '#ffffff0f', border: `1px solid ${theme.border}` }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-3 text-xs" style={{ borderColor: theme.border, color: theme.textMuted }}>
          Dica: Use os filtros para selecionar o conjunto certo antes de aplicar ações em massa.
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  open, onClose, onConfirm, summary
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: { count: number; scheduleLabel: string; tplName: string; header?: string; body: string; footer?: string; accountName?: string; phoneDisplay?: string; campaignName?: string }
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-xl border bg-[#121212] p-4" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
          <div className="text-sm font-medium">Revisar envio</div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-white/5" aria-label="Fechar"><X size={16}/></button>
        </div>
        <div className="space-y-3 py-3 text-sm">
          <div className="grid gap-1 text-xs" style={{ color: theme.textMuted }}>
            <div>Campanha: <strong>{summary.campaignName || '—'}</strong></div>
            <div>Template: <strong>{summary.tplName || '—'}</strong></div>
            <div>Conta: <strong>{summary.accountName || '—'}</strong></div>
            <div>Número: <strong>{summary.phoneDisplay || '—'}</strong></div>
            <div>Contatos selecionados: <strong>{summary.count}</strong></div>
            <div>{summary.scheduleLabel}</div>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
            {summary.header && <div className="mb-1 opacity-80">{summary.header}</div>}
            <div className="whitespace-pre-wrap leading-relaxed">{summary.body}</div>
            {summary.footer && <div className="mt-1 text-xs opacity-60">{summary.footer}</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t pt-2" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="btn-ghost rounded-md px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={onConfirm} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: '#111' }}>Confirmar envio (simulado)</button>
        </div>
      </div>
    </div>
  );
}

function AccountsPage({
  accounts, selectedAccountId, setSelectedAccountId, selectedPhoneId, setSelectedPhoneId
}: {
  accounts: MetaAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (v: string)=>void;
  selectedPhoneId: string;
  setSelectedPhoneId: (v: string)=>void;
}) {
  const account = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center gap-2"><Settings size={16}/><div className="text-sm font-medium">Contas Meta (WABA) e Números</div></div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>Contas disponíveis (simulado)</div>
          <div className="space-y-2">
            <select value={selectedAccountId} onChange={(e)=>{ setSelectedAccountId(e.target.value); setSelectedPhoneId(''); }} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} — {acc.wabaId}</option>)}
            </select>
            <p className="text-[11px] opacity-60">
              No real: listar via Graph API <em>/WABA_ID/phone_numbers</em> com permissões adequadas.
            </p>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>Números da conta</div>
          <div className="space-y-2">
            <select value={selectedPhoneId} onChange={(e)=>setSelectedPhoneId(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              <option value="">(selecione)</option>
              {account?.phones.map(ph => <option key={ph.id} value={ph.id}>{ph.display} — {ph.status || '—'}</option>)}
            </select>
            <div className="text-xs" style={{ color: theme.textMuted }}>Telefone selecionado: <strong>{selectedPhoneId || '—'}</strong></div>
            <div className="rounded-md border p-2 text-xs" style={{ borderColor: theme.border, color: theme.textMuted }}>
              <div className="mb-1 font-medium" style={{ color: theme.text }}>Como será em produção</div>
              <ul className="list-disc space-y-1 pl-4">
                <li>Botão “Conectar Meta” → OAuth (Facebook Login) para listar negócios/WABA administrados.</li>
                <li>Servidor troca por token de sistema e consulta <code>/whatsapp_business_accounts</code> e <code>/phone_numbers</code>.</li>
                <li>Escolha da WABA e do número padrão para disparos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BroadcastPage({
  contacts, selectedAccount, selectedPhone, onCreateCampaign
}: {
  contacts: Contact[];
  selectedAccount?: MetaAccount;
  selectedPhone?: MetaPhone;
  onCreateCampaign: (c: { name: string; templateName: string; total: number; scheduleAt?: string }) => void;
}) {
  const approvedTemplates = useMemo(() => [
    { id: 'tpl_boasvindas', name: 'boas_vindas_wj', header: 'Luminárias WJ', body: 'Olá {{1}}, obrigado por falar com a WJ. Posso enviar o catálogo atualizado?', footer: 'Feito à mão no Brasil' },
    { id: 'tpl_aviso2026', name: 'aviso_pedidos_2026', header: 'Agenda 2026', body: 'Olá {{1}}, os pedidos para 2026 já estão abertos. Quer garantir prioridade na produção?', footer: 'Equipe WJ' },
  ], []);

  const [selectedTplId, setSelectedTplId] = useState<string>('');
  const selectedTpl = approvedTemplates.find(t => t.id === selectedTplId);
  const tplHeader = selectedTpl?.header || '';
  const tplBody = selectedTpl?.body || '';
  const tplFooter = selectedTpl?.footer || '';

  const [campaignName, setCampaignName] = useState<string>('Campanha WJ');

  // Filtros
  const allTags = useMemo(()=> uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState<string>('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [onlyTag, setOnlyTag] = useState<string>('');
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const base = useMemo(()=> filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(()=> base.filter(c => {
    const tags = c.tags || [];
    if (onlyTag && !tags.includes(onlyTag)) return false;
    if (excludeTags.length && tags.some(t => excludeTags.includes(t))) return false;
    return true;
  }), [base, onlyTag, excludeTags]);

  // Seleção
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length > 0 && filtered.every(c => selectedIds.includes(c.id));
  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.some(c=>c.id===id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filtered.map(c=>c.id)])));
    }
  };

  // Agendamento
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(false);
  const [when, setWhen] = useState<string>(''); // datetime-local
  const tz = 'America/Sao_Paulo';
  const scheduleLabel = useMemo(() => {
    if (!scheduleEnabled || !when) return 'Envio imediato';
    try {
      const d = new Date(when);
      const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });
      return `Agendado para ${fmt.format(d)} (${tz})`;
    } catch {
      return 'Agendado (data inválida)';
    }
  }, [scheduleEnabled, when]);

  const countSelected = selectedIds.length;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSend = Boolean(selectedTplId) && countSelected > 0 && Boolean(selectedPhone?.id) && Boolean(campaignName.trim());
  const openConfirm = () => { if (canSend) setConfirmOpen(true); };
  const onConfirmSend = () => {
    setConfirmOpen(false);
    onCreateCampaign({
      name: campaignName.trim(),
      templateName: selectedTpl?.name || '',
      total: countSelected,
      scheduleAt: scheduleEnabled && when ? new Date(when).toISOString() : undefined,
    });
  };

  const accountName = selectedAccount?.name || '';
  const phoneDisplay = selectedPhone?.display || '';

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 xl:grid-cols-3">
      {/* Filtro/Seleção */}
      <div className="xl:col-span-2 space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2"><FilterIcon size={16}/><div className="text-sm font-medium">Filtro de contatos</div></div>
            <div className="text-xs" style={{ color: theme.textMuted }}>Visíveis: {filtered.length}</div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Buscar</label>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: theme.border, background: theme.panel2 }}>
                <Search size={14} className="opacity-70"/>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={()=>setTagsFilter(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                    className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: theme.border }}>{t}</button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={e=>setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={()=>setExcludeTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
                    className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                    style={{ borderColor: theme.border }}>{t}</button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>Selecionados: {selectedIds.length}</div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAllVisible} className="btn-ghost rounded-md px-3 py-1.5 text-xs">{allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}</button>
              <button onClick={()=>setSelectedIds([])} className="btn-ghost rounded-md px-3 py-1.5 text-xs">Limpar seleção</button>
            </div>
          </div>

          <div className="scroll-slim max-h-[380px] divide-y overflow-auto" style={{ borderColor: theme.border }}>
            {filtered.map(c => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={()=>toggleOne(c.id)} className="h-4 w-4" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-xs opacity-70">{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
                    {!!(c.tags && c.tags.length) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags!.map(t => (<span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: '#ffffff0f', border: `1px solid ${theme.border}` }}>{t}</span>))}
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Template/Agendamento */}
        <div className="space-y-4">
          <div className="rounded-lg border" style={{ borderColor: theme.border }}>
            <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="flex items-center gap-2"><Sparkles size={16}/><div className="text-sm font-medium">Selecionar template aprovado</div></div>
              <div className="text-xs" style={{ color: theme.textMuted }}>{selectedTpl ? selectedTpl.name : 'nenhum selecionado'}</div>
            </div>
            <div className="space-y-3 p-3 text-sm">
              <label className="mb-1 block text-xs opacity-70">Template</label>
              <select value={selectedTplId} onChange={e=>setSelectedTplId(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(selecione um template aprovado)</option>
                {approvedTemplates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>

              <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
                <div className="border-b pb-2 text-xs uppercase tracking-wider" style={{ borderColor: theme.border, color: theme.textMuted }}>Pré-visualização</div>
                <div className="mt-2 space-y-2">
                  {tplHeader && <div className="opacity-80">{tplHeader}</div>}
                  <div className="whitespace-pre-wrap">{tplBody || '—'}</div>
                  {tplFooter && <div className="text-xs opacity-60">{tplFooter}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border" style={{ borderColor: theme.border }}>
            <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="flex items-center gap-2"><BarChart3 size={16}/><div className="text-sm font-medium">Configurações do disparo</div></div>
              <div className="text-xs" style={{ color: theme.textMuted }}>
                {selectedAccount ? `${selectedAccount.name}` : 'Conta —'} {selectedPhone ? ` · ${selectedPhone.display}` : ''}
              </div>
            </div>
            <div className="space-y-3 p-3 text-sm">
              {!selectedAccount && <div className="text-xs" style={{ color: theme.warn }}>Selecione uma conta e número na aba “Contas”.</div>}
              <div>
                <label className="mb-1 block text-xs opacity-70">Nome da campanha/disparo</label>
                <input value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Ex.: Abertura Agenda 2026 (lojas VIP)" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs opacity-80"><Clock size={14}/> Agendamento</div>
                <label className="mb-2 flex items-center gap-2 text-xs opacity-80">
                  <input type="checkbox" checked={scheduleEnabled} onChange={e=>setScheduleEnabled(e.target.checked)} />
                  Agendar envio (Horário de Brasília — America/Sao_Paulo)
                </label>
                {scheduleEnabled && (
                  <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
                )}
                <div className="mt-1 text-xs" style={{ color: theme.textMuted }}>{scheduleLabel}</div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
              <div className="text-xs" style={{ color: theme.textMuted }}>Selecionados: <strong>{countSelected}</strong></div>
              <button disabled={!canSend} onClick={openConfirm} className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: theme.accent, color: '#111' }}>
                Revisar e confirmar
              </button>
            </div>
          </div>
        </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={()=>setConfirmOpen(false)}
        onConfirm={onConfirmSend}
        summary={{
          count: countSelected,
          scheduleLabel,
          tplName: selectedTpl?.name || '',
          header: tplHeader,
          body: tplBody || '',
          footer: tplFooter,
          accountName,
          phoneDisplay,
          campaignName,
        }}
      />
    </div>
  );
}

/* =========================================================
   TELA DE LOGIN
   ========================================================= */
function LoginScreen({ onLogin }: { onLogin: (user: { name: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const DEMO_USER = { email: 'admin@wj.com', password: 'wj@2025', name: 'Admin WJ' };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === DEMO_USER.email && password === DEMO_USER.password) {
      setError('');
      onLogin({ name: DEMO_USER.name });
    } else {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="grid h-screen place-items-center" style={{ background: theme.bg }}>
      <FontGlobal />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border p-6" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: theme.accent, color: '#111' }}><Shield size={18}/></div>
          <div>
            <div className="text-sm font-medium">Acesso ao Painel</div>
            <div className="text-[11px] opacity-60">Somente usuários autorizados</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs opacity-70">E-mail</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="admin@wj.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">Senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="••••••••" />
          </div>
          {error && <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: theme.border, color: theme.danger }}>{error}</div>}
          <button type="submit" className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium" style={{ background: theme.accent, color: '#111' }}>Entrar</button>
          <div className="text-[11px] opacity-60">Demo: admin@wj.com · wj@2025</div>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   APP PRINCIPAL
   ========================================================= */
export default function ChatPrototypeWJ() {
  // Autenticação (sempre no topo, sem condicionais)
  const [authUser, setAuthUser] = useState<{ name: string } | null>(null);

  // Dados principais
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selected, setSelected] = useState<string>(MOCK_CONTACTS[0].id);
  const [showSidebar, setShowSidebar] = useState(true);
  const [openNewContact, setOpenNewContact] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard'|'chat'|'contacts'|'templates'|'broadcast'|'accounts'>('dashboard');

  // Contas Meta
  const [accounts] = useState<MetaAccount[]>(MOCK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(MOCK_ACCOUNTS[0].id);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(MOCK_ACCOUNTS[0].phones[0].id);
  const selectedAccount = useMemo(()=> accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);
  const selectedPhone = useMemo(()=> selectedAccount?.phones.find(p => p.id === selectedPhoneId), [selectedAccount, selectedPhoneId]);

  const selectedContact = useMemo(() => contacts.find((c) => c.id === selected) || contacts[0], [contacts, selected]);

  // Campanhas
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 'cmp_01', name: 'Boas-vindas Showrooms', templateName: 'boas_vindas_wj', accountName: 'Luminárias WJ', phoneDisplay: '+55 11 99999-0000', total: 1000, sent: 600, delivered: 570, failed: 30, replied: 120, startedAt: new Date(Date.now()-60*60*1000).toISOString(), status: 'Em andamento' },
    { id: 'cmp_02', name: 'Agenda 2026 — Lojas VIP', templateName: 'aviso_pedidos_2026', accountName: 'Luminárias WJ', phoneDisplay: '+55 11 88888-7777', total: 350, sent: 350, delivered: 334, failed: 16, replied: 45, startedAt: new Date(Date.now()-3*60*60*1000).toISOString(), status: 'Concluída' },
    { id: 'cmp_03', name: 'Follow-up catálogo', templateName: 'boas_vindas_wj', accountName: 'Estúdio Luz Studio', phoneDisplay: '+55 21 99999-1111', total: 220, sent: 0, delivered: 0, failed: 0, replied: 0, scheduledAt: new Date(Date.now()+60*60*1000).toISOString(), status: 'Agendada' },
  ]);
  const [dashFilter, setDashFilter] = useState<CampaignStatus | 'Todos'>('Todos');

  // Ticks de simulação
  useEffect(() => {
    const id = setInterval(() => {
      setCampaigns(prev => prev.map(c => {
        if (c.status === 'Agendada' && c.scheduledAt && new Date(c.scheduledAt) <= new Date()) {
          return { ...c, status: 'Em andamento', startedAt: new Date().toISOString() };
        }
        if (c.status !== 'Em andamento') return c;
        const step = Math.max(1, Math.ceil(c.total * 0.02));
        const nextSent = Math.min(c.sent + step, c.total);
        const nextDeliveredTarget = Math.floor(nextSent * 0.95);
        const nextDelivered = Math.min(Math.max(c.delivered, nextDeliveredTarget), c.total);
        const nextFailed = Math.max(0, nextSent - nextDelivered);
        const replyTarget = Math.floor(nextDelivered * 0.15);
        const nextReplied = Math.min(Math.max(c.replied, c.replied + Math.floor(Math.random()*Math.max(1, step/4))), replyTarget);
        const done = nextSent >= c.total;
        return { ...c, sent: nextSent, delivered: nextDelivered, failed: nextFailed, replied: nextReplied, status: done ? 'Concluída' : c.status };
      }));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onResize = () => setShowSidebar(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSaveContact = (c: Contact) => {
    setContacts(prev => [c, ...prev]);
    setSelected(c.id);
    setActiveTab('chat');
  };
  const handleAddMany = (arr: Contact[]) => {
    if (!arr || !arr.length) return;
    setContacts(prev => [...arr, ...prev]);
    setActiveTab('contacts');
  };
  const handleDeleteMany = (ids: string[]) => {
    if (!ids.length) return;
    setContacts(prev => prev.filter(c => !ids.includes(c.id)));
  };
  const handleBulkTagAdd = (tag: string, ids: string[]) => {
    if (!tag.trim() || !ids.length) return;
    setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, tags: Array.from(new Set([...(c.tags||[]), tag.trim()])) } : c));
  };
  const handleBulkTagRemove = (tag: string, ids: string[]) => {
    if (!tag.trim() || !ids.length) return;
    setContacts(prev => prev.map(c => ids.includes(c.id) ? { ...c, tags: (c.tags||[]).filter(t => t !== tag.trim()) } : c));
  };
  const onCreateCampaign = (data: { name: string; templateName: string; total: number; scheduleAt?: string }) => {
    const payload: Campaign = {
      id: `cmp_${Date.now()}`,
      name: data.name,
      templateName: data.templateName,
      accountName: selectedAccount?.name || '—',
      phoneDisplay: selectedPhone?.display || '—',
      total: data.total,
      sent: 0,
      delivered: 0,
      failed: 0,
      replied: 0,
      scheduledAt: data.scheduleAt,
      startedAt: data.scheduleAt ? undefined : new Date().toISOString(),
      status: data.scheduleAt ? 'Agendada' : 'Em andamento',
    };
    setCampaigns(prev => [payload, ...prev]);
    setActiveTab('dashboard');
  };

  // Guarda de login **DEPOIS** de todos os hooks (ordem estável):
  if (!authUser) return <LoginScreen onLogin={setAuthUser} />;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: theme.bg }}>
      <FontGlobal />

      {/* Top Navbar */}
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between border-b px-4" style={{ borderColor: theme.border, background: theme.panel }}>
        <WJBadge />
        <nav className="flex items-center gap-4 text-sm">
          <button className={`tab pb-3 ${activeTab==='dashboard' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('dashboard')}>
            <div className="flex items-center gap-1"><BarChart3 size={16}/> Dashboard</div>
          </button>
          <button className={`tab pb-3 ${activeTab==='contacts' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('contacts')}>
            <div className="flex items-center gap-1"><Users size={16}/> Contatos</div>
          </button>
          <button className={`tab pb-3 ${activeTab==='templates' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('templates')}>
            <div className="flex items-center gap-1"><Sparkles size={16}/> Templates</div>
          </button>
          <button className={`tab pb-3 ${activeTab==='broadcast' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('broadcast')}>
            <div className="flex items-center gap-1"><Send size={16}/> Disparo</div>
          </button>
          <button className={`tab pb-3 ${activeTab==='accounts' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('accounts')}>
            <div className="flex items-center gap-1"><Settings size={16}/> Contas</div>
          </button>
        </nav>
        <div className="flex items-center gap-3 text-xs" style={{ color: theme.textMuted }}>
          <div className="hidden md:block">{authUser.name}</div>
          <div className="hidden items-center gap-1 md:flex">
            <Building2 size={14}/>
            <span>{selectedAccount?.name}</span>
            <span>·</span>
            <Smartphone size={14}/>
            <span>{selectedPhone?.display || '—'}</span>
          </div>
          <button className="btn-ghost rounded-md px-2 py-1" onClick={()=>setAuthUser(null)}><div className="flex items-center gap-1"><LogOut size={14}/> sair</div></button>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1600px] border" style={{ borderColor: theme.border }}>
        {activeTab === 'dashboard' && (
          <div className="flex w-full flex-1 flex-col">
            <DashboardPage campaigns={campaigns} filter={dashFilter} setFilter={setDashFilter} />
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="flex w-full flex-1 flex-col">
            <div className="border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>Gerenciar Contatos</div>
                <button className="btn-ghost rounded-md px-3 py-1.5 text-xs" onClick={()=>setOpenNewContact(true)}><div className="flex items-center gap-1 opacity-90"><Plus size={14}/> Novo</div></button>
              </div>
            </div>
            <ContactsPage
              contacts={contacts}
              onAddMany={handleAddMany}
              onDeleteMany={handleDeleteMany}
              onBulkTagAdd={handleBulkTagAdd}
              onBulkTagRemove={handleBulkTagRemove}
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex w-full flex-1 flex-col">
            <TemplatesPage />
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="flex w-full flex-1 flex-col">
            <div className="border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>Disparo de Template</div>
            </div>
            <BroadcastPage
              contacts={contacts}
              selectedAccount={selectedAccount}
              selectedPhone={selectedPhone}
              onCreateCampaign={onCreateCampaign}
            />
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="flex w-full flex-1 flex-col">
            <AccountsPage
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedPhoneId={selectedPhoneId}
              setSelectedPhoneId={setSelectedPhoneId}
            />
          </div>
        )}
      </div>

      {/* (Opcional) novo contato: painel poderia ser implementado depois */}
      {openNewContact && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setOpenNewContact(false)}/>
          <div className="relative w-full max-w-md rounded-t-2xl border bg-[#111] p-4 md:rounded-2xl" style={{ borderColor: theme.border }}>
            <div className="mb-2 text-sm font-medium">Novo contato</div>
            <NewContactForm onCancel={()=>setOpenNewContact(false)} onSave={(c)=>{ handleSaveContact(c); setOpenNewContact(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* Formulário simples de novo contato (sem hooks condicionais) */
function NewContactForm({ onCancel, onSave }: { onCancel: () => void; onSave: (c: Contact)=>void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c: Contact = {
      id: `c_${Date.now()}`,
      name: name.trim() || '(sem nome)',
      phone: toE164BR(phone),
      email: email.trim() || undefined,
      tags: tags.split(/[,;]\s*/).filter(Boolean),
    };
    onSave(c);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs opacity-70">Nome</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
      </div>
      <div>
        <label className="mb-1 block text-xs opacity-70">Telefone</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="+55..." />
      </div>
      <div>
        <label className="mb-1 block text-xs opacity-70">E-mail (opcional)</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
      </div>
      <div>
        <label className="mb-1 block text-xs opacity-70">Tags (separadas por vírgula)</label>
        <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="vip, loja" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost rounded-md px-3 py-2 text-sm">Cancelar</button>
        <button type="submit" className="rounded-md px-3 py-2 text-sm" style={{ background: theme.accent, color: '#111' }}>Salvar</button>
      </div>
    </form>
  );
}
