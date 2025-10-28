'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  // UI / status
  BarChart3, CalendarClock, CheckCircle2, CircleDashed, Clock, Filter as FilterIcon,
  MessagesSquare, Send, Settings, Shield, X, LogOut, Building2, Smartphone, Plus,
  // Edição/inputs
  Bold, Italic, Quote, List, Hash, Upload, Search, Trash2, Sparkles, Users,
  // evitar conflito com next/link
  Link as Link2,
} from 'lucide-react';

/* ============================================================
   TEMA E FONTES
============================================================ */
const theme = {
  bg: '#0b0b0b',
  panel: '#121212',
  panel2: '#161616',
  border: '#2a2a2a',
  text: '#f5f5f5',
  textMuted: '#9b9b9b',
  // ↓↓↓ troque aqui
  accent: '#F5C241',        // âmbar principal
  success: '#34d399',
  danger: '#ef4444',
  warn: '#F5C241',          // use o mesmo âmbar para alertas
} as const;

function FontGlobal() {
  return (
    <style jsx global>{`
      @font-face{
        font-family:"PP Neue Montreal";
        src: url("/assets/PPNEUEMONTREAL-VARIABLE.TTF") format("truetype-variations");
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
      }
        :root { --accent: ${theme.accent}; }
        .tab { border-bottom: 2px solid transparent; }
        .tab-active { border-bottom-color: var(--accent); color: #fff; }
        .btn-ghost:hover { background: #F5C2411a; }
        /* inputs/bordas em foco com âmbar bem sutil */
        input:focus, textarea:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(245, 194, 65, 0.15);
        }
        /* badges/dots que usam o destaque */
        .dot-accent { background: var(--accent); }
    `}</style>
  );
}

function WJBadge(){
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-full" style={{ background: theme.accent, color: '#111' }}>WJ</div>
      <div className="text-sm font-semibold tracking-wide">Painel WJ</div>
    </div>
  );
}

/* ============================================================
   TIPOS
============================================================ */
type Contact = {
  id: string;
  name: string;
  phone: string; // E.164 preferencial
  email?: string;
  tags?: string[];
};

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
  scheduledAt?: string;
  startedAt?: string;
  status: CampaignStatus;
};

type MetaPhone = { id: string; display: string; status?: string };
type MetaAccount = { id: string; name: string; wabaId: string; phones: MetaPhone[] };

/* ============================================================
   MOCKS
============================================================ */
const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Maria Silva', phone: '+5511999990000', email: 'maria@exemplo.com', tags: ['loja','vip'] },
  { id: 'c2', name: 'João Souza',  phone: '+55219988887777', email: 'joao@exemplo.com',  tags: ['revenda'] },
  { id: 'c3', name: 'Estúdio Luz',  phone: '+5511987654321', tags: ['estudio'] },
];

const MOCK_ACCOUNTS: MetaAccount[] = [
  {
    id: 'acc_1',
    name: 'Luminárias WJ',
    wabaId: 'WABA_123',
    phones: [
      { id: 'ph_11', display: '+55 11 99999-0000', status: 'Connected' },
      { id: 'ph_12', display: '+55 11 88888-7777', status: 'Connected' },
    ],
  },
  {
    id: 'acc_2',
    name: 'Estúdio Luz Studio',
    wabaId: 'WABA_987',
    phones: [
      { id: 'ph_21', display: '+55 21 99999-1111', status: 'Connected' },
    ],
  },
];

/* ============================================================
   HELPERS
============================================================ */
function uid(prefix='id'){ return `${prefix}_${Math.random().toString(36).slice(2,9)}`; }

function normalizeBRPhoneToE164(raw: string){
  // remove não-dígitos
  const digits = raw.replace(/\D+/g,'');
  if (digits.startsWith('55')) return "+{digits}";
  return "+55{digits}";
}

function parseCsvContacts(csv: string): Contact[] {
  // form esperado: name,e-mail,phone,tags
  const lines = csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const out: Contact[] = [];
  for (let i=0;i<lines.length;i++){
    const row = lines[i].split(',').map(x=>x.trim());
    if (row.length < 3) continue;
    const [name, email, phone, tagsRaw] = row;
    const tags = (tagsRaw||'').split(/[;,]/).map(t=>t.trim()).filter(Boolean);
    out.push({
      id: uid('ct'),
      name: name || 'Sem nome',
      email: email || undefined,
      phone: normalizeBRPhoneToE164(phone),
      tags: tags.length ? Array.from(new Set(tags)) : undefined,
    });
  }
  return out;
}

function uniqueTags(contacts: Contact[]){
  return Array.from(new Set(contacts.flatMap(c=>c.tags||[]))).sort((a,b)=>a.localeCompare(b));
}

function filterContacts(contacts: Contact[], query: string, includeTags: string[]){
  const q = query.trim().toLowerCase();
  return contacts.filter(c=>{
    const okQ = !q || [c.name, c.email, c.phone].filter(Boolean).some(v=>String(v).toLowerCase().includes(q));
    const okT = !includeTags.length || includeTags.some(t => (c.tags||[]).includes(t));
    return okQ && okT;
  });
}

function safeRate(part: number, total: number){
  if (!total) return 0;
  return Math.round((part/total)*100);
}

function appendSnippet(prev: string, snippet: string){
  return (prev ? prev + (prev.endsWith('\n') ? '' : '\n') : '') + snippet;
}

/* ============================================================
   COMPONENTES BÁSICOS DO CHAT
============================================================ */
function Sidebar({ contacts, selected, onSelect, onOpenNew }:{
  contacts: Contact[];
  selected: string;
  onSelect: (id: string)=>void;
  onOpenNew: ()=>void;
}){
  return (
    <aside className="hidden w-[320px] shrink-0 border-r lg:block" style={{ borderColor: theme.border, background: theme.panel }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border }}>
        <div className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>Contatos</div>
        <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={onOpenNew}>
          <div className="flex items-center gap-1"><Plus size={14}/> Novo</div>
        </button>
      </div>
      <div className="scroll-slim max-h-[calc(100vh-48px-40px)] overflow-auto divide-y" style={{ borderColor: theme.border }}>
        {contacts.map(c=>(
          <button
            key={c.id}
            onClick={()=>onSelect(c.id)}
            className={`block w-full px-3 py-2 text-left ${selected===c.id?'bg-white/5':''}`}
          >
            <div className="text-sm">{c.name}</div>
            <div className="text-xs opacity-60">{c.phone}{c.email? " · {c.email}":''}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function ChatWindow({ contact, onOpenTemplates }:{ contact: Contact; onOpenTemplates: ()=>void }){
  const [msg, setMsg] = useState('');
  const [list, setList] = useState<{id:string; from:'me'|'them'; text:string; at:number}[]>([
    { id: uid('m'), from: 'them', text: "Olá, aqui é {contact.name}. Quero saber mais sobre os pendentes.", at: Date.now()-1000*60*50 },
  ]);

  const send = ()=>{
    if (!msg.trim()) return;
    setList(prev=>[...prev, { id:uid('m'), from:'me', text: msg.trim(), at: Date.now() }]);
    setMsg('');
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="text-sm font-medium">{contact.name}</div>
        <button onClick={onOpenTemplates} className="btn-ghost rounded-md px-2 py-1 text-xs"><div className="flex items-center gap-1"><Sparkles size={14}/> Templates</div></button>
      </div>
      <div className="scroll-slim flex-1 space-y-2 overflow-auto p-4">
        {list.map(m=>(
          <div key={m.id} className={`max-w-[70%] rounded-lg p-2 text-sm ${m.from==='me'?'ml-auto':''}`} style={{ background: m.from==='me'?theme.accent:'#1a1a1c', color: m.from==='me'?'#111':theme.text }}>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: theme.border }}>
        <input value={msg} onChange={(e)=>setMsg(e.target.value)} placeholder="Escreva uma mensagem…" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
        <button onClick={send} className="rounded-md px-3 py-2 text-sm font-medium" style={{ background: theme.accent, color: '#111' }}>
          Enviar
        </button>
      </div>
    </div>
  );
}

function NewContactPanel({ onClose, onSave }:{ onClose:()=>void; onSave:(c: Contact)=>void }){
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const save = ()=>{
    const c: Contact = { id: uid('ct'), name: name||'Sem nome', phone: normalizeBRPhoneToE164(phone), email: email||undefined, tags: [] };
    onSave(c);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="relative w-full max-w-[520px] rounded-xl border bg-[#121212] p-4" style={{ borderColor: theme.border }}>
        <div className="mb-2 flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
          <div className="text-sm font-medium">Novo contato</div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg:white/5" aria-label="Fechar"><X size={16}/></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs opacity-70">Nome</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}/></div>
          <div><label className="mb-1 block text-xs opacity-70">Telefone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+55…" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}/></div>
          <div><label className="mb-1 block text-xs opacity-70">E-mail (opcional)</label><input value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}/></div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 border-t pt-2" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="btn-ghost rounded-md px-3 py-1.5 text-sm">Cancelar</button>
          <button onClick={save} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: '#111' }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
