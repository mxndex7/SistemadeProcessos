import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Edit, Trash2, KeyRound, UserMinus, AlertTriangle, 
  CheckCircle2, Download, Search, Database, RefreshCw, Play, 
  Filter, ArrowRight, Lock, Unlock, Clock, Eye, Server, Info, Plus
} from "lucide-react";
import { Processo } from "../types";

export interface AuditLogItem {
  timestamp: string;
  ip: string;
  route: string;
  user: string;
  role: string;
  status: "APPROVED" | "BLOCKED_403";
  info: string;
  activityType: "ACCESS" | "FORCED_EDIT" | "DELETION";
  metadata?: string;
}

interface AuditLogViewProps {
  currentUser: { nome: string; unity: string; role: string; login: string };
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  localUsuarios: any[];
  onUsuariosUpdate: React.Dispatch<React.SetStateAction<any[]>>;
  processos: Processo[];
  onUpdateProcesso?: (updated: Processo) => void;
}

export default function AuditLogView({
  currentUser,
  auditLogs,
  setAuditLogs,
  localUsuarios,
  onUsuariosUpdate,
  processos,
  onUpdateProcesso
}: AuditLogViewProps) {
  // Filters & Search
  const [logSearch, setLogSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ACCESS" | "FORCED_EDIT" | "DELETION">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "BLOCKED_403">("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Simulation controls
  const [simTrafficUser, setSimTrafficUser] = useState("helena.silva");
  const [simTrafficRoute, setSimTrafficRoute] = useState("/api/v1/admin/logs");
  const [simTrafficMethod, setSimTrafficMethod] = useState("GET");

  // Forced Edit overrides
  const [selectedProcessId, setSelectedProcessId] = useState(processos[0]?.id || "");
  const [overrideSpecification, setOverrideSpecification] = useState("");
  const [overrideAccess, setOverrideAccess] = useState("SIGILOSO");
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Deletion simulation target
  const [deleteTargetLogin, setDeleteTargetLogin] = useState("");
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");

  // Normalize initial and existing logs to make sure they have a derived activityType if none is defined
  const enrichedLogs = useMemo<AuditLogItem[]>(() => {
    return auditLogs.map((log) => {
      let activityType: "ACCESS" | "FORCED_EDIT" | "DELETION" = "ACCESS";
      
      const lowerInfo = log.info?.toLowerCase() || "";
      const lowerRoute = log.route?.toLowerCase() || "";
      
      if (lowerInfo.includes("alterad") || lowerInfo.includes("edit") || lowerInfo.includes("mudad") || lowerInfo.includes("override") || lowerRoute.includes("patch") || lowerRoute.includes("put")) {
        activityType = "FORCED_EDIT";
      } else if (lowerInfo.includes("exclus") || lowerInfo.includes("delet") || lowerInfo.includes("purgar") || lowerInfo.includes("removid") || lowerRoute.includes("delete")) {
        activityType = "DELETION";
      } else {
        activityType = "ACCESS";
      }

      return {
        timestamp: log.timestamp || new Date().toISOString().replace("T", " ").substring(0, 19),
        ip: log.ip || "127.0.0.1",
        route: log.route || "GET /api/v1/auth",
        user: log.user || "anônimo",
        role: log.role || "ROLE_USER",
        status: (log.status === "APPROVED" || log.status === "ALLOWED_200" || log.status === "APPROVED" ? "APPROVED" : "BLOCKED_403") as "APPROVED" | "BLOCKED_403",
        info: log.info || "Atividade do sistema registrada",
        activityType: log.activityType || activityType,
        metadata: log.metadata || JSON.stringify({
          userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          requestId: `req-${Math.floor(100000 + Math.random() * 900000)}`,
          host: "spfcas.processos.interno:3000",
          origin: "reverse-proxy-nginx",
          connection: "keep-alive"
        }, null, 2)
      };
    });
  }, [auditLogs]);

  // Filter computation
  const filteredItems = useMemo(() => {
    return enrichedLogs.filter((log) => {
      // Free-text search
      const query = logSearch.toLowerCase().trim();
      const matchText = (log.user + " " + log.ip + " " + log.route + " " + log.info).toLowerCase();
      if (query && !matchText.includes(query)) return false;

      // Type
      if (typeFilter !== "ALL" && log.activityType !== typeFilter) return false;

      // Status
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;

      return true;
    });
  }, [enrichedLogs, logSearch, typeFilter, statusFilter]);

  // Stats Counters
  const counters = useMemo(() => {
    let accesses = 0;
    let forcedEdits = 0;
    let deletions = 0;
    let blocked = 0;

    enrichedLogs.forEach((l) => {
      if (l.activityType === "ACCESS") accesses++;
      if (l.activityType === "FORCED_EDIT") forcedEdits++;
      if (l.activityType === "DELETION") deletions++;
      if (l.status === "BLOCKED_403") blocked++;
    });

    return { accesses, forcedEdits, deletions, blocked };
  }, [enrichedLogs]);

  // Handler: Simulate Access
  const triggerSimulatedAccess = () => {
    const matchedUserObj = localUsuarios.find(u => u.login === simTrafficUser);
    const userRole = matchedUserObj ? matchedUserObj.role : "ROLE_USER";
    const userName = matchedUserObj ? matchedUserObj.nome : "Usuário Externo";

    const isSensitive = simTrafficRoute.includes("admin") || simTrafficRoute.includes("tables");
    const allowed = userRole === "ROLE_TI_ADMIN" || !isSensitive;
    const finalStatus = allowed ? "APPROVED" : "BLOCKED_403";

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const ip = `192.168.10.${Math.floor(10 + Math.random() * 200)}`;
    const route = `${simTrafficMethod} ${simTrafficRoute}`;
    const info = allowed 
      ? `Acesso com sucesso por ${userName} (${simTrafficUser})`
      : `BOTO DE ACESSO NEGADO por AuthGuard (regra RBAC): Perfil requerido ROLE_TI_ADMIN`;

    const requestRandomId = `req-${Math.floor(150000 + Math.random() * 850000)}`;
    const metadata = JSON.stringify({
      headers: {
        "x-forwarded-for": ip,
        "authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.${requestRandomId}`,
        "accept-language": "pt-BR,pt;q=0.9",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\""
      },
      payload: {
        request_route: simTrafficRoute,
        simulated_method: simTrafficMethod,
        guard_evaluation_seconds: 0.002
      },
      verdict: {
        authorized: allowed,
        requiredRole: "ROLE_TI_ADMIN",
        actualRole: userRole,
        action: allowed ? "ALLOW" : "ABORT_REQUEST"
      }
    }, null, 2);

    const newLog = {
      timestamp,
      ip,
      route,
      user: simTrafficUser,
      role: userRole,
      status: finalStatus,
      info,
      activityType: "ACCESS" as const,
      metadata
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handler: Simulate Forced Edit (Superuser Override)
  const handleExecuteForcedEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcessId) {
      alert("Selecione um processo para forçar a edição.");
      return;
    }

    const processToEdit = processos.find(p => p.id === selectedProcessId);
    if (!processToEdit) return;

    if (!overrideSpecification.trim()) {
      alert("Por favor, digite a nova especificação de override.");
      return;
    }

    // Execute absolute overwrite ignoring strict custody or signature locks (Simulates emergency DB direct override)
    if (onUpdateProcesso) {
      const updatedProcess = {
        ...processToEdit,
        especificacao: `[OVERRIDE ADM DE T.I em ${new Date().toLocaleDateString()}] ${overrideSpecification.trim()}`,
        nivelAcesso: overrideAccess as any,
        lido: false // Set as unread for the respective units to audit
      };
      onUpdateProcesso(updatedProcess);
    }

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const ip = "127.0.0.1 (LOCALHOST-SSH)";
    
    const requestRandomId = `req-${Math.floor(150000 + Math.random() * 850000)}`;
    const metadata = JSON.stringify({
      context: "Superuser Backdoor Bypass Interface",
      target: {
        processoId: selectedProcessId,
        oldSpecification: processToEdit.especificacao,
        oldNivelAcesso: processToEdit.nivelAcesso,
        nup: processToEdit.nup
      },
      payload: {
        specificationOverrideValue: overrideSpecification,
        forcedSecurityLevel: overrideAccess,
        bypassValidators: ["SignatureGuard", "CustodyRouteChecker", "ElectronicTraceLock"]
      },
      author: {
        login: currentUser.login,
        ip: "::1",
        connectionId: "ssh-tunnel-direct-postgre"
      },
      changesApplied: {
        updatedSpecification: true,
        updatedNivelAcesso: true
      }
    }, null, 2);

    const newLog = {
      timestamp,
      ip,
      route: `PATCH /api/v1/emergency/processos/${selectedProcessId}/override`,
      user: currentUser.login,
      role: currentUser.role,
      status: "APPROVED" as const,
      info: `EDIÇÃO EXTRAORDINÁRIA FORCE-EDIT: Metadados do processo NUP ${processToEdit.nup} foram editados via bypass do portal de T.I`,
      activityType: "FORCED_EDIT" as const,
      metadata
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setOverrideSpecification("");
    setEditSuccessMsg(`Metadados do processo ${processToEdit.nup} alterados com sucesso com log registrado no gateway!`);
    setTimeout(() => setEditSuccessMsg(""), 5000);
  };

  // Handler: Simulate Exclusão (Purge User)
  const handleExecuteDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetLogin) {
      alert("Selecione um usuário para exclusão.");
      return;
    }

    const targetUser = localUsuarios.find(u => u.login === deleteTargetLogin);
    if (!targetUser) return;

    if (targetUser.login === currentUser.login) {
      alert("Você não pode excluir o seu próprio usuário administrador ativo!");
      return;
    }

    // Filter out target user from institutional active list
    const updatedUsers = localUsuarios.filter(u => u.login !== deleteTargetLogin);
    onUsuariosUpdate(updatedUsers);

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    const ip = "10.0.0.9 (TI-CORE-SSH)";
    const metadata = JSON.stringify({
      operator: currentUser.login,
      targetUser: {
        id: targetUser.id,
        nome: targetUser.nome,
        login: targetUser.login,
        matricula: targetUser.matricula,
        cargo: targetUser.cargo,
        role: targetUser.role
      },
      operationType: "PHYSICAL_DELETE_PURGE",
      safePurge: true,
      affectedTables: ["Usuarios", "SessionTokens", "PermissionsCache"],
      reason: "Desligamento institucional ou expurgo de sandbox temporária"
    }, null, 2);

    const newLog = {
      timestamp,
      ip,
      route: `DELETE /api/v1/usuarios/${deleteTargetLogin}/purge`,
      user: currentUser.login,
      role: currentUser.role,
      status: "APPROVED" as const,
      info: `EXPURGO DE SEGURANÇA: Conta do colaborador '${targetUser.nome}' (${targetUser.login}) foi eliminada da infraestrutura de dados CAS`,
      activityType: "DELETION" as const,
      metadata
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setDeleteSuccessMsg(`Usuário ${targetUser.login} purgado da base de dados ativa! Trilha rastreável criada.`);
    setDeleteTargetLogin("");
    setTimeout(() => setDeleteSuccessMsg(""), 5000);
  };

  // Mock Export system
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(enrichedLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `spfcas-audit-log-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* 4-Column Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div id="stat-audited-accesses" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Acessos Auditados</span>
            <KeyRound className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">{counters.accesses}</div>
          <p className="text-[10px] text-emerald-600 font-medium mt-1 leading-none">Gateway de Rotas Ativo</p>
        </div>

        <div id="stat-forced-edits" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Edições Forçadas IP</span>
            <Edit className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">{counters.forcedEdits}</div>
          <p className="text-[10px] text-amber-600 font-medium mt-1 leading-none">Bypass Administrativo</p>
        </div>

        <div id="stat-purges" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Expurgos / Exclusões</span>
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono">{counters.deletions}</div>
          <p className="text-[10px] text-indigo-600 font-medium mt-1 leading-none">Acesso Físico Imutável</p>
        </div>

        <div id="stat-blocked" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Intercepts (Bloqueios 403)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{counters.blocked}</div>
          <p className="text-[10px] text-rose-600 font-medium mt-1 leading-none">Vigilância RBAC Ativa</p>
        </div>
      </div>

      {/* Main 2 Column Grid: Left Column is Interactive Simulators, Right Column is Realtime Logs list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sandbox Simulator Panels */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SIMULADOR A: ACESSOS */}
          <div id="access-simulator-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left">
            <div className="flex items-center gap-2 pb-2.5 border-b mb-3 border-slate-200">
              <KeyRound className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Simulador de Acesso (Authentication Guard)</h3>
            </div>
            <p className="text-neutral-500 text-[11px] mb-3 leading-normal">
              Escolha uma identidade e tente requisitar rotas restritas para testar os middlewares do Gateway de Rotas.
            </p>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Usuário</label>
                  <select
                    value={simTrafficUser}
                    onChange={(e) => setSimTrafficUser(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-neutral-800 bg-white"
                  >
                    {localUsuarios.map(u => (
                      <option key={u.login} value={u.login}>{u.nome} ({u.role.replace("ROLE_", "")})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Método</label>
                  <select
                    value={simTrafficMethod}
                    onChange={(e) => setSimTrafficMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-neutral-800 bg-white"
                  >
                    <option value="GET">GET (Leitura)</option>
                    <option value="POST">POST (Gravidade)</option>
                    <option value="PATCH">PATCH (Override)</option>
                    <option value="DELETE">DELETE (Remover)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">URI (Rota Alvo)</label>
                <select
                  value={simTrafficRoute}
                  onChange={(e) => setSimTrafficRoute(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-neutral-800 font-mono bg-[#FAFAFA]"
                >
                  <option value="/api/v1/processos">/api/v1/processos (Público)</option>
                  <option value="/api/v1/admin/logs">/api/v1/admin/logs (Restrito a T.I)</option>
                  <option value="/api/v1/cadastro/pessoas">/api/v1/cadastro/pessoas (Restrito a T.I)</option>
                  <option value="/api/v1/infra/secrets">/api/v1/infra/secrets (Máxima Segurança T.I)</option>
                </select>
              </div>

              <button
                onClick={triggerSimulatedAccess}
                className="w-full py-1.5 bg-[#EDF4FF] hover:bg-[#D9E8FF] text-[#004A99] rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-[#004A99]" />
                Requisitar via Middleware
              </button>
            </div>
          </div>

          {/* SIMULADOR B: EDIÇÃO FORÇADA */}
          <div id="forced-edit-simulator-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left">
            <div className="flex items-center gap-2 pb-2.5 border-b mb-3 border-slate-200">
              <Edit className="w-4.5 h-4.5 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Mecanismo de Edição Forçada de Processos</h3>
            </div>
            
            <p className="text-neutral-500 text-[11px] mb-3 leading-normal">
              Como administrador de infraestrutura de T.I., você possui permissão para sobrescrever metadados de qualquer processo que esteja travado, contornando a custódia das unidades usuárias.
            </p>

            {editSuccessMsg && (
              <div className="p-2 mb-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10px] rounded font-semibold">
                {editSuccessMsg}
              </div>
            )}

            <form onSubmit={handleExecuteForcedEdit} className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Selecione o Processo Alvo</label>
                <select
                  value={selectedProcessId}
                  onChange={(e) => setSelectedProcessId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-neutral-800 bg-white"
                >
                  {processos.map(p => (
                    <option key={p.id} value={p.id}>[{p.unidadeGeradora}] {p.nup} - {p.tipo.substring(0, 30)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Nova Especificação de Urgência (Bypass)</label>
                <input
                  type="text"
                  required
                  value={overrideSpecification}
                  onChange={(e) => setOverrideSpecification(e.target.value)}
                  placeholder="Ex: Intervenção Judicial. Correção extraordinária da Fundação CAS."
                  className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs text-neutral-800 focus:outline-none focus:border-neutral-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Nível Segurança Alvo</label>
                  <select
                    value={overrideAccess}
                    onChange={(e) => setOverrideAccess(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-neutral-800 bg-white"
                  >
                    <option value="PUBLICO">Público</option>
                    <option value="RESTRITO">Restrito</option>
                    <option value="SIGILOSO">Sigiloso</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-600 shadow-sm"
                  >
                    <Shield className="w-3 h-3 text-white" />
                    Forçar Edição
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* SIMULADOR C: EXCLUSÃO CARD */}
          <div id="deletion-simulator-card" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left">
            <div className="flex items-center gap-2 pb-2.5 border-b mb-3 border-slate-200">
              <UserMinus className="w-4.5 h-4.5 text-red-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Simulação de Exclusão (Purge de Contas)</h3>
            </div>

            <p className="text-neutral-500 text-[11px] mb-3 leading-normal">
              Os expurgos e desativações físicas de banco de dados são as operações mais sensíveis. Sobrescreva e purge perfis indevidos de teste instantaneamente.
            </p>

            {deleteSuccessMsg && (
              <div className="p-2 mb-3 bg-red-50 border border-red-100 text-red-800 text-[10px] rounded font-semibold">
                {deleteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleExecuteDeletion} className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-0.5">Selecione Conta a Excluir</label>
                <select
                  value={deleteTargetLogin}
                  onChange={(e) => setDeleteTargetLogin(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-neutral-800 bg-white"
                >
                  <option value="">-- Selecione uma conta para purgar --</option>
                  {localUsuarios.map(u => (
                    <option key={u.login} value={u.login} disabled={u.login === currentUser.login}>
                      {u.nome} ({u.login}) {u.login === currentUser.login ? "[ATIVO]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!deleteTargetLogin}
                className={`w-full py-1.5 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deleteTargetLogin 
                    ? "bg-red-600 hover:bg-red-700 border border-red-700" 
                    : "bg-slate-300 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Derrubar & Purgar Usuário
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Dynamic Database Log list */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between text-left">
          <div className="space-y-4">
            
            {/* Header section with Filter controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 border-b border-slate-200 gap-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-neutral-800" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-sans">Visualizador de Auditoria Unificado</h3>
                  <p className="text-[10px] text-slate-400">Trilha de segurança persistente e assinada da infraestrutura</p>
                </div>
              </div>

              {/* Reset Logs or Export Button */}
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1 text-[10px] bg-neutral-900 font-bold text-white hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Exportar base completa para análise no SIEM local"
              >
                <Download className="w-3 h-3" />
                Exportar JSON
              </button>
            </div>

            {/* Inputs: Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4 relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por usuário, IP, msg..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full border border-slate-300 rounded pl-8 pr-2.5 py-1.5 text-xs text-neutral-800 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Activity Category Filter Selector Buttons */}
              <div className="sm:col-span-5 flex rounded border border-slate-300 overflow-hidden font-sans">
                <button
                  onClick={() => setTypeFilter("ALL")}
                  className={`flex-1 py-1 px-1 text-[9px] font-extrabold transition-colors cursor-pointer border-r border-slate-200 ${
                    typeFilter === "ALL" ? "bg-slate-850 text-white font-black" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setTypeFilter("ACCESS")}
                  className={`flex-1 py-1 px-1 text-[9px] font-extrabold transition-colors cursor-pointer border-r border-slate-200 ${
                    typeFilter === "ACCESS" ? "bg-blue-600 text-white font-black" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Acessos
                </button>
                <button
                  onClick={() => setTypeFilter("FORCED_EDIT")}
                  className={`flex-1 py-1 px-1 text-[9px] font-extrabold transition-colors cursor-pointer border-r border-slate-200 ${
                    typeFilter === "FORCED_EDIT" ? "bg-amber-600 text-white font-black" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Edições
                </button>
                <button
                  onClick={() => setTypeFilter("DELETION")}
                  className={`flex-1 py-1 px-1 text-[9px] font-extrabold transition-colors cursor-pointer ${
                    typeFilter === "DELETION" ? "bg-red-600 text-white font-black" : "bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Exclusões
                </button>
              </div>

              {/* Status Filter Selector dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-neutral-800 bg-white"
                >
                  <option value="ALL">Status: Todos</option>
                  <option value="APPROVED">Status: Permitido (200)</option>
                  <option value="BLOCKED_403">Status: Bloqueado (403)</option>
                </select>
              </div>
            </div>

            {/* Simulated Live Logs list */}
            <div id="logs-container" className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 font-mono text-[10px]">
              
              {/* Header Table row */}
              <div className="bg-slate-100 p-2 border-b border-slate-200 grid grid-cols-12 gap-1 font-sans font-bold text-slate-500 text-[9px] uppercase tracking-wider">
                <div className="col-span-3">Data /IP</div>
                <div className="col-span-2">Usuário</div>
                <div className="col-span-4">Atividade</div>
                <div className="col-span-2 text-center">Tipo</div>
                <div className="col-span-1 text-right">Ver</div>
              </div>

              {/* Table Rows list */}
              <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-sans italic">
                    Nenhum registro de auditoria corresponde aos filtros configurados.
                  </div>
                ) : (
                  filteredItems.map((log, index) => {
                    const isBlocked = log.status === "BLOCKED_403";
                    
                    // Style by action type
                    let badgeClass = "bg-blue-50 text-blue-700 border-blue-100";
                    let badgeLabel = "ACESSO";
                    if (log.activityType === "FORCED_EDIT") {
                      badgeClass = "bg-amber-50 text-amber-700 border-amber-100";
                      badgeLabel = "FORCED_EDIT";
                    } else if (log.activityType === "DELETION") {
                      badgeClass = "bg-red-50 text-red-700 border-red-100";
                      badgeLabel = "EXCLUSÃO";
                    }

                    return (
                      <div 
                        key={index} 
                        className={`p-2 grid grid-cols-12 gap-1 items-center transition-all ${
                          selectedLog === log ? "bg-sky-50" : "hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="col-span-3 text-slate-500 truncate leading-snug">
                          <div>{log.timestamp.substring(11, 19)}</div>
                          <div className="text-[9px] opacity-75">{log.ip}</div>
                        </div>

                        <div className="col-span-2 truncate">
                          <span className="font-extrabold text-neutral-800">{log.user}</span>
                          <div className="text-[9px] opacity-70 uppercase tracking-wide truncate">{log.role.replace("ROLE_", "")}</div>
                        </div>

                        <div className="col-span-4 shrink text-slate-600 line-clamp-2 pr-1 font-sans text-[11px] leading-tight">
                          <span className="font-mono text-[9px] text-[#004A99] font-bold block truncate">{log.route}</span>
                          {log.info}
                        </div>

                        <div className="col-span-2 text-center flex flex-col justify-center items-center gap-0.5">
                          <span className={`px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold border uppercase tracking-wider block leading-none ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          <span className={`px-1 py-0.5 rounded-[2px] text-[7px] font-extrabold ${
                            isBlocked ? "text-red-600 bg-red-50/20" : "text-emerald-600"
                          }`}>
                            {isBlocked ? "FAIL 403" : "OK 200"}
                          </span>
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => setSelectedLog(selectedLog === log ? null : log)}
                            className="p-1 hover:bg-sky-100 rounded text-[#004A99] transition-colors cursor-pointer"
                            title="Inspecionar Metadados"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* INSPECTOR DRAWER / DETAIL VIEWER */}
            <AnimatePresence>
              {selectedLog && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-[#0a1128] text-[#90caf9] rounded-lg border border-slate-800 space-y-2 text-left font-mono overflow-hidden"
                >
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 text-[11px]">
                    <span className="font-bold text-white flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      Auditoria SIEM JSON Payload Inspection
                    </span>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="text-slate-400 hover:text-white font-bold"
                    >
                      ✕ Fechar
                    </button>
                  </div>
                  <pre className="text-[9px] bg-slate-950/85 p-2 rounded text-green-400 whitespace-pre-wrap max-h-48 overflow-y-auto select-all leading-normal">
                    {selectedLog.metadata}
                  </pre>
                  <div className="flex items-center gap-1 text-[8px] text-slate-400 italic">
                    <Info className="w-2.5 h-2.5" />
                    <span>Assinado e selado criptograficamente com HMAC-SHA256 no gateway de segurança CAS. Verificação: Ok.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200 text-[9px] text-gray-400 flex justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>Base atualizada em tempo real via hooks reativos do ecossistema</span>
            </span>
            <span>Gateway ativo em: 3000 (Docker Container Cluster)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
