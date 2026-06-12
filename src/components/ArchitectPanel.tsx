import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, FileCode, Server, Cloud, 
  Search, ShieldAlert, CheckCircle2, ChevronRight, Code 
} from "lucide-react";
import { RAW_POSTGRES_SCHEMA, ELASTICSEARCH_MAPPING } from "../data/schemas";
import { ThemeVariant } from "../types";

interface ArchitectPanelProps {
  currentTheme: ThemeVariant;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchitectPanel({ currentTheme, isOpen, onClose }: ArchitectPanelProps) {
  const [activeTab, setActiveTab] = useState<"database" | "tokens" | "elasticsearch" | "services">("database");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copySchemaSql = () => {
    navigator.clipboard.writeText(RAW_POSTGRES_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#0B132B] text-slate-100 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1C2541] rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col border border-slate-700/50 text-left"
        id="architect_blueprint_modal"
      >
        {/* Header Ribbon - High tech cyber navy */}
        <div className="bg-[#0B1528] p-4 flex justify-between items-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase">
                Painel do Arquiteto & Engenheiro de Dados CAS
              </h3>
              <p className="text-[10px] text-slate-400">Varredura e Mapeamento de CustÃ³dia EletrÃ´nica de Longo Prazo (Arquitetura SPFCAS)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 px-3 hover:bg-white/10 text-xs text-slate-300 border border-slate-700 hover:text-white rounded cursor-pointer transition-colors"
          >
            Fechar Inspetor
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-[#151D35] px-4 py-1.5 flex gap-1.5 shrink-0 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "database" ? "bg-orange-500 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            1. PostgreSQL DDL SQL
          </button>

          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "tokens" ? "bg-orange-500 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            2. CSS Variables / Tokens
          </button>

          <button
            onClick={() => setActiveTab("elasticsearch")}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "elasticsearch" ? "bg-orange-500 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            3. Elasticsearch JSON Map
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === "services" ? "bg-orange-500 text-white shadow-md" : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            4. S3 & Backend flow
          </button>
        </div>

        {/* Central Display */}
        <div className="flex-1 overflow-auto p-6 bg-[#0E1528]">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: PostgreSQL DDL Script */}
            {activeTab === "database" && (
              <motion.div
                key="database"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center bg-[#1E293B] p-3 rounded-lg border border-slate-700">
                  <div className="text-xs">
                    <span className="font-bold text-orange-400 block truncate">Modelo Relacional de Integridade CAS</span>
                    <span className="text-slate-400">Tabelas mapeando Processo, Documento, CustÃ³dia Multipessoal, ComentÃ¡rios, Blocos e UsuÃ¡rios.</span>
                  </div>
                  <button 
                    onClick={copySchemaSql}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    {copied ? "âœ“ Copiado!" : "Copiar SQL Script"}
                  </button>
                </div>

                <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4 overflow-y-auto max-h-[55vh]">
                  <pre className="font-mono text-[10.5px] leading-relaxed text-slate-300 whitespace-pre overflow-x-auto select-text">
                    {RAW_POSTGRES_SCHEMA}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* TAB 2: CSS variables and design tokens */}
            {/* TAB 2: CSS variables and design tokens */}
            {activeTab === "tokens" && (
              <motion.div
                key="tokens"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-orange-400">CSS Custom Properties / Design Tokens</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">OrquestraÃ§Ã£o em tempo real das cores da FundaÃ§Ã£o CAS mapeadas no Tailwind v4</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Token List definitions */}
                  <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                    <h5 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-3">Tabela de Variáveis Design Tokens</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="font-mono text-orange-400 block">--color-primary</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Cor corporativa FundaÃ§Ã£o CAS (CabeÃ§alhos principais, botÃµes de aÃ§Ã£o e menu lateral).</p>
                        <span className="font-bold mt-1 text-[11px] block text-sky-400">Ativo atual: {currentTheme.primary}</span>
                      </div>
                      <hr className="border-slate-800/40" />
                      <div>
                        <span className="font-mono text-orange-400 block">--color-accent (Dourado/Amarelo Ouro)</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Destaques secundÃ¡rios, Ã­cones de status, bordas de foco ativas e estilizaÃ§Ã£o do logo.</p>
                        <span className="font-bold mt-1 text-[11px] block text-sky-400">Ativo atual: {currentTheme.secondary}</span>
                      </div>
                      <hr className="border-slate-800/40" />
                      <div>
                        <span className="font-mono text-orange-400 block">--bg-desktop (Ãrea de Trabalho)</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Fundo da aplicaÃ§Ã£o, dividindo as colunas de controle para evitar fadiga ocular.</p>
                        <span className="font-bold mt-1 text-[11px] block text-sky-400">Ativo atual: {currentTheme.bgDesktop}</span>
                      </div>
                      <hr className="border-slate-800/40" />
                      <div>
                        <span className="font-mono text-orange-400 block">--bg-paper (Ãrea dos Documentos)</span>
                        <p className="text-slate-400 text-[11px] mt-0.5">Fundo dedicado das folhas e visualizaÃ§Ãµes de documentos (Branco Puro ou Marfim).</p>
                        <span className="font-bold mt-1 text-[11px] block text-sky-400">Ativo atual: {currentTheme.bgPaper}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual implementation snippet */}
                  <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                    <h5 className="font-bold text-slate-300 border-b border-slate-800 pb-2 mb-3">Mapeamento em Tailwind v4 CSS</h5>
                    <pre className="font-mono text-[10.5px] leading-relaxed text-indigo-300">
{`@theme {
  --color-brand-fcas: ${currentTheme.primary};
  --color-accent-fcas: ${currentTheme.secondary};
  --color-bg-desktop: ${currentTheme.bgDesktop};
  --color-bg-paper: ${currentTheme.bgPaper};
  
  --font-sans: "Inter", system-ui;
  --font-mono: "JetBrains Mono", monospace;
}

/* AplicaÃ§Ã£o dinÃ¢mica local */
.spfcas-workspace {
  background-color: var(--color-bg-desktop);
  color: ${currentTheme.textPrimary};
}

.spfcas-paper-sheet {
  background-color: var(--color-bg-paper);
  color: #111111;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}`}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: Elasticsearch mapping index JSON */}
            {activeTab === "elasticsearch" && (
              <motion.div
                key="elasticsearch"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4"
              >
                <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-orange-400 text-xs">Mapeamento de Ãndice Elasticsearch</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">IndexaÃ§Ã£o de documentos internos/externos com analisadores de radicais e lÃ©xicos da lÃ­ngua portuguesa</p>
                </div>

                <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4 overflow-y-auto max-h-[50vh]">
                  <pre className="font-mono text-[10.5px] leading-relaxed text-slate-300 whitespace-pre overflow-x-auto select-text">
                    {JSON.stringify(ELASTICSEARCH_MAPPING, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* TAB 5: S3 storage and high performance architecture */}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-4 text-xs"
              >
                <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700">
                  <h4 className="font-bold text-orange-400">Arquitetura de MicrosserviÃ§os e Object Storage S3 (PDF/A)</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Pipeline de conversÃ£o e ciclo de vida fÃ­sico de dados imutÃ¡veis da FundaÃ§Ã£o CAS</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* S3 Lifecycle Card */}
                  <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                    <Cloud className="w-6 h-6 text-emerald-400 mb-2" />
                    <h5 className="font-bold text-slate-200 mb-1">CustÃ³dia S3 CompatÃ­vel</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Documentos externos e PDFs/A convertidos sÃ£o armazenados com criptografia nativa no Bucket S3 (ex: MinIO ou AWS S3).
                    </p>
                    <ul className="mt-2 pl-4 list-disc text-[10px] space-y-1 text-slate-300">
                      <li>Versionamento Estrito habilitado.</li>
                      <li>Imutabilidade (WORM object lock).</li>
                      <li>ReplicaÃ§Ã£o cruzada redundante de emergÃªncia.</li>
                    </ul>
                  </div>

                  {/* NestJS PDF/A compilation flow */}
                  <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                    <Server className="w-6 h-6 text-indigo-400 mb-2" />
                    <h5 className="font-bold text-slate-200 mb-1">NestJS High Performance</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      MicrosserviÃ§os especializados lidam com streams de buffers rÃ¡pidos, convertendo HTML gerados para o padrÃ£o legal de preservaÃ§Ã£o **PDF/A-1a** (PDFA) via esqueleto do motor chromium.
                    </p>
                    <ul className="mt-2 pl-4 list-disc text-[10px] space-y-1 text-slate-300">
                      <li>Varrer buffers com Streams e Pipes.</li>
                      <li>InjeÃ§Ã£o direta de metadados XMP no PDF/A.</li>
                    </ul>
                  </div>

                  {/* Elasticsearch pipeline audit card */}
                  <div className="bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                    <ShieldAlert className="w-6 h-6 text-[#004A99] mb-2" />
                    <h5 className="font-bold text-slate-200 mb-1">Varredura Textual</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      O Elasticsearch funciona acoplado ao PostgreSQL: cada novo documento assinado Ã© espelhado em streams textuais imediatos.
                    </p>
                    <ul className="mt-2 pl-4 list-disc text-[10px] space-y-1 text-slate-300">
                      <li>Term vectors para destaque em tempo real.</li>
                      <li>PreservaÃ§Ã£o auditÃ¡vel de trilhas de auditoria imutÃ¡veis.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

