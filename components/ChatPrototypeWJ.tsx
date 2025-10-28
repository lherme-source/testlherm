"use client";
import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Smile,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  Plus,
  X,
  Sparkles,
  Bold,
  Italic,
  Quote,
  Link,
  List,
  Hash,
  Upload,
  Users,
  MessagesSquare,
  Clock,
  Filter as FilterIcon,
  Trash2,
  Shield,
  LogOut,
  Building2,
  Smartphone,
  Settings,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  CalendarClock
} from "lucide-react";

/**
 * Protótipo visual (somente front-end) — Identidade WJ, tema escuro e moderno
 * Agora com: Login (usuário/senha), gestão de Contas Meta/WABA e seleção de número
 * MENU: Dashboard, Conversas, Contatos, Templates, Disparo, Contas
 */

// Paleta centralizada para fácil ajuste
const theme = {
  bg: "#0E0E0E",
  panel: "#141414",
  panel2: "#1A1A1A",
  border: "#2A2A2A",
  text: "#ECECEC",
  textMuted: "#B8B8B8",
  accent: "#D6A65C", // âmbar quente (luz)
  success: "#8BE28B",
  warn: "#F2C94C",
  danger: "#ef4444",
};

// Tipos
export type Message = {
  id: string;
  author: "me" | "them";
  text?: string;
  time: string; // HH:mm
  status?: "sent" | "delivered" | "read"; // só para mensagens do autor "me"
  media?: { kind: "image" | "file"; name?: string };
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string; // URL opcional
  initial?: string; // fallback para avatar
  lastMessage: string;
  unread?: number;
  online?: boolean;
  pinned?: boolean;
  tags?: string[];
};

export type MetaPhone = { id: string; display: string; status?: string };
export type MetaAccount = { id: string; name: string; wabaId: string; phones: MetaPhone[] };

export type CampaignStatus = 'Agendada' | 'Em andamento' | 'Concluída';
export type Campaign = {
  id: string;
  name: string;
  templateName: string;
  accountName: string;
  phoneDisplay: string;
  total: number;
  sent: number; // tentativas realizadas
  delivered: number; // entregues com sucesso
  failed: number; // falhas (sent - delivered)
  replied: number; // respostas recebidas
  scheduledAt?: string; // ISO
  startedAt?: string; // ISO
  status: CampaignStatus;
};

const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Estúdio Baviera", phone: "+55 11 99999-1111", initial: "EB", lastMessage: "Amei o acabamento em inox polido. Enviam catálogo?", online: true, unread: 2, pinned: true, tags: ["showroom", "vip"] },
  { id: "c2", name: "Galeria São Paulo", phone: "+55 11 98888-2222", initial: "GSP", lastMessage: "Pedido #427 confirmado. Prazos para janeiro?", tags: ["cliente"] },
  { id: "c3", name: "Delumini Showroom", phone: "+55 41 97777-3333", initial: "DL", lastMessage: "Consegue vídeo do pendente ORI?", unread: 1, online: true },
  { id: "c4", name: "Mariana — Arq.", phone: "+55 21 96666-4444", initial: "MA", lastMessage: "Projeto Cobogó: fita âmbar ou 3000K?" },
  { id: "c5", name: "Rodrigo de Borba", phone: "+55 48 95555-5555", initial: "RB", lastMessage: "Fechei colab 1 Reels. Envio roteiro?", pinned: true },
];

const MOCK_THREADS: Record<string, Message[]> = {
  c1: [
    { id: "m1", author: "them", text: "Olá! Vimos o pendente ENIGMA no Instagram. Tem catálogo técnico?", time: "09:02" },
    { id: "m2", author: "me", text: "Bom dia! Envio o PDF com medidas e acabamentos em seguida.", time: "09:04", status: "read" },
    { id: "m3", author: "them", text: "Amei o acabamento em inox polido. Enviam catálogo?", time: "09:10" },
  ],
  c2: [ { id: "m1", author: "them", text: "Pedido #427 confirmado. Prazos para janeiro?", time: "11:31" } ],
  c3: [ { id: "m1", author: "them", text: "Consegue vídeo do pendente ORI?", time: "10:05" }, { id: "m2", author: "me", media: { kind: "file", name: "ORI_demo.mov" }, time: "10:06", status: "delivered" } ],
  c4: [ { id: "m1", author: "them", text: "Projeto Cobogó: fita âmbar ou 3000K?", time: "15:22" } ],
  c5: [ { id: "m1", author: "them", text: "Fechei colab 1 Reels. Envio roteiro?", time: "08:19" } ],
};

// Contas/telefones Meta simulados
const MOCK_ACCOUNTS: MetaAccount[] = [
  {
    id: "acc_wj",
    name: "Luminárias WJ",
    wabaId: "WABA_12345",
    phones: [
      { id: "PHONE_5511999990000", display: "+55 11 99999-0000", status: "connected" },
      { id: "PHONE_5511988887777", display: "+55 11 88888-7777", status: "connected" },
    ],
  },
  {
    id: "acc_studio",
    name: "Estúdio Luz Studio",
    wabaId: "WABA_67890",
    phones: [
      { id: "PHONE_5521999991111", display: "+55 21 99999-1111", status: "connected" },
    ],
  },
];

// =============== Helpers & Self-Tests ===============
export function buildInitialFromName(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  const initials = parts.map((p) => p[0] ?? "").join("").slice(0, 3).toUpperCase();
  return initials || "C";
}

export function appendSnippet(prev: string, snippet: string): string {
  return prev + "\n" + snippet; // quebra segura
}

export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (digits.startsWith("55")) return digits; // E.164 BR já com 55
  // Se for local BR sem 55, prefixa 55
  return digits.length >= 10 ? "55" + digits : digits;
}

export function parseCsvContacts(csv: string): Contact[] {
  // Esperado: header com name, e-mail/email, phone, tags
  // Suporta também CSV antigo: name,phone,tags
  const rows = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rows.length === 0) return [];

  const headerRaw = rows[0];
  const header = headerRaw.toLowerCase();
  const hasHeader = header.includes("name") && header.includes("phone");

  // Mapeamento de índices por header quando existir
  let idxName = 0, idxEmail = -1, idxPhone = 1, idxTags = 2;
  if (hasHeader) {
    const cols = headerRaw.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().toLowerCase());
    idxName = cols.findIndex((c) => c === "name" || c === "nome");
    idxEmail = cols.findIndex((c) => c === "e-mail" || c === "email" || c === "e_mail");
    idxPhone = cols.findIndex((c) => c === "phone" || c === "telefone" || c === "fone");
    // FIX: arrow/parentheses estavam incorretos aqui
    idxTags = cols.findIndex((c) => c === "tags" || c === "tag");
    // Fallbacks
    if (idxName < 0) idxName = 0;
    if (idxPhone < 0) idxPhone = 1;
  }

  const start = hasHeader ? 1 : 0;
  const out: Contact[] = [];
  for (let i = start; i < rows.length; i++) {
    const cols = rows[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
    if (!cols.length) continue;

    // Se não tem header, tentar mapear 4 colunas: name,email,phone,tags ou 3 colunas: name,phone,tags
    const name = hasHeader ? (cols[idxName] || "Contato") : (cols[0] || "Contato");
    const email = hasHeader ? (idxEmail >= 0 ? (cols[idxEmail] || "") : "") : (cols.length >= 4 ? (cols[1] || "") : "");
    const phone = hasHeader ? (cols[idxPhone] || "") : (cols.length >= 4 ? (cols[2] || "") : (cols[1] || ""));
    const tagsRaw = hasHeader ? (idxTags >= 0 ? (cols[idxTags] || "") : "") : (cols.length >= 4 ? (cols[3] || "") : (cols[2] || ""));

    if (!phone) continue;

    const contact: Contact = {
      id: `c_${Date.now()}_${i}`,
      name,
      email: email ? email.trim().toLowerCase() : undefined,
      phone: sanitizePhone(phone),
      initial: buildInitialFromName(name),
      lastMessage: "—",
      tags: tagsRaw.split(/[;,]/).map((t) => t.trim()).filter(Boolean),
    };
    out.push(contact);
  }
  return out;
}

export const safeRate = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

// Helpers extras
export function uniqueTags(list: Contact[]): string[] {
  const set = new Set<string>();
  list.forEach(c => (c.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

export function filterContacts(list: Contact[], query: string, tags: string[]): Contact[] {
  const q = query.toLowerCase().trim();
  return list.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email||"").toLowerCase().includes(q);
    const matchTags = !tags.length || (c.tags||[]).some(t=>tags.includes(t));
    return matchQ && matchTags;
  });
}

function runSelfTests() {
  // Teste 1: iniciais (existente)
  console.assert(buildInitialFromName("Galeria Aurora") === "GA", "buildInitialFromName deve retornar GA");

  // Teste 2: appendSnippet (existente)
  const after = appendSnippet("Olá", "> citação");
  console.assert(after.endsWith("\n> citação"), "appendSnippet deve adicionar quebra + snippet");

  // Teste 3: sanitizePhone (existente)
  console.assert(sanitizePhone("(11) 99999-0000").startsWith("55"), "sanitizePhone deve prefixar 55");

  // Teste 4: parse CSV básico (existente, com e-mail)
  const csv = `name,e-mail,phone,tags\nMaria,maria@exemplo.com,11999990000,vip;loja\nJoão,joao@exemplo.com,5511988887777,revenda`;
  const parsed = parseCsvContacts(csv);
  console.assert(parsed.length === 2 && parsed[0].email === "maria@exemplo.com" && parsed[1].phone === "5511988887777", "parseCsvContacts deve ler 2 linhas com e-mail");

  // Teste extra 5: header variante "email" (sem hífen) e telefone local
  const csv2 = `name,email,phone,tags\nAna,ana@ex.com,(21) 90000-0000,vip,loja`;
  const p2 = parseCsvContacts(csv2);
  console.assert(p2.length === 1 && p2[0].email === "ana@ex.com" && p2[0].phone.startsWith("55"), "variante 'email' e normalização de telefone");

  // Teste extra 6: CSV legado sem e-mail
  const legacy = `name,phone,tags\nLoja Centro,21900000000,"vip;revenda"`;
  const p3 = parseCsvContacts(legacy);
  console.assert(p3.length === 1 && !p3[0].email && p3[0].tags && p3[0].tags.length === 2, "legado sem e-mail e tags mistas");

  // Teste extra 7: nome com vírgula entre aspas
  const quoted = `name,e-mail,phone,tags\n"Loja, Centro",contato@loja.com,5511999999999,revenda`;
  const p4 = parseCsvContacts(quoted);
  console.assert(p4.length === 1 && p4[0].name === "Loja, Centro", "nome entre aspas com vírgula deve manter vírgula");

  // Teste extra 8: filtro por tags e query
  const f = filterContacts(MOCK_CONTACTS, "Delu", ["showroom"]);
  console.assert(Array.isArray(f) && f.every(c=>c.name && c.phone), "filterContacts retorna contatos válidos");

  // Teste extra 9: uniqueTags inclui 'vip' e é ordenado
  const ut = uniqueTags(MOCK_CONTACTS);
  console.assert(ut.includes("vip"), "uniqueTags deve conter 'vip'");
  const utSorted = [...ut].sort((a,b)=>a.localeCompare(b));
  console.assert(JSON.stringify(ut) === JSON.stringify(utSorted), "uniqueTags deve retornar ordenado");

  // Teste extra 10: contas/telefones simulados coerentes
  console.assert(MOCK_ACCOUNTS.length > 0 && MOCK_ACCOUNTS[0].phones.length > 0, "Contas e números simulados devem existir");

  // Teste extra 11: header singular 'tag'
  const singleTag = `name,email,phone,tag\nBeta,beta@ex.com,21999990000,prospect`;
  const p5 = parseCsvContacts(singleTag);
  console.assert(p5.length === 1 && p5[0].tags && p5[0].tags[0] === 'prospect', "header singular 'tag' deve ser suportado");

  // Teste extra 12: safeRate
  console.assert(safeRate(50, 200) === 25, "safeRate deve retornar 25%");

  // Teste extra 13: filtro combinado onlyTag e excludeTags (simulação)
  const hasVip = MOCK_CONTACTS.filter(c => (c.tags||[]).includes('vip')).length > 0;
  console.assert(hasVip, "deve haver ao menos um contato com tag 'vip'");
}
runSelfTests();

// =============== Estilos base ===============
const FontGlobal: React.FC = () => (
  <style>{`
    @font-face { font-family: 'PP Neue Montreal'; src: local('PP Neue Montreal'), local('PPNeueMontreal-Variable'), url('/assets/PPNEUEMONTREAL-VARIABLE.TTF') format('truetype'); font-weight: 100 900; font-style: normal; font-display: swap; }
    :root { --wj-bg: ${theme.bg}; --wj-panel: ${theme.panel}; --wj-panel2:${theme.panel2}; --wj-border:${theme.border}; --wj-text:${theme.text}; --wj-textMuted:${theme.textMuted}; --wj-accent:${theme.accent}; }
    html, body, #root { height: 100%; }
    body { background:${theme.bg}; color:${theme.text}; font-family: 'PP Neue Montreal', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'; }
    ::selection { background: ${theme.accent}33; color: ${theme.text}; }
    .scroll-slim { scrollbar-width: thin; scrollbar-color: ${theme.border} transparent; }
    .scroll-slim::-webkit-scrollbar { width: 8px; height: 8px; }
    .scroll-slim::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 999px; }
    .btn-ghost { border:1px solid ${theme.border}; background:${theme.panel2}; }
    .tab { border-bottom: 2px solid transparent; }
    .tab-active { border-color: ${theme.accent}; color: ${theme.text}; }
  `}</style>
);

function WJBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-full" style={{ background: theme.accent, color: "#111" }} aria-label="WJ Logo">
        <strong>WJ</strong>
      </div>
      <div>
        <div className="text-sm leading-tight opacity-90">Luminárias WJ</div>
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: theme.textMuted }}>WhatsApp Cloud · Protótipo</div>
      </div>
    </div>
  );
}

// =============== Sidebar de Conversas ===============
function SidebarContact({ c, active, onClick }: { c: Contact; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`group w-full border-b px-3 py-3 text-left transition ${active ? "bg-white/5" : "hover:bg-white/5"}`} style={{ borderColor: theme.border }}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-sm font-semibold" style={{ border: `1px solid ${theme.border}` }}>{c.initial}</div>
          {c.online && (<span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border" style={{ background: theme.success, borderColor: theme.panel }} />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{c.name}</span>
            {c.pinned && (<span className="rounded-full border px-1.5 py-0.5 text-[10px]" style={{ borderColor: theme.border, color: theme.textMuted }}>fixado</span>)}
          </div>
          <div className="truncate text-xs" style={{ color: theme.textMuted }}>{c.lastMessage}</div>
          {c.tags && c.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {c.tags.map((t) => (<span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}`, color: theme.textMuted }}>{t}</span>))}
            </div>
          )}
        </div>
        {c.unread && (<span className="grid h-6 w-6 place-items-center rounded-full text-xs font-semibold" style={{ background: theme.accent, color: "#111" }}>{c.unread}</span>)}
      </div>
    </button>
  );
}

function Sidebar({ contacts, selected, onSelect, onOpenNew }: { contacts: Contact[]; selected: string; onSelect: (id: string) => void; onOpenNew: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => contacts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)), [query, contacts]);

  return (
    <aside className="flex h-full w-full max-w-[360px] flex-col border-r" style={{ background: theme.panel, borderColor: theme.border }}>
      <div className="flex items-center justify-between px-4 py-3">
        <WJBadge />
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 hover:bg-white/5" onClick={onOpenNew} aria-label="Novo contato"><Plus size={18} /></button>
          <button className="rounded-md p-2 hover:bg-white/5" aria-label="Mais opções"><MoreVertical size={18} /></button>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-md border px-3 py-2" style={{ borderColor: theme.border, background: theme.panel2 }}>
          <Search size={16} className="opacity-70" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar contato ou telefone" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
        </div>
      </div>
      <div className="scroll-slim flex-1 overflow-y-auto">
        {filtered.map((c) => (<SidebarContact key={c.id} c={c} active={selected === c.id} onClick={() => onSelect(c.id)} />))}
      </div>
    </aside>
  );
}

// =============== Header do Chat ===============
function HeaderChat({ contact, onBack, onOpenTemplates }: { contact: Contact; onBack: () => void; onOpenTemplates: () => void }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
      <div className="flex items-center gap-3">
        <button className="lg:hidden rounded-md p-2 hover:bg-white/5" onClick={onBack} aria-label="Voltar"><ChevronLeft size={18} /></button>
        <div className="relative">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-xs font-semibold" style={{ border: `1px solid ${theme.border}` }}>{contact.initial}</div>
          {contact.online && (<span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border" style={{ background: theme.success, borderColor: theme.panel }} />)}
        </div>
        <div>
          <div className="text-sm font-medium">{contact.name}</div>
          <div className="text-xs" style={{ color: theme.textMuted }}>{contact.online ? "online agora" : contact.phone}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-md px-2 py-1 text-xs" style={{ border: `1px solid ${theme.border}` }} onClick={onOpenTemplates}>
          <div className="flex items-center gap-1 opacity-90"><Sparkles size={14} /> Templates</div>
        </button>
        <button className="rounded-md p-2 hover:bg-white/5" aria-label="Ligar"><Phone size={18} /></button>
        <button className="rounded-md p-2 hover:bg-white/5" aria-label="Vídeo"><Video size={18} /></button>
        <button className="rounded-md p-2 hover:bg-white/5" aria-label="Mais"><MoreVertical size={18} /></button>
      </div>
    </div>
  );
}

// =============== Bolha de Mensagem ===============
function Bubble({ m }: { m: Message }) {
  const isMe = m.author === "me";
  const base = "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm";
  const bg = isMe ? theme.accent : "#222";
  const color = isMe ? "#111" : theme.text;

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="flex items-end gap-2">
        {!isMe && <div className="h-8 w-8 rounded-full bg-white/5" />}
        <div className={base} style={{ background: bg, color }}>
          {m.media?.kind === "image" && (
            <div className="mb-1 overflow-hidden rounded-lg"><div className="h-40 w-64 bg-black/30" /></div>
          )}
          {m.media?.kind === "file" && (
            <div className="mb-1 flex items-center gap-2 rounded-md border px-2 py-1" style={{ borderColor: theme.border, background: "#00000022" }}>
              <FileText size={14} />
              <span className="text-xs opacity-90">{m.media.name || "arquivo"}</span>
            </div>
          )}
          {m.text && <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>}
          <div className="mt-1 flex items-center gap-1 text-[11px] opacity-70">
            <span>{m.time}</span>
            {isMe && (m.status === "read" ? (<CheckCheck size={14} />) : m.status === "delivered" ? (<CheckCheck size={14} className="opacity-70" />) : (<Check size={14} className="opacity-70" />))}
          </div>
        </div>
        {isMe && <div className="h-8 w-8 rounded-full bg-white/5" />}
      </div>
    </motion.div>
  );
}

// =============== Janela de Chat ===============
function ChatWindow({ contact, onOpenTemplates }: { contact: Contact; onOpenTemplates: () => void }) {
  const [messages, setMessages] = useState<Message[]>(MOCK_THREADS[contact.id] || []);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages(MOCK_THREADS[contact.id] || []); }, [contact.id]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const sendDraft = () => {
    if (!draft.trim()) return;
    const newMsg: Message = { id: `${Date.now()}`, author: "me", text: draft.trim(), time: new Date().toTimeString().slice(0,5), status: "sent" };
    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
  };

  return (
    <section className="flex h-full flex-1 flex-col" style={{ background: `radial-gradient(1200px 1200px at 80% -200px, #1f1a12 0%, ${theme.bg} 42%, ${theme.bg} 100%)` }}>
      <HeaderChat contact={contact} onBack={() => history.back()} onOpenTemplates={onOpenTemplates} />
      <div ref={scrollRef} className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <AnimatePresence initial={false}>{messages.map((m) => (<Bubble key={m.id} m={m} />))}</AnimatePresence>
      </div>
      <div className="border-t p-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-end gap-2">
          <button className="rounded-md p-2 hover:bg-white/5" aria-label="Anexar mídia"><Paperclip size={18} /></button>
          <button className="rounded-md p-2 hover:bg-white/5" aria-label="Inserir imagem"><ImageIcon size={18} /></button>
          <div className="flex-1 rounded-lg border px-3 py-2" style={{ borderColor: theme.border, background: theme.panel2 }}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva uma mensagem" rows={1} className="max-h-40 w-full resize-none bg-transparent outline-none placeholder:opacity-50" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDraft(); } }} />
          </div>
          <button onClick={sendDraft} className="rounded-xl px-3 py-2 font-medium transition" style={{ background: theme.accent, color: "#111" }}>
            <div className="flex items-center gap-2 text-sm"><Send size={16} /> Enviar</div>
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: theme.textMuted }}>
          <div className="flex items-center gap-2"><Smile size={14} className="opacity-70" /><span>Dica: Shift + Enter quebra linha</span></div>
          <span>Protótipo UI · sem conexão API</span>
        </div>
      </div>
    </section>
  );
}

// =============== Painel: Novo Contato (slide-over) ===============
function NewContactPanel({ onClose, onSave }: { onClose: () => void; onSave: (c: Contact) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    const c: Contact = { id: `c_${Date.now()}`, name: name.trim(), phone: sanitizePhone(phone.trim()), initial: buildInitialFromName(name.trim()), lastMessage: "—", tags: tags.split(',').map((t) => t.trim()).filter(Boolean) };
    onSave(c);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="ml-auto h-full w-full max-w-[420px] border-l bg-black/60 backdrop-blur" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
          <div className="flex items-center gap-2"><Plus size={18} /><div className="text-sm font-medium">Novo contato</div></div>
          <button className="rounded-md p-2 hover:bg-white/5" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="space-y-3 p-4">
          <div><label className="mb-1 block text-xs opacity-70">Nome</label><input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: Galeria Aurora" /></div>
          <div><label className="mb-1 block text-xs opacity-70">Telefone (E.164 ou BR)</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: 5511999999999" /></div>
          <div><label className="mb-1 block text-xs opacity-70">Tags (opcional, separadas por vírgula)</label><input value={tags} onChange={(e)=>setTags(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="vip, showroom" /></div>
          <div className="pt-1"><button onClick={handleSave} className="w-full rounded-lg px-3 py-2 font-medium" style={{ background: theme.accent, color: '#111' }}>Salvar contato</button></div>
          <p className="text-[11px] opacity-60">* Protótipo: dados ficam apenas em memória local durante a sessão.</p>
        </div>
      </div>
    </div>
  );
}

// =============== Painel: Templates (página dedicada) ===============
function TemplatesPage() {
  const [name, setName] = useState("boas_vindas_wj");
  const [lang, setLang] = useState("pt_BR");
  const [category, setCategory] = useState("UTILITY");
  const [header, setHeader] = useState<string>("");
  const [body, setBody] = useState<string>("Olá {{1}}, obrigado pelo interesse nas Luminárias WJ. Podemos ajudar com medidas, prazos e acabamentos. Digite seu assunto ou responda 1-Catálogo 2-Prazos 3-Atendimento.");
  const [footer, setFooter] = useState<string>("WJ · Feito à mão no Brasil");

  const wrapSel = (fieldSetter: (v: string)=>void, value: string, left: string, right: string) => fieldSetter(left + value + right);

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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs opacity-70">Nome interno</label><input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} /></div>
            <div><label className="mb-1 block text-xs opacity-70">Idioma</label><select value={lang} onChange={(e)=>setLang(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}><option value="pt_BR">pt_BR</option><option value="en_US">en_US</option><option value="es_ES">es_ES</option></select></div>
            <div><label className="mb-1 block text-xs opacity-70">Categoria</label><select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}><option value="UTILITY">UTILITY</option><option value="MARKETING">MARKETING</option><option value="AUTHENTICATION">AUTHENTICATION</option></select></div>
            <div className="flex items-end"><div className="text-[11px] opacity-60">{'Use variáveis {{1}}, {{2}} ...'}</div></div>
          </div>
          <div><label className="mb-1 block text-xs opacity-70">Header (opcional)</label><input value={header} onChange={(e)=>setHeader(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: WJ — Boas-vindas" /></div>
          <div>
            <div className="mb-1 flex items-center justify-between"><label className="block text-xs opacity-70">Body</label>
              <div className="flex items-center gap-1">
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, "*", "*")}>
                  <Bold size={14}/>
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, "_", "_")}>
                  <Italic size={14}/>
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((prev)=>appendSnippet(prev, "> citação"))}>
                  <Quote size={14}/>
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((prev)=>appendSnippet(prev, "• item"))}>
                  <List size={14}/>
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((prev)=>appendSnippet(prev, "{{1}}"))}>
                  <Hash size={14}/>
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody((prev)=>prev + " https://wj.link ")}>
                  <Link size={14}/>
                </button>
              </div>
            </div>
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
          </div>
          <div><label className="mb-1 block text-xs opacity-70">Footer (opcional)</label><input value={footer} onChange={(e)=>setFooter(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} /></div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: errors.length ? theme.danger : theme.textMuted }}>{errors.length ? `Erros: ${errors.join(' | ')}` : 'Pronto para enviar (simulado)'}</div>
            <button disabled={!!errors.length} className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: theme.accent, color: '#111' }}>Enviar para aprovação (simulado)</button>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="border-b pb-2 text-xs uppercase tracking-wider" style={{ borderColor: theme.border, color: theme.textMuted }}>Pré-visualização</div>
          <div className="space-y-2 text-sm">
            {header && <div className="opacity-80">{header}</div>}
            <div>{body}</div>
            {footer && <div className="text-xs opacity-60">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== Painel: Contatos (página dedicada) ===============
function ContactsPage({ contacts, onAddMany, onDeleteMany, onBulkTagAdd, onBulkTagRemove }: { contacts: Contact[]; onAddMany: (c: Contact[]) => void; onDeleteMany: (ids: string[]) => void; onBulkTagAdd: (tag: string, ids: string[]) => void; onBulkTagRemove: (tag: string, ids: string[]) => void }) {
  // -------- Importação CSV (coluna esquerda) --------
  const [csvPreview, setCsvPreview] = useState<string>(`name,e-mail,phone,tags\nMaria,maria@exemplo.com,11999990000,vip;loja\nJoão,joao@exemplo.com,5511988887777,revenda`);
  const [parsed, setParsed] = useState<Contact[]>([]);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const list = parseCsvContacts(text);
      setParsed(list);
    };
    reader.readAsText(file);
  };
  useEffect(() => { setParsed(parseCsvContacts(csvPreview)); }, []);

  // -------- Gestão / Contagem / Edição em massa (coluna direita) --------
  const allTags = useMemo(()=> uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState<string>("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [onlyTag, setOnlyTag] = useState<string>("");
  const [excludeTags, setExcludeTags] = useState<string[]>([]);

  const base = useMemo(()=> filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(()=> base.filter(c => {
    const tags = c.tags || [];
    if (onlyTag && !tags.includes(onlyTag)) return false;
    if (excludeTags.length && tags.some(t => excludeTags.includes(t))) return false;
    return true;
  }), [base, onlyTag, excludeTags]);

  const totalCount = contacts.length;
  const [countTag, setCountTag] = useState<string>("");
  const countByTag = useMemo(()=> countTag ? contacts.filter(c => (c.tags||[]).includes(countTag)).length : 0, [contacts, countTag]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length>0 && filtered.every(c=>selectedIds.includes(c.id));
  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.some(c=>c.id===id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filtered.map(c=>c.id)])));
    }
  };

  const [bulkTag, setBulkTag] = useState<string>("");
  const canBulk = selectedIds.length > 0 && bulkTag.trim().length > 0;

  const doDelete = () => { if (selectedIds.length) { onDeleteMany(selectedIds); setSelectedIds([]); } };
  const doAddTag = () => { if (canBulk) { onBulkTagAdd(bulkTag.trim(), selectedIds); setBulkTag(""); } };
  const doRemoveTag = () => { if (canBulk) { onBulkTagRemove(bulkTag.trim(), selectedIds); setBulkTag(""); } };

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      {/* Coluna esquerda: Importar */}
      <div className="space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2"><Users size={16}/><div className="text-sm font-medium">Importar contatos (CSV)</div></div>
            <label className="btn-ghost cursor-pointer rounded-md px-3 py-1.5 text-xs"><input type="file" accept=".csv" className="hidden" onChange={(e)=>handleFile(e.target.files?.[0])} /><div className="flex items-center gap-1"><Upload size={14}/> Selecionar CSV</div></label>
          </div>
          <div className="space-y-2 p-3 text-sm">
            <div className="text-xs" style={{ color: theme.textMuted }}>Formato esperado: <code>name, e-mail, phone, tags</code> (tags separadas por "," ou ";"). Telefones serão convertidos para E.164 BR automaticamente (prefixo 55).</div>
            <textarea value={csvPreview} onChange={(e)=>setCsvPreview(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
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

      {/* Coluna direita: Gestão / Contagem / Edição em massa */}
      <div className="space-y-3">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="text-sm font-medium">Base de contatos</div>
            <div className="text-xs" style={{ color: theme.textMuted }}>Total: <strong>{totalCount}</strong></div>
          </div>

          {/* Contadores */}
          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Contar contatos com a tag</label>
              <select value={countTag} onChange={(e)=>setCountTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(selecione)</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="mt-1 text-xs" style={{ color: theme.textMuted }}>Com "{countTag || '—'}": <strong>{countTag ? countByTag : 0}</strong></div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Buscar</label>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: theme.border, background: theme.panel2 }}>
                <Search size={14} className="opacity-70" />
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={() => setTagsFilter(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} style={{ borderColor: theme.border }}>
                    {t}
                  </button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={(e)=>setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={() => setExcludeTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} style={{ borderColor: theme.border }}>
                    {t}
                  </button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>Selecionados: {selectedIds.length} · Visíveis: {filtered.length}</div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={bulkTag} onChange={(e)=>setBulkTag(e.target.value)} placeholder="tag para editar" className="rounded-md border bg-transparent px-2 py-1 text-xs outline-none" style={{ borderColor: theme.border }} />
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
                    <div className="truncate text-xs opacity-70">{c.phone} {c.email ? ` · ${c.email}` : ''}</div>
                    {c.tags && c.tags.length>0 && <div className="mt-1 flex flex-wrap gap-1">{c.tags.map(t=>(<span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}` }}>{t}</span>))}</div>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-3 text-xs" style={{ borderColor: theme.border, color: theme.textMuted }}>
          Dica: Use os filtros para selecionar o conjunto certo antes de aplicar ações em massa. “Adicionar tag” cria a tag se não existir nos contatos selecionados.
        </div>
      </div>
    </div>
  );
}

// =============== Modal de Confirmação (ÚNICA) ===============
function ConfirmModal({ open, onClose, onConfirm, summary }: { open: boolean; onClose: () => void; onConfirm: () => void; summary: { count: number; scheduleLabel: string; tplName: string; header?: string; body: string; footer?: string; accountName?: string; phoneDisplay?: string; campaignName?: string } }) {
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

// =============== Página: Contas (seleção de WABA e número) ===============
function AccountsPage({ accounts, selectedAccountId, setSelectedAccountId, selectedPhoneId, setSelectedPhoneId }: { accounts: MetaAccount[]; selectedAccountId: string; setSelectedAccountId: (v: string)=>void; selectedPhoneId: string; setSelectedPhoneId: (v: string)=>void }) {
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
            <p className="text-[11px] opacity-60">No real: listar via Graph API <em>/{{WABA_ID}}/phone_numbers</em> com permissões adequadas.</p>
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
                <li>Botão “Conectar Meta” → OAuth (Facebook Login) para listar negócios/WABA que você administra.</li>
                <li>Servidor troca por token de sistema (Business Manager) e consulta <code>/whatsapp_business_accounts</code> e <code>/phone_numbers</code>.</li>
                <li>Você escolhe a WABA e o número padrão para disparos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== Página de Disparo (Broadcast) ===============
function BroadcastPage({ contacts, selectedAccount, selectedPhone, onCreateCampaign }: { contacts: Contact[]; selectedAccount?: MetaAccount; selectedPhone?: MetaPhone; onCreateCampaign: (c: { name: string; templateName: string; total: number; scheduleAt?: string }) => void }) {
  // Lista simulada de templates aprovados (no real viria da Meta)
  const approvedTemplates = useMemo(() => [
    { id: 'tpl_boasvindas', name: 'boas_vindas_wj', header: 'Luminárias WJ', body: 'Olá {{1}}, obrigado por falar com a WJ. Posso enviar o catálogo atualizado?', footer: 'Feito à mão no Brasil' },
    { id: 'tpl_aviso2026', name: 'aviso_pedidos_2026', header: 'Agenda 2026', body: 'Olá {{1}}, os pedidos para 2026 já estão abertos. Quer garantir prioridade na produção?', footer: 'Equipe WJ' },
  ], []);

  const [selectedTplId, setSelectedTplId] = useState<string>("");
  const selectedTpl = approvedTemplates.find(t => t.id === selectedTplId);

  // Template (apenas leitura a partir do aprovado)
  const tplHeader = selectedTpl?.header || "";
  const tplBody = selectedTpl?.body || "";
  const tplFooter = selectedTpl?.footer || "";

  // Nome da campanha
  const [campaignName, setCampaignName] = useState<string>("Campanha WJ");

  // Filtros de contatos
  const allTags = useMemo(()=> uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState<string>("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]); // incluir (OR)
  const [onlyTag, setOnlyTag] = useState<string>(""); // "apenas com a tag X"
  const [excludeTags, setExcludeTags] = useState<string[]>([]); // exclusões

  const base = useMemo(()=> filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(()=> base.filter(c => {
    const tags = c.tags || [];
    if (onlyTag && !tags.includes(onlyTag)) return false;
    if (excludeTags.length && tags.some(t => excludeTags.includes(t))) return false;
    return true;
  }), [base, onlyTag, excludeTags]);

  // Seleção de contatos
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length>0 && filtered.every(c=>selectedIds.includes(c.id));
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
  const [when, setWhen] = useState<string>(""); // input datetime-local
  const tz = "America/Sao_Paulo"; // Horário de Brasília
  const scheduleLabel = useMemo(()=>{
    if (!scheduleEnabled || !when) return "Envio imediato";
    try {
      const d = new Date(when);
      const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });
      return `Agendado para ${fmt.format(d)} (${tz})`;
    } catch { return "Agendado (data inválida)"; }
  }, [scheduleEnabled, when]);

  const countSelected = selectedIds.length;

  // Modal de confirmação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSend = Boolean(selectedTplId) && countSelected > 0 && Boolean(selectedPhone?.id) && Boolean(campaignName.trim()); // obrigatório: template + número + nome campanha
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
      {/* Coluna esquerda: Filtros e Seleção */}
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
                <Search size={14} className="opacity-70" />
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={() => setTagsFilter(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} style={{ borderColor: theme.border }}>
                    {t}
                  </button>
                )) : <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={(e)=>setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? allTags.map(t => (
                  <button key={t} onClick={() => setExcludeTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])} className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} style={{ borderColor: theme.border }}>
                    {t}
                  </button>
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
                    <div className="truncate text-xs opacity-70">{c.phone} {c.email ? ` · ${c.email}` : ''}</div>
                    {c.tags && c.tags.length>0 && <div className="mt-1 flex flex-wrap gap-1">{c.tags.map(t=>(<span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}` }}>{t}</span>))}</div>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border p-3 text-xs" style={{ borderColor: theme.border, color: theme.textMuted }}>
          Dica: Use um número configurado na página **Contas**. No real, a API usará o <strong>PHONE_NUMBER_ID</strong> selecionado.
        </div>
      </div>

      {/* Coluna direita: Template, agendamento e confirmação */}
      <div className="space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2"><Sparkles size={16}/><div className="text-sm font-medium">Selecionar template aprovado</div></div>
            <div className="text-xs" style={{ color: theme.textMuted }}>{selectedTpl ? selectedTpl.name : 'nenhum selecionado'}</div>
          </div>
          <div className="space-y-3 p-3 text-sm">
            <label className="mb-1 block text-xs opacity-70">Template</label>
            <select value={selectedTplId} onChange={(e)=>setSelectedTplId(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              <option value="">(selecione um template aprovado)</option>
              {approvedTemplates.map(t=>(<option key={t.id} value={t.id}>{t.name}</option>))}
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
              {selectedAccount ? `${selectedAccount.name}` : 'Conta —' } {selectedPhone ? ` · ${selectedPhone.display}` : ''}
            </div>
          </div>
          <div className="space-y-3 p-3 text-sm">
            {!selectedAccount && <div className="text-xs" style={{ color: theme.warn }}>Selecione uma conta e número na aba "Contas".</div>}

            <div>
              <label className="mb-1 block text-xs opacity-70">Nome da campanha/disparo</label>
              <input value={campaignName} onChange={(e)=>setCampaignName(e.target.value)} placeholder="Ex.: Abertura Agenda 2026 (lojas VIP)" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-xs opacity-80"><Clock size={14}/> Agendamento</div>
              <label className="mb-2 flex items-center gap-2 text-xs opacity-80">
                <input type="checkbox" checked={scheduleEnabled} onChange={(e)=>setScheduleEnabled(e.target.checked)} />
                Agendar envio (Horário de Brasília — America/Sao_Paulo)
              </label>
              {scheduleEnabled && (
                <input type="datetime-local" value={when} onChange={(e)=>setWhen(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
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

// =============== Página: Dashboard (campanhas) ===============
function StatusBadge({ status }: { status: CampaignStatus }){
  const map = {
    'Agendada': { bg: '#1f2a00', color: theme.warn, icon: <CalendarClock size={12}/> },
    'Em andamento': { bg: '#0a1f15', color: '#34d399', icon: <CircleDashed size={12}/> },
    'Concluída': { bg: '#0a1a0a', color: theme.success, icon: <CheckCircle2 size={12}/> },
  } as const;
  const s = map[status];
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px]" style={{ background: s.bg, color: s.color, border: `1px solid ${theme.border}` }}>{s.icon}{status}</span>;
}

function ProgressBar({ value }: { value: number }){
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full" style={{ background: '#1f1f1f', border: `1px solid ${theme.border}` }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${clamped}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} className="h-full rounded-full" style={{ background: theme.accent }} />
    </div>
  );
}

function CampaignCard({ c }: { c: Campaign }){
  const progress = c.total > 0 ? Math.round((c.sent / c.total) * 100) : 0;
  const rateDelivery = safeRate(c.delivered, c.total);
  const rateError = safeRate(c.failed, c.total);
  const rateReply = safeRate(c.replied, c.total);
  const fmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: theme.border, background: theme.panel }}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{c.name}</div>
          <div className="text-[11px] opacity-60">Template: {c.templateName} · Conta: {c.accountName} · Nº: {c.phoneDisplay || '—'}</div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="mb-2 flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
        <div>Envio: {c.scheduledAt ? fmt.format(new Date(c.scheduledAt)) : (c.startedAt ? fmt.format(new Date(c.startedAt)) : '—')}</div>
        <div>{c.sent}/{c.total} enviados</div>
      </div>
      <ProgressBar value={progress} />

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border p-2 text-center" style={{ borderColor: theme.border }}>
          <div className="opacity-60">Entrega</div>
          <div className="text-sm font-semibold">{rateDelivery}%</div>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ borderColor: theme.border }}>
          <div className="opacity-60">Erro</div>
          <div className="text-sm font-semibold">{rateError}%</div>
        </div>
        <div className="rounded-md border p-2 text-center" style={{ borderColor: theme.border }}>
          <div className="opacity-60">Resposta</div>
          <div className="text-sm font-semibold">{rateReply}%</div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ campaigns, filter, setFilter }: { campaigns: Campaign[]; filter: CampaignStatus | 'Todos'; setFilter: (f: CampaignStatus | 'Todos') => void }){
  const list = campaigns.filter(c => filter === 'Todos' ? true : c.status === filter);

  const totals = campaigns.reduce((acc, c) => {
    acc.total += c.total; acc.sent += c.sent; acc.delivered += c.delivered; acc.failed += c.failed; acc.replied += c.replied; return acc;
  }, { total: 0, sent: 0, delivered: 0, failed: 0, replied: 0 });

  const overallProgress = safeRate(totals.sent, totals.total);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><BarChart3 size={16}/><div className="text-sm font-medium">Dashboard de Campanhas</div></div>
          <div className="flex items-center gap-2 text-xs">
            <button className={`rounded-md px-2 py-1 ${filter==='Todos' ? 'tab-active' : 'opacity-70 hover:opacity-100'} tab`} onClick={()=>setFilter('Todos')}>Todos</button>
            <button className={`rounded-md px-2 py-1 ${filter==='Em andamento' ? 'tab-active' : 'opacity-70 hover:opacity-100'} tab`} onClick={()=>setFilter('Em andamento')}>Em andamento</button>
            <button className={`rounded-md px-2 py-1 ${filter==='Agendada' ? 'tab-active' : 'opacity-70 hover:opacity-100'} tab`} onClick={()=>setFilter('Agendada')}>Agendadas</button>
            <button className={`rounded-md px-2 py-1 ${filter==='Concluída' ? 'tab-active' : 'opacity-70 hover:opacity-100'} tab`} onClick={()=>setFilter('Concluída')}>Concluídas</button>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
        <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="text-xs opacity-60">Total destinatários</div>
          <div className="text-xl font-semibold">{totals.total}</div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="text-xs opacity-60">Entregues</div>
          <div className="text-xl font-semibold">{totals.delivered}</div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="text-xs opacity-60">Falhas</div>
          <div className="text-xl font-semibold">{totals.failed}</div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="text-xs opacity-60">Respostas</div>
          <div className="text-xl font-semibold">{totals.replied}</div>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-2 text-xs" style={{ color: theme.textMuted }}>Progresso geral</div>
        <ProgressBar value={overallProgress} />
      </div>

      {/* Lista de campanhas */}
      <div className="scroll-slim grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {list.length ? list.map(c => <CampaignCard key={c.id} c={c} />) : (
          <div className="col-span-full rounded-lg border p-6 text-center text-sm" style={{ borderColor: theme.border, color: theme.textMuted }}>
            Nenhuma campanha para esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}

// =============== Tela de Login (simples, local) ===============
function LoginScreen({ onLogin }: { onLogin: (user: { name: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const DEMO_USER = { email: "admin@wj.com", password: "wj@2025", name: "Admin WJ" };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === DEMO_USER.email && password === DEMO_USER.password) {
      setError("");
      onLogin({ name: DEMO_USER.name });
    } else {
      setError("Credenciais inválidas");
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
            <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="admin@wj.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">Senha</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="••••••••" />
          </div>
          {error && <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: theme.border, color: theme.danger }}>{error}</div>}
          <button type="submit" className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium" style={{ background: theme.accent, color: '#111' }}>Entrar</button>
          <div className="text-[11px] opacity-60">Demo: admin@wj.com · wj@2025</div>
        </div>
      </form>
    </div>
  );
}

// =============== App com MENU + Login + Contas + Dashboard ===============
export default function ChatPrototypeWJ() {
  // Autenticação simples (local)
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

  // Campanhas (dashboard)
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 'cmp_01', name: 'Boas-vindas Showrooms', templateName: 'boas_vindas_wj', accountName: 'Luminárias WJ', phoneDisplay: '+55 11 99999-0000', total: 1000, sent: 600, delivered: 570, failed: 30, replied: 120, startedAt: new Date(Date.now()-60*60*1000).toISOString(), status: 'Em andamento' },
    { id: 'cmp_02', name: 'Agenda 2026 — Lojas VIP', templateName: 'aviso_pedidos_2026', accountName: 'Luminárias WJ', phoneDisplay: '+55 11 88888-7777', total: 350, sent: 350, delivered: 334, failed: 16, replied: 45, startedAt: new Date(Date.now()-3*60*60*1000).toISOString(), status: 'Concluída' },
    { id: 'cmp_03', name: 'Follow-up catálogo', templateName: 'boas_vindas_wj', accountName: 'Estúdio Luz Studio', phoneDisplay: '+55 21 99999-1111', total: 220, sent: 0, delivered: 0, failed: 0, replied: 0, scheduledAt: new Date(Date.now()+60*60*1000).toISOString(), status: 'Agendada' },
  ]);
  const [dashFilter, setDashFilter] = useState<CampaignStatus | 'Todos'>('Todos');

  // Tick de simulação para progresso, início de agendadas e respostas
  useEffect(() => {
    const id = setInterval(() => {
      setCampaigns(prev => prev.map(c => {
        // Agendamento → Em andamento
        if (c.status === 'Agendada' && c.scheduledAt && new Date(c.scheduledAt) <= new Date()) {
          return { ...c, status: 'Em andamento', startedAt: new Date().toISOString() };
        }
        if (c.status !== 'Em andamento') return c;
        // Progresso por "lotes"
        const step = Math.max(1, Math.ceil(c.total * 0.02)); // ~2% por tick
        const nextSent = Math.min(c.sent + step, c.total);
        // Entregas: ~95% dos enviados
        const nextDeliveredTarget = Math.floor(nextSent * 0.95);
        const nextDelivered = Math.min(Math.max(c.delivered, nextDeliveredTarget), c.total);
        const nextFailed = Math.max(0, nextSent - nextDelivered);
        // Respostas: ~10-20% dos entregues (cresce devagar)
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
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleSaveContact = (c: Contact) => {
    setContacts((prev) => [c, ...prev]);
    setSelected(c.id);
    setActiveTab('chat');
  };

  const handleAddMany = (arr: Contact[]) => {
    if (!arr || !arr.length) return;
    setContacts((prev) => [...arr, ...prev]);
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
          <button className={`tab pb-3 ${activeTab==='chat' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('chat')}>
            <div className="flex items-center gap-1"><MessagesSquare size={16}/> Conversas</div>
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

        {activeTab === 'chat' && (
          <>
            {showSidebar && (
              <Sidebar contacts={contacts} selected={selected} onSelect={setSelected} onOpenNew={()=>setOpenNewContact(true)} />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <ChatWindow contact={selectedContact} onOpenTemplates={()=>setActiveTab('templates')} />
            </div>
          </>
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
            <BroadcastPage contacts={contacts} selectedAccount={selectedAccount} selectedPhone={selectedPhone} onCreateCampaign={onCreateCampaign} />
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

      {openNewContact && <NewContactPanel onClose={()=>setOpenNewContact(false)} onSave={handleSaveContact} />}
    </div>
  );
}
