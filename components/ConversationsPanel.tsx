import React, { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";

// === Helpers ===
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

// === Mock Data ===
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
  {
    id: "1",
    name: "Estúdio Baviera",
    initials: "EB",
    last: "Amei o acabamento em inox polido. Enviam catálogo?",
    time: "09:10",
    pinned: true,
    tags: ["showroom"],
    unread: 2,
  },
  {
    id: "2",
    name: "Galeria São Paulo",
    initials: "GSP",
    last: "Pedido #427 confirmado. Prazos para janeiro?",
    time: "08:56",
    tags: ["galeria", "cliente"],
    unread: 0,
  },
  {
    id: "3",
    name: "Delumini Showroom",
    initials: "DL",
    last: "Consegue vídeo do pendente ORI?",
    time: "08:40",
    tags: [],
    unread: 1,
  },
  {
    id: "4",
    name: "Mariana — Arq.",
    initials: "MA",
    last: "Projeto Cobogó: fita âmbar ou 3000K?",
    time: "Ontem",
    tags: [],
    unread: 0,
  },
  {
    id: "5",
    name: "Rodrigo de Borba",
    initials: "RB",
    last: "Fechei colab 1 Reels. Envio roteiro?",
    time: "Ontem",
    pinned: true,
    tags: [],
    unread: 0,
  },
];

export type Message = {
  id: string;
  who: "me" | "them";
  text: string;
  time: string;
  status?: "none" | "delivered" | "seen";
};

const MESSAGES: Record<string, Message[]> = {
  // 1 — Estúdio Baviera
  "1": [
    {
      id: "m1",
      who: "them",
      text: "Olá! Vimos o pendente ENIGMA no Instagram. Tem catálogo técnico?",
      time: "09:02",
      status: "seen",
    },
    {
      id: "m2",
      who: "me",
      text: "Bom dia! Envio o PDF com medidas e acabamentos em seguida.",
      time: "09:04",
      status: "delivered",
    },
    {
      id: "m3",
      who: "them",
      text: "Amei o acabamento em inox polido. Enviam catálogo?",
      time: "09:10",
      status: "none",
    },
  ],
  // 2 — Galeria São Paulo
  "2": [
    { id: "g1", who: "them", text: "Pedido #427 confirmado. Prazos para janeiro?", time: "08:56" },
    { id: "g2", who: "me", text: "Janeiro/2ª quinzena. Confirmo agenda e retorno ainda hoje.", time: "09:01", status: "delivered" },
  ],
  // 3 — Delumini Showroom
  "3": [
    { id: "d1", who: "them", text: "Consegue vídeo do pendente ORI?", time: "08:40" },
    { id: "d2", who: "me", text: "Claro, envio um link com 2 takes (close e ambiente).", time: "08:42", status: "seen" },
  ],
  // 4 — Mariana — Arq.
  "4": [
    { id: "a1", who: "them", text: "Projeto Cobogó: fita âmbar ou 3000K?", time: "Ontem" },
    { id: "a2", who: "me", text: "Se quiser efeito dramático e acolhedor, vá de âmbar.", time: "Ontem", status: "delivered" },
  ],
  // 5 — Rodrigo de Borba
  "5": [
    { id: "r1", who: "them", text: "Fechei colab 1 Reels. Envio roteiro?", time: "Ontem" },
    { id: "r2", who: "me", text: "Manda sim. Já deixo pauta e horários disponíveis.", time: "Ontem", status: "seen" },
  ],
};

// === UI ===
export default function ConversationsPanel() {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeId, setActiveId] = useState<string>("1");

  const active = useMemo(() => threads.find((t) => t.id === activeId)!, [threads, activeId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter((t) =>
      [t.name, t.last, ...(t.tags || [])].join(" ").toLowerCase().includes(q)
    );
  }, [query, threads]);

  const messages = useMemo<Message[]>(() => MESSAGES[activeId] || [], [activeId]);

  // Zera contagem de não lidas ao abrir a thread
  useEffect(() => {
    setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, unread: 0 } : t)));
  }, [activeId]);

  return (
    <div className="h-screen w-full overflow-hidden bg-neutral-900 text-neutral-100">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full" style={{ backgroundColor: AMBER }} />
          <div className="text-sm font-semibold">Luminárias WJ</div>
          <span className="ml-2 rounded bg-neutral-800 px-2 py-0.5 text-[10px]">WHATSAPP CLOUD · PROTÓTIPO</span>
        </div>
        <div className="flex items-center gap-3 text-neutral-400">
          <MessageSquare size={18} />
          <Users size={18} />
          <Clock size={18} />
        </div>
      </div>

      <div className="grid h-[calc(100vh-56px)] grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="flex h-full flex-col border-r border-neutral-800">
          <div className="flex items-center gap-2 p-3">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar contato ou telefone"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-neutral-500 focus:border-neutral-700"
              />
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`group mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-neutral-800 ${
                  t.id === activeId ? "bg-neutral-800" : ""
                }`}
              >
                <div className="relative">
                  <Avatar label={t.initials} />
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
                    {t.tags?.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
                {t.unread > 0 && <UnreadDot count={t.unread} />}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="flex h-full flex-col">
          {/* Chat header */}
          <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
            <div className="flex items-center gap-3">
              <Avatar label={active.initials} />
              <div>
                <div className="text-sm font-semibold">{active.name}</div>
                <div className="text-[11px] text-neutral-400">online agora</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Templates">
                <FileText className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Chamada de voz">
                <Phone className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Vídeo">
                <Video className="h-4 w-4" />
              </button>
              <button className="rounded-lg p-2 hover:bg-neutral-800" title="Mais">
                <EllipsisVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.who === "me" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      m.who === "me" ? "text-black" : "text-neutral-200"
                    }`}
                    style={{
                      backgroundColor: m.who === "me" ? AMBER : "#1f1f1f",
                    }}
                  >
                    {m.text}
                  </div>
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.who === "me" ? "justify-end text-neutral-400" : "text-neutral-500"}`}>
                    <span>{m.time}</span>
                    {m.who === "me" && (
                      m.status === "seen" ? (
                        <CheckCheck className="h-3 w-3" />
                      ) : m.status === "delivered" ? (
                        <Check className="h-3 w-3" />
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-neutral-800 p-3">
            <div className="flex items-end gap-2">
              <div className="flex gap-1">
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Anexar">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Imagem">
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button className="rounded-lg p-2 text-neutral-300 hover:bg-neutral-800" title="Emoji">
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <textarea
                rows={1}
                placeholder="Escreva uma mensagem"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-neutral-700"
              />
              <button
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black shadow-sm hover:opacity-90"
                style={{ backgroundColor: AMBER }}
              >
                <Send className="h-4 w-4" /> Enviar
              </button>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">Dica: <b>Shift + Enter</b> quebra linha</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-900 bg-neutral-950 px-4 py-2 text-[11px] text-neutral-500">
            <div>Protótipo UI · sem conexão API</div>
            <div>
              <span className="mr-2">Admin WJ</span>
              <span className="rounded bg-neutral-900 px-2 py-0.5">Luminárias WJ · +55 11 99999-0000</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
