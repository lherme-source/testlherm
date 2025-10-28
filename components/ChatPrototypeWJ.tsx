
'use client';
import React, {useEffect, useMemo, useState} from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Bold, Building2, CalendarClock, CheckCircle2, Clock, 
  Hash, Italic, Link as LinkIcon, List, LogOut, 
  MessagesSquare, Plus, Quote, Search, Send, Settings, Shield, Smartphone, 
  Sparkles, Users, X
} from 'lucide-react';

/** ======= TEMA (âmbar #d6a65c) ======= */
const theme = {
  bg: '#0b0b0b',
  panel: '#121212',
  panel2: '#161616',
  border: '#2a2a2a',
  text: '#f5f5f5',
  textMuted: '#9b9b9b',
  accent: '#d6a65c',   // âmbar pedido
  success: '#34d399',
  danger: '#ef4444',
  warn: '#d6a65c',
};

/** ======= Estilos globais ======= */
function FontGlobal(){
  return (
    <style jsx global>{`
      :root { --accent: ${theme.accent}; }
      body { color: ${theme.text}; background: ${theme.bg}; }
      .tab { border-bottom: 2px solid transparent; }
      .tab-active { border-bottom-color: var(--accent); color: #fff; }
      .btn-ghost:hover { background: #d6a65c1a; }
      input:focus, textarea:focus, select:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px rgba(214,166,92,0.15);
      }
      .badge-amber { background: ${theme.accent}; color: #111; }
      .bubble-sent { background: #1a1608; border: 1px solid #3b2f10; } /* neutro quente */
    `}</style>
  );
}

/** ======= Tipos ======= */
type Contact = {
  id: string; name: string; phone: string; email?: string;
  tags?: string[]; pinned?: boolean; unread?: number;
  lastMessage?: string; lastMessageAt?: string;
};
type CampaignStatus = 'Agendada'|'Em andamento'|'Concluída';
type Campaign = {
  id: string; name: string; templateName: string;
  accountName: string; phoneDisplay?: string;
  total: number; sent: number; delivered: number; failed: number; replied: number;
  scheduledAt?: string; startedAt?: string; status: CampaignStatus;
};
type MetaPhone = { id: string; display: string; status?: string };
type MetaAccount = { id: string; name: string; wabaId: string; phones: MetaPhone[] };

/** ======= Helpers ======= */
const initials = (s:string)=> (s||'')
  .split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase();
const uniqueTags = (arr: Contact[]) => Array.from(new Set(arr.flatMap(c=>c.tags||[])));
const safeRate = (num:number, den:number)=> den>0 ? Math.round((num/den)*100) : 0;
const filterContacts = (contacts: Contact[], q: string, tagsOR: string[]) => {
  const qq = q.trim().toLowerCase();
  return contacts.filter(c => {
    const hitQ = !qq || `${c.name} ${c.phone} ${c.email||''}`.toLowerCase().includes(qq);
    const hitT = !tagsOR.length || (c.tags||[]).some(t=>tagsOR.includes(t));
    return hitQ && hitT;
  });
};
const appendSnippet = (prev:string, snippet:string)=> (prev ? (prev + (prev.endsWith('\\n')?'':'\\n') + snippet) : snippet);

const parseCsvContacts = (text:string): Contact[] => {
  try {
    const rows = text.split(/\\r?\\n/).filter(Boolean);
    if (!rows.length) return [];
    const header = rows[0];
    const lines = rows.slice(1);
    const cols = header.split(',').map(s=>s.trim().toLowerCase());
    const colIdx = (k:string)=> cols.indexOf(k);
    const iName = colIdx('name'), iMail = colIdx('e-mail'), iPhone = colIdx('phone'), iTags = colIdx('tags');
    return lines.map((ln, i)=>{
      const parts = ln.split(',').map(p=>p.trim());
      const tags = (parts[iTags]||'').split(/[,;]\\s*/).filter(Boolean);
      let phone = (parts[iPhone]||'').replace(/\\D/g,'');
      if (phone && !phone.startsWith('55')) phone = '55' + phone;
      return {
        id: `csv_${Date.now()}_${i}`,
        name: parts[iName] || 'Sem nome',
        email: parts[iMail] || '',
        phone,
        tags,
        lastMessageAt: new Date().toISOString(),
      } as Contact;
    });
  } catch { return []; }
};

/** ======= MOCKS ======= */
const MOCK_ACCOUNTS: MetaAccount[] = [
  { id: 'acc_wj', name: 'Luminárias WJ', wabaId: 'WABA-001', phones: [
    { id: 'ph_1', display: '+55 11 99999-0000', status: 'Connected' },
    { id: 'ph_2', display: '+55 11 88888-7777', status: 'Connected' },
  ]},
  { id: 'acc_est', name: 'Estúdio Luz Studio', wabaId: 'WABA-002', phones: [
    { id: 'ph_3', display: '+55 21 99999-1111', status: 'Connected' },
  ]},
];

const MOCK_CONTACTS: Contact[] = [
  { id:'c1', name:'Estúdio Baviera', phone:'5511999990000', tags:['showroom','vip'], pinned:true, unread:2,
    lastMessage:'Amei o acabamento em inox polido. Enviam catálogo?', lastMessageAt:'2025-10-28T09:10:00-03:00' },
  { id:'c2', name:'Galeria São Paulo', phone:'5511988887777', tags:['cliente'],
    lastMessage:'Projeto #427 confirmado. Prazos para janeiro?', lastMessageAt:'2025-10-28T08:55:00-03:00' },
  { id:'c3', name:'Delumini Showroom', phone:'5511977776666',
    lastMessage:'Consegue vídeo do pendente ORI?', lastMessageAt:'2025-10-28T08:42:00-03:00' },
  { id:'c4', name:'Mariana — Arq.', phone:'5511966665555',
    lastMessage:'Projeto Cobogó: fita âmbar ou 3000K?', lastMessageAt:'2025-10-28T08:31:00-03:00' },
  { id:'c5', name:'Rodrigo de Borba', phone:'5511987654321', pinned:true,
    lastMessage:'Fechei colab 1 Reels. Envio roteiro?', lastMessageAt:'2025-10-27T18:10:00-03:00' },
];

/** ======= UI micro ======= */
function WJBadge(){
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-6 w-6 place-items-center rounded-full badge-amber">WJ</div>
      <div className="text-sm font-semibold">Luminárias WJ</div>
    </div>
  );
}

/** ======= Sidebar Conversas ======= */
function Sidebar({contacts, selected, onSelect, onOpenNew}:{contacts:Contact[];selected:string;onSelect:(id:string)=>void;onOpenNew:()=>void}){
  const sorted = useMemo(()=>{
    return [...contacts].sort((a,b)=>{
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return Number(b.pinned) - Number(a.pinned);
      const ta = new Date(a.lastMessageAt||0).getTime();
      const tb = new Date(b.lastMessageAt||0).getTime();
      return tb - ta;
    });
  },[contacts]);

  return (
    <aside className="hidden w-[320px] flex-col border-r lg:flex" style={{borderColor: theme.border}}>
      <div className="flex items-center justify-between border-b p-3" style={{borderColor: theme.border, background: theme.panel}}>
        <input placeholder="Buscar contato ou telefone" className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}/>
        <button onClick={onOpenNew} className="ml-2 rounded-md px-3 py-2 text-xs badge-amber"><Plus size={14}/></button>
      </div>
      <div className="flex-1 overflow-auto">
        {sorted.map(c=>{
          const active = c.id===selected;
          return (
            <button key={c.id} onClick={()=>onSelect(c.id)} className={`w-full border-b px-3 py-2 text-left ${active?'bg-white/[0.03]':''}`} style={{borderColor: theme.border}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full border bg-white/5" style={{borderColor: theme.border}}>
                    <span className="text-xs opacity-90">{initials(c.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm">{c.name}</div>
                      {c.pinned && <span className="text-[11px] opacity-60">📌</span>}
                    </div>
                    <div className="truncate text-[11px] opacity-60">{c.lastMessage||'—'}</div>
                    {c.tags?.length ? (
                      <div className="mt-1 flex gap-1">
                        {c.tags.map(t=>(
                          <span key={t} className="rounded px-1.5 py-[2px] text-[10px]" style={{border:`1px solid ${theme.border}`, background:'#ffffff0f'}}>{t}</span>
                        ))}
                      </div>
                    ): null}
                  </div>
                </div>
                {c.unread ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full text-[10px] font-semibold badge-amber">{c.unread}</span>
                ): null}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

/** ======= ChatWindow (mock) ======= */
function ChatWindow({contact, onOpenTemplates}:{contact:Contact; onOpenTemplates:()=>void}){
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3" style={{borderColor: theme.border, background: theme.panel}}>
        <div className="text-sm font-medium">{contact.name}</div>
        <button onClick={onOpenTemplates} className="btn-ghost rounded-md px-2 py-1 text-xs"><Sparkles size={14}/> Templates</button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg bg-white/[0.03] p-3 text-sm" style={{border:`1px solid ${theme.border}`}}>
          Olá! Vimos o pendente ENIGMA no Instagram. Tem catálogo técnico?
        </div>
        <div className="mt-4 ml-auto max-w-[60%] rounded-lg p-3 text-sm bubble-sent">
          Bom dia! Envio o PDF com medidas e acabamentos em seguida.
        </div>
      </div>
      <div className="border-t p-3" style={{borderColor: theme.border}}>
        <div className="flex items-center gap-2">
          <input placeholder="Escreva uma mensagem..." className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}/>
          <button className="rounded-md px-3 py-2 text-sm badge-amber"><Send size={14}/></button>
        </div>
      </div>
    </div>
  );
}

/** ======= Templates (página) ======= */
function TemplatesPage(){
  const [name,setName] = useState('boas_vindas_wj');
  const [lang,setLang] = useState('pt_BR');
  const [category,setCategory] = useState<'UTILITY'|'MARKETING'|'AUTHENTICATION'>('UTILITY');
  const [header,setHeader] = useState('WJ — Boas-vindas');
  const [body,setBody] = useState('Olá {{1}}, obrigado pelo interesse nas Luminárias WJ.');
  const [footer,setFooter] = useState('WJ · Feito à mão no Brasil');
  const wrapSel = (set:(v:string)=>void, v:string, left:string, right:string)=> set(left+v+right);
  const validate = ()=>{
    const errors:string[]=[];
    if(!name.trim()) errors.push('Nome interno obrigatório');
    if(!/^[a-z0-9_\\-]+$/i.test(name)) errors.push('Nome interno inválido');
    if(!body.includes('{{1}}')) errors.push('Inclua {{1}} no corpo');
    return errors;
  };
  const errors = validate();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3" style={{borderColor: theme.border, background: theme.panel}}>
        <div className="flex items-center gap-2"><Sparkles size={16}/><div className="text-sm font-medium">Templates para aprovação (Meta)</div></div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs opacity-70">Nome interno</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}/></div>
            <div><label className="mb-1 block text-xs opacity-70">Idioma</label><select value={lang} onChange={e=>setLang(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}><option value="pt_BR">pt_BR</option><option value="en_US">en_US</option></select></div>
            <div><label className="mb-1 block text-xs opacity-70">Categoria</label><select value={category} onChange={e=>setCategory(e.target.value as any)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}><option value="UTILITY">UTILITY</option><option value="MARKETING">MARKETING</option><option value="AUTHENTICATION">AUTHENTICATION</option></select></div>
            <div className="flex items-end"><div className="text-[11px] opacity-60">{'Use variáveis {{1}}, {{2}} ...'}</div></div>
          </div>
          <div><label className="mb-1 block text-xs opacity-70">Header (opcional)</label><input value={header} onChange={e=>setHeader(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}/></div>
          <div>
            <div className="mb-1 flex items-center justify-between"><label className="block text-xs opacity-70">Body</label>
              <div className="flex items-center gap-1">
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, '*','*')}><b>B</b></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>wrapSel(setBody, body, '_','_')}><i>I</i></button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(p=>appendSnippet(p, '> citação'))}>❝</button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(p=>appendSnippet(p, '• item'))}>•</button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(p=>appendSnippet(p, '{{1}}'))}>#</button>
                <button className="btn-ghost rounded-md px-2 py-1 text-xs" onClick={()=>setBody(p=>p+' https://wj.link ')}><LinkIcon size={14}/></button>
              </div>
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{borderColor: theme.border}}/>
          </div>
          <div><label className="mb-1 block text-xs opacity-70">Footer (opcional)</label><input value={footer} onChange={e=>setFooter(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{borderColor: theme.border}}/></div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: errors.length ? theme.danger : theme.textMuted }}>{errors.length ? `Erros: ${errors.join(' | ')}` : 'Pronto para enviar (simulado)'}</div>
            <button disabled={!!errors.length} className="rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-60 badge-amber">Enviar para aprovação (simulado)</button>
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

/** ======= ContactsPage (simplificada) ======= */
function ContactsPage({ contacts, onAddMany }:{
  contacts: Contact[];
  onAddMany: (c: Contact[]) => void;
}){
  const [csvPreview, setCsvPreview] = useState<string>(`name,e-mail,phone,tags\nMaria,maria@exemplo.com,11999990000,vip;loja\nJoão,joao@exemplo.com,5511988887777,revenda`);
  const [parsed, setParsed] = useState<Contact[]>([]);
  useEffect(()=>{ setParsed(parseCsvContacts(csvPreview)); },[]);

  const allTags = useMemo(()=> uniqueTags(contacts), [contacts]);
  const [query, setQuery] = useState<string>('');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const base = useMemo(()=> filterContacts(contacts, query, tagsFilter), [contacts, query, tagsFilter]);

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-lg border" style={{borderColor: theme.border}}>
          <div className="flex items-center justify-between border-b px-3 py-2" style={{borderColor: theme.border, background: theme.panel}}>
            <div className="flex items-center gap-2"><Users size={16}/><div className="text-sm font-medium">Importar contatos (CSV)</div></div>
            <button onClick={()=>setParsed(parseCsvContacts(csvPreview))} className="rounded-md px-3 py-1.5 text-xs badge-amber">Atualizar preview</button>
          </div>
          <div className="space-y-2 p-3 text-sm">
            <div className="text-xs" style={{ color: theme.textMuted }}>Formato: <code>name, e-mail, phone, tags</code>. Telefones BR ganham prefixo 55 automaticamente.</div>
            <textarea value={csvPreview} onChange={(e)=>setCsvPreview(e.target.value)} rows={8} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none" style={{ borderColor: theme.border }} />
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: theme.textMuted }}>{`Pré-visualização: ${parsed.length} contato(s)`}</div>
              <button onClick={()=>onAddMany(parsed)} className="rounded-md px-3 py-1.5 text-sm badge-amber">Adicionar à lista</button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border p-3 text-sm" style={{borderColor: theme.border, color: theme.textMuted}}>
          Visualização da base de contatos foi simplificada nesta versão do patch.
        </div>
      </div>
    </div>
  );
}

/** ======= Modal de confirmação (mantido) ======= */
function ConfirmModal(){ return null; } // omitido no patch para encurtar o arquivo

/** ======= AccountsPage ======= */
function AccountsPage({ accounts, selectedAccountId, setSelectedAccountId, selectedPhoneId, setSelectedPhoneId }:{
  accounts: MetaAccount[]; selectedAccountId: string; setSelectedAccountId: (v: string)=>void; selectedPhoneId: string; setSelectedPhoneId: (v: string)=>void;
}){
  const account = accounts.find(a=>a.id===selectedAccountId);
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
            <p className="text-[11px] opacity-60">No real: listar via Graph API <em>{'/{WABA_ID}/phone_numbers'}</em> com permissões adequadas.</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

/** ======= Dashboard (resumo simplificado) ======= */
function DashboardStub(){
  return (
    <div className="grid h-full place-items-center text-sm" style={{color: theme.textMuted}}>
      Dashboard de campanhas (stub para patch).
    </div>
  );
}

/** ======= Login ======= */
function LoginScreen({ onLogin }:{ onLogin:(user:{name:string})=>void }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const DEMO = { email:'admin@wj.com', password:'wj@2025', name:'Admin WJ' };
  const submit = (e: React.FormEvent)=>{
    e.preventDefault();
    if (email.trim()===DEMO.email && password===DEMO.password){ setError(''); onLogin({ name: DEMO.name }); }
    else setError('Credenciais inválidas');
  };
  return (
    <div className="grid h-screen place-items-center" style={{ background: theme.bg }}>
      <FontGlobal />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border p-6" style={{ background: theme.panel, borderColor: theme.border }}>
        <div className="mb-4 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full badge-amber">🔒</div>
          <div>
            <div className="text-sm font-medium">Acesso ao Painel</div>
            <div className="text-[11px] opacity-60">Somente usuários autorizados</div>
          </div>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs opacity-70">E-mail</label><input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="admin@wj.com" /></div>
          <div><label className="mb-1 block text-xs opacity-70">Senha</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none" style={{ borderColor: theme.border }} placeholder="••••••••" /></div>
          {error && <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: theme.border, color: theme.danger }}>{error}</div>}
          <button type="submit" className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium badge-amber">Entrar</button>
          <div className="text-[11px] opacity-60">Demo: admin@wj.com · wj@2025</div>
        </div>
      </form>
    </div>
  );
}

/** ======= App Principal ======= */
export default function ChatPrototypeWJ(){
  const [authUser, setAuthUser] = useState<{name:string}|null>(null);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [selected, setSelected] = useState<string>(MOCK_CONTACTS[0].id);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard'|'chat'|'contacts'|'templates'|'accounts'>('chat');

  const [accounts] = useState<MetaAccount[]>(MOCK_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(MOCK_ACCOUNTS[0].id);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>(MOCK_ACCOUNTS[0].phones[0].id);
  const selectedAccount = useMemo(()=> accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);
  const selectedPhone = useMemo(()=> selectedAccount?.phones.find(p => p.id === selectedPhoneId), [selectedAccount, selectedPhoneId]);

  useEffect(()=>{
    const onResize = ()=> setShowSidebar(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return ()=> window.removeEventListener('resize', onResize);
  },[]);

  if (!authUser) return <LoginScreen onLogin={setAuthUser} />;

  const selectedContact = useMemo(()=> contacts.find(c=>c.id===selected)||contacts[0], [contacts, selected]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: theme.bg }}>
      <FontGlobal />
      {/* Topbar */}
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between border-b px-4" style={{ borderColor: theme.border, background: theme.panel }}>
        <div className="flex items-center gap-4">
          <div className="grid h-6 w-6 place-items-center rounded-full badge-amber">WJ</div>
          <div className="text-sm font-semibold">Luminárias WJ</div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <button className={`tab pb-3 ${activeTab==='dashboard' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('dashboard')}><div className="flex items-center gap-1"><BarChart3 size={16}/> Dashboard</div></button>
          <button className={`tab pb-3 ${activeTab==='chat' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('chat')}><div className="flex items-center gap-1"><MessagesSquare size={16}/> Conversas</div></button>
          <button className={`tab pb-3 ${activeTab==='contacts' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('contacts')}><div className="flex items-center gap-1"><Users size={16}/> Contatos</div></button>
          <button className={`tab pb-3 ${activeTab==='templates' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('templates')}><div className="flex items-center gap-1"><Sparkles size={16}/> Templates</div></button>
          <button className={`tab pb-3 ${activeTab==='accounts' ? 'tab-active' : 'opacity-70 hover:opacity-100'}`} onClick={()=>setActiveTab('accounts')}><div className="flex items-center gap-1"><Settings size={16}/> Contas</div></button>
        </nav>
        <div className="flex items-center gap-3 text-xs" style={{ color: theme.textMuted }}>
          <div className="hidden md:block">{authUser.name}</div>
          <div className="hidden items-center gap-1 md:flex">
            <Building2 size={14}/><span>{selectedAccount?.name}</span><span>·</span><Smartphone size={14}/><span>{selectedPhone?.display || '—'}</span>
          </div>
          <button className="btn-ghost rounded-md px-2 py-1" onClick={()=>setAuthUser(null)}><div className="flex items-center gap-1"><LogOut size={14}/> sair</div></button>
        </div>
      </div>
      {/* Body */}
      <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1600px] border" style={{ borderColor: theme.border }}>
        {activeTab==='dashboard' && <div className="flex w-full flex-1 flex-col"><DashboardStub /></div>}
        {activeTab==='chat' && (
          <>
            {showSidebar && <Sidebar contacts={contacts} selected={selected} onSelect={setSelected} onOpenNew={()=>{}} />}
            <div className="flex min-w-0 flex-1 flex-col">
              <ChatWindow contact={selectedContact} onOpenTemplates={()=>setActiveTab('templates')} />
            </div>
          </>
        )}
        {activeTab==='contacts' && (
          <div className="flex w-full flex-1 flex-col">
            <ContactsPage
              contacts={contacts}
              onAddMany={(arr)=>{ if(arr?.length){ setContacts(prev=>[...arr,...prev]); } }}
            />
          </div>
        )}
        {activeTab==='templates' && <div className="flex w-full flex-1 flex-col"><TemplatesPage/></div>}
        {activeTab==='accounts' && (
          <div className="flex w-full flex-1 flex-col">
            <AccountsPage
              accounts={MOCK_ACCOUNTS}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedPhoneId={selectedPhoneId}
              setSelectedPhoneId={setSelectedPhoneId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
