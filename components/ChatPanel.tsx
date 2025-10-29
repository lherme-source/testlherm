import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreVertical, Phone, Video, Paperclip, Send, Check, CheckCheck, Smile, Image as ImageIcon, FileText, ChevronLeft, Plus, X, Sparkles } from "lucide-react";

// ===================== THEME (isolado) =====================
const theme = {
  bg: "#0E0E0E",
  panel: "#141414",
  panel2: "#1A1A1A",
  border: "#2A2A2A",
  text: "#ECECEC",
  textMuted: "#B8B8B8",
  accent: "#D6A65C",
  success: "#8BE28B",
};

// ===================== Tipos locais (compatíveis) =====================
export type Message = {
  id: string;
  author: "me" | "them";
  text?: string;
  time: string; // HH:mm
  status?: "sent" | "delivered" | "read";
  media?: { kind: "image" | "file"; name?: string };
};
export type Contact = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  initial?: string;
  lastMessage: string;
  unread?: number;
  online?: boolean;
  pinned?: boolean;
  tags?: string[];
};

// ===================== Helpers isolados (prefixo cp_) =====================
const cp_buildInitialFromName = (s: string) => {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  const initials = parts.map((p) => p[0] ?? "").join("").slice(0, 3).toUpperCase();
  return initials || "C";
};

// ===================== Estilos globais locais =====================
const FontGlobal: React.FC = () => (
  <style>{`
    :root {
      --wj-bg: ${theme.bg};
      --wj-panel: ${theme.panel};
      --wj-panel2:${theme.panel2};
      --wj-border:${theme.border};
      --wj-text:${theme.text};
      --wj-textMuted:${theme.textMuted};
      --wj-accent:${theme.accent};
    }
    .scroll-slim { scrollbar-width: thin; scrollbar-color: ${theme.border} transparent; }
    .scroll-slim::-webkit-scrollbar { width: 8px; height: 8px; }
    .scroll-slim::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 999px; }
    .btn-ghost { border:1px solid ${theme.border}; background:${theme.panel2}; }
    .tab { border-bottom: 2px solid transparent; }
    .tab-active { border-color: ${theme.accent}; color: ${theme.text}; }
  `}</style>
);

// ===================== Badge =====================
function WJBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 place-items-center rounded-full" style={{ background: theme.accent, color: "#111" }} aria-label="WJ Logo">
        <strong>WJ</strong>
      </div>
      <div>
        <div className="text-sm leading-tight opacity-90">Luminárias WJ</div>
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: theme.textMuted }}>WhatsApp · Conversas</div>
      </div>
    </div>
  );
}

// ===================== Itens de Sidebar =====================
function SidebarContact({ c, active, onClick }: { c: Contact; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full border-b px-3 py-3 text-left transition ${active ? "bg-white/5" : "hover:bg-white/5"}`}
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-sm font-semibold" style={{ border: `1px solid ${theme.border}` }}>{c.initial || cp_buildInitialFromName(c.name)}</div>
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
              {c.tags.map((t) => (
                <span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}`, color: theme.textMuted }}>{t}</span>
              ))}
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
        {filtered.map((c) => (
          <SidebarContact key={c.id} c={c} active={selected === c.id} onClick={() => onSelect(c.id)} />
        ))}
      </div>
    </aside>
  );
}

// ===================== Header do Chat =====================
function HeaderChat({ contact, onBack, onOpenTemplates }: { contact: Contact; onBack: () => void; onOpenTemplates: () => void }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
      <div className="flex items-center gap-3">
        <button className="lg:hidden rounded-md p-2 hover:bg-white/5" onClick={onBack} aria-label="Voltar"><ChevronLeft size={18} /></button>
        <div className="relative">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-xs font-semibold" style={{ border: `1px solid ${theme.border}` }}>{contact.initial || cp_buildInitialFromName(contact.name)}</div>
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

// ===================== Bolha =====================
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

// ===================== Janela do Chat =====================
function ChatWindow({ contact, thread, onSend, onOpenTemplates }: { contact: Contact; thread: Message[]; onSend: (text: string) => void; onOpenTemplates: () => void }) {
  const [messages, setMessages] = useState<Message[]>(thread || []);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages(thread || []); }, [contact.id, thread]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const sendDraft = () => {
    if (!draft.trim()) return;
    const newMsg: Message = { id: String(Date.now()), author: "me", text: draft.trim(), time: new Date().toTimeString().slice(0,5), status: "sent" };
    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
    onSend(newMsg.text || "");
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
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva uma mensagem"
              rows={1}
              className="max-h-40 w-full resize-none bg-transparent outline-none placeholder:opacity-50"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDraft(); } }}
            />
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

// ===================== Painel: Novo Contato =====================
function NewContactPanel({ onClose, onSave }: { onClose: () => void; onSave: (c: Contact) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) return;
    const c: Contact = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      initial: cp_buildInitialFromName(name.trim()),
      lastMessage: "—",
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
    };
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
          <div><label className="mb-1 block text-xs opacity-70">Telefone</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: 5511999999999" /></div>
          <div><label className="mb-1 block text-xs opacity-70">Tags (opcional, separadas por vírgula)</label><input value={tags} onChange={(e)=>setTags(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="vip, showroom" /></div>
          <div className="pt-1"><button onClick={handleSave} className="w-full rounded-lg px-3 py-2 font-medium" style={{ background: theme.accent, color: '#111' }}>Salvar contato</button></div>
          <p className="text-[11px] opacity-60">* Protótipo: dados ficam somente nesta sessão.</p>
        </div>
      </div>
    </div>
  );
}

// ===================== Componente Principal (Drop-in) =====================
export default function ChatPanel(props: {
  contacts?: Contact[];
  threads?: Record<string, Message[]>;
  selectedId?: string;
  onChangeSelected?: (id: string) => void;
  onSendMessage?: (contactId: string, text: string) => void;
  onOpenTemplates?: () => void;
  style?: React.CSSProperties;
}) {
  // Mocks seguros se nada vier por props
  const MOCK_CONTACTS: Contact[] = [
    { id: "c1", name: "Estúdio Baviera", phone: "+55 11 99999-1111", initial: "EB", lastMessage: "Amei o acabamento em inox polido. Enviam catálogo?", online: true, unread: 2, pinned: true, tags: ["showroom", "vip"] },
    { id: "c2", name: "Galeria São Paulo", phone: "+55 11 98888-2222", initial: "GSP", lastMessage: "Pedido #427 confirmado. Prazos para janeiro?", tags: ["cliente"] },
    { id: "c3", name: "Delumini Showroom", phone: "+55 41 97777-3333", initial: "DL", lastMessage: "Consegue vídeo do pendente ORI?", unread: 1, online: true },
  ];
  const MOCK_THREADS: Record<string, Message[]> = {
    c1: [
      { id: "m1", author: "them", text: "Olá! Vimos o pendente ENIGMA no Instagram. Tem catálogo técnico?", time: "09:02" },
      { id: "m2", author: "me", text: "Bom dia! Envio o PDF com medidas e acabamentos em seguida.", time: "09:04", status: "read" },
      { id: "m3", author: "them", text: "Amei o acabamento em inox polido. Enviam catálogo?", time: "09:10" },
    ],
    c2: [ { id: "m1", author: "them", text: "Pedido #427 confirmado. Prazos para janeiro?", time: "11:31" } ],
    c3: [ { id: "m1", author: "them", text: "Consegue vídeo do pendente ORI?", time: "10:05" } ],
  };

  const [contacts, setContacts] = useState<Contact[]>(props.contacts || MOCK_CONTACTS);
  const [selected, setSelected] = useState<string>(props.selectedId || contacts[0]?.id);
  const [openNewContact, setOpenNewContact] = useState(false);

  useEffect(() => { if (props.selectedId) setSelected(props.selectedId); }, [props.selectedId]);

  const threads = props.threads || MOCK_THREADS;
  const selectedContact = useMemo(() => contacts.find((c) => c.id === selected) || contacts[0], [contacts, selected]);
  const thread = threads[selectedContact?.id || ""] || [];

  const handleSend = (text: string) => {
    props.onSendMessage?.(selectedContact.id, text);
  };

  const handleSaveContact = (c: Contact) => {
    setContacts((prev) => [c, ...prev]);
    setSelected(c.id);
  };

  return (
    <div className="h-full w-full" style={{ background: theme.bg, ...(props.style || {}) }}>
      <FontGlobal />
      <div className="flex h-full w-full border" style={{ borderColor: theme.border }}>
        {/* Sidebar */}
        <Sidebar contacts={contacts} selected={selected} onSelect={(id)=>{ setSelected(id); props.onChangeSelected?.(id); }} onOpenNew={() => setOpenNewContact(true)} />

        {/* Chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              thread={thread}
              onSend={handleSend}
              onOpenTemplates={() => props.onOpenTemplates?.() || alert("Abrir Templates (simulação)")}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm" style={{ color: theme.textMuted }}>Selecione um contato</div>
          )}
        </div>
      </div>
      {openNewContact && <NewContactPanel onClose={() => setOpenNewContact(false)} onSave={handleSaveContact} />}
    </div>
  );
}
