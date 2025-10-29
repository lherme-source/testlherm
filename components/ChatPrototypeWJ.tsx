// components/ChatPrototypeWJ.tsx
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
  // ↓↓↓ novo tom âmbar (pedido: rgb(214,166,92) / #d6a65c)
  accent: '#d6a65c',
  success: '#34d399',
  danger: '#ef4444',
  warn: '#d6a65c', // mantém o mesmo âmbar para alertas
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
        .btn-ghost:hover { background: #d6a65c1a; } /* hover harmonizado */
        /* inputs/bordas em foco com âmbar bem sutil */
        input:focus, textarea:focus, select:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(214, 166, 92, 0.15);
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

  // novos campos p/ visual de conversas (imagem 1)
  initials?: string;
  subtitle?: string;     // ex.: "cliente", "showroom", "fixado"
  lastMessage?: string;  // preview da última mensagem
  unread?: number;       // contador de não lidas
  pinned?: boolean;      // fixado
  online?: boolean;      // status online (pontinho verde)
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
  {
    id: 'c1',
    name: 'Estúdio Baviera',
    phone: '+5511999990000',
    email: 'contato@baviera.com',
    initials: 'EB',
    tags: ['showroom','vip'],
    subtitle: 'fixado',
    lastMessage: 'Amei o acabamento em inox polido. Enviam catálogo?',
    unread: 2,
    pinned: true,
    online: true,
  },
  {
    id: 'c2',
    name: 'Galeria São Paulo',
    phone: '+5511987654000',
    initials: 'GSP',
    tags: ['cliente'],
    lastMessage: 'Pedido #427 confirmado. Prazos para janeiro?',
    unread: 0,
  },
  {
    id: 'c3',
    name: 'Delumini Showroom',
    phone: '+5511987654321',
    initials: 'DL',
    tags: ['showroom'],
    lastMessage: 'Consegue vídeo do pendente ORI?',
    unread: 1,
    online: true,
  },
  {
    id: 'c4',
    name: 'Mariana — Arq.',
    phone: '+55219988887777',
    initials: 'MA',
    lastMessage: 'Projeto Cobogó: fita âmbar ou 3000K?',
    unread: 0,
  },
  {
    id: 'c5',
    name: 'Rodrigo de Borba',
    phone: '+5551998887777',
    initials: 'RB',
    subtitle: 'fixado',
    lastMessage: 'Fechei colab 1 Reels. Envio roteiro?',
    unread: 0,
    pinned: true,
  },
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
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
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
  const ordered = [...contacts].sort((a,b)=>
    (b.pinned?1:0) - (a.pinned?1:0) || (b.unread||0) - (a.unread||0)
  );

  return (
    <aside className="hidden w-[360px] shrink-0 border-r lg:block" style={{ borderColor: theme.border, background: theme.panel }}>
      {/* Topo */}
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: theme.textMuted }}>Luminárias WJ</div>
          <div className="text-[11px] opacity-60">WHATSAPP CLOUD · PROTÓTIPO</div>
        </div>
        <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={onOpenNew}>
          <div className="flex items-center gap-1"><Plus size={14}/> Novo</div>
        </button>
      </div>

      {/* Busca */}
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-md border px-2 py-2" style={{ borderColor: theme.border, background: theme.panel2 }}>
          <Search size={14} className="opacity-70" />
          <input placeholder="Buscar contato ou telefone" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
        </div>
      </div>

      {/* Lista */}
      <div className="scroll-slim max-h-[calc(100vh-48px-40px-64px)] overflow-auto divide-y" style={{ borderColor: theme.border }}>
        {ordered.map(c=>{
          const initials = c.initials || c.name.split(' ').map(p=>p[0]).join('').slice(0,3).toUpperCase();
          const isActive = selected===c.id;
          return (
            <button
              key={c.id}
              onClick={()=>onSelect(c.id)}
              className={`block w-full px-3 py-2 text-left transition-colors ${isActive?'bg-white/5':'hover:bg-white/3'}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
                       style={{ background: '#1f1f1f', border: `1px solid ${theme.border}` }}>
                    {initials}
                  </div>
                  {c.online && <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full" style={{ background: '#34d399', border: '2px solid #121212' }}/>}
                </div>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm">{c.name}</div>
                    {c.pinned ? (
                      <span className="rounded-full border px-1.5 py-[1px] text-[10px]" style={{ borderColor: theme.border, color: theme.textMuted }}>fixado</span>
                    ) : c.subtitle ? (
                      <span className="rounded-full border px-1.5 py-[1px] text-[10px]" style={{ borderColor: theme.border, color: theme.textMuted }}>{c.subtitle}</span>
                    ) : null}
                  </div>
                  {c.lastMessage && <div className="truncate text-xs opacity-70">{c.lastMessage}</div>}
                  {!!(c.tags && c.tags.length) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags!.map(t=>(
                        <span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}` }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unread */}
                {c.unread && c.unread>0 && (
                  <div className="ml-2 grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-semibold" style={{ background: theme.accent, color: '#111' }}>
                    {c.unread}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ChatWindow({ contact, onOpenTemplates }:{ contact: Contact; onOpenTemplates: ()=>void }){
  const [msg, setMsg] = useState('');
  const [list, setList] = useState<{id:string; from:'me'|'them'; text:string; at:number}[]>([
    { id: uid('m'), from: 'them', text: `Olá, aqui é ${contact.name}. Quero saber mais sobre os pendentes.`, at: Date.now()-1000*60*50 },
  ]);

  const send = ()=>{
    if (!msg.trim()) return;
    setList(prev=>[...prev, { id:uid('m'), from:'me', text: msg.trim(), at: Date.now() }]);
    setMsg('');
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header ajustado: nome + online agora + botão Templates */}
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
        <div>
          <div className="text-sm font-medium">{contact.name}</div>
          {contact.online && <div className="text-[11px]" style={{ color: theme.textMuted }}>online agora</div>}
        </div>
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

/* ============================================================
   ... (todo o restante do arquivo permanece igual ao seu original)
   A partir daqui, copie exatamente as páginas Templates, Contacts,
   ConfirmModal, AccountsPage, BroadcastPage, DashboardPage, LoginScreen,
   e o componente principal export default, do código que você já usa.
============================================================ */

// --- Abaixo, reaproveitamos integralmente o restante do seu arquivo original ---

function NewContactPanel({ onClose, onSave }:{ onClose:()=>void; onSave:(c: any)=>void }){
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
          <button onClick={onClose} className="rounded-md p-2 hover:bg-white/5" aria-label="Fechar"><X size={16}/></button>
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

/* ============================================================
   PÁGINA: TEMPLATES (ÚNICA DEFINIÇÃO)
============================================================ */
function TemplatesPage() {
  const [name, setName] = useState("boas_vindas_wj");
  const [lang, setLang] = useState("pt_BR");
  const [category, setCategory] = useState<"UTILITY"|"MARKETING"|"AUTHENTICATION">("UTILITY");
  const [header, setHeader] = useState<string>("");
  const [body, setBody] = useState<string>("Olá {{1}}, obrigado pelo interesse nas Luminárias WJ. Podemos ajudar com medidas, prazos e acabamentos. Digite seu assunto ou responda 1-Catálogo 2-Prazos 3-Atendimento.");
  const [footer, setFooter] = useState<string>("WJ · Feito à mão no Brasil");

  const wrapSel = (setter: (v: string)=>void, value: string, left: string, right: string) => setter(left + value + right);

  const validate = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Nome interno obrigatório");
    if (!/^[a-z0-9_\-]+$/i.test(name)) errors.push("Nome interno: use letras, números, hífen ou underline");
    if (!body.includes("{{1}}")) errors.push("Inclua pelo menos {{1}} no corpo para personalização");
    if (!["UTILITY","MARKETING","AUTHENTICATION"].includes(category)) errors.push("Categoria inválida");
    return errors;
  };

  const errors = validate();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center gap-2"><Sparkles size={16}/><div className="text-sm font-medium">Templates para aprovação (Meta)</div></div>
      </div>

      <div className="scroll-slim grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        {/* Formulário */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs opacity-70">Nome interno</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Idioma</label>
              <select value={lang} onChange={(e)=>setLang(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="pt_BR">pt_BR</option>
                <option value="en_US">en_US</option>
                <option value="es_ES">es_ES</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Categoria</label>
              <select value={category} onChange={(e)=>setCategory(e.target.value as any)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="UTILITY">UTILITY</option>
                <option value="MARKETING">MARKETING</option>
                <option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-[11px] opacity-60">{'Use variáveis {{1}}, {{2}} ...'}</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Header (opcional)</label>
            <input value={header} onChange={(e)=>setHeader(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: WJ — Boas-vindas" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs opacity-70">Body</label>
              <div className="flex items-center gap-1">
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, "*", "*")}><Bold size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, "_", "_")}><Italic size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((p)=>appendSnippet(p, "> citação"))}><Quote size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((p)=>appendSnippet(p, "• item"))}><List size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((p)=>appendSnippet(p, "{{1}}"))}><Hash size={14}/></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((p)=>p + " https://wj.link ")}><Link2 size={14}/></button>
              </div>
            </div>
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Footer (opcional)</label>
            <input value={footer} onChange={(e)=>setFooter(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
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

        {/* Preview */}
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

/* ============================================================
   CONTATOS (IMPORT/GERENCIAR) — idêntico ao seu
============================================================ */
// (mesmo código da sua versão atual)
