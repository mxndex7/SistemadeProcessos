import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Folder, FileText, ChevronLeft, Plus, CheckSquare, Edit, Trash2, 
  Send, UserCheck, Eye, ShieldAlert, MessageCircle, Pin, ToggleLeft, 
  ToggleRight, Save, X, EyeOff, QrCode, CheckCircle2, History,
  Paperclip, Upload, Download
} from "lucide-react";
import { Processo, Documento, NivelAcesso, Comentario, Anotacao, DocumentoAnexo } from "../types";
import RichTextEditor, { HEADER_HTML } from "./RichTextEditor";
import fcasLogo from "../assets/logofcas.png";
import { getNextDocumentNumber } from "../utils/documentNumbering";

interface ProcessDetailProps {
  processo: Processo;
  processos: Processo[];
  currentUnit: string;
  usuarioNome: string;
  onBack: () => void;
  onUpdateProcesso: (updated: Processo) => void;
  onOpenTramitar: () => void;
}

export default function ProcessDetail({ 
  processo, processos, currentUnit, usuarioNome, onBack, onUpdateProcesso, onOpenTramitar 
}: ProcessDetailProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // Selection mode: null for process meta overview, documentId for specific document
  const activeDoc = processo.documentos.find((d) => d.id === selectedDocId) || null;
  const latestTramitacao = processo.historicoTramitacoes[processo.historicoTramitacoes.length - 1];
  const isPendingDestinationReceipt = Boolean(latestTramitacao && latestTramitacao.origem === currentUnit && !processo.lido);
  const isCurrentUnitCustodian = latestTramitacao
    ? latestTramitacao.destino === currentUnit && processo.lido
    : processo.unidadeGeradora === currentUnit;
  const canAddDocument = isCurrentUnitCustodian || isPendingDestinationReceipt;
  const canModifyDocument = (doc: Documento) =>
    !doc.assinado &&
    (doc.criador === usuarioNome || doc.unidadeGeradora === currentUnit) &&
    (isCurrentUnitCustodian || isPendingDestinationReceipt);
  const canModifyActiveDoc = activeDoc ? canModifyDocument(activeDoc) : false;
  const getAccessBadgeColor = (nivelAcesso: string) => {
    if (nivelAcesso === "Público") return "#16A34A";
    if (nivelAcesso === "Restrito") return "#004A99";
    if (nivelAcesso === "Sigiloso") return "#DC2626";
    return "#64748B";
  };

  // Editorial states
  const [isEditing, setIsEditing] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  
  // Signature flow
  const [isSigning, setIsSigning] = useState(false);
  const [cargoAssinatura, setCargoAssinatura] = useState("Diretor de Gestão Estrutural");
  const [senhaAssinatura, setSenhaAssinatura] = useState("••••••••");

  // Creation of new Document
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [newDocTipo, setNewDocTipo] = useState("Ofício");
  const [newDocTitulo, setNewDocTitulo] = useState("");
  const [newDocAcesso, setNewDocAcesso] = useState(NivelAcesso.PUBLICO);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const nextDocNumber = getNextDocumentNumber(processos, currentUnit, newDocTipo);

  // Tabs for Comments (indexable) and Annotations (private unit)
  const [commentsTab, setCommentsTab] = useState<"comments" | "annotations">("comments");
  const [newCommentText, setNewCommentText] = useState("");
  const [newAnnotationText, setNewAnnotationText] = useState("");
  const [annotationPriority, setAnnotationPriority] = useState(false);

  const selectDocument = (docId: string | null) => {
    setSelectedDocId(docId);
    setIsEditing(false);
    if (docId) {
      const doc = processo.documentos.find((d) => d.id === docId);
      if (doc) setEditorHtml(doc.conteudoHtml);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleSaveDocumentContent = () => {
    if (!activeDoc) return;
    const updatedDocs = processo.documentos.map((d) =>
      d.id === activeDoc.id ? { ...d, conteudoHtml: editorHtml } : d
    );
    const updatedProcesso = { 
      ...processo, 
      documentos: updatedDocs,
      lido: true // Mark as read when worked
    };
    onUpdateProcesso(updatedProcesso);
    setIsEditing(false);
  };

  const handleSignDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;

    const signature = {
      nome: usuarioNome,
      cargo: cargoAssinatura,
      dataHora: new Date().toISOString()
    };

    // Add signature footer card in HTML immediately
    const signFooter = `
      <div class="mt-8 pt-4 border-t-2 border-dashed border-gray-300 font-sans text-xs text-gray-600 select-none">
        <p class="font-bold flex items-center gap-1 text-emerald-700">
          ✓ Documento assinado eletronicamente por ${usuarioNome} (${cargoAssinatura})
        </p>
        <p>Unidade autenticadora: ${currentUnit} | IP e chave de custódia CAS auditados: FCAS-SIG-VERIFIED</p>
        <p>Chave de conferência: ${Math.floor(100000 + Math.random() * 900000)} | Série: ${Math.floor(1000 + Math.random() * 9000)}</p>
      </div>
    `;

    const updatedDocs = processo.documentos.map((d) =>
      d.id === activeDoc.id 
        ? { 
            ...d, 
            assinado: true, 
            assinantes: [...d.assinantes, signature],
            conteudoHtml: d.conteudoHtml + signFooter
          } 
        : d
    );

    const updatedProcesso = { ...processo, documentos: updatedDocs };
    onUpdateProcesso(updatedProcesso);
    setIsSigning(false);
    selectDocument(activeDoc.id); // Reload content
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitulo.trim()) return;

    // Standardized numbering
    const randomizedId = Math.floor(1000000 + Math.random() * 9000000);
    const seiNum = `${newDocTipo.toUpperCase()} ${nextDocNumber} (${randomizedId})`;

    const currentYear = new Date().getFullYear();
    
    // Build default body style for government SEI standards
    const defaultBodyFormat = `
      <p style="text-align: left; font-weight: bold; margin-bottom: 20px; font-family: 'Inter', sans-serif;">
        ${newDocTipo} nº ${nextDocNumber}/${currentYear} – ${currentUnit} – FCAS
      </p>
      <p style="text-align: right; margin-bottom: 25px; font-family: 'Inter', sans-serif;">
        Recife, ______ de ___________________ de ${currentYear}.
      </p>
      
      <p style="text-align: left; margin-bottom: 5px; font-family: 'Inter', sans-serif;">Ao Senhor</p>
      <p style="text-align: left; font-weight: bold; margin-bottom: 5px; font-family: 'Inter', sans-serif;">[Nome do Destinatário]</p>
      <p style="text-align: left; margin-bottom: 25px; font-family: 'Inter', sans-serif;">[Cargo do Destinatário] da Fundação CAS</p>
      
      <p style="text-align: justify; text-indent: 2cm; margin-bottom: 25px; line-height: 1.6; font-family: 'Inter', sans-serif;">
        Cumprimentando-o cordialmente, venho por meio deste solicitar...
      </p>
      
      <p style="text-align: center; margin-top: 35px; font-family: 'Inter', sans-serif;">Atenciosamente,</p>
    `;

    const newDoc: Documento = {
      id: `doc-${Date.now()}`,
      seiNumero: seiNum,
      titulo: newDocTitulo,
      tipo: newDocTipo,
      formato: "Interno",
      unidadeGeradora: currentUnit,
      criador: usuarioNome,
      dataCriacao: new Date().toISOString(),
      nivelAcesso: newDocAcesso,
      conteudoHtml: HEADER_HTML + defaultBodyFormat,
      assinado: false,
      assinantes: [],
      nomeNaArvore: `${newDocTipo} ${nextDocNumber} - ${newDocTitulo}`,
      anexos: []
    };

    const updatedProcesso = {
      ...processo,
      documentos: [...processo.documentos, newDoc]
    };
    onUpdateProcesso(updatedProcesso);
    setIsCreatingDoc(false);
    setNewDocTitulo("");
    selectDocument(newDoc.id); // View newly created doc
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = processo.documentos.find((d) => d.id === docId);
    if (!doc || !canModifyDocument(doc)) return;
    if (!window.confirm("Excluir este documento e seus anexos da árvore do processo?")) return;

    const updatedDocs = processo.documentos.filter((d) => d.id !== docId);
    const updatedProcesso = { ...processo, documentos: updatedDocs };
    onUpdateProcesso(updatedProcesso);
    setSelectedDocId(null);
  };

  const handleAddAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeDoc || !canModifyActiveDoc) return;

    const files: File[] = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    if (files.length === 0) return;

    try {
      setIsUploadingAttachment(true);
      const newAttachments: DocumentoAnexo[] = await Promise.all(
        files.map(async (file) => ({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nome: file.name,
          mimeType: file.type || "application/octet-stream",
          tamanhoBytes: file.size,
          dataUpload: new Date().toISOString(),
          criador: usuarioNome,
          unidadeGeradora: currentUnit,
          dataUrl: await readFileAsDataUrl(file)
        }))
      );

      const updatedDocs = processo.documentos.map((d) =>
        d.id === activeDoc.id
          ? { ...d, anexos: [...(d.anexos || []), ...newAttachments] }
          : d
      );
      onUpdateProcesso({ ...processo, documentos: updatedDocs });
    } catch {
      alert("Não foi possível anexar um ou mais arquivos. Tente novamente.");
    } finally {
      setIsUploadingAttachment(false);
      setAttachmentInputKey((value) => value + 1);
    }
  };

  const handleDeleteAttachment = (docId: string, attachmentId: string) => {
    const doc = processo.documentos.find((d) => d.id === docId);
    if (!doc || !canModifyDocument(doc)) return;
    if (!window.confirm("Excluir este anexo do documento?")) return;

    const updatedDocs = processo.documentos.map((d) =>
      d.id === docId
        ? { ...d, anexos: (d.anexos || []).filter((anexo) => anexo.id !== attachmentId) }
        : d
    );
    onUpdateProcesso({ ...processo, documentos: updatedDocs });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: Comentario = {
      id: `comment-${Date.now()}`,
      autor: usuarioNome,
      unidade: currentUnit,
      texto: newCommentText,
      dataHora: new Date().toISOString(),
      nivelAcesso: processo.nivelAcesso
    };

    const updatedProcesso = {
      ...processo,
      comentarios: [...processo.comentarios, newComment]
    };
    onUpdateProcesso(updatedProcesso);
    setNewCommentText("");
  };

  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotationText.trim()) return;

    const newAnot: Anotacao = {
      id: `annot-${Date.now()}`,
      autor: usuarioNome,
      texto: newAnnotationText,
      dataHora: new Date().toISOString(),
      prioridade: annotationPriority
    };

    const updatedProcesso = {
      ...processo,
      anotacao: newAnot
    };
    onUpdateProcesso(updatedProcesso);
    setNewAnnotationText("");
  };

  const handleDeleteAnnotation = () => {
    const updatedProcesso = {
      ...processo,
      anotacao: undefined
    };
    onUpdateProcesso(updatedProcesso);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F4F7FA]">
      
      {/* 1. COLUNA ESQUERDA (Árvore Estrutural do Processo SEI) */}
      <div 
        className="w-80 md:w-96 border-r border-[#D9E2EC] bg-[#F4F7FA] flex flex-col h-full overflow-hidden shrink-0 select-none text-left"
        id="process_tree_container"
      >
        {/* Top of Left Column: Back button & general process actions */}
        <div className="p-3 border-b border-[#D9E2EC] bg-[#00264D] text-white flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-100 hover:text-white cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Mesa de Processos
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => canAddDocument && setIsCreatingDoc(true)}
              disabled={!canAddDocument}
              className="p-1 px-2.5 text-[10px] font-bold rounded flex items-center gap-1 bg-[#004A99] hover:bg-[#005CC5] text-white transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              title={canAddDocument ? "Incluir Documento" : "Documento bloqueado após recebimento pelo destino"}
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              Incluir Doc
            </button>
          </div>
        </div>

        {/* Process Number & Main Folder Header (SEI style block) */}
        <div className="p-4 bg-white border-b border-[#D9E2EC] process-tree-panel">
          <div 
            onClick={() => selectDocument(null)}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
              selectedDocId === null 
                ? "process-tree-selected bg-[#EDF4FF] border-[#B3D1FF] shadow-sm font-bold text-[#00264D]" 
                : "process-tree-idle border-transparent hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Folder className="w-5 h-5 text-[#004A99] shrink-0 mt-0.5" />
            <div className="text-xs min-w-0">
              <span className="font-mono text-xs font-extrabold tracking-tight block truncate text-[#00264D]">
                {processo.nup}
              </span>
              <span className="text-[10px] text-slate-500 block font-semibold mt-0.5">
                Processo Principal [{processo.unidadeGeradora}]
              </span>
            </div>
          </div>
        </div>

        {/* List representation of tree items (recuados/indented hierarquicos SEI) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-white process-tree-panel">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
            Árvore de Documentos
          </div>

          <div className="pl-2 border-l border-dashed border-slate-200 ml-4 space-y-1 text-left font-sans">
            {processo.documentos.map((doc) => {
              const isSelected = selectedDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => selectDocument(doc.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
                    isSelected 
                      ? "process-tree-selected bg-[#EDF4FF] text-[#00264D] font-extrabold shadow-sm border-l-4 border-[#004A99] pl-2" 
                      : "process-tree-idle hover:bg-slate-50 text-slate-700 pl-3"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${doc.assinado ? "text-emerald-500" : "text-slate-400"}`} />
                    <span className="font-mono truncate text-[11px] font-semibold text-slate-800" title={doc.seiNumero}>
                      {doc.seiNumero}
                    </span>
                    {(doc.anexos?.length || 0) > 0 && (
                      <span className="process-tree-badge inline-flex items-center gap-0.5 text-[9px] font-bold text-[#004A99] bg-[#EDF4FF] border border-[#B3D1FF] rounded px-1">
                        <Paperclip className="w-2.5 h-2.5" />
                        {doc.anexos?.length}
                      </span>
                    )}
                  </div>
                  <span className="process-tree-badge text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-[#00264D] border border-slate-200 uppercase shrink-0 font-mono ml-2">
                    {doc.unidadeGeradora}
                  </span>
                </div>
              );
            })}

            {processo.documentos.length === 0 && (
              <p className="text-[11px] italic py-3 text-slate-400 text-center">Nenhum documento anexado ainda.</p>
            )}
          </div>
        </div>

        {/* Left Column footer details */}
        <div className="p-3 bg-slate-50 border-t border-[#D9E2EC] text-[10px] text-slate-500 font-medium font-sans">
          <div className="flex justify-between mb-1">
            <span>Acesso:</span>
            <span className="font-bold px-2 py-0.5 rounded text-white" style={{
              backgroundColor: getAccessBadgeColor(processo.nivelAcesso)
            }}>{processo.nivelAcesso}</span>
          </div>
          <div className="flex justify-between">
            <span>Organização:</span>
            <span className="font-semibold text-slate-700 font-sans">Fundação CAS ({currentUnit})</span>
          </div>
        </div>
      </div>

      {/* 2. COLUNA DIREITA (Visualizador Central de Leitura) */}
      <div className="flex-1 flex flex-col overflow-hidden h-full text-left">
        {/* Top toolbar for document action options */}
        <div className="h-14 bg-white border-b border-[#D9E2EC] flex items-center justify-between px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 font-sans">Visualizando:</span>
            {activeDoc ? (
              <span className="process-context-pill text-xs font-mono font-extrabold text-[#00264D] truncate bg-[#EDF4FF] px-2 py-1 rounded border border-[#B3D1FF]" title={activeDoc.titulo}>
                {activeDoc.seiNumero} - {activeDoc.titulo}
              </span>
            ) : (
              <span className="process-context-pill text-xs font-extrabold text-[#00264D] uppercase bg-[#EDF4FF] border border-[#B3D1FF] px-2.5 py-1 rounded font-sans">
                Metadados Operacionais do Processo Principal
              </span>
            )}
          </div>

          {/* Action buttons (dynamic depending on selection style) */}
          <div className="flex items-center gap-2 shrink-0">
            {activeDoc ? (
              <>
                {canModifyActiveDoc && !isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditorHtml(activeDoc.conteudoHtml);
                    }}
                    className="p-1.5 px-3 rounded text-xs hover:bg-[#F4F7FA] border border-[#D9E2EC] flex items-center gap-1.5 cursor-pointer font-bold transition-all text-[#004A99]"
                  >
                    <Edit className="w-3.5 h-3.5 text-blue-600" />
                    Editar Conteúdo
                  </button>
                )}

                {canModifyActiveDoc && !isEditing && (
                  <label
                    className="p-1.5 px-3 rounded text-xs hover:bg-[#F4F7FA] border border-[#D9E2EC] flex items-center gap-1.5 cursor-pointer font-bold transition-all text-[#004A99]"
                    title="Anexar PDF, imagem ou arquivo ao documento"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#004A99]" />
                    {isUploadingAttachment ? "Anexando..." : "Anexar PDF/Arquivo"}
                    <input
                      key={attachmentInputKey}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,application/pdf,image/*"
                      className="hidden"
                      onChange={handleAddAttachments}
                      disabled={isUploadingAttachment}
                    />
                  </label>
                )}

                {!activeDoc.assinado && canModifyActiveDoc && (
                  <button
                    onClick={() => setIsSigning(true)}
                    className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Assinar Documento
                  </button>
                )}

                {canModifyActiveDoc && (
                  <button
                    onClick={() => handleDeleteDocument(activeDoc.id)}
                    className="p-1.5 px-3 rounded text-xs hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200 flex items-center gap-1.5 cursor-pointer font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenTramitar}
                  className="p-1.5 px-4 bg-[#00264D] hover:bg-[#004A99] text-white rounded-lg text-xs flex items-center gap-1.5 font-extrabold cursor-pointer transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Tramitar Processo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area split into vertical layout (Paper sheet space and collapsible notes pane) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100">
          
          {/* A4 Paper Sheets Container wrapper */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col min-w-0" id="sei_doc_content_reader">
            <AnimatePresence mode="wait">
              {isEditing && activeDoc ? (
                <RichTextEditor
                  value={editorHtml}
                  onChange={(html) => setEditorHtml(html)}
                  onSave={handleSaveDocumentContent}
                  onDiscard={() => setIsEditing(false)}
                  documentTitle={activeDoc.titulo}
                  documentType={activeDoc.tipo}
                  processNup={processo.nup}
                />
              ) : activeDoc ? (
                /* OFFICIAL FORMAT A4 SHEET (Vertical Page look of SEI) */
                <motion.div
                  key={activeDoc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="official-process-sheet bg-white text-black p-10 sm:p-16 md:p-20 rounded-lg shadow-xl mx-auto w-full max-w-[210mm] min-h-[297mm] border border-slate-300/60 select-text leading-relaxed relative overflow-hidden text-left font-sans"
                  id={`spfcas_sheet_${activeDoc.id}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {/* Institutional letterhead */}
                  {!activeDoc.conteudoHtml.includes("fcas-header-print") && (
                    <div className="pb-6 mb-8 text-center tracking-tight font-serif text-black">
                      <img src={fcasLogo} alt="Logo FCAS" className="w-[92px] h-[92px] object-contain mx-auto mb-2" />
                      <h3 className="font-medium text-base uppercase leading-tight">FCAS - FUNDAÇÃO DE APOIO AO CENTRO DE ASSISTÊNCIA SOCIAL DA PMPE</h3>
                      <p className="text-[11px] leading-tight">Endereço: Rua Guilherme Pinto, n 155, bairro do Derby, Recife - PE, CEP: 52010-200 CNPJ: 32.928.258/0001-49</p>
                      <p className="text-[11px] leading-tight">Email: fundacaocas@gmail.com / Contato: (81) 98713-4377</p>
                      <span className="text-[9px] text-gray-400 font-mono">SPFCAS-NUP: {processo.nup}</span>
                    </div>                  )}

                  {/* HTML content rendering in paper body */}
                  <div 
                    className="prose prose-sm max-w-none text-xs text-justify font-sans leading-relaxed text-slate-800"
                    dangerouslySetInnerHTML={{ __html: activeDoc.conteudoHtml }}
                  />

                  {(activeDoc.anexos?.length || 0) > 0 && (
                    <div className="mt-10 pt-5 border-t border-dashed border-slate-300">
                      <h4 className="font-extrabold text-xs uppercase text-[#00264D] mb-3 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-[#004A99]" />
                        Anexos do Documento ({activeDoc.anexos?.length})
                      </h4>
                      <div className="space-y-2">
                        {activeDoc.anexos?.map((anexo) => (
                          <div key={anexo.id} className="flex items-center justify-between gap-3 p-3 rounded border border-slate-200 bg-slate-50 text-left">
                            <div className="min-w-0">
                              <p className="text-[11px] font-extrabold text-slate-800 truncate">{anexo.nome}</p>
                              <p className="text-[9px] font-semibold text-slate-500">
                                {anexo.mimeType || "Arquivo"} · {formatFileSize(anexo.tamanhoBytes)} · {new Date(anexo.dataUpload).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={anexo.dataUrl}
                                download={anexo.nome}
                                className="p-1.5 rounded border border-[#D9E2EC] bg-white hover:bg-[#EDF4FF] text-[#004A99] transition-colors"
                                title="Baixar anexo"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              {canModifyActiveDoc && (
                                <button
                                  onClick={() => handleDeleteAttachment(activeDoc.id, anexo.id)}
                                  className="p-1.5 rounded border border-transparent hover:border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                                  title="Excluir anexo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certified signature QR representation */}
                  {activeDoc.assinado && activeDoc.assinantes.length > 0 && (
                    <div className="mt-14 p-4 bg-slate-50 rounded-lg border border-dashed border-emerald-400 flex items-center gap-3">
                      <QrCode className="w-12 h-12 text-slate-700 shrink-0" />
                      <div className="text-[9px] leading-relaxed text-slate-600">
                        <strong>Autenticidade Certificada SSL/TLS</strong><br/>
                        Para verificar as assinaturas deste documento, consulte a barra de verificação SPFCAS com IP de auditoria do Setor/Diretoria.
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* PROCESS SUMMARY METADATA SHEET IN A4 LOOK */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="official-process-sheet bg-white text-slate-800 p-10 sm:p-14 md:p-16 rounded-lg shadow-xl mx-auto w-full max-w-[210mm] min-h-[297mm] border border-slate-300/60 text-left select-text relative overflow-hidden font-sans"
                >
                  <div className="pb-6 mb-8 border-b-2 border-dashed border-slate-300 text-center">
                    <h3 className="font-extrabold text-sm uppercase text-[#00264D]">Mecanismo de Autuação Integrada (SPFCAS)</h3>
                    <p className="text-[10px] uppercase font-semibold text-slate-500">Autarquia de Custódia e Governança Legal</p>
                  </div>

                  {isPendingDestinationReceipt && latestTramitacao && (
                    <div className="mb-6 p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold">
                      Envio pendente de recebimento por {latestTramitacao.destino}. Documentos da unidade {currentUnit} ainda podem ser editados ou excluídos até a abertura pelo setor destinatário.
                    </div>
                  )}

                  <h3 className="font-extrabold text-base tracking-tight border-b pb-2 mb-4 uppercase text-[#00264D]">
                    Metadados Operacionais do Processo Principal
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs mb-8">
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Número Único de Protocolo (NUP):</span>
                      <span className="font-mono text-base font-extrabold text-[#004A99]">{processo.nup}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Interessados:</span>
                      <span className="font-sans font-extrabold text-slate-900">{processo.interessados}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Título / Tipo de Expediente:</span>
                      <span className="font-extrabold text-slate-800">{processo.tipo}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Especificações Detalhadas de Autuação:</span>
                      <p className="opacity-95 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200 text-slate-700 font-medium">
                        {processo.especificacao || "Nenhuma especificação cadastrada."}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Timeline list of document operations */}
                  <h4 className="font-extrabold text-xs uppercase text-[#00264D] mb-4 flex items-center gap-1.5 border-b pb-1">
                    <History className="w-4 h-4 text-[#004A99]" />
                    Historial de Tramitações e Custódia do Trâmite
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold text-[9px] text-[#64748B] uppercase block">Autuação Inicial</span>
                      <p className="font-medium text-slate-800 mt-1">
                        Instaurado de forma nato-digital na unidade <strong className="text-[#00264D]">{processo.unidadeGeradora}</strong> em {new Date(processo.dataGeracao).toLocaleString()}
                      </p>
                    </div>

                    {processo.historicoTramitacoes.map((t, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <span className="font-bold text-[9px] text-[#004A99] uppercase block">Trâmite Registrado</span>
                        <p className="font-medium text-slate-800 mt-1">
                          Transferido de <strong className="text-slate-900">{t.origem}</strong> para <strong className="text-sky-800">{t.destino}</strong> por <span className="italic">{t.usuario}</span> em {new Date(t.dataEnvio).toLocaleString()}
                        </p>
                        {t.retornoProgramado && (
                          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded font-bold mt-2 inline-block">
                            Retorno programado até {t.retornoProgramado.dataLimite} ({t.retornoProgramado.status})
                          </div>
                        )}
                        {t.despachoRestrito && (
                          <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded font-bold mt-2 inline-block">
                            Despacho restrito a {t.usuariosPermitidos?.length || 0} usuário(s) do setor destinatário
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comments and Annotations Side Box (Collapsible/Integrated Panel) */}
          <div className="w-full lg:w-96 shrink-0 bg-white border-l border-[#D9E2EC] flex flex-col h-full overflow-hidden">
            {/* Header selection tab */}
            <div className="flex border-b border-[#D9E2EC] bg-[#F4F7FA] p-2 gap-1.5 select-none shrink-0 border-t lg:border-t-0 font-sans">
              <button
                onClick={() => setCommentsTab("comments")}
                className={`flex-1 py-1.5 text-center text-xs font-bold cursor-pointer rounded transition-all border ${
                  commentsTab === "comments" 
                    ? "process-tab-active bg-[#00264D] text-white border-[#00264D] shadow-sm" 
                    : "process-tab-idle bg-white hover:bg-slate-50 text-slate-600 border-[#D9E2EC]"
                }`}
              >
                Comentários ({processo.comentarios.length})
              </button>
              <button
                onClick={() => setCommentsTab("annotations")}
                className={`flex-1 py-1.5 text-center text-xs font-bold cursor-pointer rounded transition-all border ${
                  commentsTab === "annotations" 
                    ? "process-tab-active bg-[#00264D] text-white border-[#00264D] shadow-sm" 
                    : "process-tab-idle bg-white hover:bg-slate-50 text-slate-600 border-[#D9E2EC]"
                }`}
              >
                Notas Internas
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-left font-sans">
              <AnimatePresence mode="wait">
                {commentsTab === "comments" ? (
                  /* COMMENTS SECTION */
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full text-left"
                  >
                    <div className="mb-3 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-sky-600" />
                        Comentários Compartilhados
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Visíveis a todas as unidades vinculadas ao expediente.</p>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-1 max-h-[300px]">
                      {processo.comentarios.map((c) => (
                        <div key={c.id} className="p-3 rounded bg-sky-50/50 border border-sky-100 text-xs text-left">
                          <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-[#00264D]">
                            <span>{c.autor} ({c.unidade})</span>
                            <span className="text-slate-400 font-mono font-normal">{new Date(c.dataHora).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-semibold text-left">{c.texto}</p>
                        </div>
                      ))}

                      {processo.comentarios.length === 0 && (
                        <p className="text-[11px] italic text-center text-slate-400 py-12">Nenhum comentário cadastrado para este processo.</p>
                      )}
                    </div>

                    {/* Comment Input */}
                    <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 mt-auto">
                      <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Adicionar comentário oficial ao processo..."
                        className="w-full text-xs p-2.5 border border-[#D9E2EC] rounded focus:outline-none focus:ring-1 focus:ring-[#00264D] bg-[#F4F7FA] focus:bg-white resize-none font-medium"
                        rows={3}
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="w-full mt-2 py-2 bg-[#00264D] hover:bg-[#004A99] text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors"
                      >
                        Enviar Comentário
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  /* ANNOTATIONS SECTION */
                  <motion.div
                    key="annotations"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full text-left"
                  >
                    <div className="mb-3 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-[#00264D] flex items-center gap-1.5">
                        <Pin className="w-4 h-4 text-[#004A99]" />
                        Lembretes da Unidade [{currentUnit}]
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rascunhos privados de uso temporário da equipe local.</p>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                      {processo.anotacao ? (
                        <div className={`p-4 rounded border text-xs relative text-left ${
                          processo.anotacao.prioridade 
                            ? "bg-red-50 border-red-200 text-red-950 font-semibold" 
                            : "bg-[#EDF4FF] border-[#D9E2EC] text-[#00264D] font-semibold"
                        }`}>
                          <button
                            onClick={handleDeleteAnnotation}
                            className="absolute right-1.5 top-1.5 p-1 hover:bg-black/5 rounded text-gray-500 cursor-pointer transition-colors"
                            title="Remover anotação"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase text-white ${
                              processo.anotacao.prioridade ? "bg-red-600" : "bg-[#004A99]"
                            }`}>
                              {processo.anotacao.prioridade ? "Urgente" : "Nota Local"}
                            </span>
                            <span className="text-[9px] text-[#64748B] font-bold">{processo.anotacao.autor}</span>
                          </div>

                          <p className="leading-relaxed whitespace-pre-wrap text-left">{processo.anotacao.texto}</p>
                          <span className="text-[9px] opacity-60 block mt-2.5 text-right font-mono">
                            Salvo em {new Date(processo.anotacao.dataHora).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="text-left">
                          <p className="text-[11px] text-center italic text-slate-400 py-12">Nenhum lembrete privado para esta unidade.</p>
                          
                          <form onSubmit={handleSaveAnnotation} className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Novo Rascunho Interno</label>
                              <textarea
                                value={newAnnotationText}
                                onChange={(e) => setNewAnnotationText(e.target.value)}
                                placeholder="Notas internas do gabinente, lembretes de prazos, providências de assinaturas..."
                                className="w-full text-xs p-2.5 border border-[#D9E2EC] rounded focus:outline-none focus:ring-1 focus:ring-[#00264D] bg-[#F4F7FA] focus:bg-white font-medium"
                                rows={4}
                              />
                            </div>

                            <div className="flex items-center justify-between p-1 bg-[#F4F7FA] rounded border border-[#D9E2EC] px-3 py-1.5">
                              <span className="text-[11px] font-bold text-[#00264D]">Marcar como Urgência</span>
                              <button
                                type="button"
                                onClick={() => setAnnotationPriority(!annotationPriority)}
                                className="focus:outline-none"
                              >
                                {annotationPriority ? (
                                  <ToggleRight className="w-8 h-8 text-red-600" />
                                ) : (
                                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                                )}
                              </button>
                            </div>

                            <button
                              type="submit"
                              disabled={!newAnnotationText.trim()}
                              className="w-full py-2 rounded text-xs font-bold text-white bg-[#004A99] hover:bg-[#00264D] disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              Salvar Anotação Interna
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

      {/* 2FA REGULATORY SIGNATURE VERIFICATION PROMPT MODAL */}
      <AnimatePresence>
        {isSigning && activeDoc && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-black p-6 rounded-2xl shadow-xl w-full max-w-sm text-left border"
            >
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-sm uppercase">Assinatura Certificada SPFCAS</h3>
              </div>

              <form onSubmit={handleSignDocument} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Nome Completo do Assinante
                  </label>
                  <input
                    type="text"
                    value={usuarioNome}
                    disabled
                    className="w-full text-xs p-2 border rounded bg-gray-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Definir Cargo / Função para Efeito
                  </label>
                  <input
                    type="text"
                    value={cargoAssinatura}
                    onChange={(e) => setCargoAssinatura(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: Diretor Substituto de Finanças"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Autenticação por Senha ou Token
                  </label>
                  <input
                    type="password"
                    value={senhaAssinatura}
                    onChange={(e) => setSenhaAssinatura(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSigning(false)}
                    className="flex-1 py-1.5 border rounded text-xs font-semibold cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Assinar Agora
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW CUSTODY DOCUMENT MODAL */}
      <AnimatePresence>
        {isCreatingDoc && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-black p-6 rounded-2xl shadow-xl w-full max-w-md text-left border"
            >
              <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100">
                <FileText className="w-5 h-5 text-[#004A99]" />
                <h3 className="font-bold text-sm uppercase">Anexar Documento ao Processo</h3>
              </div>

              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Tipo do Documento Eletrônico
                  </label>
                  <select
                    value={newDocTipo}
                    onChange={(e) => setNewDocTipo(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Ofício">Ofício (Comunicação com autarquias externas)</option>
                    <option value="Memorando">Memorando (Tráfego interno corporativo)</option>
                    <option value="Parecer">Parecer (Manifestação técnica consultiva)</option>
                    <option value="Relatório">Relatório (Auditorias e laudos periciais)</option>
                    <option value="Despacho">Despacho (Manifestações decidoras ordinatórias)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Número do Documento
                  </label>
                  <input
                    type="text"
                    value={`${nextDocNumber}/${new Date().getFullYear()} - ${currentUnit}`}
                    readOnly
                    className="w-full text-xs p-2 border rounded bg-slate-100 text-[#00264D] font-bold cursor-not-allowed"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Numeração automática pela sequência de {newDocTipo.toLowerCase()}s da unidade {currentUnit}.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Título / Assunto Principal
                  </label>
                  <input
                    type="text"
                    value={newDocTitulo}
                    onChange={(e) => setNewDocTitulo(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:outline-none"
                    placeholder="Ex: Aquisição de mobiliários corporativos CAS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Nível de Acesso Regulamentar
                  </label>
                  <select
                    value={newDocAcesso}
                    onChange={(e) => setNewDocAcesso(e.target.value as NivelAcesso)}
                    className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-1 bg-white"
                  >
                    <option value="Público">Público (Acesso como regra geral - LAI)</option>
                    <option value="Restrito">Restrito (Unidades por onde o processo transite)</option>
                    <option value="Sigiloso">Sigiloso (Credenciados específicos DITEC/DG)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingDoc(false)}
                    className="flex-1 py-1.5 border rounded text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#0B1B3D] text-white rounded text-xs font-bold hover:brightness-110 cursor-pointer"
                  >
                    Incluir Documento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
