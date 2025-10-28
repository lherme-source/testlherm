'use client';

import React, { useMemo, useState } from 'react';

type Account = { id: string; name: string; type: 'WABA' | 'Sandbox'; };
type PhoneNumber = { id: string; display: string; e164: string; accountId: string; };
type Conversation = {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastAt: string; // ISO
  unread: number;
  status: 'ok' | 'failed';
};

const AMBER = {
  ring: 'ring-amber-400',
  text: 'text-amber-600',
  bg: 'bg-amber-500',
  bgSoft: 'bg-amber-50 dark:bg-amber-950/20',
  border: 'border-amber-300 dark:border-amber-800',
};

// --- MOCK DATA (estável e próximo do que você vinha usando) ---
const accounts: Account[] = [
  { id: 'acc_waba_01', name: 'Meta WABA — Conta 1', type: 'WABA' },
  { id: 'acc_sbx_01', name: 'Sandbox — Testes', type: 'Sandbox' },
];

const phones: PhoneNumber[] = [
  { id: 'ph1', display: '+55 11 99876-0001', e164: '+5511998760001', accountId: 'acc_waba_01' },
  { id: 'ph2', display: '+55 11 99876-0002', e164: '+5511998760002', accountId: 'acc_waba_01' },
  { id: 'ph3', display: '+55 51 99123-0003', e164: '+5551991230003', accountId: 'acc_sbx_01' },
];

const seedConversations: Conversation[] = [
  {
    id: 'c1', contactName: 'Maria Eduarda', contactPhone: '+55 11 91234-5678',
    lastMessage: 'Tudo certo para o envio amanhã. Obrigada!', lastAt: '2025-10-27T16:21:00-03:00',
    unread: 0, status: 'ok'
  },
  {
    id: 'c2', contactName: 'Arq. Carlos', contactPhone: '+55 51 99888-7777',
    lastMessage: 'Consegue o orçamento revisado ainda hoje?', lastAt: '2025-10-28T10:05:00-03:00',
    unread: 2, status: 'ok'
  },
  {
    id: 'c3', contactName: 'Rodrigo de Borba', contactPhone: '+55 11 90000-0001',
    lastMessage: 'Fechado: 01 Reels em colab.', lastAt: '2025-10-22T15:06:00-03:00',
    unread: 0, status: 'ok'
  },
  {
    id: 'c4', contactName: 'Galeria SP', contactPhone: '+55 11 95555-1212',
    lastMessage: 'Falha no envio do template ✕', lastAt: '2025-10-21T09:40:00-03:00',
    unread: 0, status: 'failed'
  },
];

function timeLabel(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function ChatPrototypeWJ() {
  const [selectedAccountId, setSelectedAccountId] = useState<Account['id']>(accounts[0].id);
  const [selectedPhoneId, setSelectedPhoneId] = useState<PhoneNumber['id']>('ph1');
  const [query, setQuery] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<Conversation['id'] | null>(seedConversations[0].id);

  const selectedAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId)!, [selectedAccountId]);
  const phoneOptions = useMemo(() => phones.filter(p => p.accountId === selectedAccountId), [selectedAccountId]);
  const selectedPhone = useMemo(() => phoneOptions.find(p => p.id === selectedPhoneId) ?? phoneOptions[0], [phoneOptions, selectedPhoneId]);

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...seedConversations].sort((a,b) => b.lastAt.localeCompare(a.lastAt));
    if (!q) return base;
    return base.filter(c =>
      c.contactName.toLowerCase().includes(q) ||
      c.contactPhone.includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }, [query]);

  const active = conversations.find(c => c.id === activeConversationId) ?? conversations[0];

  return (
    <div className="grid h-[calc(100vh-2rem)] grid-cols-1 gap-4 xl:grid-cols-3">
      {/* Coluna 1: Filtros e seleção */}
      <section className="xl:col-span-1 space-y-4">
        <div className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Seleção de Conta</h2>
          <label className="block text-sm mb-1">Conta Meta / Ambiente</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              // Troca de conta força trocar número se o anterior não pertencer
              const first = phones.find(p => p.accountId === e.target.value);
              if (first) setSelectedPhoneId(first.id);
            }}
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <label className="block text-sm mt-4 mb-1">Número de telefone</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            value={selectedPhone?.id}
            onChange={(e) => setSelectedPhoneId(e.target.value)}
          >
            {phoneOptions.map(p => (
              <option key={p.id} value={p.id}>{p.display}</option>
            ))}
          </select>

          <p className="mt-3 text-xs text-neutral-500">
            Enviando a partir de: <span className="font-medium">{selectedPhone?.display}</span>
          </p>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Busca</h2>
          <input
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            placeholder="Pesquisar por nome, número ou mensagem…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-lg font-semibold">Integração WhatsApp API</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Ponto de integração pendente. Exponha seu token e App ID via variáveis de ambiente:
          </p>
          <pre className="mt-2 rounded-lg p-3 overflow-auto text-xs bg-neutral-100 dark:bg-neutral-900 border">
            {`# .env.local
WABA_ACCESS_TOKEN=seu_token
WABA_BUSINESS_ID=123456789
WABA_PHONE_ID=1234567890
`}
          </pre>
          <p className="text-xs mt-2">
            Depois implemente chamadas no diretório <code>app/api/</code> para enviar templates e mensagens (ver TODOs).
          </p>
        </div>
      </section>

      {/* Coluna 2: Lista de conversas */}
      <section className="xl:col-span-1 card flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <span className="text-sm">{conversations.length} itens</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
          {conversations.map(c => {
            const isActive = active?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConversationId(c.id)}
                className={[
                  "w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900",
                  isActive ? "bg-amber-50/80 dark:bg-amber-950/20" : ""
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center border bg-white dark:bg-neutral-900">
                    <span className="text-sm font-semibold">{c.contactName.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{c.contactName}</p>
                      {c.unread > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-300">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400 truncate">{c.lastMessage}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-neutral-500">{timeLabel(c.lastAt)}</span>
                      {c.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[11px] bg-red-500/10 text-red-700 border-red-300">
                          Falha
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Coluna 3: Mensagens / Preview */}
      <section className="xl:col-span-1 card flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
          <div className="h-10 w-10 rounded-full flex items-center justify-center border bg-white dark:bg-neutral-900">
            <span className="text-sm font-semibold">{active?.contactName.slice(0,2).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{active?.contactName}</p>
            <p className="text-xs text-neutral-500">{active?.contactPhone}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs rounded px-2 py-1 border bg-amber-50 text-amber-700 border-amber-300">
            Número: {selectedPhone?.display}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Mensagens fake para preview */}
          <div className="flex gap-2">
            <div className="max-w-[80%] rounded-xl border bg-white dark:bg-neutral-900 p-3">
              <p className="text-sm">Olá! Aqui é do time WJ :)</p>
              <p className="mt-1 text-[11px] text-neutral-500">{timeLabel(active?.lastAt ?? '')}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <div className="max-w-[80%] rounded-xl border p-3 bg-amber-50 border-amber-300">
              <p className="text-sm">Perfeito, seguimos com o envio amanhã.</p>
              <p className="mt-1 text-[11px] text-neutral-500 text-right">{timeLabel(active?.lastAt ?? '')}</p>
            </div>
          </div>
        </div>

        <form
          className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Envio placeholder — implementar integração WABA em /app/api/messages');
          }}
        >
          <input
            className="flex-1 rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            placeholder="Escreva uma mensagem…"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 border font-medium bg-amber-500 text-white border-amber-600 hover:opacity-95 active:opacity-90"
            title="Enviar"
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
