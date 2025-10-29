"use client";
import React, { useState } from "react";
import ConversationsPanel from "./ConversationsPanel";
import { ChartBar, MessageSquare, Users, FileText, Send, Settings, Phone } from "lucide-react";

const theme = {
  bg: "#0a0a0a",
  panel: "#111111",
  panel2: "#161616",
  border: "#2a2a2a",
  text: "#f5f5f5",
  textMuted: "#9b9b9b",
  accent: "#d6a65c",
} as const;

function WJBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-full" style={{ background: theme.accent }} />
      <span className="text-sm font-semibold">Painel WJ</span>
    </div>
  );
}

export default function ChatPrototypeWJ() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "contacts" | "templates" | "blast" | "accounts">("chat");

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ background: theme.bg }}>
      {/* Top Navbar */}
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between border-b px-4" style={{ borderColor: theme.border, background: theme.panel }}>
        <WJBadge />
        <nav className="flex items-center gap-5 text-sm">
          <button onClick={() => setActiveTab("dashboard")} className={`pb-3 ${activeTab === "dashboard" ? "text-white border-b-2" : "text-neutral-400 hover:text-neutral-200"}`} style={{ borderColor: activeTab === "dashboard" ? theme.accent : "transparent" }}>Dashboard</button>
          <button onClick={() => setActiveTab("chat")} className={`pb-3 ${activeTab === "chat" ? "text-white border-b-2" : "text-neutral-400 hover:text-neutral-200"}`} style={{ borderColor: activeTab === "chat" ? theme.accent : "transparent" }}>Conversas</button>
          <button onClick={() => setActiveTab("contacts")} className="pb-3 text-neutral-400 hover:text-neutral-200">Contatos</button>
          <button onClick={() => setActiveTab("templates")} className="pb-3 text-neutral-400 hover:text-neutral-200">Templates</button>
          <button onClick={() => setActiveTab("blast")} className="pb-3 text-neutral-400 hover:text-neutral-200">Disparo</button>
          <button onClick={() => setActiveTab("accounts")} className="pb-3 text-neutral-400 hover:text-neutral-200">Contas</button>
        </nav>
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>Admin WJ</span>
          <span>•</span>
          <span>Luminárias WJ · +55 11 99999-0000</span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto h-[calc(100vh-48px)] max-w-[1600px]">
        {activeTab === "dashboard" && (
          <div className="h-full border-x p-6 text-neutral-400" style={{ borderColor: theme.border }}>
            <div className="text-sm">Dashboard (placeholder)</div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-full">
            <ConversationsPanel />
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="h-full border-x p-6 text-neutral-400" style={{ borderColor: theme.border }}>
            <div className="text-sm">Contatos (placeholder)</div>
          </div>
        )}
        {activeTab === "templates" && (
          <div className="h-full border-x p-6 text-neutral-400" style={{ borderColor: theme.border }}>
            <div className="text-sm">Templates (placeholder)</div>
          </div>
        )}
        {activeTab === "blast" && (
          <div className="h-full border-x p-6 text-neutral-400" style={{ borderColor: theme.border }}>
            <div className="text-sm">Disparo (placeholder)</div>
          </div>
        )}
        {activeTab === "accounts" && (
          <div className="h-full border-x p-6 text-neutral-400" style={{ borderColor: theme.border }}>
            <div className="text-sm">Contas (placeholder)</div>
          </div>
        )}
      </div>
    </div>
  );
}
