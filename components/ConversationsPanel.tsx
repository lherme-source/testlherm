"use client";
// ConversationsPanel.tsx (WJ — Versão 1 / Aba Conversas)
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  Paperclip,
  Send,
  Smile,
  Image as ImageIcon,
  FileText,
  Phone,
  Video,
  Check,
  CheckCheck,
  Pin,
  EllipsisVertical,
  MessageSquare,
  Users,
  Clock,
  ArrowLeft,
} from "lucide-react";

const AMBER = "#d6a65c"; // rgb(214,166,92)

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold">
      {label}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] leading-none text-neutral-300">
      {children}
    </span>
  );
}

function UnreadDot({ count = 1 }: { count?: number }) {
  return (
    <div
      className="flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-semibold text-black"
      style={{ backgroundColor: AMBER }}
    >
      {count}
    </div>
  );
}

export type Thread = {
  id: string;
  name: string;
  initials: string;
  last: string;
  time: string;
  pinned?: boolean;
  tags?: string[];
  unread: number;
};

const initialThreads: Thread[] = [
  { id: "1", name: "Estúdio Baviera", initials: "EB", last: "Amei o acabamento em inox polido. Enviam catálogo?", time: "09:10", pinned: true, tags: ["showroom"], unread: 2 },
  { id: "2", name: "Galeria São Paulo", initials: "GSP", last: "Pedido #427 confirmado. Prazos para janeiro?", time: "08:56", tags: ["galeria", "cliente"], unread: 0 },
  { id: "3", name: "Delumini Showroom", initials: "DL", last: "Consegue vídeo do pendente ORI?", time: "08:40", tags: [], unread: 1 },
  { id: "4", name: "Mariana — Arq.", initials: "MA", last: "Projeto Cobogó: fita âmbar ou 3000K?", time: "Ontem", tags: [], unread: 0 },
  { id: "5", name: "Rodrigo de Borba", initials: "RB", last: "Fechei colab 1 Reels. Envio roteiro?", time: "Ontem", pinned: true, tags: [], unread: 0 },
];

export type Message = {
  id: string;
  who: "me" | "them";
  text: string;
  time: string;
  status?: "none" | "delivered" | "seen";
  image?: string;
};

const MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", who: "them", text: "Olá! Vimos o pendente ENIGMA no Instagram. Tem catálogo técnico?", time: "09:02", status: "seen" },
    { id: "m2", who: "me", text: "Bom dia! Envio o PDF com medidas e acabamentos em seguida.", time: "09:04", status: "delivered" },
    { id: "m3", who: "them", text: "Amei o acabamento em inox polido. Enviam catálogo?", time: "09:10", status: "none" },
  ],
  "2": [
    { id: "g1", who: "them", text: "Pedido #427 confirmado. Prazos para janeiro?", time: "08:56" },
    { id: "g2", who: "me", text: "Janeiro/2ª quinzena. Confirmo agenda e retorno ainda hoje.", time: "09:01", status: "delivered" },
  ],
  "3": [
    { id: "d1", who: "them", text: "Consegue vídeo do pendente ORI?", time: "08:40" },
    { id: "d2", who: "me", text: "Claro, envio um link com 2 takes (close e ambiente).", time: "08:42", status: "seen" },
  ],
  "4": [
    { id: "a1", who: "them", text: "Projeto Cobogó: fita âmbar ou 3000K?", time: "Ontem" },
    { id: "a2", who: "me", text: "Se quiser efeito dramático e acolhedor, vá de âmbar.", time: "Ontem", status: "delivered" },
  ],
  "5": [
    { id: "r1", who: "them", text: "Fechei colab 1 Reels. Envio roteiro?", time: "Ontem" },
    { id: "r2", who: "me", text: "Manda sim. Já deixo pauta e horários disponíveis.", time: "Ontem", status: "seen" },
  ],
};

export default function ConversationsPanel() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string>("1");
  const [msg, setMsg] = useState("");
  const [toPhone, setToPhone] = useState<string>("+55 11 99999-0000"); // telefone destino (E.164)
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(MESSAGES);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFile, setShowFile] = useState<"doc"|"img"|false>(false);
  const [fileName, setFileName] = useState<string>("");
  const [pastedImage, setPastedImage] = useState<string | null>(null); // base64 da imagem colada
  const [lightbox, setLightbox] = useState<string | null>(null); // visualização ampliada de imagem
  const messagesBoxRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMode, setMobileMode] = useState<"list"|"chat">("list");
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [templates, setTemplates] = useState<Array<{ name: string; language?: string; status?: string; category?: string }>>([]);

  // Handler para colar imagem (printscreen)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPastedImage(ev.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  };

  const active = useMemo(() => threads.find((t: Thread) => t.id === activeId)!, [threads, activeId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter((t: Thread) => [t.name, t.last, ...(t.tags || [])].join(" ").toLowerCase().includes(q));
  }, [query, threads]);

  const messages = useMemo<Message[]>(() => messagesMap[activeId] || [], [messagesMap, activeId]);

  // Mantém a lista de mensagens rolada para o final ao trocar de conversa ou enviar/receber
  useEffect(() => {
    const el = messagesBoxRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeId, messages.length]);

  // Detecta viewport mobile (iPhone 15 Pro ~393px) e alterna layout
  useEffect(() => {
    const handler = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 430 : false);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Detecta conexão com nossa API (tentando listar templates)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/templates', { cache: 'no-store' });
        setApiConnected(res.ok);
      } catch {
        setApiConnected(false);
      }
    })();
  }, []);

  useEffect(() => {
    setThreads((prev: Thread[]) => prev.map((t: Thread) => (t.id === activeId ? { ...t, unread: 0 } : t)));
  }, [activeId]);

  // Envia mensagem ou imagem colada
  const normalizeE164 = (s: string) => s.replace(/[^\d+]/g, '');

  const send = async () => {
    if (pastedImage) {
      const newMsg: Message & { image?: string } = {
        id: `img_${Date.now()}`,
        who: "me",
        text: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "none",
        image: pastedImage,
      };
      setMessagesMap((prev: Record<string, Message[]>) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), newMsg],
      }));
      setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: "🖼️ Imagem", time: newMsg.time } : t));
      setPastedImage(null);
      setMsg("");
      // Observação: envio real de imagem precisa de URL pública. Use o botão de imagem por link (em breve).
      return;
    }
    const text = msg.trim();
    if (!text) return;
    const newMsg: Message = {
      id: `me_${Date.now()}`,
      who: "me",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "none",
    };
    setMessagesMap((prev: Record<string, Message[]>) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setMsg("");
    setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: text, time: newMsg.time } : t));

    // Disparo real pela API (se disponível)
    try {
      setSending(true);
      setErrorMsg("");
      const to = normalizeE164(toPhone);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', to, text: { body: text } })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Falha ao enviar');
      // Marca como entregue visualmente
      setMessagesMap((prev: Record<string, Message[]>) => ({
        ...prev,
        [activeId]: (prev[activeId] || []).map((m: Message) => m.id === newMsg.id ? { ...m, status: 'delivered' } : m)
      }));
    } catch (e:any) {
      setErrorMsg(e?.message || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  // Simula uma imagem recebida (para testar preview de "them")
  const simulateIncomingImage = () => {
    const sampleUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80&auto=format&fit=crop";
    const newMsg: Message = {
      id: `them_img_${Date.now()}`,
      who: "them",
      text: "",
      image: sampleUrl,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "none",
    };
    setMessagesMap((prev: Record<string, Message[]>) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: "🖼️ Imagem", time: newMsg.time } : t));
  };

  // Handler para emoji picker
  const handleEmoji = (emoji: string) => {
    setMsg((prev: string) => prev + emoji);
    setShowEmoji(false);
  };

  // Handler para arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const isImg = showFile === "img" && file.type.startsWith("image/");
    setShowFile(false);
    if (isImg) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newMsg: Message = {
          id: `img_${Date.now()}`,
          who: "me",
          text: "",
          image: dataUrl,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "none",
        };
        setMessagesMap((prev: Record<string, Message[]>) => ({
          ...prev,
          [activeId]: [...(prev[activeId] || []), newMsg],
        }));
        setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: "🖼️ Imagem", time: newMsg.time } : t));
      };
      reader.readAsDataURL(file);
    } else {
      const newMsg: Message = {
        id: `file_${Date.now()}`,
        who: "me",
        text: `📎 ${file.name}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "none",
      };
      setMessagesMap((prev: Record<string, Message[]>) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), newMsg],
      }));
      setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: newMsg.text, time: newMsg.time } : t));
    }
  };

  // Abrir modal de templates e carregar lista
  const openTemplates = async () => {
    setShowTemplates(true);
    try {
      const res = await fetch('/api/templates', { cache: 'no-store' });
      const data = await res.json();
      const items = (data?.data || data?.templates || data)?.map((t: any) => ({
        name: t.name,
        language: t.language?.code || t.language || 'pt_BR',
        status: t.status,
        category: t.category
      })) || [];
      setTemplates(items);
    } catch {
      setTemplates([]);
    }
  };

  const sendTemplate = async (name: string, language = 'pt_BR') => {
    try {
      setSending(true);
      setErrorMsg("");
      const to = normalizeE164(toPhone);
      const res = await fetch('/api/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, template: name, lang: language, components: [] })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Falha ao enviar template');
      // Feedback visual no chat
      const visual: Message = { id: `tpl_${Date.now()}`, who: 'me', text: `Template enviado: ${name}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'delivered' };
  setMessagesMap((prev: Record<string, Message[]>) => ({ ...prev, [activeId]: [...(prev[activeId]||[]), visual] }));
  setThreads((prev: Thread[]) => prev.map((t: Thread) => t.id === activeId ? { ...t, last: visual.text, time: visual.time } : t));
      setShowTemplates(false);
    } catch (e:any) {
      setErrorMsg(e?.message || 'Erro ao enviar template');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-neutral-900 text-neutral-100">
      <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
        <div className="flex items-center gap-2">
          {/* Desktop header */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="h-7 w-7 rounded-full" style={{ backgroundColor: AMBER }} />
            <div className="text-sm font-semibold">Luminárias WJ</div>
            <span className="ml-2 rounded bg-neutral-800 px-2 py-0.5 text-[10px]">WHATSAPP CLOUD · PROTÓTIPO</span>
          </div>
          {/* Mobile header */}
          <div className="flex items-center gap-2 md:hidden">
            {mobileMode === "chat" ? (
              <>
                <button className="rounded-lg p-1 hover:bg-neutral-800" onClick={() => setMobileMode("list")} aria-label="Voltar">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-semibold">{active.initials}</div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">{active.name}</div>
                    <div className="-mt-0.5 text-[10px] text-neutral-400">online agora</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold">Conversas</div>
            )}
          </div>
        </div>
        <div className="hidden items-center gap-3 text-neutral-400 md:flex">
          <MessageSquare size={18} />
          <Users size={18} />
          <Clock size={18} />
        </div>
      </div>

      <div className="grid h-[calc(100%-56px)] min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
        <aside className={`h-full min-h-0 flex-col border-r border-neutral-800 ${isMobile ? (mobileMode === 'list' ? 'flex' : 'hidden') : 'flex'}`}>
          <div className="flex items-center gap-2 p-3">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Buscar contato ou telefone"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-neutral-500 focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
            {filtered.map((t: Thread) => (
              <button
                key={t.id}
                onClick={() => { setActiveId(t.id); if (isMobile) setMobileMode('chat'); }}
                className={`group mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-neutral-800 ${t.id === activeId ? "bg-neutral-800" : ""}`}
              >
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold">{t.initials}</div>
                  {t.pinned && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-neutral-800 p-1 text-neutral-400">
                      <Pin className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="shrink-0 text-[10px] text-neutral-400">{t.time}</div>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-neutral-400">{t.last}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {t.tags?.map((tag) => (<span key={tag} className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] leading-none text-neutral-300">{tag}</span>))}
                  </div>
                </div>
                {t.unread > 0 && <div className="flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-semibold text-black" style={{ backgroundColor: AMBER }}>{t.unread}</div>}
              </button>
            ))}
          </div>
        </aside>

  <section className={`h-full min-h-0 flex-col ${isMobile ? (mobileMode === 'chat' ? 'flex' : 'hidden') : 'flex'}`}>
          <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold">{active.initials}</div>
              <div>
                <div className="text-sm font-semibold">{active.name}</div>
                <div className="text-[11px] text-neutral-400">online agora</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Templates" onClick={openTemplates}><FileText className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Chamada de voz"><Phone className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Vídeo"><Video className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Mais"><EllipsisVertical className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Testar imagem recebida" onClick={simulateIncomingImage}><ImageIcon className="h-4 w-4" /></button>
            </div>
          </div>

          <div ref={messagesBoxRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
            {messages.map((m: Message) => (
              <div key={m.id} className={`flex ${m.who === "me" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[70%]">
                  {/* Se a mensagem tem imagem colada, exibe a imagem */}
                  {typeof m.image === 'string' && m.image ? (
                    <img src={m.image} alt="imagem enviada" onClick={() => setLightbox(m.image!)} className="rounded-2xl max-w-xs max-h-40 mb-2 border border-neutral-700 cursor-zoom-in" />
                  ) : null}
                  {m.text.trim() !== "" && (
                    <div className={`rounded-2xl px-4 py-3 text-sm ${m.who === "me" ? "text-black" : "text-neutral-200"}`} style={{ backgroundColor: m.who === "me" ? AMBER : "#1f1f1f" }}>{m.text}</div>
                  )}
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.who === "me" ? "justify-end text-neutral-400" : "text-neutral-500"}`}>
                    <span>{m.time}</span>
                    {m.who === "me" && (m.status === "seen" ? <CheckCheck className="h-3 w-3" /> : m.status === "delivered" ? <Check className="h-3 w-3" /> : null)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-800 p-3">
            {/* Linha de configuração rápida: telefone destino e status de envio */}
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Telefone destino (E.164):</span>
                <input value={toPhone} onChange={(e)=>setToPhone(e.target.value)} className="w-48 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm outline-none focus:border-neutral-700" placeholder="+5511999999999" />
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className={`inline-block h-2 w-2 rounded-full ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {apiConnected ? 'API conectada' : 'API indisponível'} {sending ? '· enviando…' : ''}
                {errorMsg && <span className="ml-2 rounded bg-red-900/40 px-2 py-0.5 text-red-300">{errorMsg}</span>}
              </div>
            </div>
            {/* Preview da imagem colada */}
            {pastedImage && (
              <div className="mb-2 flex flex-col items-start gap-2">
                <div className="text-xs text-neutral-400">Imagem colada:</div>
                <img src={pastedImage} alt="imagem colada" className="max-w-xs max-h-40 rounded-lg border border-neutral-700" />
                <button className="rounded bg-neutral-800 px-3 py-1 text-sm" onClick={() => setPastedImage(null)}>Cancelar</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex gap-1">
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Anexar" onClick={() => setShowFile("doc")}> <Paperclip className="h-5 w-5" /></button>
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Imagem" onClick={() => setShowFile("img")}> <ImageIcon className="h-5 w-5" /></button>
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Emoji" onClick={() => setShowEmoji(true)}> <Smile className="h-5 w-5" /></button>
              </div>
              <textarea
                rows={1}
                value={msg}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMsg(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                onPaste={handlePaste}
                placeholder="Escreva uma mensagem ou cole uma imagem"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-neutral-700"
              />
              <button
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black shadow-sm hover:opacity-90"
                style={{ backgroundColor: AMBER }}
                onClick={send}
                disabled={!msg.trim() && !pastedImage}
              >
                <Send className="h-4 w-4" /> Enviar
              </button>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">Dica: <b>Shift + Enter</b> quebra linha</div>
            {/* Emoji Picker Modal */}
            {showEmoji && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowEmoji(false)} />
                <div className="relative rounded-xl bg-neutral-900 p-4 border border-neutral-700 shadow-xl">
                  <div className="mb-2 text-sm font-semibold">Escolha um emoji</div>
                  <div className="grid grid-cols-8 gap-2 text-2xl">
                    {['😀','😁','😂','🤣','😍','😎','😇','🥳','😜','🤩','😢','😡','👍','🙏','👏','💡','🎉','🔥','❤️','💎','🌟','🍀','🍕','⚡'].map(e => (
                      <button key={e} className="hover:bg-neutral-800 rounded p-1" onClick={() => handleEmoji(e)}>{e}</button>
                    ))}
                  </div>
                  <button className="mt-4 rounded bg-neutral-800 px-3 py-1 text-sm" onClick={() => setShowEmoji(false)}>Fechar</button>
                </div>
              </div>
            )}
            {/* File Picker Modal */}
            {showFile && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowFile(false)} />
                <div className="relative rounded-xl bg-neutral-900 p-4 border border-neutral-700 shadow-xl">
                  <div className="mb-2 text-sm font-semibold">{showFile === "img" ? "Enviar imagem" : "Enviar documento"}</div>
                  <input type="file" accept={showFile === "img" ? "image/*" : undefined} onChange={handleFileChange} className="mb-3" />
                  <button className="rounded bg-neutral-800 px-3 py-1 text-sm" onClick={() => setShowFile(false)}>Fechar</button>
                </div>
              </div>
            )}
            {/* Modal de Templates */}
            {showTemplates && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60" onClick={() => setShowTemplates(false)} />
                <div className="relative max-h-[80vh] w-[520px] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
                    <div className="text-sm font-semibold">Enviar template</div>
                    <button className="rounded p-1 hover:bg-neutral-800" onClick={()=>setShowTemplates(false)}>Fechar</button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-3 text-sm">
                    {templates.length === 0 && <div className="text-neutral-400">Nenhum template encontrado.</div>}
                    <ul className="space-y-2">
                      {templates.map((t)=> (
                        <li key={`${t.name}:${t.language}`} className="flex items-center justify-between rounded-lg border border-neutral-800 px-3 py-2">
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-neutral-400">{t.language || 'pt_BR'} · {t.status || '—'} · {t.category || '—'}</div>
                          </div>
                          <button className="rounded bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700" onClick={()=>sendTemplate(t.name, t.language || 'pt_BR')}>Enviar</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* Lightbox para visualizar imagem em tamanho maior */}
            {lightbox && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setLightbox(null)}>
                <div className="absolute inset-0 bg-black/80" />
                <img src={lightbox} alt="visualização da imagem" className="relative max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
              </div>
            )}
            {/* Feedback do arquivo enviado */}
            {fileName && (
              <div className="mt-2 text-xs text-neutral-400">Arquivo enviado: <b>{fileName}</b></div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-900 bg-neutral-950 px-4 py-2 text-[11px] text-neutral-500">
            <div>UI conectada à API · WhatsApp Cloud</div>
            <div><span className="mr-2">Admin WJ</span><span className="rounded bg-neutral-900 px-2 py-0.5">Luminárias WJ · +55 11 99999-0000</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
