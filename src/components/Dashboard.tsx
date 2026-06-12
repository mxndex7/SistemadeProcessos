import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, PlayCircle, Eye, FolderCheck, Briefcase, Clock, 
  BarChart3, Star, Users, Bookmark, Home, Search, Milestone, 
  Ban, CalendarClock, FileCode, Menu, ChevronLeft, ChevronRight,
  User, Bell, HelpCircle, Power, SearchCode, Settings, Calendar,
  CheckCircle2, FolderInput, MailOpen, Landmark, RotateCcw, AlertTriangle, ToggleLeft, ToggleRight,
  Shield, Database, Moon, Sun
} from "lucide-react";
import { PrioridadeProcesso, Processo, ThemeVariant, StatusRetorno, Usuario } from "../types";
import { INITIAL_UNIDADES, INITIAL_USUARIOS } from "../data/schemas";
import SecurityArchitectureDoc from "./SecurityArchitectureDoc";
import AuditLogView from "./AuditLogView";
import fcasLogo from "../assets/logofcas.png";
import { getNextDocumentNumber } from "../utils/documentNumbering";

// Mapping icons dynamically for menu
const ICON_MAP: Record<string, any> = {
  Home, PlayCircle, Eye, FolderCheck, Briefcase, Clock, FileText,
  BarChart3, Star, Users, Bookmark, Search, Milestone, Ban, CalendarClock, FileCode, Settings,
  FolderInput, RotateCcw
};

const MENU_ITEMS = [
  { label: "Controle de Processos", key: "Controle de Processos", icon: "FileText" },
  { label: "Processos Recebidos", key: "Processos Recebidos", icon: "FolderInput" },
  { label: "Processos Gerados", key: "Processos Gerados", icon: "PlayCircle" },
  { label: "Criar Memorando", key: "Criar Memorando", icon: "FileCode" },
  { label: "Histórico", key: "Histórico", icon: "RotateCcw" },
  { label: "Pesquisa Avançada", key: "Pesquisa Avançada", icon: "Search" },
  { label: "Blocos de Trabalho", key: "Blocos de Trabalho", icon: "Briefcase" },
  { label: "Controle de Prazos", key: "Controle de Prazos", icon: "Clock" },
  { label: "Retorno Programado", key: "Retorno Programado", icon: "CalendarClock" },
  { label: "Estatística", key: "Estatística", icon: "BarChart3" },
  { label: "Grupos", key: "Grupos", icon: "Users" },
  { label: "Marcadores", key: "Marcadores", icon: "Bookmark" },
  { label: "Favoritos", key: "Favoritos", icon: "Star" },
  { label: "Painel de Controle (Arquiteto)", key: "Painel de Controle", icon: "Home", isTiOnly: true },
  { label: "Painel de T.I (Admin)", key: "Painel de T.I", icon: "Settings", isTiOnly: true },
  { label: "Painel de Controle", key: "Painel de Controle Comum", icon: "Settings", isUserOnly: true }
];

interface DashboardProps {
  theme: ThemeVariant;
  usuarioNome: string;
  usuarioLogin: string;
  unidadeSigla: string;
  usuarioRole: "ROLE_USER" | "ROLE_TI_ADMIN";
  onLogout: () => void;
  processos: Processo[];
  onSelectProcesso: (processoId: string) => void;
  onIniciarProcesso: (tipo: string) => void;
  onOpenSearch: () => void;
  onOpenArchitect: () => void;
  isDarkTheme: boolean;
  onToggleDarkTheme: () => void;
  onBatchConclude: (ids: string[]) => void;
  onBatchAddMarcador: (ids: string[], marcadorNome: string, marcadorCor: string) => void;
  localUsuarios: Usuario[];
  onUsuariosUpdate: React.Dispatch<React.SetStateAction<Usuario[]>>;
  onUpdateProcesso?: (updated: Processo) => void;
}

export default function Dashboard({ 
  theme, usuarioNome, usuarioLogin, unidadeSigla, usuarioRole, onLogout,
  processos, onSelectProcesso, onIniciarProcesso, onOpenSearch, onOpenArchitect,
  isDarkTheme, onToggleDarkTheme, onBatchConclude, onBatchAddMarcador,
  localUsuarios, onUsuariosUpdate, onUpdateProcesso
}: DashboardProps) {
  const [sidebarRetracted, setSidebarRetracted] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [selectedMenuKey, setSelectedMenuKey] = useState("Controle de Processos");
  
  // Custom dashboard control panel state (configurable toggles reminiscent of SPFCAS UI)
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [quickLabelFilter, setQuickLabelFilter] = useState("TODOS");

  // Local list of active user account statuses to show dynamic manipulation
  const [activeStatuses, setActiveStatuses] = useState<Record<string, boolean>>({
    "rafael.almeida": true,
    "helena.silva": true,
    "clarice.mendes": true,
    "lucas.viana": true
  });

  // Simulated live audit log feed mimicking backend Express router auth security intercepts
  const [auditLogs, setAuditLogs] = useState([
    { timestamp: "2026-06-07 00:01:12", ip: "192.168.10.45", route: "GET /api/v1/processos", user: "rafael.almeida", role: "ROLE_USER", status: "APPROVED", info: "Acesso autorizado à mesa de controle" },
    { timestamp: "2026-06-07 00:03:45", ip: "192.168.10.12", route: "GET /api/v1/admin/logs", user: "helena.silva", role: "ROLE_USER", status: "BLOCKED_403", info: "Interceptado por AuthGuard: Permissão insuficiente" },
    { timestamp: "2026-06-07 00:05:01", ip: "10.0.4.88", route: "POST /api/v1/processos/iniciar", user: "clarice.mendes", role: "ROLE_USER", status: "APPROVED", info: "Processo orçamentário inicializado com sucesso" },
    { timestamp: "2026-06-07 00:11:22", ip: "192.168.15.109", route: "DELETE /db/tables/truncate", user: "lucas.viana", role: "ROLE_TI_ADMIN", status: "APPROVED", info: "Acesso total concedido. Purga e reindexação concluída" },
    { timestamp: "2026-06-07 00:15:30", ip: "192.168.10.45", route: "GET /api/v1/admin/configs", user: "rafael.almeida", role: "ROLE_USER", status: "BLOCKED_403", info: "Acesso negado à infraestrutura global" },
  ]);

  // Form states for adding people
  const [newUserName, setNewUserName] = useState("");
  const [newUserLogin, setNewUserLogin] = useState("");
  const [newUserCargo, setNewUserCargo] = useState("");
  const [newUserUnidade, setNewUserUnidade] = useState("GER-ADM");
  const [newUserRole, setNewUserRole] = useState<"ROLE_USER" | "ROLE_TI_ADMIN">("ROLE_USER");
  const [newUserCpf, setNewUserCpf] = useState("");
  const [newUserMatricula, setNewUserMatricula] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [inspectedHash, setInspectedHash] = useState<string | null>(null);
  const [inspectedName, setInspectedName] = useState<string | null>(null);

  // States for password alteration form inside Painel de Controle Comum
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isLoggingOutSec, setIsLoggingOutSec] = useState<number | null>(null);

  // Active sub-tab under T.I Admin workspace
  const [adminActiveTab, setAdminActiveTab] = useState<"sandbox" | "security" | "audit">("sandbox");

  // Filter logs locally
  const [logFilter, setLogFilter] = useState<"ALL" | "APPROVED" | "BLOCKED">("ALL");

  // Custom interactive sub-views states
  const [favoritedIds, setFavoritedIds] = useState<string[]>(["proc-2", "proc-3"]);
  const [memoSelectedProcessId, setMemoSelectedProcessId] = useState<string>("");
  const [memoNumber, setMemoNumber] = useState<string>("");
  const [memoRecipient, setMemoRecipient] = useState<string>("");
  const [memoRecipientSector, setMemoRecipientSector] = useState<string>("");
  const [memoSubject, setMemoSubject] = useState<string>("");
  const [memoContent, setMemoContent] = useState<string>("Tendo em vista as diretivas de otimização de segurança SPFCAS, certifico por meio deste ato a plena conformidade de todos os trâmites sob as chaves criptográficas institucionais.");
  const [memoAccess, setMemoAccess] = useState<string>("Público");
  const [memoSuccessMsg, setMemoSuccessMsg] = useState<string>("");
  const [activeHistoricoTab, setActiveHistoricoTab] = useState<"tramites" | "audit">("tramites");
  const [selectedGrupoUnit, setSelectedGrupoUnit] = useState<string>("GER-ADM");
  const [pesquisaTerm, setPesquisaTerm] = useState<string>("");
  const [pesquisaUnit, setPesquisaUnit] = useState<string>("TODAS");
  const [pesquisaAccess, setPesquisaAccess] = useState<string>("TODOS");
  const nextMemoNumber = getNextDocumentNumber(processos, unidadeSigla, "Memorando");

  const getPriorityConfig = (prioridade?: PrioridadeProcesso) => {
    if (prioridade === "alta") {
      return { label: "Alta", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" };
    }
    if (prioridade === "media") {
      return { label: "Média", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" };
    }
    return { label: "Baixa", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" };
  };

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (item.isTiOnly && usuarioRole !== "ROLE_TI_ADMIN") return false;
    if ((item as any).isUserOnly && usuarioRole !== "ROLE_USER") return false;
    return item.label.toLowerCase().includes(menuSearchQuery.toLowerCase());
  });

  // Sync state from location hash to support direct typing & route guards
  React.useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (hash === "#painel-ti") {
        if (usuarioRole === "ROLE_TI_ADMIN") {
          setSelectedMenuKey("Painel de T.I");
        } else {
          // Redirect unauthorized users typing hash directly back to the initial desk view
          window.location.hash = "";
          setSelectedMenuKey("Controle de Processos");
        }
      } else if (hash === "#painel-de-controle" || hash === "#arquiteto") {
        if (usuarioRole === "ROLE_TI_ADMIN") {
          onOpenArchitect();
        } else {
          window.location.hash = "";
          setSelectedMenuKey("Controle de Processos");
        }
      } else if (hash === "#painel-comum") {
        if (usuarioRole === "ROLE_USER") {
          setSelectedMenuKey("Painel de Controle Comum");
        } else {
          window.location.hash = "";
          setSelectedMenuKey("Controle de Processos");
        }
      } else if (hash === "#processos-recebidos") {
        setSelectedMenuKey("Processos Recebidos");
      } else if (hash === "#processos-gerados") {
        setSelectedMenuKey("Processos Gerados");
      } else if (hash === "#criar-memorando") {
        setSelectedMenuKey("Criar Memorando");
      } else if (hash === "#historico") {
        setSelectedMenuKey("Histórico");
      } else if (hash === "" || hash === "#controle-processos" || hash === "#home" || hash === "#/") {
        setSelectedMenuKey("Controle de Processos");
      }
    };

    window.addEventListener("hashchange", handleHashSync);
    handleHashSync(); // initial check

    return () => {
      window.removeEventListener("hashchange", handleHashSync);
    };
  }, [usuarioRole, onOpenArchitect]);

  // Guard to prevent common users from staying on admin views / routes and vice-versa
  React.useEffect(() => {
    if (usuarioRole !== "ROLE_TI_ADMIN") {
      if (selectedMenuKey === "Painel de T.I" || selectedMenuKey === "Painel de Controle") {
        setSelectedMenuKey("Controle de Processos");
        window.location.hash = "";
      }
    } else {
      if (selectedMenuKey === "Painel de Controle Comum") {
        setSelectedMenuKey("Controle de Processos");
        window.location.hash = "";
      }
    }
  }, [usuarioRole, selectedMenuKey]);

  const getCurrentDestinationUnit = (processo: Processo) => {
    const latestTramitacao = processo.historicoTramitacoes[processo.historicoTramitacoes.length - 1];
    return latestTramitacao?.destino || processo.unidadeGeradora;
  };

  // Divide processes between received and generated
  // Received: current custody destination is this unit and it was generated elsewhere
  // Generated: generator is the current unit, including sent-but-not-received processes
  const processosRecebidos = processos.filter(
    (p) => getCurrentDestinationUnit(p) === unidadeSigla && p.unidadeGeradora !== unidadeSigla && !p.estaConcluido
  );
  const processosGerados = processos.filter(
    (p) => p.unidadeGeradora === unidadeSigla && !p.estaConcluido
  );

  // Filter application
  const applyDashboardFilters = (list: Processo[]) => {
    let result = list;
    if (showOnlyUnread) {
      result = result.filter((p) => !p.lido);
    }
    if (showUrgentOnly) {
      result = result.filter((p) => p.marcadorNome === "PRIORITÁRIO" || p.bloqueadoTramite);
    }
    if (quickLabelFilter !== "TODOS") {
      result = result.filter((p) => p.nivelAcesso === quickLabelFilter);
    }
    if (globalSearchQuery.trim()) {
      const q = globalSearchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.nup.toLowerCase().includes(q) ||
          p.tipo.toLowerCase().includes(q) ||
          p.especificacao.toLowerCase().includes(q) ||
          p.interessados.toLowerCase().includes(q)
      );
    }
    return result;
  };

  const finalRecebidos = applyDashboardFilters(processosRecebidos);
  const finalGerados = applyDashboardFilters(processosGerados);

  const toggleSelectProcesso = (id: string) => {
    setSelectedProcessIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (list: Processo[], isSelected: boolean) => {
    if (isSelected) {
      const ids = list.map((p) => p.id);
      setSelectedProcessIds((prev) => Array.from(new Set([...prev, ...ids])));
    } else {
      const idsToRemove = list.map((p) => p.id);
      setSelectedProcessIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
    }
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchQuery.trim()) {
      onOpenSearch();
    }
  };

  const triggerBatchConclude = () => {
    if (selectedProcessIds.length === 0) return;
    onBatchConclude(selectedProcessIds);
    setSelectedProcessIds([]);
  };

  const triggerBatchMarcador = (marcador: string, cor: string) => {
    if (selectedProcessIds.length === 0) return;
    onBatchAddMarcador(selectedProcessIds, marcador, cor);
    setSelectedProcessIds([]);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserLogin.trim() || !newUserMatricula.trim() || !newUserCpf.trim() || !newUserEmail.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Add to state registry
    const newUserObj = {
      id: `usr-${Date.now()}`,
      login: newUserLogin.trim().toLowerCase(),
      nome: newUserName.trim(),
      cargo: newUserCargo.trim() || "Colaborador",
      unidade: newUserUnidade,
      matricula: newUserMatricula.trim(),
      cpf: newUserCpf.trim(),
      fone: "(11) 99000-1122",
      email: newUserEmail.trim(),
      role: newUserRole
    };
    
    onUsuariosUpdate(prev => [...prev, newUserObj]);
    setActiveStatuses(prev => ({ ...prev, [newUserObj.login]: true }));
    
    // Log telemetry
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = {
      timestamp: now,
      ip: "10.150.12.89",
      route: "POST /api/v1/cadastro/pessoas",
      user: usuarioNome.toLowerCase().replace(/\s+/g, '.'),
      role: usuarioRole,
      status: "APPROVED",
      info: `Usuário '${newUserObj.login}' cadastrado com perfil ${newUserObj.role} e status Ativo`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Reset form
    setNewUserName("");
    setNewUserLogin("");
    setNewUserCargo("");
    setNewUserCpf("");
    setNewUserMatricula("");
    setNewUserEmail("");
    setFormSuccess("Colaborador cadastrado no sistema SPFCAS com sucesso!");
    setTimeout(() => setFormSuccess(""), 4000);
  };

  // Styled helper for unit name in header
  const matchedUnitObj = INITIAL_UNIDADES.find(u => u.sigla === unidadeSigla);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: "#F4F7FA", color: "#00264D" }}>
      
      {/* 1. BARRA SUPERIOR (HEADER) */}
      <header 
        className="h-14 flex items-center justify-between px-4 sticky top-0 z-40 border-b shadow-sm transition-colors"
        style={{ backgroundColor: "#00264D", color: "#FFFFFF", borderColor: "#D9E2EC" }}
        id="dashboard_header"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarRetracted(!sidebarRetracted)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            id="toggle_sidebar_btn"
            title={sidebarRetracted ? "Expandir Menu" : "Recolher Menu"}
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          
            <button
              onClick={() => {
                window.location.hash = "";
                setSelectedMenuKey("Controle de Processos");
              }}
              className="flex items-center gap-2 select-none text-left cursor-pointer hover:opacity-90 transition-opacity"
              title="Voltar para Mesa Virtual de Controle"
              id="spfcas_brand_logo_btn"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 bg-white overflow-hidden shadow-sm">
                <img src={fcasLogo} alt="Logo FCAS" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="font-extrabold text-sm tracking-widest uppercase text-white">
                  SPFCAS
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-85 text-white">
                  Fundação CAS
                </span>
              </div>
            </button>
        </div>

        {/* Global Search Interface */}
        <form onSubmit={handleGlobalSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <input 
              type="text"
              placeholder="Pesquisa rápida de processos (palavras-chave ou NUP)..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full text-xs py-1.5 pl-3 pr-8 rounded-full border focus:outline-none transition-all placeholder:text-white/70"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.20)",
                color: "#FFFFFF",
              }}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1.5 p-0.5 text-white/70 hover:text-white focus:outline-none cursor-pointer"
              title="Pesquisa avançada"
            >
              <Search className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </form>

        {/* Rigth Operations area */}
        <div className="flex items-center gap-3 text-xs md:text-sm">
          {/* Fixed unit selected during login */}
          <div className="flex items-center gap-1.5 rounded border border-white/15 bg-white/10 px-2 py-1" title={matchedUnitObj?.nome}>
            <Landmark className="w-4 h-4 text-white md:block hidden" />
            <span className="text-xs font-extrabold text-white">{unidadeSigla}</span>
          </div>

          <div className="h-5 w-px bg-white/20" />

          {/* User profile dropdown simulator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium md:inline hidden text-white opacity-90">{usuarioNome}</span>
            <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center font-bold text-xs text-white">
              RA
            </span>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onToggleDarkTheme} 
              className="p-1 px-2 text-xs font-semibold rounded hover:bg-white/10 border border-white/20 flex items-center gap-1 cursor-pointer transition-colors text-white"
              title={isDarkTheme ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-white" /> : <Moon className="w-3.5 h-3.5 text-white" />}
              <span className="sm:inline hidden">{isDarkTheme ? "Claro" : "Dark"}</span>
            </button>

            <button 
              onClick={onOpenArchitect} 
              className="p-1 px-2 text-xs font-semibold rounded hover:bg-white/10 border border-white/20 flex items-center gap-1 cursor-pointer transition-colors text-white"
              title="Estrutura de dados das tabelas"
            >
              <SearchCode className="w-3.5 h-3.5 text-white" />
              <span className="sm:inline hidden">Arquiteto</span>
            </button>

            <button 
              onClick={onLogout} 
              className="p-1.5 text-xs font-semibold rounded-full hover:bg-red-500/20 text-red-100 cursor-pointer transition-colors"
              title="Encerrar Sessão"
            >
              <Power className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. AREA CENTRAL DO TRABALHO */}
      <div className="flex-1 flex relative">
        
        {/* a) MENU RETRÁTIL ESQUERDO (ALPHABETICAL ORDER AND SEARCH) */}
        <aside 
          className="transition-all duration-300 flex flex-col z-30 select-none shrink-0"
          style={{ 
            width: sidebarRetracted ? "0px" : "240px",
            borderRight: "1px solid #D9E2EC", 
            backgroundColor: "#FFFFFF",
            opacity: sidebarRetracted ? 0 : 1,
            pointerEvents: sidebarRetracted ? "none" : "auto"
          }}
          id="sidebar_menu"
        >
          {/* Menu Search Field */}
          {!sidebarRetracted && (
            <div className="p-3 border-b border-[#D9E2EC]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pesquisar no Menu..." 
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full text-xs py-1.5 pl-2 pr-7 rounded border border-[#D9E2EC] focus:outline-none focus:ring-1 focus:ring-opacity-50"
                  style={{ backgroundColor: "#F4F7FA", color: "#00264D" }}
                  id="menu_search_input"
                />
                <Search className="w-3.5 h-3.5 absolute right-2 top-2 text-[#64748B] opacity-70" />
              </div>
            </div>
          )}

          {/* Menu list */}
          <nav className="flex-1 overflow-y-auto py-2">
            {!sidebarRetracted && filteredMenuItems.map((item) => {
              const IconComponent = ICON_MAP[item.icon] || FileText;
              const isActive = item.key === selectedMenuKey;
              
              // Set customized actions
              const handleMenuClick = () => {
                setSelectedMenuKey(item.key);
                if (item.key === "Iniciar Processo") {
                  onIniciarProcesso("Generativo Comum");
                } else if (item.key === "Pesquisa Avançada") {
                  onOpenSearch();
                } else if (item.key === "Painel de Controle") {
                  window.location.hash = "painel-de-controle";
                  onOpenArchitect(); // Redirect to database inspector!
                } else if (item.key === "Painel de T.I") {
                  window.location.hash = "painel-ti";
                } else if (item.key === "Processos Recebidos") {
                  window.location.hash = "processos-recebidos";
                } else if (item.key === "Processos Gerados") {
                  window.location.hash = "processos-gerados";
                } else if (item.key === "Criar Memorando") {
                  window.location.hash = "criar-memorando";
                } else if (item.key === "Histórico") {
                  window.location.hash = "historico";
                } else if (item.key === "Controle de Processos") {
                  window.location.hash = "";
                  // Resets filters
                  setShowOnlyUnread(false);
                  setShowUrgentOnly(false);
                  setQuickLabelFilter("TODOS");
                }
              };

              const showLock = item.isTiOnly && usuarioRole !== "ROLE_TI_ADMIN";

              const activeBg = isDarkTheme ? "#1E293B" : "#EDF4FF";
              const activeBorder = isDarkTheme ? "#38BDF8" : "#00264D";
              const itemColor = isActive
                ? (isDarkTheme ? "#F8FAFC" : "#00264D")
                : (isDarkTheme ? "#E5E7EB" : "#00264D");

              return (
                <button
                  key={item.label}
                  onClick={handleMenuClick}
                  className="w-full text-left px-4 py-2 hover:bg-[#EDF4FF]/50 dark:hover:bg-slate-800/80 hover:text-[#004A99] dark:hover:text-sky-200 text-xs flex items-center justify-between transition-all cursor-pointer group"
                  style={
                    isActive 
                      ? {
                          backgroundColor: activeBg,
                          borderLeft: `4px solid ${activeBorder}`,
                          fontWeight: "600",
                          color: itemColor
                        }
                      : {
                          borderLeft: "4px solid transparent",
                          color: itemColor
                        }
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" style={{ color: "inherit" }} />
                    <span className="truncate group-hover:translate-x-0.5 transition-transform" style={{ color: "inherit" }}>
                      {item.label}
                    </span>
                  </div>
                  {showLock && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shadow-sm scale-90 select-none uppercase tracking-wide flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                      <Shield className="w-2.5 h-2.5" /> BLOQ
                    </span>
                  )}
                </button>
              );
            })}
            
            {!sidebarRetracted && filteredMenuItems.length === 0 && (
              <p className="text-[11px] text-center mt-6 px-4 italic opacity-60 text-[#64748B]">Nenhum atalho encontrado.</p>
            )}
          </nav>

          {/* Unit branding block */}
          {!sidebarRetracted && (
            <div className="p-3 border-t border-[#D9E2EC] text-[10px] text-center" style={{ backgroundColor: "#F4F7FA" }}>
              <div className="font-mono text-xs font-bold leading-tight text-[#00264D]">
                {unidadeSigla} / CAS
              </div>
              <p className="text-[9px] mt-0.5 truncate opacity-70 text-[#64748B]" title={matchedUnitObj?.nome}>
                {matchedUnitObj?.nome}
              </p>
            </div>
          )}
        </aside>

        {/* Quick button indicator to reveal sidebar if retracted */}
        {sidebarRetracted && (
          <button 
            onClick={() => setSidebarRetracted(false)}
            className="absolute left-0 top-1/3 p-1 rounded-r-md border border-l-0 shadow z-30 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
            title="Expandir Menu"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* b) ÁREA LATERAL PRINCIPAL: DASHBOARD DUAL COLUMNS AND PANEL */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full" id="main_virtual_workspace">
          
          {selectedMenuKey === "Painel de T.I" ? (
            renderTiAdminPanel()
          ) : selectedMenuKey === "Painel de Controle Comum" ? (
            renderUserControlPanel()
          ) : selectedMenuKey === "Processos Recebidos" ? (
            renderProcessosRecebidosPanel()
          ) : selectedMenuKey === "Processos Gerados" ? (
            renderProcessosGeradosPanel()
          ) : selectedMenuKey === "Criar Memorando" ? (
            renderCriarMemorandoPanel()
          ) : selectedMenuKey === "Histórico" ? (
            renderHistoricoPanel()
          ) : selectedMenuKey === "Pesquisa Avançada" ? (
            renderPesquisaAvancadaPanel()
          ) : selectedMenuKey === "Blocos de Trabalho" ? (
            renderBlocosDeTrabalhoPanel()
          ) : selectedMenuKey === "Controle de Prazos" ? (
            renderControleDePrazosPanel()
          ) : selectedMenuKey === "Retorno Programado" ? (
            renderRetornoProgramadoPanel()
          ) : selectedMenuKey === "Estatística" ? (
            renderEstatisticaPanel()
          ) : selectedMenuKey === "Grupos" ? (
            renderGruposPanel()
          ) : selectedMenuKey === "Marcadores" ? (
            renderMarcadoresPanel()
          ) : selectedMenuKey === "Favoritos" ? (
            renderFavoritosPanel()
          ) : (
            <div className="space-y-6">
              {/* HEADER DO PAINEL DE CONTROLE / BATCH ACTIONS */}
              <div 
                className="p-5 rounded-xl border mb-6 transition-all duration-300 shadow-sm"
                style={{ backgroundColor: "#FFFFFF", borderColor: "#D9E2EC", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" }}
              >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-[48px] font-bold tracking-tight text-[#00264D] leading-tight mb-1">Mesa Virtual de Controle</h2>
                <p className="text-xs text-[#64748B] font-medium">Atas, portarias, investigações e monitorações regulamentares Fundação CAS</p>
              </div>

              {/* Advanced customizable dashboard options */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                  className="px-2.5 py-1 text-xs rounded border border-[#D9E2EC] flex items-center gap-1.5 cursor-pointer transition-colors"
                  style={{ 
                    backgroundColor: showOnlyUnread ? "#00264D" : "transparent",
                    color: showOnlyUnread ? "#FFFFFF" : "#00264D"
                  }}
                >
                  <MailOpen className="w-3.5 h-3.5" />
                  <span>Não Lidos</span>
                </button>

                <button
                  onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                  className="px-2.5 py-1 text-xs rounded border border-[#D9E2EC] flex items-center gap-1.5 cursor-pointer transition-colors"
                  style={{ 
                    backgroundColor: showUrgentOnly ? "#004A99" : "transparent",
                    color: showUrgentOnly ? "#FFFFFF" : "#00264D"
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Prioritários</span>
                </button>

                {/* Dropdown filters representing NivelAcesso */}
                <div className="flex items-center border border-[#D9E2EC] rounded px-1">
                  <span className="text-[10px] font-semibold px-2 uppercase tracking-wide opacity-60 text-[#64748B]">Nível</span>
                  <select 
                    value={quickLabelFilter}
                    onChange={(e) => setQuickLabelFilter(e.target.value)}
                    className="p-1 text-xs font-semibold focus:outline-none bg-transparent cursor-pointer text-[#00264D]"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="Público">Público</option>
                    <option value="Restrito">Restrito</option>
                    <option value="Sigiloso">Sigiloso</option>
                  </select>
                </div>

                {/* Create Process main action button */}
                <button
                  onClick={() => onIniciarProcesso("Generativo Comum")}
                  className="py-2 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all hover:bg-[#004A99] active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#00264D", color: "#FFFFFF", border: "none" }}
                  id="btn_iniciar_processo"
                >
                  <PlayCircle className="w-4 h-4 text-white" />
                  Iniciar Processo
                </button>
              </div>
            </div>

            {/* BATCH ACTION CONTROLS / SELECTION MANAGER (Activated when checkbox checked) */}
            {selectedProcessIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3"
                style={{ borderColor: theme.border }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary, color: "white" }}>
                    {selectedProcessIds.length}
                  </span>
                  <span className="text-xs font-medium">processo(s) selecionado(s) para operação em lote:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={triggerBatchConclude}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir na Unidade
                  </button>

                  <button
                    onClick={() => triggerBatchMarcador("PRIORITÁRIO", "vermelho")}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Exigir Prioridade
                  </button>

                  <button
                    onClick={() => triggerBatchMarcador("EM ANÁLISE", "azul")}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Marcar em Análise
                  </button>

                  <button
                    onClick={() => setSelectedProcessIds([])}
                    className="px-2.5 py-1 rounded text-xs font-medium border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderColor: theme.border }}
                  >
                    Cancelar Seleção
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* DUAL COLUMN PROCESS GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* COLUNA 1: PROCESSOS RECEBIDOS (Recebidos de outras unidades) */}
            <div 
              className="p-5 flex flex-col transition-all duration-300"
              style={{ 
                backgroundColor: "#FFFFFF", 
                border: "1px solid #D9E2EC", 
                borderRadius: "12px", 
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" 
              }}
              id="col_processos_recebidos"
            >
              <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: "#D9E2EC" }}>
                <div className="flex items-center gap-2">
                  <FolderInput className="w-5 h-5 text-[#004A99]" />
                  <h3 className="font-semibold text-base text-[#00264D] tracking-tight">Processos Recebidos ({finalRecebidos.length})</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="opacity-75 text-[11px] text-[#64748B] font-medium">Selecionar tudo</span>
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-[#00264D] cursor-pointer"
                    checked={finalRecebidos.length > 0 && finalRecebidos.every(p => selectedProcessIds.includes(p.id))}
                    onChange={(e) => handleSelectAll(finalRecebidos, e.target.checked)}
                  />
                </div>
              </div>

              {/* Processes list */}
              <div className="space-y-2.5 flex-1 min-h-[300px]">
                {finalRecebidos.map((processo) => renderProcessRow(processo))}
                
                {finalRecebidos.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-16 text-center opacity-65 text-[#64748B]">
                    <MailOpen className="w-10 h-10 mb-2 stroke-1 text-[#00264D]" />
                    <p className="text-xs font-semibold text-[#00264D]">Tudo lido! Nenhum processo recebido pendente.</p>
                    <p className="text-[10px] mt-0.5">Processos de outras autarquias aparecerão detalhados aqui.</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA 2: PROCESSOS GERADOS (Gerados pela própria unidade) */}
            <div 
              className="p-5 flex flex-col transition-all duration-300"
              style={{ 
                backgroundColor: "#FFFFFF", 
                border: "1px solid #D9E2EC", 
                borderRadius: "12px", 
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)" 
              }}
              id="col_processos_gerados"
            >
              <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: "#D9E2EC" }}>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#004A99]" />
                  <h3 className="font-semibold text-base text-[#00264D] tracking-tight">Processos Gerados ({finalGerados.length})</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="opacity-75 text-[11px] text-[#64748B] font-medium">Selecionar tudo</span>
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-[#00264D] cursor-pointer"
                    checked={finalGerados.length > 0 && finalGerados.every(p => selectedProcessIds.includes(p.id))}
                    onChange={(e) => handleSelectAll(finalGerados, e.target.checked)}
                  />
                </div>
              </div>

              {/* Processes list */}
              <div className="space-y-2.5 flex-1 min-h-[300px]">
                {finalGerados.map((processo) => renderProcessRow(processo))}
                
                {finalGerados.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-16 text-center opacity-65 text-[#64748B]">
                    <FileText className="w-10 h-10 mb-2 stroke-1 text-[#00264D]" />
                    <p className="text-xs font-semibold text-[#00264D]">Sua unidade não gerou processos ativos.</p>
                    <p className="text-[10px] mt-0.5">Inicie um expediente eletrônico clicando em "Iniciar Processo".</p>
                  </div>
                )}
              </div>
            </div>

            </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  // Helper renderer to render each single row in received or generated lists
  function renderProcessRow(processo: Processo) {
    const isSelected = selectedProcessIds.includes(processo.id);
    const hasUnread = !processo.lido;

    // Level style mappings using cold blue corporate palette
    let accessBorder = "border-l-4 border-l-[#D9E2EC]";
    if (processo.nivelAcesso === "Restrito") accessBorder = "border-l-4 border-l-[#004A99]";
    if (processo.nivelAcesso === "Sigiloso") accessBorder = "border-l-4 border-l-[#00264D]";

    // Dynamic marker colors based on SPFCAS standards (no gold/orange/yellow!)
    let tagBg = "bg-[#EDF4FF] text-[#004A99] border border-[#D9E2EC]";
    if (processo.marcadorCor === "vermelho") tagBg = "bg-slate-100 text-slate-800 border border-slate-300";
    if (processo.marcadorCor === "dourado") tagBg = "bg-sky-100 text-[#00264D] border border-sky-200";

    const accessBadgeColor =
      processo.nivelAcesso === "Público"
        ? "#16A34A"
        : processo.nivelAcesso === "Restrito"
          ? "#004A99"
          : processo.nivelAcesso === "Sigiloso"
            ? "#DC2626"
            : "#64748B";

    // Determine cascade deadline schedule status if any
    const latestTramitacao = processo.historicoTramitacoes[processo.historicoTramitacoes.length - 1];
    const retorno = latestTramitacao?.retornoProgramado;
    const isRestrictedToOtherUser =
      latestTramitacao?.despachoRestrito &&
      latestTramitacao.destino === unidadeSigla &&
      !latestTramitacao.usuariosPermitidos?.includes(usuarioLogin);
    const priorityConfig = getPriorityConfig(processo.prioridade);

    return (
      <div
        key={processo.id}
        className={`p-3 rounded-[10px] border flex gap-3 items-start transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,38,77,0.08)] ${accessBorder} ${
          isSelected ? "bg-[#EDF4FF] ring-1 ring-[#004A99]" : "bg-white"
        }`}
        style={{ borderColor: "#E2E8F0" }}
        id={`proc_row_${processo.id}`}
      >
        <div className="pt-0.5 select-none text-left">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#00264D] cursor-pointer rounded"
            checked={isSelected}
            onChange={() => toggleSelectProcesso(processo.id)}
          />
        </div>

        {/* Info cluster */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {/* Number of protocol clicked triggers view detail */}
            <span
              onClick={() => onSelectProcesso(processo.id)}
              className={`text-xs font-mono font-bold hover:underline cursor-pointer tracking-wider ${
                hasUnread ? "text-[#004A99] font-black text-[13px]" : ""
              }`}
              style={{ color: hasUnread ? "#004A99" : "#00264D" }}
              title={hasUnread ? "PROCESSO NÃO LIDO NA UNIDADE" : "Ver árvore do processo"}
            >
              {processo.nup}
            </span>

            {/* Originating Unit label */}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F4F7FA] font-semibold text-[#64748B]">
              {processo.unidadeGeradora}
            </span>

            {/* Level label */}
            <span className="text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold text-white leading-none" style={{
              backgroundColor: accessBadgeColor
            }}>
              {processo.nivelAcesso}
            </span>

            {/* In-use customized marker / Tag labels */}
            {processo.marcadorNome && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 leading-none ${tagBg}`} title={processo.marcadorTexto}>
                <Bookmark className="w-2.5 h-2.5 fill-current" />
                {processo.marcadorNome}
              </span>
            )}

            <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold leading-none border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
              Prioridade {priorityConfig.label}
            </span>

            {latestTramitacao?.despachoRestrito && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold leading-none border flex items-center gap-1 ${
                isRestrictedToOtherUser
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                <Shield className="w-2.5 h-2.5" />
                {isRestrictedToOtherUser ? "Restrito" : "Liberado"}
              </span>
            )}

            {/* Cascade Deadline (Retorno Programado) indicators */}
            {retorno && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 leading-none ${
                retorno.status === StatusRetorno.PRAZO_EXPIRADO 
                  ? "bg-slate-200 text-slate-800 border border-slate-300"
                  : retorno.status === StatusRetorno.RETORNO_CUMPRIDO
                  ? "bg-sky-100 text-sky-800 border border-sky-200"
                  : "bg-slate-100 text-[#00264D] border border-[#D9E2EC]"
              }`} title={`Devolução limite: ${retorno.dataLimite}`}>
                <CalendarClock className="w-2.5 h-2.5" />
                {retorno.status} ({retorno.dataLimite})
              </span>
            )}

            {/* Blocked for external tramites indicator */}
            {processo.bloqueadoTramite && (
              <span className="text-[9px] bg-sky-200 text-[#00264D] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 border border-sky-300 leading-none" title="Processo bloqueado na unidade por trâmite externo">
                <Ban className="w-2.5 h-2.5" />
                Bloqueado
              </span>
            )}
          </div>

          <h4 className="text-xs font-bold leading-tight truncate text-gray-800 dark:text-gray-100">
            {processo.tipo}
          </h4>
          <p className="text-[10px] mt-0.5 line-clamp-1 opacity-80 leading-relaxed">
            {processo.especificacao || "Sem descrição secundária."}
          </p>
          <div className="flex gap-2 items-center text-[9px] mt-1.5 opacity-65 font-mono">
            <span>Interessado: {processo.interessados}</span>
            <span>•</span>
            <span>Instaurado em: {new Date(processo.dataGeracao).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Favoritar toggler */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFavoritedIds(prev => 
              prev.includes(processo.id) 
                ? prev.filter(id => id !== processo.id) 
                : [...prev, processo.id]
            );
          }}
          className="p-1 px-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors self-center cursor-pointer text-slate-400 hover:text-amber-500 transition-all active:scale-90"
          title={favoritedIds.includes(processo.id) ? "Remover dos favoritos" : "Marcar como favorito"}
        >
          <Star className={`w-4 h-4 ${favoritedIds.includes(processo.id) ? "fill-amber-400 text-amber-500" : "opacity-45"}`} />
        </button>

        {/* Right Arrow go to tree */}
        <button
          onClick={() => onSelectProcesso(processo.id)}
          className={`p-1 px-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors self-center cursor-pointer ${
            isRestrictedToOtherUser ? "text-red-500" : ""
          }`}
          title={isRestrictedToOtherUser ? "Resumo visível, acesso documental restrito" : "Abrir árvore documental"}
        >
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>
      </div>
    );
  }

  // Renders the common user's control panel (profile view + secure password alteration)
  function renderUserControlPanel() {
    const currentUserObj = localUsuarios.find(u => u.nome === usuarioNome) || 
                           localUsuarios.find(u => u.nome.toLowerCase().includes(usuarioNome.toLowerCase())) || 
                           localUsuarios[0];

    // Password criteria helpers
    const condLength = newPassword.length >= 8;
    const condUpper = /[A-Z]/.test(newPassword);
    const condLower = /[a-z]/.test(newPassword);
    const condNum = /[0-9]/.test(newPassword);
    const condSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(newPassword);

    const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError("");
      setPasswordSuccess("");

      if (!currentPassword) {
        setPasswordError("Sua senha atual é obrigatória para validar esta operação.");
        return;
      }

      if (!condLength || !condUpper || !condLower || !condNum || !condSpecial) {
        setPasswordError("Sua nova senha não atende a todos os critérios de complexidade exigidos pela Fundação CAS.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("A confirmação da nova senha não confere.");
        return;
      }

      // Successful password change scenario!
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        timestamp: now,
        ip: "192.168.10.45",
        route: "POST /api/v1/auth/password-reset",
        user: usuarioNome.toLowerCase().replace(/\s+/g, '.'),
        role: usuarioRole,
        status: "APPROVED",
        info: "Alteração de senha realizada com sucesso."
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setPasswordSuccess("Senha corporativa atualizada com pleno sucesso! Como protocolo de segurança SPFCAS, sua sessão será finalizada em instantes.");
      
      // Start countdown
      let count = 3;
      setIsLoggingOutSec(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timer);
          onLogout();
        } else {
          setIsLoggingOutSec(count);
        }
      }, 1000);
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
        id="painel-controle-comum-container"
      >
        {/* Banner */}
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border border-[#001D3D] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-200 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                Mesa Virtual / Autoatendimento
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                Conexão Segura SSL/TLS
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Painel de Controle do Colaborador</h2>
            <p className="text-xs text-sky-200/80">Consulte seus dados de custódia Fundação CAS ou atualize suas credenciais corporativas com validação redundante.</p>
          </div>
          <button
            onClick={() => {
              window.location.hash = "";
              setSelectedMenuKey("Controle de Processos");
            }}
            className="px-4 py-2 hover:bg-white/10 text-white rounded-lg border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Voltar para Mesa Virtual
          </button>
        </div>

        {/* 2 Slices: Static Profile Data and password alteration form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Section A: Static Profile (5 Cols) */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-[#D9E2EC] text-left">
                <User className="w-5 h-5 text-[#00264D]" />
                <h3 className="font-bold text-[#00264D] text-sm">Dados Funcionais do Servidor</h3>
              </div>

              {/* Avatar decoration */}
              <div className="flex items-center gap-4 text-left">
                <div className="w-14 h-14 rounded-full bg-[#EDF4FF] border border-[#D9E2EC] flex items-center justify-center font-bold text-[#00264D] text-lg">
                  {usuarioNome.split(" ").map(w => w[0]).join("").substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-[#00264D] text-sm leading-tight">{currentUserObj?.nome || usuarioNome}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{currentUserObj?.cargo || "Colaborador da Fundação"}</p>
                </div>
              </div>

              {/* Specifications block */}
              <div className="space-y-3.5 pt-2 text-left">
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">Matrícula do Servidor</label>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{currentUserObj?.matricula || "CAS-9212-B"}</p>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">Setor / Gerência Atribuidor</label>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{currentUserObj?.unidade || unidadeSigla} - Fundação CAS</p>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">E-mail Corporativo</label>
                  <p className="text-xs font-mono text-slate-800 mt-0.5">{currentUserObj?.email || "atendimento@fundacaocas.org.br"}</p>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">Nível de Privilégio (RBAC)</label>
                  <span className="inline-block text-[9px] font-bold bg-sky-100 text-[#004A99] border border-sky-200 px-2 py-0.5 mt-1 rounded uppercase tracking-wide">
                    {usuarioRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9E2EC] mt-6 text-left">
              <p className="text-[10px] text-slate-400 leading-normal">
                Sua ficha de identificação é atualizada centralizadamente pela Gerência de Recursos Humanos. Se houver discrepância, acione o time de suporte da DITEC.
              </p>
            </div>
          </div>

          {/* Section B: Alteration of Password (7 Cols) */}
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-[#D9E2EC] shadow-sm text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-[#D9E2EC] mb-5">
              <Shield className="w-5 h-5 text-[#00264D]" />
              <h3 className="font-bold text-[#00264D] text-sm">Atualização de Credencial de Acesso</h3>
            </div>

            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2 leading-relaxed"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{passwordError}</span>
              </motion.div>
            )}

            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold space-y-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-900">Sucesso na Modificação da Senha</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  {passwordSuccess}
                </p>
                {isLoggingOutSec !== null && (
                  <div className="p-2 bg-emerald-100 rounded-lg border border-emerald-200 text-center font-bold text-xs flex items-center justify-center gap-2 mt-2 animate-pulse text-emerald-900">
                    <Power className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Desconectando a sessão corporativa em {isLoggingOutSec} segundos...</span>
                  </div>
                )}
              </motion.div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Senha Atual</label>
                <input
                  type="password"
                  disabled={isLoggingOutSec !== null}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Insira a senha em vigor"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-[#00264D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    disabled={isLoggingOutSec !== null}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-[#00264D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    disabled={isLoggingOutSec !== null}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-[#00264D]"
                  />
                </div>
              </div>

              {/* Password complexity metrics */}
              <div className="bg-[#F4F7FA] p-3.5 rounded-lg border border-[#D9E2EC] space-y-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Requisitos de Senha Segura (DITEC/CAS)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${condLength ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={condLength ? "text-emerald-800 font-semibold" : "text-slate-500"}>Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${condUpper ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={condUpper ? "text-emerald-800 font-semibold" : "text-slate-500"}>Letra maiúscula (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${condLower ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={condLower ? "text-emerald-800 font-semibold" : "text-slate-500"}>Letra minúscula (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${condNum ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={condNum ? "text-emerald-800 font-semibold" : "text-slate-500"}>Pelo menos um número</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${condSpecial ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={condSpecial ? "text-emerald-800 font-semibold" : "text-slate-500"}>Caractere especial (@, #, $)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoggingOutSec !== null}
                  className="px-5 py-2.5 bg-[#00264D] hover:bg-[#004A99] active:bg-[#001D3D] text-white text-xs font-bold rounded-lg tracking-wide shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Nova Senha Corporativa
                </button>
              </div>
            </form>
          </div>

        </div>

      </motion.div>
    );
  }

  // ==== PORTFOLIO OF INTERACTIVE VIEWS FOR EVERY DAILY-USE MENU OPTION ====

  function renderProcessosRecebidosPanel() {
    return (
      <div className="space-y-6 text-left">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#00264D] to-[#004A99] text-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-sky-500/25 border border-sky-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-sky-200 uppercase font-mono">
                Mesa Operacional / Recebidos
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-1.5">Processos Recebidos na Unidade</h2>
              <p className="text-xs text-sky-100 opacity-90 font-medium">Expedientes administrativos instaurados externamente e remetidos à Fundação CAS para análise.</p>
            </div>
            <button
              onClick={() => setSelectedMenuKey("Controle de Processos")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 select-none text-white rounded-lg border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mesa de Controle Integrada
            </button>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border" style={{ borderColor: "#D9E2EC" }}>
          <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: "#D9E2EC" }}>
            <div className="flex items-center gap-2">
              <FolderInput className="w-5 h-5 text-[#004A99]" />
              <h3 className="font-semibold text-base text-[#00264D]">Acervo de Entrada ({finalRecebidos.length} ativos)</h3>
            </div>
            {finalRecebidos.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="opacity-75 text-[11px] text-[#64748B] font-medium">Selecionar todos</span>
                <input 
                  type="checkbox"
                  className="w-4 h-4 accent-[#00264D] cursor-pointer"
                  checked={finalRecebidos.length > 0 && finalRecebidos.every(p => selectedProcessIds.includes(p.id))}
                  onChange={(e) => handleSelectAll(finalRecebidos, e.target.checked)}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {finalRecebidos.map((processo) => renderProcessRow(processo))}
            
            {finalRecebidos.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center opacity-65 text-[#64748B]">
                <MailOpen className="w-12 h-12 mb-3 stroke-1 text-[#00264D]" />
                <p className="text-sm font-semibold text-[#00264D]">Nenhum expediente recebido pendente!</p>
                <p className="text-xs mt-0.5">Todos os processos encaminhados sob monitoramento já foram lidos.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderProcessosGeradosPanel() {
    return (
      <div className="space-y-6 text-left">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#00264D] to-[#013A63] text-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-sky-500/25 border border-sky-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-sky-200 uppercase font-mono">
                Mesa Operacional / Iniciados
              </span>
              <h2 className="text-2xl font-bold tracking-tight mt-1.5">Processos Gerados pela Unidade</h2>
              <p className="text-xs text-sky-100 opacity-90 font-medium">Expedientes criados por {unidadeSigla} com chaves criptográficas ativas no banco de dados regional.</p>
            </div>
            <button
              onClick={() => onIniciarProcesso("Generativo Comum")}
              className="py-2 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 bg-white text-[#00264D] hover:bg-sky-100 transition-all shadow"
            >
              <PlayCircle className="w-4 h-4 text-[#00264D]" />
              Novo Expediente
            </button>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border" style={{ borderColor: "#D9E2EC" }}>
          <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: "#D9E2EC" }}>
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-[#004A99]" />
              <h3 className="font-semibold text-base text-[#00264D]">Expedientes da Unidade ({finalGerados.length} processos)</h3>
            </div>
            {finalGerados.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="opacity-75 text-[11px] text-[#64748B] font-medium">Selecionar todos</span>
                <input 
                  type="checkbox"
                  className="w-4 h-4 accent-[#00264D] cursor-pointer"
                  checked={finalGerados.length > 0 && finalGerados.every(p => selectedProcessIds.includes(p.id))}
                  onChange={(e) => handleSelectAll(finalGerados, e.target.checked)}
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {finalGerados.map((processo) => renderProcessRow(processo))}
            
            {finalGerados.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center opacity-65 text-[#64748B]">
                <FileText className="w-12 h-12 mb-3 stroke-1 text-[#00264D]" />
                <p className="text-sm font-semibold text-[#00264D]">Nenhum expediente gerado por esta unidade.</p>
                <p className="text-xs mt-0.5">Clique em "Novo Expediente" para iniciar uma autuação.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCriarMemorandoPanel() {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const formatOfficialDate = (date: Date) =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);

    const handleAddMemorando = (e: React.FormEvent) => {
      e.preventDefault();
      setMemoSuccessMsg("");

      const parentProcess =
        processos.find(p => p.id === memoSelectedProcessId) ||
        processos.find(p => p.unidadeGeradora === unidadeSigla && !p.estaConcluido) ||
        processos.find(p => !p.estaConcluido) ||
        processos[0];

      if (!parentProcess) {
        alert("Não há processo disponível para anexar o Memorando.");
        return;
      }

      if (!memoSubject.trim()) {
        alert("O assunto do Memorando é obrigatório.");
        return;
      }

      if (!memoRecipient.trim() || !memoRecipientSector.trim()) {
        alert("Preencha destinatário e setor destinatário.");
        return;
      }

      const newDocId = `doc-${Date.now()}`;
      const memoNumberValue = String(nextMemoNumber);
      const seiNum = `MEMORANDO ${memoNumberValue} (${Math.floor(100000 + Math.random() * 900000)})`;
      const currentDate = new Date();
      const safeMemoNumber = escapeHtml(`${memoNumberValue}/${currentDate.getFullYear()}`);
      const safeRecipient = escapeHtml(memoRecipient.trim());
      const safeRecipientSector = escapeHtml(memoRecipientSector.trim());
      const safeSubject = escapeHtml(memoSubject.trim());
      const safeContent = escapeHtml(memoContent.trim()).split("\n").join("<br />");
      const safeUser = escapeHtml(usuarioNome);
      const safeUnit = escapeHtml(unidadeSigla);

      const newDoc: any = {
        id: newDocId,
        seiNumero: seiNum,
        titulo: `Memorando nº ${memoNumberValue} - ${memoSubject}`,
        tipo: "Memorando",
        formato: "Interno",
        unidadeGeradora: unidadeSigla,
        criador: usuarioNome,
        dataCriacao: new Date().toISOString(),
        nivelAcesso: memoAccess,
        conteudoHtml: `
          <div class="fcas-header-print" style="text-align:center;font-family:Georgia,'Times New Roman',serif;margin:0 auto 48px auto;color:#000;">
            <img src="${fcasLogo}" alt="Logo FCAS" style="display:block;margin:0 auto 10px auto;width:92px;height:92px;object-fit:contain;" />
            <h2 style="margin:0;font-size:16px;font-weight:500;line-height:1.25;text-transform:uppercase;">FCAS - FUNDAÇÃO DE APOIO AO CENTRO DE ASSISTÊNCIA SOCIAL DA PMPE</h2>
            <p style="margin:0;font-size:11px;line-height:1.25;">Endereço: Rua Guilherme Pinto, n 155, bairro do Derby, Recife - PE, CEP: 52010-200 CNPJ: 32.928.258/0001-49</p>
            <p style="margin:0;font-size:11px;line-height:1.25;">Email: <u>fundacaocas@gmail.com</u> / Contato: (81) 98713-4377</p>
          </div><!-- END_FCAS_HEADER_MARKER -->

          <div style="font-family:Georgia,'Times New Roman',serif;color:#000;font-size:15px;line-height:1.65;">
            <p style="font-weight:700;margin:0 0 34px 0;">Memorando. nº ${safeMemoNumber} - ${safeUnit} - FCAS</p>
            <p style="text-align:right;font-weight:700;margin:0 0 34px 0;">Recife, ${formatOfficialDate(currentDate)}.</p>
            <p style="margin:0 0 8px 0;"><strong>Ao(a) Senhor(a):</strong> ${safeRecipient}</p>
            <p style="margin:0 0 8px 0;"><strong>Setor destinatário:</strong> ${safeRecipientSector}</p>
            <p style="margin:0 0 30px 0;"><strong>Assunto:</strong> ${safeSubject}</p>
            <p style="text-align:justify;text-indent:2cm;margin:0 0 22px 0;">${safeContent}</p>
            <p style="text-align:center;margin:52px 0 0 0;">Atenciosamente,</p>
            <p style="text-align:center;margin:42px 0 0 0;"><strong>${safeUser}</strong><br />${safeUnit} - Fundação CAS</p>
          </div>`,
        assinado: false,
        assinantes: [],
        nomeNaArvore: `Memorando ${memoNumberValue} - ${memoSubject}`
      };

      const updatedProcess = {
        ...parentProcess,
        documentos: [...parentProcess.documentos, newDoc]
      };

      if (onUpdateProcesso) {
        onUpdateProcesso(updatedProcess);
      }

      const auditNow = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        timestamp: auditNow,
        ip: "192.168.1.18",
        route: `POST /api/v1/processos/${parentProcess.id}/documents`,
        user: usuarioNome.toLowerCase().replace(/\s+/g, "."),
        role: usuarioRole,
        status: "APPROVED",
        info: `Memorando ${seiNum} adicionado ao processo NUP: ${parentProcess.nup}`
      };
      setAuditLogs(prev => [newLog, ...prev]);

      setMemoSuccessMsg(`Memorando Oficial ${seiNum} anexado ao NUP ${parentProcess.nup} com integridade garantida no PostgreSQL.`);
      setMemoSelectedProcessId(parentProcess.id);
      setMemoRecipient("");
      setMemoRecipientSector("");
      setMemoSubject("");
    };

    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border border-slate-700 shadow-md flex justify-between items-center">
          <div>
            <span className="bg-[#12B76A]/20 text-[#12B76A] border border-[#12B76A]/35 px-3 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-extrabold uppercase">
              Expediente Digital
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-1.5 font-sans">Criar Memorando Oficial</h2>
            <p className="text-xs text-sky-100 opacity-80">Elabore um instrumento de comunicação interna indexado automaticamente a um processo ativo da unidade.</p>
          </div>
          <FileCode className="w-8 h-8 text-white/30" />
        </div>

        {memoSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex flex-col gap-1 shadow-sm"
          >
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Memorando Autuado com Pleno Sucesso!
            </div>
            <div>{memoSuccessMsg}</div>
            <button
              onClick={() => {
                setMemoSuccessMsg("");
                onSelectProcesso(memoSelectedProcessId);
              }}
              className="mt-3 self-start text-[11px] font-extrabold underline text-emerald-950 cursor-pointer text-left"
            >
              Visualizar Árvore do Processo com Novo Documento ➔
            </button>
          </motion.div>
        )}

        <div className="p-6 bg-white border rounded-xl shadow-sm" style={{ borderColor: "#D9E2EC" }}>
          <form onSubmit={handleAddMemorando} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Nível de Restrição do Documento</label>
              <select
                value={memoAccess}
                onChange={(e) => setMemoAccess(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-[#F4F7FA] text-[#00264D] focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white transition-all cursor-pointer font-semibold"
              >
                <option value="Público">Público (Irrestrito)</option>
                <option value="Restrito">Restrito (Unidade)</option>
                <option value="Sigiloso">Sigiloso (Supervisionado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Número do Memorando</label>
              <input
                type="text"
                value={`${nextMemoNumber}/${new Date().getFullYear()} - ${unidadeSigla}`}
                readOnly
                className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-slate-100 text-[#00264D] focus:outline-none transition-all font-extrabold cursor-not-allowed"
              />
              <p className="text-[10px] mt-1 text-[#64748B] font-medium">
                Sequência automática da unidade {unidadeSigla}; se o último memorando foi 43, este será 44.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Destinatário *</label>
                <input
                  type="text"
                  placeholder="Nome da pessoa destinatária"
                  value={memoRecipient}
                  onChange={(e) => setMemoRecipient(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-[#F4F7FA] text-[#00264D] focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white transition-all font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Setor Destinatário *</label>
                <input
                  type="text"
                  placeholder="Ex. Gerência Administrativa"
                  value={memoRecipientSector}
                  onChange={(e) => setMemoRecipientSector(e.target.value)}
                  className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-[#F4F7FA] text-[#00264D] focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white transition-all font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Assunto / Tópico Principal *</label>
              <input
                type="text"
                placeholder="Ex. Providência imediata com convênio social dos beneficiários inativos"
                value={memoSubject}
                onChange={(e) => setMemoSubject(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-[#F4F7FA] text-[#00264D] focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white transition-all font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase font-sans">Minuta e Texto do Expediente</label>
              <textarea
                rows={6}
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                className="w-full text-xs p-3.5 font-sans rounded border border-[#D9E2EC] bg-slate-50 text-slate-800 focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white transition-all leading-relaxed shadow-inner"
              />
            </div>

            <div className="pt-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono text-[#64748B]">
              <div>
                Rascunho assinado eletronicamente por: <span className="font-extrabold text-[#00264D]">{usuarioNome} ({unidadeSigla})</span>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#00264D] hover:bg-[#004A99] active:scale-95 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm"
              >
                Gerar e Autuar Memorando
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderHistoricoPanel() {
    const flattenedTramites = processos.flatMap(p => 
      p.historicoTramitacoes.map(t => ({
        nup: p.nup,
        processId: p.id,
        tipo: p.tipo,
        ...t
      }))
    );
    const sortedTramites = [...flattenedTramites].sort((a, b) => 
      new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime()
    );

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border border-slate-700 shadow-md flex justify-between items-center">
          <div>
            <span className="bg-sky-500/25 border border-sky-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-sky-200 uppercase font-mono">
              Monitoramento Analítico
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-1.5 font-sans">Logs de Auditoria & Histórico Geral</h2>
            <p className="text-xs text-sky-100 opacity-95 font-medium">Histórico completo de trâmites de processos na Fundação CAS e trilha de segurança dos middlewares.</p>
          </div>
          <RotateCcw className="w-8 h-8 text-white/30" />
        </div>

        <div className="flex border-b border-slate-200 gap-1 select-none">
          <button
            onClick={() => setActiveHistoricoTab("tramites")}
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeHistoricoTab === "tramites" 
                ? "border-[#00264D] text-[#00264D] font-extrabold bg-blue-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <FolderInput className="w-3.5 h-3.5" />
            Histórico de Trâmites de Processos ({sortedTramites.length})
          </button>

          <button
            onClick={() => setActiveHistoricoTab("audit")}
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeHistoricoTab === "audit" 
                ? "border-[#00264D] text-[#00264D] font-extrabold bg-blue-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Terminal de Segurança do Servidor ({auditLogs.length})
          </button>
        </div>

        {activeHistoricoTab === "tramites" ? (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: "#D9E2EC" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-600 text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F7FA] border-b text-[#00264D] font-bold" style={{ borderColor: "#D9E2EC" }}>
                    <th className="p-3">Protocolo NUP</th>
                    <th className="p-3">Expediente</th>
                    <th className="p-3">Origem</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3">Usuário Remetente</th>
                    <th className="p-3">Data Envio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortedTramites.map((tram, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <button 
                          onClick={() => onSelectProcesso(tram.processId)}
                          className="font-mono font-bold text-[#004A99] hover:underline cursor-pointer"
                        >
                          {tram.nup}
                        </button>
                      </td>
                      <td className="p-3 truncate max-w-xs text-slate-700" title={tram.tipo}>{tram.tipo}</td>
                      <td className="p-3 font-semibold text-slate-800">{tram.origem}</td>
                      <td className="p-3 font-semibold text-sky-800">{tram.destino}</td>
                      <td className="p-3 italic">{tram.usuario}</td>
                      <td className="p-3 font-mono text-slate-500">{new Date(tram.dataEnvio).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs leading-relaxed">
              <strong>Mecanismo de Interceptação da Autenticação Ativo:</strong> Todo acesso a views e rotas restritas é submetido ao 
              middleware Express <code>AuthGuard</code> integrado que audita papéis RBAC e emite alertas corporativos na Fundaçao CAS.
            </div>
            
            <div className="bg-neutral-950 text-[#F1F1F1] rounded-xl font-mono text-xs border border-neutral-800 shadow-2xl p-5">
              <div className="flex flex-wrap justify-between items-center border-b border-neutral-900 pb-3 mb-4 gap-2">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#004A99]" />
                  Servidor Logs: sys_express_gateway.log
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setLogFilter("ALL")} className={`px-2.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${logFilter === "ALL" ? "bg-[#333] border-gray-600" : "border-[#333]"}`}>Todos</button>
                  <button onClick={() => setLogFilter("APPROVED")} className={`px-2.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${logFilter === "APPROVED" ? "bg-emerald-900/30 border-emerald-950" : "border-[#333]"}`}>Autorizados</button>
                  <button onClick={() => setLogFilter("BLOCKED")} className={`px-2.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${logFilter === "BLOCKED" ? "bg-red-900/30 border-red-950" : "border-[#333]"}`}>Alvos Interceptados</button>
                </div>
              </div>

              <div className="space-y-1 max-h-72 overflow-y-auto font-mono text-[11px]">
                  {auditLogs.filter(l => {
                    if (logFilter === "APPROVED") return l.status === "APPROVED";
                    if (logFilter === "BLOCKED") return l.status === "BLOCKED_403";
                    return true;
                  }).map((log, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between hover:bg-neutral-900 py-1 border-b border-neutral-900 leading-tight gap-2">
                      <span>
                        <span className="text-gray-500">[{log.timestamp}]</span> <span className="text-sky-400">{log.ip}</span> <span className="text-blue-300 font-bold">{log.route}</span> <span className="text-slate-400">({log.user})</span> - {log.info}
                      </span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-extrabold self-start sm:self-center ${log.status === "APPROVED" ? "text-green-400 bg-green-950/20" : "text-red-400 bg-red-950/20"}`}>
                        {log.status === "APPROVED" ? "ALLOW 200" : "DENY 403"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderPesquisaAvancadaPanel() {
    const handleQuickSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
    };

    const searchFiltered = processos.filter(p => {
      const matchText = !pesquisaTerm ? true : (
        p.nup.toLowerCase().includes(pesquisaTerm.toLowerCase()) ||
        p.tipo.toLowerCase().includes(pesquisaTerm.toLowerCase()) ||
        p.especificacao.toLowerCase().includes(pesquisaTerm.toLowerCase()) ||
        p.interessados.toLowerCase().includes(pesquisaTerm.toLowerCase())
      );
      const matchUnit = pesquisaUnit === "TODAS" ? true : p.unidadeGeradora === pesquisaUnit;
      const matchAccess = pesquisaAccess === "TODOS" ? true : p.nivelAcesso === pesquisaAccess;
      return matchText && matchUnit && matchAccess;
    });

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm">
          <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase">
            Elasticsearch Grounded / Indexing
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 font-sans">Pesquisa Avançada de Custódia</h2>
          <p className="text-xs text-sky-100 opacity-90 mt-0.5">Busca textual global em tempo real no banco relacional da Fundação CAS.</p>
        </div>

        <div className="p-5 bg-white rounded-xl border" style={{ borderColor: "#D9E2EC" }}>
          <form onSubmit={handleQuickSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#00264D] mb-1.5 uppercase">Termo ou Palavra-chave</label>
              <input
                type="text"
                placeholder="Busque por NUP, tipo, interessados..."
                value={pesquisaTerm}
                onChange={(e) => setPesquisaTerm(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-[#D9E2EC] bg-[#F4F7FA] text-[#00264D] focus:ring-1 focus:ring-[#00264D] focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[#00264D] text-xs font-bold mb-1.5 uppercase font-sans">Unidade Custidiante/Geradora</label>
              <select
                value={pesquisaUnit}
                onChange={(e) => setPesquisaUnit(e.target.value)}
                className="w-full text-xs p-2.5 rounded border bg-transparent text-[#00264D] focus:outline-none cursor-pointer border-[#D9E2EC]"
              >
                <option value="TODAS">Todas as Unidades</option>
                {INITIAL_UNIDADES.map(u => (
                  <option key={u.id} value={u.sigla}>{u.sigla} - {u.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#00264D] text-xs font-bold mb-1.5 uppercase font-sans">Nível de Acesso Regulamentar</label>
              <select
                value={pesquisaAccess}
                onChange={(e) => setPesquisaAccess(e.target.value)}
                className="w-full text-xs p-2.5 rounded border bg-transparent text-[#00264D] focus:outline-none cursor-pointer border-[#D9E2EC]"
              >
                <option value="TODOS">Todos os Níveis</option>
                <option value="Público">Público</option>
                <option value="Restrito">Restrito</option>
                <option value="Sigiloso">Sigiloso</option>
              </select>
            </div>
          </form>
        </div>

        <div className="p-5 bg-white rounded-xl border" style={{ borderColor: "#D9E2EC" }}>
          <h3 className="font-bold text-sm text-[#00264D] pb-2 border-b mb-4">Resultados Correspondentes ({searchFiltered.length})</h3>
          
          <div className="space-y-3 font-medium">
            {searchFiltered.map(p => renderProcessRow(p))}

            {searchFiltered.length === 0 && (
              <div className="py-20 text-center text-slate-400 italic">
                Nenhum processo correspondente aos termos de busca encontrados. Refine seus filtros.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderBlocosDeTrabalhoPanel() {
    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
          <div>
            <span className="bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide">
              Módulo Colegiado / Assinaturas em Lote
            </span>
            <h2 className="text-2xl font-bold mt-1 font-sans">Blocos de Trabalho Ativos</h2>
            <p className="text-xs text-sky-200 mt-0.5">Agrupadores de processos para inspeção, reuniões de curadoria ou assinatura multipessoal da COAD.</p>
          </div>
          <Briefcase className="w-8 h-8 text-white/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-white border rounded-xl hover:shadow transition-shadow flex flex-col justify-between" style={{ borderColor: "#D9E2EC" }}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-sky-100 text-[#004A99] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Assinatura Multipessoal</span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">GBE / SEC-EXEC</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">BLOCO 140: Convênios de Reabilitação Social</h4>
              <p className="text-xs text-slate-500 mb-4 font-normal">Reúne expedientes selecionados para certificação de quotas especiais e assistência administrativa.</p>
              
              <div className="space-y-2 border-t pt-3 border-dashed">
                {processos.slice(0, 2).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-[#004A99]">{p.nup}</span>
                    <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{p.tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                alert("Assinaturas do Bloco nº 140 efetuadas em lote no PostgreSQL com registro de metatransação!");
                const nowLog = {
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  ip: "192.168.10.45",
                  route: "POST /api/v1/blocos/signature/coad",
                  user: usuarioNome.toLowerCase(),
                  role: usuarioRole,
                  status: "APPROVED",
                  info: "Bloco de Assinatura 140 assinado coletivamente"
                };
                setAuditLogs(prev => [nowLog, ...prev]);
              }}
              className="mt-6 w-full text-center py-2 bg-[#00264D] hover:bg-[#004A99] text-white text-xs font-bold rounded cursor-pointer transition-colors border-none"
            >
              Assinar Documentos em Lote
            </button>
          </div>

          <div className="p-5 bg-white border rounded-xl hover:shadow transition-shadow flex flex-col justify-between" style={{ borderColor: "#D9E2EC" }}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Trâmite Estrutural</span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">GER-ADM / STI</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">BLOCO 142: Relatório de Providências Técnicas</h4>
              <p className="text-xs text-slate-500 mb-4 font-normal">Recomendações técnicas urgentes do setor de segurança de dados despachados conjuntos.</p>
              
              <div className="space-y-2 border-t pt-3 border-dashed">
                {processos.slice(2, 4).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-[#004A99]">{p.nup}</span>
                    <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{p.tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                alert("Trâmite de processos do Bloco nº 142 despachado em lote.");
              }}
              className="mt-6 w-full text-center py-2 bg-[#00264D] hover:bg-[#004A99] text-white text-xs font-bold rounded cursor-pointer transition-colors border-none"
            >
              Despachar Bloco de Trâmite
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderControleDePrazosPanel() {
    const activeProcesses = processos.filter(p => !p.estaConcluido);

    const handlePriorityChange = (processo: Processo, prioridade: PrioridadeProcesso) => {
      if (!onUpdateProcesso) return;
      onUpdateProcesso({
        ...processo,
        prioridade
      });
    };

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm">
          <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase">
            Tempo & Regulamentos
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 font-sans">Linha do Tempo de Prazos</h2>
          <p className="text-xs text-sky-100 opacity-90 mt-0.5">Varredura de prazos e definição de prioridade operacional por processo.</p>
        </div>

        <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
          <h3 className="font-bold text-sm text-[#00264D] pb-3 border-b mb-4 font-sans">Expedientes Ativos ({activeProcesses.length})</h3>
          
          <div className="space-y-4 font-medium">
            {activeProcesses.map(p => {
              const latest = p.historicoTramitacoes[p.historicoTramitacoes.length - 1];
              const limit = latest?.retornoProgramado;
              const isUrgent = limit?.status === StatusRetorno.PRAZO_EXPIRADO;
              const priorityConfig = getPriorityConfig(p.prioridade);

              return (
                <div key={p.id} className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isUrgent ? "bg-red-50/30 border-red-200" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#004A99]">{p.nup}</span>
                      {limit ? (
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          isUrgent ? "bg-red-100 text-red-700" : "bg-sky-100 text-[#00264D]"
                        }`}>
                          {limit.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full uppercase bg-slate-100 text-slate-500">
                          Sem prazo
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                        Prioridade {priorityConfig.label}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800">{p.tipo}</h5>
                    <p className="text-[10px] text-slate-405 font-mono">
                      {latest ? `Última movimentação: de ${latest.origem} para ${latest.destino}` : `Gerado em ${p.unidadeGeradora}`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Prioridade</p>
                      <select
                        value={p.prioridade || "baixa"}
                        onChange={(e) => handlePriorityChange(p, e.target.value as PrioridadeProcesso)}
                        className={`text-xs font-bold rounded border px-2 py-1.5 bg-white ${priorityConfig.text} ${priorityConfig.border}`}
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Devolução Limite</p>
                      <p className="text-xs font-bold text-[#002649] font-mono">{limit?.dataLimite || "Não definida"}</p>
                    </div>
                    <button
                      onClick={() => onSelectProcesso(p.id)}
                      className="px-3.5 py-1.5 bg-[#00264D] hover:bg-[#004A99] text-white rounded text-xs font-bold cursor-pointer transition-colors border-none"
                    >
                      Inspecionar
                    </button>
                  </div>
                </div>
              );
            })}

            {activeProcesses.length === 0 && (
              <p className="text-xs italic text-center p-8 text-neutral-400 font-sans font-medium">Nenhum processo ativo encontrado no banco de dados.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderRetornoProgramadoPanel() {
    const returnRequests = processos.filter(p => 
      p.historicoTramitacoes.some(t => t.retornoProgramado)
    );

    const fulfillReturn = (pId: string) => {
      const targetProc = processos.find(p => p.id === pId);
      if (!targetProc) return;

      const updatedHistory = targetProc.historicoTramitacoes.map(t => {
        if (t.retornoProgramado) {
          return {
            ...t,
            retornoProgramado: {
              ...t.retornoProgramado,
              status: StatusRetorno.RETORNO_CUMPRIDO
            }
          };
        }
        return t;
      });

      const updatedProcess = {
        ...targetProc,
        historicoTramitacoes: updatedHistory
      };

      if (onUpdateProcesso) {
        onUpdateProcesso(updatedProcess);
      }

      const auditNow = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        timestamp: auditNow,
        ip: "10.0.12.92",
        route: "PATCH /api/v1/processos/retorno/fulfill",
        user: usuarioNome.toLowerCase(),
        role: usuarioRole,
        status: "APPROVED",
        info: `Retorno cumprido e consolidado para processo NUP: ${targetProc.nup}`
      };
      setAuditLogs(prev => [newLog, ...prev]);
      alert(`Retorno Programado para o processo ${targetProc.nup} marcado como Cumprido com sucesso!`);
    };

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm">
          <span className="bg-[#12B76A]/20 text-[#12B76A] border border-[#12B76A]/35 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide font-medium">
            Garantia de Providências
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 font-sans">Acordo de Retorno Programado</h2>
          <p className="text-xs text-sky-100 opacity-95 mt-0.5">Regras e status de devoluções requeridas para validação externa Fundação CAS.</p>
        </div>

        <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#00264D] font-bold border-b" style={{ borderColor: "#D9E2EC" }}>
                  <th className="p-3 font-sans">Processo (NUP)</th>
                  <th className="p-3 font-sans">Destino do Envio</th>
                  <th className="p-3 font-sans">Data Limite</th>
                  <th className="p-3 font-sans">Status Atual</th>
                  <th className="p-3 text-right font-sans">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {returnRequests.map(p => {
                  const latest = p.historicoTramitacoes[p.historicoTramitacoes.length - 1];
                  const ret = latest?.retornoProgramado;
                  if (!ret) return null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#004A99]">
                        <button onClick={() => onSelectProcesso(p.id)} className="hover:underline cursor-pointer">
                          {p.nup}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{latest.destino}</td>
                      <td className="p-3 font-mono text-slate-500">{ret.dataLimite}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.status === StatusRetorno.RETORNO_CUMPRIDO ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : 
                          ret.status === StatusRetorno.PRAZO_EXPIRADO ? "bg-red-50 text-red-700 border border-red-200" : 
                          "bg-sky-50 text-[#00264D] border border-sky-100"
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {ret.status !== StatusRetorno.RETORNO_CUMPRIDO ? (
                          <button
                            onClick={() => fulfillReturn(p.id)}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-extrabold cursor-pointer transition-colors border-none"
                          >
                            Cumprir Devolução
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold font-mono">✓ Arquivado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderEstatisticaPanel() {
    const totalCount = processos.length;
    const concludedCount = processos.filter(p => p.estaConcluido).length;
    const activeCount = totalCount - concludedCount;
    
    const publicoCount = processos.filter(p => p.nivelAcesso === "Público").length;
    const restritoCount = processos.filter(p => p.nivelAcesso === "Restrito").length;
    const sigilosoCount = processos.filter(p => p.nivelAcesso === "Sigiloso").length;

    const publicoPct = totalCount ? Math.round((publicoCount / totalCount) * 100) : 0;
    const restritoPct = totalCount ? Math.round((restritoCount / totalCount) * 105) : 0; // balanced rounded ratio
    const sigilosoPct = totalCount ? (100 - publicoPct - Math.round((restritoCount / totalCount) * 100)) : 0;

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm">
          <span className="bg-[#12B76A]/20 text-[#12B76A] border border-[#12B76A]/35 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide">
            Estatísticas Analíticas SPFCAS
          </span>
          <h2 className="text-2xl font-bold mt-1 font-sans">Carga de Trabalho & Custódia de Dados</h2>
          <p className="text-xs text-sky-100 opacity-90 mt-0.5 font-medium font-sans">Relatórios e percentuais gerados de forma consolidada para auditorias regulamentares Fundação CAS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white border rounded-xl shadow-sm text-left relative overflow-hidden" style={{ borderColor: "#D9E2EC" }}>
            <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Total de Expedientes</h6>
            <div className="text-3xl font-extrabold text-[#00264D] font-mono mt-1">{totalCount}</div>
            <p className="text-[10px] text-[#64748B] mt-1.5 font-sans font-semibold">* 100% integrados no PostgreSQL</p>
          </div>

          <div className="p-5 bg-white border rounded-xl shadow-sm text-left relative overflow-hidden" style={{ borderColor: "#D9E2EC" }}>
            <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Mesa de Trabalho Ativa</h6>
            <div className="text-3xl font-extrabold text-[#004A99] font-mono mt-1">{activeCount}</div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-sans font-semibold">* Aguardando trâmites administrativos</p>
          </div>

          <div className="p-5 bg-white border rounded-xl shadow-sm text-left relative overflow-hidden" style={{ borderColor: "#D9E2EC" }}>
            <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Processos Concluídos</h6>
            <div className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">{concludedCount}</div>
            <p className="text-[10px] text-emerald-600 mt-1.5 font-sans font-semibold">* Histórico e custódia preservados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
            <h4 className="font-bold text-sm text-[#00264D] pb-3 border-b mb-4 font-sans">Distribuição por Nível de Restrição (WCAG Compliant)</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1">
                  <span>Público ({publicoCount})</span>
                  <span>{publicoPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-[#004A99] h-full" style={{ width: `${publicoPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1">
                  <span>Restrito ({restritoCount})</span>
                  <span>{restritoPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-[#64748B] h-full" style={{ width: `${restritoPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono font-bold mb-1">
                  <span>Sigiloso ({sigilosoCount})</span>
                  <span>{sigilosoPct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-[#00264D] h-full" style={{ width: `${sigilosoPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
            <h4 className="font-bold text-sm text-[#00264D] pb-3 border-b mb-4 font-sans">Carga Laboral por Unidades de Custódia (Expedientes)</h4>
            
            <div className="grid grid-cols-5 gap-3 h-40 items-end pt-4 select-none">
              {["DIR-PRES", "DIR-FIN-ADM", "GER-ADM", "GBE", "STI"].map(unit => {
                const count = processos.filter(p => p.unidadeGeradora === unit).length;
                const max = Math.max(1, processos.length);
                const heightPct = Math.round((count / max) * 100);

                return (
                  <div key={unit} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold font-mono text-[#004A99]">{count}</span>
                    <div className="w-full bg-[#00264D] rounded-t hover:bg-[#004A99] transition-all cursor-pointer shadow-sm" style={{ height: `${Math.max(8, heightPct)}%` }} title={`${count} processos em ${unit}`} />
                    <span className="text-[10px] font-extrabold text-slate-500 font-mono">{unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderGruposPanel() {
    const groupUsers = localUsuarios.filter(u => u.unidade === selectedGrupoUnit);

    const toggleStatus = (login: string) => {
      setActiveStatuses(prev => ({
        ...prev,
        [login]: !prev[login]
      }));
      
      const newStatus = activeStatuses[login] === false ? "ATIVO" : "INATIVO";
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLog = {
        timestamp: now,
        ip: "10.100.8.204",
        route: "PATCH /api/v1/usuarios/status/toggle",
        user: usuarioNome.toLowerCase(),
        role: usuarioRole,
        status: "APPROVED",
        info: `Status do usuário '${login}' alterado para ${newStatus}`
      };
      setAuditLogs(prev => [newLog, ...prev]);
    };

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm">
          <span className="bg-[#12B76A]/20 text-[#12B76A] border border-[#12B76A]/35 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide">
            Diretório de Servidores Autárquicos
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 font-sans">Grupos & Unidades Organizacionais</h2>
          <p className="text-xs text-sky-100 opacity-95 mt-0.5 font-medium font-sans">Controle e checagem de privilégios de acessos a pastas de custódia e relatórios regionalizados.</p>
        </div>

        <div className="flex bg-[#E2E8F0] p-1 rounded-lg max-w-lg select-none">
          {["DIR-PRES", "DIR-FIN-ADM", "GER-ADM", "GBE", "STI"].map(unit => (
            <button
              key={unit}
              onClick={() => setSelectedGrupoUnit(unit)}
              className={`flex-1 text-center py-1.5 rounded transition-all text-xs font-bold cursor-pointer border-none ${
                selectedGrupoUnit === unit ? "bg-[#00264D] text-white shadow font-extrabold" : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
          <h3 className="font-bold text-sm text-[#00264D] pb-3 border-b mb-4 font-sans">Profissionais Alocados em {selectedGrupoUnit} ({groupUsers.length})</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-700 text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[#00264D] font-bold border-b" style={{ borderColor: "#D9E2EC" }}>
                  <th className="p-3">Nome do Servidor</th>
                  <th className="p-3 font-mono">Login / Matrícula</th>
                  <th className="p-3 font-sans">Cargo Operacional</th>
                  <th className="p-3 font-sans">Permissão RBAC</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {groupUsers.map(user => {
                  const isActive = activeStatuses[user.login] !== false;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{user.nome}</td>
                      <td className="p-3 font-mono">
                        <div>{user.login}</div>
                        <div className="text-[10px] text-slate-400">MAT: {user.matricula || "192801-X"}</div>
                      </td>
                      <td className="p-3 truncate max-w-xs text-slate-700">{user.cargo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === "ROLE_TI_ADMIN" ? "bg-red-50 text-red-700" : "bg-sky-50 text-[#004A99]"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStatus(user.login)}
                          className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors border ${
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                          title="Clique para alternar o status nos registros"
                        >
                          {isActive ? "Ativo" : "Bloqueado"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderMarcadoresPanel() {
    const processesWithMarkers = processos.filter(p => p.marcadorNome);

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
          <div>
            <span className="bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide">
              Mesa Virtual / Classificações
            </span>
            <h2 className="text-2xl font-bold mt-1 font-sans">Marcadores de Expedientes</h2>
            <p className="text-xs text-sky-100 opacity-95 mt-0.5">Filtros temáticos em lote e tags especiais associadas a portarias regulamentares Fundação CAS.</p>
          </div>
          <Bookmark className="w-8 h-8 text-white/30" />
        </div>

        <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
          <h3 className="font-bold text-[#00264D] text-sm pb-3 border-b mb-4 font-sans">Processos Autuados com Marcadores Ativos</h3>
          
          <div className="space-y-3 font-medium">
            {processesWithMarkers.map(p => renderProcessRow(p))}

            {processesWithMarkers.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center p-8">Nenhum processo rotulado com etiqueta nas bases de dados.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderFavoritosPanel() {
    const favoritedList = processos.filter(p => favoritedIds.includes(p.id));

    return (
      <div className="space-y-6 text-left">
        <div className="bg-[#00264D] text-white p-6 rounded-2xl border border-slate-700 shadow-sm flex justify-between items-center">
          <div>
            <span className="bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-extrabold">
              Área de Trabalho Pessoal / Starred
            </span>
            <h2 className="text-2xl font-bold mt-1 font-sans">Meus Expedientes Favoritos</h2>
            <p className="text-xs text-sky-100 opacity-90 mt-0.5">Expedientes destacados para monitoração preferencial diária.</p>
          </div>
          <Star className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <div className="p-5 bg-white border rounded-xl" style={{ borderColor: "#D9E2EC" }}>
          <h3 className="font-bold text-sm text-[#00264D] pb-3 border-b mb-4 font-sans">Meus Atalhos de Consulta Estrela ({favoritedList.length})</h3>

          <div className="space-y-3 font-medium">
            {favoritedList.map((p) => renderProcessRow(p))}
            
            {favoritedList.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-65 text-[#64748B]">
                <Star className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-[#00264D]">Ainda nenhum processo marcado como favorito.</p>
                <p className="text-xs mt-0.5 font-sans">Destaque os processos cruciais clicando na estrela ao lado de cada registro na Mesa Virtual.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renders the senior software engineer's interactive RBAC sandbox inside SPFCAS
  function renderTiAdminPanel() {
    // -------------------------------------------------------------------------
    // CASE A: USER REJECTED WITH ERRO 403 (USUÁRIO COMUM TRYING TO ACCESS IT AREA)
    // -------------------------------------------------------------------------
    if (usuarioRole !== "ROLE_TI_ADMIN") {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 max-w-4xl mx-auto my-12 rounded-2xl border flex flex-col items-center text-center shadow-xl bg-white border-red-200"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5 animate-pulse text-red-600">
            <Shield className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 text-[11px] font-bold tracking-widest bg-red-100 uppercase rounded-full text-red-700 font-mono mb-2">
            Erro de Segurança: HTTP 403 Forbidden
          </span>

          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 mb-3 font-sans">
            Acesso Negado: Proteção de Rotas Guardada por RBAC
          </h2>

          <div className="max-w-xl text-xs text-neutral-600 space-y-3 leading-relaxed">
            <p>
              O ecossistema <strong>SPFCAS</strong> implementa o modelo de <strong>Controle de Acesso Baseado em Regras (RBAC)</strong>. 
              Sua tentativa de requisitar ou acessar recursos reservados de gerenciamento foi interceptada e abortada.
            </p>

            <div className="p-4 rounded-xl text-left bg-neutral-950 font-mono text-[11px] text-green-400 border border-neutral-900 space-y-1.5 shadow-inner">
              <div className="text-neutral-500 font-semibold">// Trilha de Auditoria do Servidor Express & Guardas:</div>
              <div>[GATEWAY] {new Date().toISOString().replace('T', ' ').substring(0, 19)} IP: 192.168.1.104</div>
              <div>[GATEWAY] Rota solicitada: <span className="text-red-400 font-bold">GET /api/v1/admin/infra-setup</span></div>
              <div>[AUTH_GUARD] Validando sessão do usuário: <span className="text-yellow-300 font-semibold">{usuarioNome}</span></div>
              <div>[AUTH_GUARD] Papel do usuário: <span className="text-sky-300 font-semibold">{usuarioRole}</span></div>
              <div className="text-red-400 font-bold animate-pulse">[RBAC_VERDICT] REJECTED. Papel requerido: 'ROLE_TI_ADMIN'</div>
            </div>

            <p className="text-[11px] text-neutral-500 italic">
              <strong>Isolamento Garantido:</strong> O time de atendimento da Fundação CAS (área de negócio) está rigidamente isolado 
              da equipe de desenvolvimento e de suporte de infraestrutura para evitar modificações ilegítimas e vazamentos de dados.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 w-full flex flex-col items-center">
            <span className="text-[11px] text-slate-500 mb-4 font-medium">Experimente alternar de conta para inspecionar os logs de segurança e o cadastro de pessoas:</span>
            <button
              onClick={onLogout}
              className="px-6 py-2.5 rounded-lg text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800 tracking-wide flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Power className="w-3.5 h-3.5" />
              Sair desta conta e escolher 'Arqt. Lucas Viana'
            </button>
          </div>
        </motion.div>
      );
    }

    // -------------------------------------------------------------------------
    // CASE B: USER APPROVED AS ROLE_TI_ADMIN (IT TEAM WORKSPACE)
    // -------------------------------------------------------------------------
    const filteredLogs = auditLogs.filter(log => {
      if (logFilter === "APPROVED") return log.status === "APPROVED";
      if (logFilter === "BLOCKED") return log.status === "BLOCKED_403";
      return true;
    });

    if (adminActiveTab === "security") {
      return (
        <div className="space-y-6">
          {/* top header banner */}
          <div className="bg-[#0b2545] text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="bg-red-500/25 border border-red-500/45 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-red-300 uppercase font-mono">
                  Superuser / T.I Admin
                </span>
                <span className="bg-[#12B76A]/20 text-[#12B76A] px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-[#12B76A]/30">
                  Express Routing Guards Active
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Portal do Administrador de Sistemas SPFCAS</h2>
              <p className="text-xs text-slate-300">Ponto central para gerenciamento de perfis de usuário, auditoria de middlewares e integridade de senhas.</p>
            </div>
            <button
              onClick={() => setSelectedMenuKey("Controle de Processos")}
              className="px-4 py-2 hover:bg-white/10 text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Voltar para a Mesa Virtual
            </button>
          </div>

          {/* Sub-tabs toggler bar */}
          <div className="flex border-b border-slate-200 gap-1 select-none">
            <button
              onClick={() => setAdminActiveTab("sandbox")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "sandbox" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Central de Cadastro & Auditoria de Logs
            </button>

            <button
              onClick={() => setAdminActiveTab("audit")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "audit" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#004A99]" />
              Central de Auditoria Geral (AuditLogView)
            </button>
            
            <button
              onClick={() => setAdminActiveTab("security")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "security" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-600" />
              Guia de Arquitetura de Autenticação (4 Pilares) & Simuladores
            </button>
          </div>

          <SecurityArchitectureDoc 
            currentUser={{
              nome: usuarioNome,
              unity: unidadeSigla,
              role: usuarioRole,
              login: usuarioNome.toLowerCase().replace(/\s+/g, ".")
            }}
            localUsuarios={localUsuarios}
            onLogout={onLogout}
          />
        </div>
      );
    }

    if (adminActiveTab === "audit") {
      return (
        <div className="space-y-6">
          {/* top header banner */}
          <div className="bg-[#0b2545] text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="bg-red-500/25 border border-red-500/45 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-red-300 uppercase font-mono">
                  Superuser / T.I Admin
                </span>
                <span className="bg-[#12B76A]/20 text-[#12B76A] px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-[#12B76A]/30">
                  Express Routing Guards Active
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Portal do Administrador de Sistemas SPFCAS</h2>
              <p className="text-xs text-slate-300">Ponto central para gerenciamento de perfis de usuário, auditoria de middlewares e integridade de senhas.</p>
            </div>
            <button
              onClick={() => setSelectedMenuKey("Controle de Processos")}
              className="px-4 py-2 hover:bg-white/10 text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Voltar para a Mesa Virtual
            </button>
          </div>

          {/* Sub-tabs toggler bar */}
          <div className="flex border-b border-slate-200 gap-1 select-none">
            <button
              onClick={() => setAdminActiveTab("sandbox")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "sandbox" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              Central de Cadastro & Auditoria de Logs
            </button>

            <button
              onClick={() => setAdminActiveTab("audit")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "audit" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#004A99]" />
              Central de Auditoria Geral (AuditLogView)
            </button>
            
            <button
              onClick={() => setAdminActiveTab("security")}
              className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                adminActiveTab === "security" 
                  ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-red-600" />
              Guia de Arquitetura de Autenticação (4 Pilares) & Simuladores
            </button>
          </div>

          <AuditLogView 
            currentUser={{
              nome: usuarioNome,
              unity: unidadeSigla,
              role: usuarioRole,
              login: usuarioNome.toLowerCase().replace(/\s+/g, ".")
            }}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            localUsuarios={localUsuarios}
            onUsuariosUpdate={onUsuariosUpdate}
            processos={processos}
            onUpdateProcesso={onUpdateProcesso}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* top header banner */}
        <div className="bg-[#0b2545] text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="bg-red-500/25 border border-red-500/45 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide text-red-300 uppercase font-mono">
                Superuser / T.I Admin
              </span>
              <span className="bg-[#12B76A]/20 text-[#12B76A] px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-[#12B76A]/30">
                Express Routing Guards Active
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Portal do Administrador de Sistemas SPFCAS</h2>
            <p className="text-xs text-slate-300">Ponto central para gerenciamento de perfis de usuário, auditoria de middlewares e integridade de senhas.</p>
          </div>
          <button
            onClick={() => setSelectedMenuKey("Controle de Processos")}
            className="px-4 py-2 hover:bg-white/10 text-white rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Voltar para a Mesa Virtual
          </button>
        </div>

        {/* Sub-tabs toggler bar */}
        <div className="flex border-b border-slate-200 gap-1 select-none">
          <button
            onClick={() => setAdminActiveTab("sandbox")}
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminActiveTab === "sandbox" 
                ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Central de Cadastro & Auditoria de Logs
          </button>

          <button
            onClick={() => setAdminActiveTab("audit")}
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminActiveTab === "audit" 
                ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#004A99]" />
            Central de Auditoria Geral (AuditLogView)
          </button>
          
          <button
            onClick={() => setAdminActiveTab("security")}
            className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminActiveTab === "security" 
                ? "border-sky-600 text-sky-800 font-extrabold bg-[#EDF4FF]" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-red-600" />
            Guia de Arquitetura de Autenticação (4 Pilares) & Simuladores
          </button>
        </div>

        {/* 2-Column interactive layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column One: Cadastro de Pessoas Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b mb-4 border-slate-200">
                <Users className="w-5 h-5 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-sm">Módulo de Cadastro de Pessoas</h3>
              </div>

              <p className="text-neutral-500 text-[11px] mb-4 leading-normal">
                Insira novos servidores autárquicos e atribua as devidas chaves de perfis de segurança (Roles) para validação pelas rotas de API.
              </p>

              {formSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 leading-snug"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </motion.div>
              )}

              <form onSubmit={handleUserSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Clarice Mendes de Oliveira"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Cargo / Função</label>
                    <input
                      type="text"
                      required
                      value={newUserCargo}
                      onChange={(e) => setNewUserCargo(e.target.value)}
                      placeholder="Coordenadora"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Login do Usuário</label>
                    <input
                      type="text"
                      required
                      value={newUserLogin}
                      onChange={(e) => setNewUserLogin(e.target.value.toLowerCase().trim())}
                      placeholder="clarice.mendes"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Matrícula CAS</label>
                    <input
                      type="text"
                      required
                      value={newUserMatricula}
                      onChange={(e) => setNewUserMatricula(e.target.value)}
                      placeholder="CAS-8812-B"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      value={newUserCpf}
                      onChange={(e) => setNewUserCpf(e.target.value)}
                      placeholder="111.222.333-44"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="nome@fundacaocas.org.br"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Setor de Atuação</label>
                    <select
                      value={newUserUnidade}
                      onChange={(e) => setNewUserUnidade(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs text-neutral-800"
                    >
                      {INITIAL_UNIDADES.map(u => (
                        <option key={u.sigla} value={u.sigla}>{u.nome} ({u.sigla})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">Papel / Perfil (RBAC)</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as "ROLE_USER" | "ROLE_TI_ADMIN")}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-sky-50 text-xs font-bold text-[#00264D]"
                    >
                      <option value="ROLE_USER">Usuário Comum (ROLE_USER)</option>
                      <option value="ROLE_TI_ADMIN">Equipe de T.I (ROLE_TI_ADMIN)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-neutral-900 text-white rounded text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-neutral-800 cursor-pointer select-none transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  Salvar Cadastro Pessoa
                </button>
              </form>
            </div>
            
            <div className="mt-6 p-3 bg-red-50 text-[10px] text-red-900 rounded-lg border border-red-200 flex gap-2">
              <Shield className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong>Atenção Segurança:</strong> O ID institucional e o perfil de acesso salvos neste formulário ditarão a qual grupo de middlewares as requisições deste colaborador serão submetidas.
              </div>
            </div>
          </div>

          {/* Column Two: Active Registry with status mapping (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b mb-4 border-slate-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-neutral-800" />
                  <h3 className="font-bold text-slate-900 text-sm">Base de Dados Pessoais Ativos (Tabela 'Usuarios')</h3>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-neutral-600">
                  Total: {localUsuarios.length} Registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Colaborador</th>
                      <th className="pb-2">Matrícula</th>
                      <th className="pb-2">Perfil</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localUsuarios.map((usr: any) => {
                      const isActive = activeStatuses[usr.login] !== false;
                      const isTiSuper = usr.role === "ROLE_TI_ADMIN";
                      return (
                        <tr key={usr.login} className="hover:bg-slate-50/50">
                          <td className="py-2.5">
                            <div className="font-semibold text-neutral-900">{usr.nome}</div>
                            <div className="text-[10px] text-neutral-500">{usr.cargo || "Servidor"} • {usr.email}</div>
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-neutral-600">
                            {usr.matricula || (usr.login === "rafael.almeida" ? "CAS-1011-A" : usr.login === "helena.silva" ? "CAS-4299-A" : usr.login === "lucas.viana" ? "CAS-0021-T" : "CAS-9912-D")}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                              isTiSuper 
                                ? "bg-red-50 text-red-700 border border-red-200" 
                                : "bg-sky-50 text-sky-700 border border-sky-100"
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-600" : "bg-gray-400"}`} />
                              {isActive ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                const newStat = !isActive;
                                setActiveStatuses(prev => ({ ...prev, [usr.login]: newStat }));
                                
                                // Logs telemetry
                                setAuditLogs(prev => [{
                                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                                  ip: "::1",
                                  route: `PATCH /api/v1/usuarios/${usr.login}/status`,
                                  user: usuarioNome.toLowerCase().replace(/\s+/g, '.'),
                                  role: usuarioRole,
                                  status: "APPROVED",
                                  info: `Alterado estado do colaborador '${usr.login}' para ${newStat ? "ATIVO" : "INATIVO"}`
                                }, ...prev]);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-700"
                            >
                              Status
                            </button>
                            <button
                              onClick={() => {
                                // Simulate password hash inspection
                                setInspectedName(usr.nome);
                                setInspectedHash(`$argon2id$v=19$m=65536,t=3,p=4$spfcas$salt${usr.login.substring(0,4)}${btoa(usr.login).substring(0,18)}`);
                              }}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-[#E8F4FF] hover:bg-[#D4EAFF] text-[#004A99] cursor-pointer"
                            >
                              Crypt Hash
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simulated Crypt Hash Inspector container */}
            {inspectedHash && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-3 rounded-lg border border-sky-200 bg-[#F4F9FF] text-xs space-y-1 text-left"
              >
                <div className="flex justify-between items-center text-left">
                  <span className="font-bold text-[#00264D] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-600" />
                    Inspeção de Integridade da Credencial para {inspectedName}
                  </span>
                  <button
                    onClick={() => {
                      setInspectedHash(null);
                      setInspectedName(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="font-mono text-[10px] bg-white p-2 border border-slate-200 rounded text-sky-800 break-all select-all">
                  {inspectedHash}
                </div>
                <div className="text-[9px] text-[#64748B] italic">
                  * Hash verificado contra repositório criptográfico unidirecional via salt único de criptografia corporativa fundação CAS.
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Middleware logs & Telemetry display (full width) */}
        <div className="bg-neutral-950 text-[#F1F1F1] rounded-xl font-mono text-xs border border-neutral-800 shadow-2xl p-5 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-900 pb-3 mb-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-neutral-300">Terminal de Auditoria do Gateway de Rotas (Middlewares Express/Nest)</span>
            </div>
            
            <div className="flex gap-2 text-[10px]">
              <button
                onClick={() => setLogFilter("ALL")}
                className={`px-2.5 py-1 rounded text-neutral-300 font-bold border transition-all ${
                  logFilter === "ALL" ? "bg-slate-800 border-slate-700 font-black" : "border-neutral-800 hover:bg-neutral-900"
                }`}
              >
                Todos ({auditLogs.length})
              </button>
              <button
                onClick={() => setLogFilter("APPROVED")}
                className={`px-2.5 py-1 rounded text-emerald-400 font-bold border transition-all ${
                  logFilter === "APPROVED" ? "bg-emerald-950/20 border-emerald-900 font-black" : "border-neutral-800 hover:bg-neutral-900"
                }`}
              >
                Acesso Permitido ({auditLogs.filter(l => l.status === "APPROVED").length})
              </button>
              <button
                onClick={() => setLogFilter("BLOCKED")}
                className={`px-2.5 py-1 rounded text-red-400 font-bold border transition-all ${
                  logFilter === "BLOCKED" ? "bg-red-950/20 border-red-900 font-black" : "border-neutral-800 hover:bg-neutral-900"
                }`}
              >
                Acesso Bloqueado (403) ({auditLogs.filter(l => l.status === "BLOCKED_403").length})
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2 scrollbar-thin">
            {filteredLogs.map((log, i) => {
              const isBlocked = log.status === "BLOCKED_403";
              return (
                <div key={i} className="py-1 border-b border-neutral-900 flex justify-between gap-4 text-[11px] leading-relaxed">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500 font-mono text-[10px] shrink-0">[{log.timestamp}]</span>
                    <span className="text-blue-400 font-semibold shrink-0">{log.ip}</span>
                    <span className="text-indigo-300 shrink-0">{log.route}</span>
                    <span className="text-gray-400 shrink-0">({log.user} / {log.role})</span>
                    <span className="text-neutral-300">• {log.info}</span>
                  </div>
                  <span className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded leading-none ${isBlocked ? "bg-red-950/50 text-red-400 border border-red-900" : "bg-emerald-950/50 text-emerald-400 border border-emerald-900"}`}>
                    {isBlocked ? "BLOCKED 403" : "ALLOWED 200"}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-3 border-t border-neutral-900 text-[10px] text-gray-500 flex justify-between flex-wrap gap-2 text-left">
            <span>🚀 Escaneando segurança em tempo real...</span>
            <span>Gateway ativo em: 3000 (SPFCAS Core Cluster)</span>
          </div>
        </div>
      </div>
    );
  }
}
