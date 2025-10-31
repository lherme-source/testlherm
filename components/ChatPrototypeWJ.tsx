"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Filter as FilterIcon,
  MessagesSquare,
  Send,
  Settings,
  Shield,
  X,
  LogOut,
  Building2,
  Smartphone,
  Plus,
  Bold,
  Italic,
  Quote,
  List,
  Hash,
  Upload,
  Search,
  Trash2,
  Sparkles,
  Users,
  Link as Link2,
} from "lucide-react";
import ConversationsPanel from "./ConversationsPanel";

/* ============================================================
   TEMA E FONTES
============================================================ */
const theme = {
  bg: "#0b0b0b",
  panel: "#121212",
  panel2: "#161616",
  border: "#2a2a2a",
  text: "#f5f5f5",
  textMuted: "#9b9b9b",
  accent: "#D6A65C",
  success: "#34d399",
  danger: "#ef4444",
  warn: "#D6A65C",
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
      .btn-ghost:hover { background: #D6A65C1a; }
      input:focus, textarea:focus, select:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px rgba(214, 166, 92, 0.15);
      }
      .dot-accent { background: var(--accent); }
    `}</style>
  );
}

function WJBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-7 w-7 place-items-center rounded-full" style={{ background: theme.accent, color: "#111" }}>WJ</div>
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
  phone: string;
  email?: string;
  tags?: string[];
};

type CampaignStatus = "Agendada" | "Em andamento" | "Concluída";

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
  { id: "c1", name: "Maria Silva", phone: "+5511999990000", email: "maria@exemplo.com", tags: ["loja", "vip"] },
  { id: "c2", name: "João Souza", phone: "+55219988887777", email: "joao@exemplo.com", tags: ["revenda"] },
  { id: "c3", name: "Estúdio Luz", phone: "+5511987654321", tags: ["estudio"] },
];

const MOCK_ACCOUNTS: MetaAccount[] = [
  {
    id: "acc_1",
    name: "Luminárias WJ",
    wabaId: "WABA_123",
    phones: [
      { id: "ph_11", display: "+55 11 99999-0000", status: "Connected" },
      { id: "ph_12", display: "+55 11 88888-7777", status: "Connected" },
    ],
  },
  {
    id: "acc_2",
    name: "Estúdio Luz Studio",
    wabaId: "WABA_987",
    phones: [{ id: "ph_21", display: "+55 21 99999-1111", status: "Connected" }],
  },
];

/* ============================================================
   HELPERS
============================================================ */
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeBRPhoneToE164(raw: string) {
  const digits = raw.replace(/\D+/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

function parseCsvContacts(csv: string): Contact[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const out: Contact[] = [];
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i].split(",").map((x) => x.trim());
    if (row.length < 3) continue;
    const [name, email, phone, tagsRaw] = row;
    const tags = (tagsRaw || "").split(/[;,]/).map((t) => t.trim()).filter(Boolean);
    out.push({
      id: uid("ct"),
      name: name || "Sem nome",
      email: email || undefined,
      phone: normalizeBRPhoneToE164(phone),
      tags: tags.length ? Array.from(new Set(tags)) : undefined,
    });
  }
  return out;
}

function uniqueTags(contacts: Contact[]) {
  return Array.from(new Set(contacts.flatMap((c) => c.tags || []))).sort((a, b) => a.localeCompare(b));
}

function filterContacts(contacts: Contact[], query: string, includeTags: string[]) {
  const q = query.trim().toLowerCase();
  return contacts.filter((c) => {
    const okQ = !q || [c.name, c.email, c.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    const okT = !includeTags.length || includeTags.some((t) => (c.tags || []).includes(t));
    return okQ && okT;
  });
}

function safeRate(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function appendSnippet(prev: string, snippet: string) {
  return (prev ? prev + (prev.endsWith("\n") ? "" : "\n") : "") + snippet;
}

/* ============================================================
   PÁGINA: TEMPLATES
============================================================ */
function TemplatesPage() {
  const [name, setName] = useState("boas_vindas_wj");
  const [lang, setLang] = useState("pt_BR");
  const [category, setCategory] = useState<"UTILITY" | "MARKETING" | "AUTHENTICATION">("UTILITY");
  const [header, setHeader] = useState<string>("");
  const [body, setBody] = useState<string>(
    "Olá {{1}}, obrigado pelo interesse nas Luminárias WJ. Podemos ajudar com medidas, prazos e acabamentos. Digite seu assunto ou responda 1-Catálogo 2-Prazos 3-Atendimento."
  );
  const [footer, setFooter] = useState<string>("WJ · Feito à mão no Brasil");
  const [loadingList, setLoadingList] = useState(false);
  const [tplList, setTplList] = useState<Array<{ name: string; language?: string; category?: string; status?: string }>>([]);

  const wrapSel = (setter: (v: string) => void, value: string, left: string, right: string) => setter(left + value + right);

  const validate = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Nome interno obrigatório");
    if (!/^[a-z0-9_\-]+$/i.test(name)) errors.push("Nome interno: use letras, números, hífen ou underline");
    if (!body.includes("{{1}}")) errors.push("Inclua pelo menos {{1}} no corpo para personalização");
    if (!("UTILITY|MARKETING|AUTHENTICATION" as any).includes?.(category)) {
      // fallback para evitar warning de TS no includes acima
    }
    return errors;
  };

  const errors = validate();

  const loadMetaTemplates = async () => {
    try {
      setLoadingList(true);
      const res = await fetch('/api/templates', { cache: 'no-store' });
      const data = await res.json();
      const items = (data?.data || data?.templates || data)?.map((t: any) => ({
        name: t.name,
        language: t.language?.code || t.language || 'pt_BR',
        status: t.status,
        category: t.category
      })) || [];
      setTplList(items);
    } finally {
      setLoadingList(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <div className="text-sm font-medium">Templates</div>
          </div>
          <button onClick={loadMetaTemplates} className="btn-ghost rounded-md px-3 py-1.5 text-xs">{loadingList ? 'Carregando…' : 'Carregar da Meta'}</button>
        </div>
      </div>

      <div className="scroll-slim grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs opacity-70">Nome interno</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Idioma</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="pt_BR">pt_BR</option>
                <option value="en_US">en_US</option>
                <option value="es_ES">es_ES</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs opacity-70">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="UTILITY">UTILITY</option>
                <option value="MARKETING">MARKETING</option>
                <option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-[11px] opacity-60">{"Use variáveis {{1}}, {{2}} ..."}</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Header (opcional)</label>
            <input value={header} onChange={(e) => setHeader(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="Ex.: WJ — Boas-vindas" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs opacity-70">Body</label>
              <div className="flex items-center gap-1">
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => wrapSel(setBody, body, "*", "*")}>
                  <Bold size={14} />
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => wrapSel(setBody, body, "_", "_")}>
                  <Italic size={14} />
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => setBody((p) => appendSnippet(p, "> citação"))}>
                  <Quote size={14} />
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => setBody((p) => appendSnippet(p, "• item"))}>
                  <List size={14} />
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => setBody((p) => appendSnippet(p, "{{1}}"))}>
                  <Hash size={14} />
                </button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={() => setBody((p) => p + " https://wj.link ")}>
                  <Link2 size={14} />
                </button>
              </div>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
          </div>

          <div>
            <label className="mb-1 block text-xs opacity-70">Footer (opcional)</label>
            <input value={footer} onChange={(e) => setFooter(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: errors.length ? theme.danger : theme.textMuted }}>
              {errors.length ? `Erros: ${errors.join(" | ")}` : "Pronto para enviar (simulado)"}
            </div>
            <button disabled={!!errors.length} className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: theme.accent, color: "#111" }}>
              Enviar para aprovação (simulado)
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="border-b pb-2 text-xs uppercase tracking-wider" style={{ borderColor: theme.border, color: theme.textMuted }}>
            Pré-visualização
          </div>
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
   CONTATOS (IMPORT/GERENCIAR)
============================================================ */
function ContactsPage({
  contacts,
  onAddMany,
  onDeleteMany,
  onBulkTagAdd,
  onBulkTagRemove,
}: {
  contacts: Contact[];
  onAddMany: (c: Contact[]) => void;
  onDeleteMany: (ids: string[]) => void;
  onBulkTagAdd: (tag: string, ids: string[]) => void;
  onBulkTagRemove: (tag: string, ids: string[]) => void;
}) {
  const [csvPreview, setCsvPreview] = useState<string>(`name,e-mail,phone,tags\nMaria,maria@exemplo.com,11999990000,vip;loja\nJoão,joao@exemplo.com,5511988887777,revenda`);
  const [parsed, setParsed] = useState<Contact[]>([]);
  useEffect(() => {
    setParsed(parseCsvContacts(csvPreview));
  }, []);

  const allTags = useMemo(() => uniqueTags(contacts), [contacts]);

  const [query, setQuery] = useState("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [onlyTag, setOnlyTag] = useState("");
  const [excludeTags, setExcludeTags] = useState<string[]>([]);

  const base = useMemo(() => filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(
    () =>
      base.filter((c) => {
        const tags = c.tags || [];
        if (onlyTag && !tags.includes(onlyTag)) return false;
        if (excludeTags.length && tags.some((t) => excludeTags.includes(t))) return false;
        return true;
      }),
    [base, onlyTag, excludeTags]
  );

  const totalCount = contacts.length;
  const [countTag, setCountTag] = useState("");
  const countByTag = useMemo(() => (countTag ? contacts.filter((c) => (c.tags || []).includes(countTag)).length : 0), [contacts, countTag]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((c) => c.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((c) => c.id)])));
    }
  };

  const [bulkTag, setBulkTag] = useState("");
  const canBulk = selectedIds.length > 0 && bulkTag.trim().length > 0;

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setParsed(parseCsvContacts(String(reader.result || "")));
    reader.readAsText(file);
  };

  const doDelete = () => {
    if (selectedIds.length) {
      onDeleteMany(selectedIds);
      setSelectedIds([]);
    }
  };
  const doAddTag = () => {
    if (canBulk) {
      onBulkTagAdd(bulkTag.trim(), selectedIds);
      setBulkTag("");
    }
  };
  const doRemoveTag = () => {
    if (canBulk) {
      onBulkTagRemove(bulkTag.trim(), selectedIds);
      setBulkTag("");
    }
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <div className="text-sm font-medium">Importar contatos (CSV)</div>
            </div>
            <label className="btn-ghost cursor-pointer rounded-md px-3 py-1.5 text-xs">
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              <div className="flex items-center gap-1">
                <Upload size={14} /> Selecionar CSV
              </div>
            </label>
          </div>
          <div className="space-y-2 p-3 text-sm">
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Formato esperado: <code>name, e-mail, phone, tags</code> (tags separadas por "," ou ";"). Telefones convertidos para E.164 (BR) automaticamente.
            </div>
            <textarea value={csvPreview} onChange={(e) => setCsvPreview(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: theme.textMuted }}>{`Pré-visualização: ${parsed.length} contato(s)`}</div>
              <button onClick={() => setParsed(parseCsvContacts(csvPreview))} className="rounded-md px-3 py-1.5 text-xs" style={{ background: theme.accent, color: "#111" }}>
                Atualizar preview
              </button>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t p-3" style={{ borderColor: theme.border }}>
            <button onClick={() => onAddMany(parsed)} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: "#111" }}>
              Adicionar à lista
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="text-sm font-medium">Base de contatos</div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Total: <strong>{totalCount}</strong>
            </div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Contar contatos com a tag</label>
              <select value={countTag} onChange={(e) => setCountTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(selecione)</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs" style={{ color: theme.textMuted }}>
                Com "{countTag || "—"}": <strong>{countTag ? countByTag : 0}</strong>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Buscar</label>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: theme.border, background: theme.panel2 }}>
                <Search size={14} className="opacity-70" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? (
                  allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTagsFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                      style={{ borderColor: theme.border }}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>
                )}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={(e) => setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? (
                  allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setExcludeTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                      style={{ borderColor: theme.border }}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Selecionados: {selectedIds.length} · Visíveis: {filtered.length}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} placeholder="tag para editar" className="rounded-md border bg-transparent px-2 py-1 text-xs outline-none" style={{ borderColor: theme.border }} />
              <button disabled={!canBulk} onClick={doAddTag} className="btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60">
                Adicionar tag
              </button>
              <button disabled={!canBulk} onClick={doRemoveTag} className="btn-ghost rounded-md px-3 py-1.5 text-xs disabled:opacity-60">
                Remover tag
              </button>
              <button disabled={!selectedIds.length} onClick={doDelete} className="rounded-md px-3 py-1.5 text-xs disabled:opacity-60" style={{ background: "#2a0000", border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-1">
                  <Trash2 size={14} /> Deletar selecionados
                </div>
              </button>
              <button onClick={toggleAllVisible} className="btn-ghost rounded-md px-3 py-1.5 text-xs">
                {allVisibleSelected ? "Desmarcar visíveis" : "Selecionar visíveis"}
              </button>
              <button onClick={() => setSelectedIds([])} className="btn-ghost rounded-md px-3 py-1.5 text-xs">
                Limpar seleção
              </button>
            </div>
          </div>

          <div className="scroll-slim max-h-[420px] divide-y overflow-auto" style={{ borderColor: theme.border }}>
            {filtered.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <input type="checkbox" className="h-4 w-4" checked={selectedIds.includes(c.id)} onChange={() => toggleOne(c.id)} />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-xs opacity-70">
                      {c.phone} {c.email ? ` · ${c.email}` : ""}
                    </div>
                    {c.tags && c.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}` }}>
                            {t}
                          </span>
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
          Dica: Use os filtros para selecionar o conjunto certo antes de aplicar ações em massa. “Adicionar tag” cria a tag se não existir nos contatos selecionados.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL DE CONFIRMAÇÃO (ÚNICO)
============================================================ */
function ConfirmModal({
  open,
  onClose,
  onConfirm,
  summary,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summary: { count: number; scheduleLabel: string; tplName: string; header?: string; body: string; footer?: string; accountName?: string; phoneDisplay?: string; campaignName?: string };
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-xl border bg-[#121212] p-4" style={{ borderColor: theme.border }}>
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
          <div className="text-sm font-medium">Revisar envio</div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-white/5" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 py-3 text-sm">
          <div className="grid gap-1 text-xs" style={{ color: theme.textMuted }}>
            <div>
              Campanha: <strong>{summary.campaignName || "—"}</strong>
            </div>
            <div>
              Template: <strong>{summary.tplName || "—"}</strong>
            </div>
            <div>
              Conta: <strong>{summary.accountName || "—"}</strong>
            </div>
            <div>
              Número: <strong>{summary.phoneDisplay || "—"}</strong>
            </div>
            <div>
              Contatos selecionados: <strong>{summary.count}</strong>
            </div>
            <div>{summary.scheduleLabel}</div>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
            {summary.header && <div className="mb-1 opacity-80">{summary.header}</div>}
            <div className="whitespace-pre-wrap leading-relaxed">{summary.body}</div>
            {summary.footer && <div className="mt-1 text-xs opacity-60">{summary.footer}</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t pt-2" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="btn-ghost rounded-md px-3 py-1.5 text-sm">
            Cancelar
          </button>
          <button onClick={onConfirm} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: "#111" }}>
            Confirmar envio (simulado)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PÁGINA: ACCOUNTS (WABA + NÚMERO)
============================================================ */
function AccountsPage({
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  selectedPhoneId,
  setSelectedPhoneId,
  isLive,
}: {
  accounts: MetaAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (v: string) => void;
  selectedPhoneId: string;
  setSelectedPhoneId: (v: string) => void;
  isLive: boolean;
}) {
  const account = accounts.find((a) => a.id === selectedAccountId);
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center gap-2">
          <Settings size={16} />
          <div className="text-sm font-medium">Contas Meta (WABA) e Números</div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>
            {isLive ? 'Conta conectada (live)' : 'Contas disponíveis (simulado)'}
          </div>
          <div className="space-y-2">
            <select value={selectedAccountId} onChange={(e) => { setSelectedAccountId(e.target.value); setSelectedPhoneId(""); }} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — {acc.wabaId}
                </option>
              ))}
            </select>
            {!isLive && (
              <p className="text[11px] opacity-60">
                No real: listar via Graph API <code>/&#123;WABA_ID&#125;/phone_numbers</code> com permissões adequadas.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="mb-1 text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>
            Números da conta
          </div>
          <div className="space-y-2">
            <select value={selectedPhoneId} onChange={(e) => setSelectedPhoneId(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              <option value="">(selecione)</option>
              {account?.phones.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.display} — {ph.status || "—"}
                </option>
              ))}
            </select>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Telefone selecionado: <strong>{selectedPhoneId || "—"}</strong>
            </div>
            <div className="rounded-md border p-2 text-xs" style={{ borderColor: theme.border, color: theme.textMuted }}>
              <div className="mb-1 font-medium" style={{ color: theme.text }}>
                Como será em produção
              </div>
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

/* ============================================================
   PÁGINA: BROADCAST (DISPARO)
============================================================ */
function BroadcastPage({
  contacts,
  selectedAccount,
  selectedPhone,
  onCreateCampaign,
}: {
  contacts: Contact[];
  selectedAccount?: MetaAccount;
  selectedPhone?: MetaPhone;
  onCreateCampaign: (c: { name: string; templateName: string; total: number; scheduleAt?: string }) => void;
}) {
  const [approvedTemplates, setApprovedTemplates] = useState<any[]>([
    { id: "tpl_boasvindas", name: "boas_vindas_wj", header: "Luminárias WJ", body: "Olá {{1}}, obrigado por falar com a WJ. Posso enviar o catálogo atualizado?", footer: "Feito à mão no Brasil" },
    { id: "tpl_aviso2026", name: "aviso_pedidos_2026", header: "Agenda 2026", body: "Olá {{1}}, os pedidos para 2026 já estão abertos. Quer garantir prioridade na produção?", footer: "Equipe WJ" },
  ]);

  // Load approved templates from Meta on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/templates', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const tpls = (data.templates || []).filter((t: any) => t.status === 'APPROVED');
        if (tpls.length) {
          const mapped = tpls.map((t: any, idx: number) => ({
            id: `tpl_${t.name}_${idx}`,
            name: t.name,
            header: t.components?.find((c: any) => c.type === 'HEADER')?.text || '',
            body: t.components?.find((c: any) => c.type === 'BODY')?.text || '',
            footer: t.components?.find((c: any) => c.type === 'FOOTER')?.text || ''
          }));
          setApprovedTemplates(mapped);
        }
      } catch {}
    })();
  }, []);

  const [selectedTplId, setSelectedTplId] = useState<string>("");
  const selectedTpl = approvedTemplates.find((t) => t.id === selectedTplId);

  const tplHeader = selectedTpl?.header || "";
  const tplBody = selectedTpl?.body || "";
  const tplFooter = selectedTpl?.footer || "";

  const [campaignName, setCampaignName] = useState<string>("Campanha WJ");

  const allTags = useMemo(() => uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [onlyTag, setOnlyTag] = useState("");
  const [excludeTags, setExcludeTags] = useState<string[]>([]);

  const base = useMemo(() => filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);
  const filtered = useMemo(
    () =>
      base.filter((c) => {
        const tags = c.tags || [];
        if (onlyTag && !tags.includes(onlyTag)) return false;
        if (excludeTags.length && tags.some((t) => excludeTags.includes(t))) return false;
        return true;
      }),
    [base, onlyTag, excludeTags]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selectedIds.includes(c.id));
  const toggleOne = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((c) => c.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filtered.map((c) => c.id)])));
    }
  };

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [when, setWhen] = useState("");
  const tz = "America/Sao_Paulo";
  const scheduleLabel = useMemo(() => {
    if (!scheduleEnabled || !when) return "Envio imediato";
    try {
      const d = new Date(when);
      const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, dateStyle: "medium", timeStyle: "short" });
      return `Agendado para ${fmt.format(d)} (${tz})`;
    } catch {
      return "Agendado (data inválida)";
    }
  }, [scheduleEnabled, when]);

  const countSelected = selectedIds.length;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const canSend = Boolean(selectedTplId) && countSelected > 0 && Boolean(selectedPhone?.id) && Boolean(campaignName.trim());
  const openConfirm = () => {
    if (canSend) setConfirmOpen(true);
  };
  const onConfirmSend = () => {
    setConfirmOpen(false);
    onCreateCampaign({
      name: campaignName.trim(),
      templateName: selectedTpl?.name || "",
      total: countSelected,
      scheduleAt: scheduleEnabled && when ? new Date(when).toISOString() : undefined,
    });
  };

  const accountName = selectedAccount?.name || "";
  const phoneDisplay = selectedPhone?.display || "";

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2">
              <FilterIcon size={16} />
              <div className="text-sm font-medium">Filtro de contatos</div>
            </div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Visíveis: {filtered.length}
            </div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Buscar</label>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5" style={{ borderColor: theme.border, background: theme.panel2 }}>
                <Search size={14} className="opacity-70" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nome, telefone ou e-mail" className="w-full bg-transparent text-sm outline-none placeholder:opacity-50" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Incluir por tags (OR)</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? (
                  allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTagsFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-md border px-2 py-1 text-xs ${tagsFilter.includes(t) ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                      style={{ borderColor: theme.border }}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>
                )}
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs opacity-70">Apenas com a tag</label>
              <select value={onlyTag} onChange={(e) => setOnlyTag(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none" style={{ borderColor: theme.border }}>
                <option value="">(qualquer)</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs opacity-70">Excluir tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.length ? (
                  allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setExcludeTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-md border px-2 py-1 text-xs ${excludeTags.includes(t) ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                      style={{ borderColor: theme.border }}
                    >
                      {t}
                    </button>
                  ))
                ) : (
                  <div className="text-xs opacity-60">Nenhuma tag cadastrada</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Selecionados: {selectedIds.length}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAllVisible} className="btn-ghost rounded-md px-3 py-1.5 text-xs">
                {allVisibleSelected ? "Desmarcar visíveis" : "Selecionar visíveis"}
              </button>
              <button onClick={() => setSelectedIds([])} className="btn-ghost rounded-md px-3 py-1.5 text-xs">
                Limpar seleção
              </button>
            </div>
          </div>

          <div className="scroll-slim max-h-[380px] divide-y overflow-auto" style={{ borderColor: theme.border }}>
            {filtered.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleOne(c.id)} className="h-4 w-4" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{c.name}</div>
                    <div className="truncate text-xs opacity-70">
                      {c.phone} {c.email ? ` · ${c.email}` : ""}
                    </div>
                    {c.tags && c.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span key={t} className="rounded-md px-1.5 py-[2px] text-[10px]" style={{ background: "#ffffff0f", border: `1px solid ${theme.border}` }}>
                            {t}
                          </span>
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
          Dica: Use um número configurado na página <b>Contas</b>. No real, a API usará o <b>PHONE_NUMBER_ID</b> selecionado.
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <div className="text-sm font-medium">Selecionar template aprovado</div>
            </div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              {selectedTpl ? selectedTpl.name : "nenhum selecionado"}
            </div>
          </div>
          <div className="space-y-3 p-3 text-sm">
            <label className="mb-1 block text-xs opacity-70">Template</label>
            <select value={selectedTplId} onChange={(e) => setSelectedTplId(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }}>
              <option value="">(selecione um template aprovado)</option>
              {approvedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
              <div className="border-b pb-2 text-xs uppercase tracking-wider" style={{ borderColor: theme.border, color: theme.textMuted }}>
                Pré-visualização
              </div>
              <div className="mt-2 space-y-2">
                {tplHeader && <div className="opacity-80">{tplHeader}</div>}
                <div className="whitespace-pre-wrap">{tplBody || "—"}</div>
                {tplFooter && <div className="text-xs opacity-60">{tplFooter}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <div className="text-sm font-medium">Configurações do disparo</div>
            </div>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              {selectedAccount ? `${selectedAccount.name}` : "Conta —"} {selectedPhone ? ` · ${selectedPhone.display}` : ""}
            </div>
          </div>

          <div className="space-y-3 p-3 text-sm">
            {!selectedAccount && <div className="text-xs" style={{ color: theme.warn }}>Selecione uma conta e número na aba "Contas".</div>}

            <div>
              <label className="mb-1 block text-xs opacity-70">Nome da campanha/disparo</label>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ex.: Abertura Agenda 2026 (lojas VIP)" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                <Clock size={14} /> Agendamento
              </div>
              <label className="mb-2 flex items-center gap-2 text-xs opacity-80">
                <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} />
                Agendar envio (Horário de Brasília — America/Sao_Paulo)
              </label>
              {scheduleEnabled && <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-md border bg-transparent px-2 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />}
              <div className="mt-1 text-xs" style={{ color: theme.textMuted }}>
                {scheduleLabel}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: theme.border }}>
            <div className="text-xs" style={{ color: theme.textMuted }}>
              Selecionados: <strong>{countSelected}</strong>
            </div>
            <button disabled={!canSend} onClick={openConfirm} className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60" style={{ background: theme.accent, color: "#111" }}>
              Revisar e confirmar
            </button>
          </div>
        </div>

        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={onConfirmSend}
          summary={{
            count: countSelected,
            scheduleLabel,
            tplName: selectedTpl?.name || "",
            header: tplHeader,
            body: tplBody || "",
            footer: tplFooter,
            accountName,
            phoneDisplay,
            campaignName,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */
function StatusBadge({ status }: { status: CampaignStatus }) {
  const map = {
    Agendada: { bg: "#1f2a00", color: theme.warn, icon: <CalendarClock size={12} /> },
    "Em andamento": { bg: "#0a1f15", color: "#34d399", icon: <CircleDashed size={12} /> },
    Concluída: { bg: "#0a1a0a", color: theme.success, icon: <CheckCircle2 size={12} /> },
  } as const;
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11px]" style={{ background: s.bg, color: s.color, border: `1px solid ${theme.border}` }}>
      {s.icon}
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full" style={{ background: "#1f1f1f", border: `1px solid ${theme.border}` }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${clamped}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className="h-full rounded-full" style={{ background: theme.accent }} />
    </div>
  );
}

function CampaignCard({ c }: { c: Campaign }) {
  const progress = c.total > 0 ? Math.round((c.sent / c.total) * 100) : 0;
  const rateDelivery = safeRate(c.delivered, c.total);
  const rateError = safeRate(c.failed, c.total);
  const rateReply = safeRate(c.replied, c.total);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="rounded-lg border p-3" style={{ borderColor: theme.border, background: theme.panel }}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{c.name}</div>
          <div className="text-[11px] opacity-60">Template: {c.templateName} · Conta: {c.accountName} · Nº: {c.phoneDisplay || "—"}</div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="mb-2 flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
        <div>Envio: {c.scheduledAt ? fmt.format(new Date(c.scheduledAt)) : c.startedAt ? fmt.format(new Date(c.startedAt)) : "—"}</div>
        <div>
          {c.sent}/{c.total} enviados
        </div>
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

function DashboardPage({ campaigns, filter, setFilter }: { campaigns: Campaign[]; filter: CampaignStatus | "Todos"; setFilter: (f: CampaignStatus | "Todos") => void }) {
  const [stats, setStats] = useState<any>(null);
  
  // Load real statistics from webhook events
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch {}
    })();
  }, []);

  const list = campaigns.filter((c) => (filter === "Todos" ? true : c.status === filter));

  // Use real stats if available, otherwise fallback to campaign totals
  const totals = stats ? {
    total: stats.total || 0,
    sent: stats.sent || 0,
    delivered: stats.delivered || 0,
    failed: stats.failed || 0,
    replied: stats.replied || 0
  } : campaigns.reduce(
    (acc, c) => {
      acc.total += c.total;
      acc.sent += c.sent;
      acc.delivered += c.delivered;
      acc.failed += c.failed;
      acc.replied += c.replied;
      return acc;
    },
    { total: 0, sent: 0, delivered: 0, failed: 0, replied: 0 }
  );

  const overallProgress = safeRate(totals.delivered, totals.sent);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} />
            <div className="text-sm font-medium">Dashboard de Campanhas</div>
            {stats && <span className="ml-2 rounded bg-green-900/30 px-2 py-0.5 text-[10px] text-green-400">Dados reais · Webhooks</span>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button className={`rounded-md px-2 py-1 ${filter === "Todos" ? "tab-active" : "opacity-70 hover:opacity-100"} tab`} onClick={() => setFilter("Todos")}>
              Todos
            </button>
            <button className={`rounded-md px-2 py-1 ${filter === "Em andamento" ? "tab-active" : "opacity-70 hover:opacity-100"} tab`} onClick={() => setFilter("Em andamento")}>
              Em andamento
            </button>
            <button className={`rounded-md px-2 py-1 ${filter === "Agendada" ? "tab-active" : "opacity-70 hover:opacity-100"} tab`} onClick={() => setFilter("Agendada")}>
              Agendadas
            </button>
            <button className={`rounded-md px-2 py-1 ${filter === "Concluída" ? "tab-active" : "opacity-70 hover:opacity-100"} tab`} onClick={() => setFilter("Concluída")}>
              Concluídas
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
        <div className="rounded-lg border p-3" style={{ borderColor: theme.border }}>
          <div className="text-xs opacity-60">Total enviados</div>
          <div className="text-xl font-semibold">{totals.sent}</div>
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
        <div className="mb-2 text-xs" style={{ color: theme.textMuted }}>
          Progresso geral
        </div>
        <ProgressBar value={overallProgress} />
      </div>

      <div className="scroll-slim grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {list.length ? (
          list.map((c) => <CampaignCard key={c.id} c={c} />)
        ) : (
          <div className="col-span-full rounded-lg border p-6 text-center text-sm" style={{ borderColor: theme.border, color: theme.textMuted }}>
            Nenhuma campanha para esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN
============================================================ */
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
          <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: theme.accent, color: "#111" }}>
            <Shield size={18} />
          </div>
          <div>
            <div className="text-sm font-medium">Acesso ao Painel</div>
            <div className="text-[11px] opacity-60">Somente usuários autorizados</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs opacity-70">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="admin@wj.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="••••••••" />
          </div>
          {error && (
            <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: theme.border, color: theme.danger }}>
              {error}
            </div>
          )}
          <button type="submit" className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium" style={{ background: theme.accent, color: "#111" }}>
            Entrar
          </button>
          <div className="text-[11px] opacity-60">Demo: admin@wj.com · wj@2025</div>
        </div>
      </form>
    </div>
  );
}

/* ============================================================
   APP PRINCIPAL (mesclado: Conversas usa ConversationsPanel)
============================================================ */
export default function ChatPrototypeWJ() {
  const [authUser, setAuthUser] = useState<{ name: string } | null>(null);

  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selected, setSelected] = useState<string>(MOCK_CONTACTS[0].id);
  const [openNewContact, setOpenNewContact] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "contacts" | "templates" | "broadcast" | "accounts">("dashboard");

  const [accounts, setAccounts] = useState<MetaAccount[]>(MOCK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(MOCK_ACCOUNTS[0].id);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(MOCK_ACCOUNTS[0].phones[0].id);

  const selectedAccount = useMemo(() => accounts.find((a) => a.id === selectedAccountId), [accounts, selectedAccountId]);
  const selectedPhone = useMemo(() => selectedAccount?.phones.find((p) => p.id === selectedPhoneId), [selectedAccount, selectedPhoneId]);

  // Fetch real account/phones from API if available
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/account', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data?.wabaId) return;
        const liveAcc: MetaAccount = {
          id: 'acc_live',
          name: data.name || 'Meta WhatsApp Account',
          wabaId: data.wabaId,
          phones: (data.phones || []).map((p: any) => ({ id: p.id, display: p.display || p.id, status: p.status || '—' })),
        };
        setAccounts([liveAcc]);
        setSelectedAccountId('acc_live');
        if (liveAcc.phones[0]) setSelectedPhoneId(liveAcc.phones[0].id);
      } catch {}
    })();
  }, []);

  const selectedContact = useMemo(() => contacts.find((c) => c.id === selected) || contacts[0], [contacts, selected]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: "cmp_01", name: "Boas-vindas Showrooms", templateName: "boas_vindas_wj", accountName: "Luminárias WJ", phoneDisplay: "+55 11 99999-0000", total: 1000, sent: 600, delivered: 570, failed: 30, replied: 120, startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), status: "Em andamento" },
    { id: "cmp_02", name: "Agenda 2026 — Lojas VIP", templateName: "aviso_pedidos_2026", accountName: "Luminárias WJ", phoneDisplay: "+55 11 88888-7777", total: 350, sent: 350, delivered: 334, failed: 16, replied: 45, startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), status: "Concluída" },
    { id: "cmp_03", name: "Follow-up catálogo", templateName: "boas_vindas_wj", accountName: "Estúdio Luz Studio", phoneDisplay: "+55 21 99999-1111", total: 220, sent: 0, delivered: 0, failed: 0, replied: 0, scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), status: "Agendada" },
  ]);
  const [dashFilter, setDashFilter] = useState<CampaignStatus | "Todos">("Todos");

  useEffect(() => {
    const id = setInterval(() => {
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.status === "Agendada" && c.scheduledAt && new Date(c.scheduledAt) <= new Date()) {
            return { ...c, status: "Em andamento", startedAt: new Date().toISOString() };
          }
          if (c.status !== "Em andamento") return c;
          const step = Math.max(1, Math.ceil(c.total * 0.02));
          const nextSent = Math.min(c.sent + step, c.total);
          const nextDeliveredTarget = Math.floor(nextSent * 0.95);
          const nextDelivered = Math.min(Math.max(c.delivered, nextDeliveredTarget), c.total);
          const nextFailed = Math.max(0, nextSent - nextDelivered);
          const replyTarget = Math.floor(nextDelivered * 0.15);
          const nextReplied = Math.min(Math.max(c.replied, c.replied + Math.floor(Math.random() * Math.max(1, step / 4))), replyTarget);
          const done = nextSent >= c.total;
          return { ...c, sent: nextSent, delivered: nextDelivered, failed: nextFailed, replied: nextReplied, status: done ? "Concluída" : c.status };
        })
      );
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const handleSaveContact = (c: Contact) => {
    setContacts((prev) => [c, ...prev]);
    setSelected(c.id);
    setActiveTab("chat");
  };

  const handleAddMany = (arr: Contact[]) => {
    if (!arr || !arr.length) return;
    setContacts((prev) => [...arr, ...prev]);
    setActiveTab("contacts");
  };

  const handleDeleteMany = (ids: string[]) => {
    if (!ids.length) return;
    setContacts((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  const handleBulkTagAdd = (tag: string, ids: string[]) => {
    if (!tag.trim() || !ids.length) return;
    setContacts((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, tags: Array.from(new Set([...(c.tags || []), tag.trim()])) } : c)));
  };

  const handleBulkTagRemove = (tag: string, ids: string[]) => {
    if (!tag.trim() || !ids.length) return;
    setContacts((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, tags: (c.tags || []).filter((t) => t !== tag.trim()) } : c)));
  };

  const onCreateCampaign = (data: { name: string; templateName: string; total: number; scheduleAt?: string }) => {
    const payload: Campaign = {
      id: `cmp_${Date.now()}`,
      name: data.name,
      templateName: data.templateName,
      accountName: selectedAccount?.name || "—",
      phoneDisplay: selectedPhone?.display || "—",
      total: data.total,
      sent: 0,
      delivered: 0,
      failed: 0,
      replied: 0,
      scheduledAt: data.scheduleAt,
      startedAt: data.scheduleAt ? undefined : new Date().toISOString(),
      status: data.scheduleAt ? "Agendada" : "Em andamento",
    };
    setCampaigns((prev) => [payload, ...prev]);
    setActiveTab("dashboard");
  };

  if (!authUser) return <LoginScreen onLogin={setAuthUser} />;

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: theme.bg }}>
      <FontGlobal />

      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between border-b px-4" style={{ borderColor: theme.border, background: theme.panel }}>
        <WJBadge />
        <nav className="flex items-center gap-4 text-sm">
          <button className={`tab pb-3 ${activeTab === "dashboard" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("dashboard")}>
            <div className="flex items-center gap-1">
              <BarChart3 size={16} /> Dashboard
            </div>
          </button>
          <button className={`tab pb-3 ${activeTab === "chat" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("chat")}>
            <div className="flex items-center gap-1">
              <MessagesSquare size={16} /> Conversas
            </div>
          </button>
          <button className={`tab pb-3 ${activeTab === "contacts" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("contacts")}>
            <div className="flex items-center gap-1">
              <Users size={16} /> Contatos
            </div>
          </button>
          <button className={`tab pb-3 ${activeTab === "templates" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("templates")}>
            <div className="flex items-center gap-1">
              <Sparkles size={16} /> Templates
            </div>
          </button>
          <button className={`tab pb-3 ${activeTab === "broadcast" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("broadcast")}>
            <div className="flex items-center gap-1">
              <Send size={16} /> Disparo
            </div>
          </button>
          <button className={`tab pb-3 ${activeTab === "accounts" ? "tab-active" : "opacity-70 hover:opacity-100"}`} onClick={() => setActiveTab("accounts")}>
            <div className="flex items-center gap-1">
              <Settings size={16} /> Contas
            </div>
          </button>
        </nav>
        <div className="flex items-center gap-3 text-xs" style={{ color: theme.textMuted }}>
          <div className="hidden md:block">{authUser.name}</div>
          <div className="hidden items-center gap-1 md:flex">
            <Building2 size={14} />
            <span>{selectedAccount?.name}</span>
            <span>·</span>
            <Smartphone size={14} />
            <span>{selectedPhone?.display || "—"}</span>
          </div>
          <button className="btn-ghost rounded-md px-2 py-1" onClick={() => setAuthUser(null)}>
            <div className="flex items-center gap-1">
              <LogOut size={14} /> sair
            </div>
          </button>
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1600px] border" style={{ borderColor: theme.border }}>
        {activeTab === "dashboard" && (
          <div className="flex w-full flex-1 flex-col">
            <DashboardPage campaigns={campaigns} filter={dashFilter} setFilter={setDashFilter} />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex w-full flex-1 flex-col">
            <ConversationsPanel />
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="flex w-full flex-1 flex-col">
            <div className="border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                  Gerenciar Contatos
                </div>
                <button className="btn-ghost rounded-md px-3 py-1.5 text-xs" onClick={() => setOpenNewContact(true)}>
                  <div className="flex items-center gap-1 opacity-90">
                    <Plus size={14} /> Novo
                  </div>
                </button>
              </div>
            </div>
            <ContactsPage contacts={contacts} onAddMany={handleAddMany} onDeleteMany={handleDeleteMany} onBulkTagAdd={handleBulkTagAdd} onBulkTagRemove={handleBulkTagRemove} />
          </div>
        )}

        {activeTab === "templates" && (
          <div className="flex w-full flex-1 flex-col">
            <TemplatesPage />
          </div>
        )}

        {activeTab === "broadcast" && (
          <div className="flex w-full flex-1 flex-col">
            <div className="border-b px-4 py-2" style={{ borderColor: theme.border, background: theme.panel }}>
              <div className="text-xs uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                Disparo de Template
              </div>
            </div>
            <BroadcastPage contacts={contacts} selectedAccount={selectedAccount} selectedPhone={selectedPhone} onCreateCampaign={onCreateCampaign} />
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="flex w-full flex-1 flex-col">
            <AccountsPage accounts={accounts} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId} selectedPhoneId={selectedPhoneId} setSelectedPhoneId={setSelectedPhoneId} isLive={accounts.length === 1 && accounts[0].id === 'acc_live'} />
          </div>
        )}
      </div>

      {openNewContact && (
        <NewContactPanel onClose={() => setOpenNewContact(false)} onSave={handleSaveContact} />
      )}
    </div>
  );
}

/* ============================================================
   MODAL: Novo contato (reutilizado)
============================================================ */
function NewContactPanel({ onClose, onSave }: { onClose: () => void; onSave: (c: Contact) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const save = () => {
    const c: Contact = { id: uid("ct"), name: name || "Sem nome", phone: normalizeBRPhoneToE164(phone), email: email || undefined, tags: [] };
    onSave(c);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-xl border bg-[#121212] p-4" style={{ borderColor: theme.border }}>
        <div className="mb-2 flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
          <div className="text-sm font-medium">Novo contato</div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-white/5" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs opacity-70">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55…" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
          </div>
          <div>
            <label className="mb-1 block text-xs opacity-70">E-mail (opcional)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 border-t pt-2" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="btn-ghost rounded-md px-3 py-1.5 text-sm">
            Cancelar
          </button>
          <button onClick={save} className="rounded-md px-3 py-1.5 text-sm" style={{ background: theme.accent, color: "#111" }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
