import React, { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import ProcessDetail from "./components/ProcessDetail";
import TramitacaoModal from "./components/TramitacaoModal";
import SearchPanel from "./components/SearchPanel";
import ArchitectPanel from "./components/ArchitectPanel";

import { INITIAL_PROCESSOS, INITIAL_USUARIOS } from "./data/schemas";
import { Processo, ThemeVariant, StatusRetorno, TipoBloco, NivelAcesso, Usuario } from "./types";

const LIGHT_THEME: ThemeVariant = {
  id: "light",
  nome: "Claro",
  descricao: "Tema claro institucional",
  primary: "#00264D",
  secondary: "#004A99",
  secondaryHover: "#1D4ED8",
  bgDesktop: "#F4F7FA",
  bgPaper: "#FFFFFF",
  textPrimary: "#00264D",
  textSecondary: "#64748B",
  border: "#D9E2EC",
  cardBg: "#FFFFFF",
  isDark: false
};

const DARK_THEME: ThemeVariant = {
  id: "dark",
  nome: "Escuro",
  descricao: "Tema escuro institucional",
  primary: "#020617",
  secondary: "#38BDF8",
  secondaryHover: "#7DD3FC",
  bgDesktop: "#020617",
  bgPaper: "#0F172A",
  textPrimary: "#E5E7EB",
  textSecondary: "#94A3B8",
  border: "#334155",
  cardBg: "#0F172A",
  isDark: true
};

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const currentTheme = isDarkTheme ? DARK_THEME : LIGHT_THEME;

  // 2. Authentication and Session state
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  // 2.2 Users Database list (State-managed to allow registration sandbox to work globally)
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS as Usuario[]);

  // 3. Process Database list (State-managed to allow reactive edits, signatures, and document additions)
  const [processos, setProcessos] = useState<Processo[]>(INITIAL_PROCESSOS);
  const [activeProcessoId, setActiveProcessoId] = useState<string | null>(null);

  // 4. Modal and Layer Toggles
  const [isTramitarOpen, setIsTramitarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isArchitectOpen, setIsArchitectOpen] = useState(false);

  // Active process context for Detail View
  const activeProcesso = processos.find((p) => p.id === activeProcessoId) || null;
  const getCurrentDestinationUnit = (processo: Processo) => {
    const latestTramitacao = processo.historicoTramitacoes[processo.historicoTramitacoes.length - 1];
    return latestTramitacao?.destino || processo.unidadeGeradora;
  };

  // Login handler
  const handleLoginSuccess = (usuario: Usuario, unidadeSigla: string) => {
    setCurrentUser({
      ...usuario,
      unidade: unidadeSigla,
      role: usuario.role || "ROLE_USER"
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveProcessoId(null);
    setIsTramitarOpen(false);
    setIsSearchOpen(false);
    setIsArchitectOpen(false);
  };

  // Single Process updates (e.g. document signed, comment added, annotations written)
  const handleUpdateProcesso = (updated: Processo) => {
    setProcessos((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  // Trâmite (Process Routing) execution logic
  const handleConfirmTramitacao = (
    destinoSigla: string, 
    retornoData?: string, 
    retornoStatus?: StatusRetorno,
    blocoAdicionadoId?: string,
    blocoAdicionadoTipo?: TipoBloco,
    despachoRestrito?: boolean,
    usuariosPermitidos?: string[]
  ) => {
    if (!activeProcesso || !currentUser) return;

    // Build timeline trace
    const novoTrâmite = {
      origem: currentUser.unidade,
      destino: destinoSigla,
      dataEnvio: new Date().toISOString(),
      usuario: currentUser.nome,
      despachoRestrito,
      usuariosPermitidos: despachoRestrito ? usuariosPermitidos || [] : undefined,
      retornoProgramado: retornoData && retornoStatus ? {
        dataLimite: retornoData,
        status: statusTranslator(retornoStatus)
      } : undefined
    };

    // Update process values
    const updatedProcesso: Processo = {
      ...activeProcesso,
      historicoTramitacoes: [...activeProcesso.historicoTramitacoes, novoTrâmite],
      // Transfer custody to the destination: can block depending on status or set new properties
      bloqueadoTramite: blocoAdicionadoTipo === TipoBloco.INTERNO,
      lido: false // Unread in newly transferred destination
    };

    // If a work block is checked, we can simulate tag additions
    if (blocoAdicionadoId && blocoAdicionadoTipo) {
      updatedProcesso.marcadorNome = blocoAdicionadoTipo.toUpperCase();
      updatedProcesso.marcadorCor = "dourado";
      updatedProcesso.marcadorTexto = `Processo anexado ao Bloco ID: ${blocoAdicionadoId}`;
    }

    setProcessos((prev) =>
      prev.map((p) => (p.id === activeProcesso.id ? updatedProcesso : p))
    );

    setIsTramitarOpen(false);
    // Take user back to the desk on transfer
    setActiveProcessoId(null);
  };

  // Convert status to typed status cleanly
  const statusTranslator = (ret: StatusRetorno): StatusRetorno => {
    if (ret === "Retorno Cumprido") return StatusRetorno.RETORNO_CUMPRIDO;
    if (ret === "Prazo Expirado") return StatusRetorno.PRAZO_EXPIRADO;
    return StatusRetorno.DENTRO_DO_PRAZO;
  };

  // BATCH OPERATION: Conclude selected processes in unit
  const handleBatchConclude = (ids: string[]) => {
    setProcessos((prev) =>
      prev.map((p) => (ids.includes(p.id) ? { ...p, estaConcluido: true } : p))
    );
  };

  // BATCH OPERATION: Apply tag marker
  const handleBatchAddMarcador = (ids: string[], marcadorNome: string, marcadorCor: string) => {
    setProcessos((prev) =>
      prev.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              marcadorNome: marcadorNome,
              marcadorCor: marcadorCor,
              marcadorTexto: `Etiqueta aplicada em lote para fins organizacionais. Unidade: ${currentUser?.unidade}`
            }
          : p
      )
    );
  };

  // Initiate process of specific type dynamically
  const handleIniciarProcesso = (tipo: string) => {
    if (!currentUser) return;
    
    const randomizedId = Math.floor(1000000 + Math.random() * 9000000);
    const nupStr = `23546.${String(randomizedId).substring(0, 6)}/${new Date().getFullYear()}-${String(randomizedId).substring(6, 8)}`;

    const novoProcesso: Processo = {
      id: `p-${Date.now()}`,
      nup: nupStr,
      tipo: "Expediente Eletrônico: Solicitação Geral de Demandas Administrativas",
      unidadeGeradora: currentUser.unidade,
      interessados: "Fundação CAS / Diretoria Geral",
      especificacao: "Formalização e registro de expediente para controle arquivístico inicial.",
      dataGeracao: new Date().toISOString(),
      nivelAcesso: NivelAcesso.PUBLICO,
      lido: true,
      estaConcluido: false,
      bloqueadoTramite: false,
      historicoTramitacoes: [],
      comentarios: [],
      documentos: [
        {
          id: `doc-${Date.now()}`,
          seiNumero: `TERMO 1 (${Math.floor(1000000 + Math.random() * 9000000)})`,
          titulo: "Termo de Autuação Inicial do Processo",
          tipo: "Despacho",
          formato: "Interno",
          unidadeGeradora: currentUser.unidade,
          criador: currentUser.nome,
          dataCriacao: new Date().toISOString(),
          nivelAcesso: NivelAcesso.PUBLICO,
          conteudoHtml: `<h3>TERMO DE AUTUAÇÃO INICIAL GERAL</h3>
<p>Na presente data, em conformidade com as regras estritas de custódia e integridade da Fundação CAS e sob as diretrizes do SPFCAS, autuo o processo sob número indexado <strong>${nupStr}</strong> para tramitação.</p>
<p>Todos os trâmites, assinaturas, autenticações SSL/TLS e anotações internas constarão sob o banco PostgreSQL relacional imutável com preservação em S3 e busca no Elasticsearch.</p>`,
          assinado: false,
          assinantes: []
        }
      ]
    };

    setProcessos((prev) => [novoProcesso, ...prev]);
    setActiveProcessoId(novoProcesso.id); // Open details immediately
  };

  // Active process selection from search results or columns
  const handleSelectProcesso = (id: string) => {
    if (!currentUser) return;
    const selectedProcesso = processos.find((p) => p.id === id);
    const latestTramitacao = selectedProcesso?.historicoTramitacoes[selectedProcesso.historicoTramitacoes.length - 1];

    if (
      selectedProcesso &&
      latestTramitacao?.despachoRestrito &&
      latestTramitacao.destino === currentUser.unidade &&
      !latestTramitacao.usuariosPermitidos?.includes(currentUser.login)
    ) {
      const permittedUsers = usuarios
        .filter((usuario) => latestTramitacao.usuariosPermitidos?.includes(usuario.login))
        .map((usuario) => usuario.nome)
        .join(", ");

      alert(
        `Este processo chegou ao setor ${currentUser.unidade} como despacho restrito. ` +
        `A visualização completa está liberada apenas para: ${permittedUsers || "usuários credenciados do setor"}.`
      );
      return;
    }

    // Mark as received only when the destination unit opens the transferred process.
    setProcessos((prev) =>
      prev.map((p) =>
        p.id === id && getCurrentDestinationUnit(p) === currentUser.unidade
          ? { ...p, lido: true }
          : p
      )
    );
    setActiveProcessoId(id);
    setIsSearchOpen(false); // Close search modal if open
  };

  return (
    <div className={isDarkTheme ? "app-shell app-dark" : "app-shell"} style={{ backgroundColor: currentTheme.bgDesktop }}>
      
      {/* Dynamic Theme Wrapping Scope style properties provider */}
      <div 
        style={{
          "--color-primary": currentTheme.primary,
          "--color-secondary": currentTheme.secondary,
          "--color-bg": currentTheme.bgDesktop,
          "--color-paper": currentTheme.bgPaper,
        } as React.CSSProperties}
      >
        {currentUser === null ? (
          // LOGIN STEP
          <LoginScreen 
            theme={currentTheme} 
            usuarios={usuarios}
            onLoginSuccess={handleLoginSuccess} 
          />
        ) : (
          // AUTHENTICATED SYSTEM PORTAL
          <div className="flex flex-col min-h-screen">
            
            {activeProcessoId && activeProcesso ? (
              // PROCESS DETAIL MODE (TREE VIEW AND EDITOR)
              <ProcessDetail
                processo={activeProcesso}
                processos={processos}
                currentUnit={currentUser.unidade}
                usuarioNome={currentUser.nome}
                onBack={() => setActiveProcessoId(null)}
                onUpdateProcesso={handleUpdateProcesso}
                onOpenTramitar={() => setIsTramitarOpen(true)}
              />
            ) : (
              // GENERAL DASHBOARD MODE
              <Dashboard
                theme={currentTheme}
                usuarioNome={currentUser.nome}
                usuarioLogin={currentUser.login}
                unidadeSigla={currentUser.unidade}
                usuarioRole={currentUser.role}
                onLogout={handleLogout}
                processos={processos}
                onSelectProcesso={handleSelectProcesso}
                onIniciarProcesso={handleIniciarProcesso}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenArchitect={() => setIsArchitectOpen(true)}
                isDarkTheme={isDarkTheme}
                onToggleDarkTheme={() => setIsDarkTheme((value) => !value)}
                onBatchConclude={handleBatchConclude}
                onBatchAddMarcador={handleBatchAddMarcador}
                localUsuarios={usuarios}
                onUsuariosUpdate={setUsuarios}
                onUpdateProcesso={handleUpdateProcesso}
              />
            )}

            {/* MODALS LAYER */}
            
            {/* 1. Routing / Tramitar modal */}
            {activeProcesso && (
              <TramitacaoModal
                processo={activeProcesso}
                currentUnit={currentUser.unidade}
                isOpen={isTramitarOpen}
                onClose={() => setIsTramitarOpen(false)}
                onConfirmTramitacao={handleConfirmTramitacao}
                usuarios={usuarios}
              />
            )}

            {/* 2. Structured Multi-Filter Search Panel modal */}
            <SearchPanel
              currentTheme={currentTheme}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onSelectProcesso={handleSelectProcesso}
            />

            {/* 3. Databases and Relations Blueprints Inspector modal */}
            {currentUser.role === "ROLE_TI_ADMIN" && (
              <ArchitectPanel
                currentTheme={currentTheme}
                isOpen={isArchitectOpen}
                onClose={() => {
                  setIsArchitectOpen(false);
                  window.location.hash = "";
                }}
              />
            )}

          </div>
        )}

      </div>
    </div>
  );
}
