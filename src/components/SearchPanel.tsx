import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, X, SlidersHorizontal, Calendar, FileText, 
  MapPin, Landmark, ArrowRight, Table2, User, Eye, Sparkles 
} from "lucide-react";
import { Processo, NivelAcesso } from "../types";
import { INITIAL_UNIDADES, INITIAL_PROCESSOS } from "../data/schemas";

interface SearchPanelProps {
  currentTheme: any;
  isOpen: boolean;
  onClose: () => void;
  onSelectProcesso: (processoId: string) => void;
}

export default function SearchPanel({ currentTheme, isOpen, onClose, onSelectProcesso }: SearchPanelProps) {
  const [globalQuery, setGlobalQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Advanced structured filters state
  const [tipoProcesso, setTipoProcesso] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [unidadeGeradora, setUnidadeGeradora] = useState("");
  const [assunto, setAssunto] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [assinante, setAssinante] = useState("");

  const [results, setResults] = useState<Processo[]>(INITIAL_PROCESSOS);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    let list = INITIAL_PROCESSOS;

    // Apply global query
    if (globalQuery.trim()) {
      const gq = globalQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nup.toLowerCase().includes(gq) ||
          p.tipo.toLowerCase().includes(gq) ||
          p.especificacao.toLowerCase().includes(gq) ||
          p.interessados.toLowerCase().includes(gq) ||
          p.documentos.some((d) => d.conteudoHtml.toLowerCase().includes(gq) || d.seiNumero.toLowerCase().includes(gq))
      );
    }

    // Apply advanced structured filters if any are filled out
    if (tipoProcesso) {
      list = list.filter((p) => p.tipo.toLowerCase().includes(tipoProcesso.toLowerCase()));
    }
    if (tipoDocumento) {
      list = list.filter((p) =>
        p.documentos.some((d) => d.tipo.toLowerCase() === tipoDocumento.toLowerCase())
      );
    }
    if (unidadeGeradora) {
      list = list.filter((p) => p.unidadeGeradora === unidadeGeradora);
    }
    if (assunto) {
      list = list.filter(
        (p) =>
          p.especificacao.toLowerCase().includes(assunto.toLowerCase()) ||
          p.tipo.toLowerCase().includes(assunto.toLowerCase())
      );
    }
    if (cpfCnpj) {
      // CNPJ/CPF selector simulation
      list = list.filter((p) => p.interessados.toLowerCase().includes(cpfCnpj.toLowerCase()));
    }
    if (assinante) {
      list = list.filter((p) =>
        p.documentos.some((d) =>
          d.assinantes.some((a) => a.nome.toLowerCase().includes(assinante.toLowerCase()))
        )
      );
    }
    if (dataInicio) {
      list = list.filter((p) => new Date(p.dataGeracao) >= new Date(dataInicio));
    }
    if (dataFim) {
      list = list.filter((p) => new Date(p.dataGeracao) <= new Date(dataFim));
    }

    setResults(list);
  };

  const handleClearFilters = () => {
    setGlobalQuery("");
    setTipoProcesso("");
    setTipoDocumento("");
    setUnidadeGeradora("");
    setAssunto("");
    setCpfCnpj("");
    setDataInicio("");
    setDataFim("");
    setAssinante("");
    setResults(INITIAL_PROCESSOS);
    setHasSearched(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white text-black rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col border text-left"
        id="search_panel_modal"
      >
        {/* Header bar */}
        <div className="bg-[#00264D] text-white p-4 font-sans flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white animate-pulse" />
            <div>
              <h3 className="font-bold text-sm uppercase">Mecanismo de Pesquisa Indexada (Elasticsearch)</h3>
              <p className="text-[10px] opacity-75">Motor estruturado de varredura textual real-time Fundação CAS</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Layout Grid split between filters and results */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Side: Advanced Filter Form */}
          <div 
            className="w-full lg:w-96 border-r overflow-y-auto p-4 shrink-0 bg-gray-50/50"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="flex items-center justify-between pb-2 mb-4 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                Filtros de Indexação
              </span>
              <button 
                onClick={handleClearFilters}
                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Limpar Campos
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-3.5 text-xs">
              {/* Global Field */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Pesquisa Rápida Global</span>
                <input
                  type="text"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="Termo textual do documento..."
                  className="w-full text-xs p-2.5 border rounded-lg bg-white focus:ring-1"
                />
              </div>

              {/* Type Process */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tipo de Processo</span>
                <select
                  value={tipoProcesso}
                  onChange={(e) => setTipoProcesso(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                >
                  <option value="">Qualquer tipo...</option>
                  <option value="Gestão Estrutural">Gestão Estrutural</option>
                  <option value="Contratação Coletiva">Contratação Coletiva</option>
                  <option value="Investigação Interna">Investigação Interna</option>
                </select>
              </div>

              {/* Type Document */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tipo de Documento</span>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                >
                  <option value="">Qualquer formato...</option>
                  <option value="Ofício">Ofício</option>
                  <option value="Memorando">Memorando</option>
                  <option value="Parecer">Parecer</option>
                  <option value="Relatório">Relatório</option>
                </select>
              </div>

              {/* Unit Origin */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Unidade Geradora</span>
                <select
                  value={unidadeGeradora}
                  onChange={(e) => setUnidadeGeradora(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                >
                  <option value="">Qualquer unidade...</option>
                  {INITIAL_UNIDADES.map(u => (
                    <option key={u.id} value={u.sigla}>{u.sigla} - {u.nome}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Classificação Arquivística (Assunto)</span>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Contratos, infraestrutura..."
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                />
              </div>

              {/* CPF / CNPJ */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">CPF / CNPJ de Contatos</span>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00 ou Nome"
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                />
              </div>

              {/* User Signer */}
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Usuário Assinante</span>
                <input
                  type="text"
                  value={assinante}
                  onChange={(e) => setAssinante(e.target.value)}
                  placeholder="Ex: Rafael, Helena..."
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Data De</span>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white text-gray-700"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Até</span>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full text-xs p-1.5 border rounded bg-white text-gray-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#00264D] text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer flex items-center justify-center gap-1 shadow-sm mt-3"
              >
                <Search className="w-4 h-4 text-white" />
                Varrer Elasticsearch
              </button>
            </form>
          </div>

          {/* Right Side: Results Grid */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col bg-white">
            <div className="flex items-center justify-between pb-2 mb-4 border-b shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00264D] flex items-center gap-1">
                <Table2 className="w-4 h-4 text-[#004A99]" />
                Ocorrências Encontradas ({results.length})
              </span>
              {hasSearched && (
                <span className="text-[10px] bg-slate-100 text-[#00264D] border border-slate-200 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#004A99]" />
                  Pesquisa Refinada
                </span>
              )}
            </div>

            {/* Results output list */}
            <div className="space-y-3 flex-1 min-h-[350px]">
              {results.map((proc) => {
                let accessColor = "border-l-[#D9E2EC]";
                if (proc.nivelAcesso === "Restrito") accessColor = "border-l-[#004A99]";
                if (proc.nivelAcesso === "Sigiloso") accessColor = "border-l-[#00264D]";

                return (
                  <div
                    key={proc.id}
                    className={`p-3 rounded-lg border border-l-4 hover:shadow-md transition-all text-left flex justify-between items-start gap-4 ${accessColor}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-[#00264D]">{proc.nup}</span>
                        <span className="text-[9px] px-1.5 rounded uppercase font-bold text-white" style={{
                          backgroundColor: proc.nivelAcesso === "Público" ? "#16A34A" : proc.nivelAcesso === "Restrito" ? "#004A99" : proc.nivelAcesso === "Sigiloso" ? "#DC2626" : "#64748B"
                        }}>
                          {proc.nivelAcesso}
                        </span>
                        <span className="text-[9px] text-gray-500 tracking-wider">[{proc.unidadeGeradora}]</span>
                      </div>

                      <h4 className="text-xs font-semibold text-gray-800 leading-snug truncate">
                        {proc.tipo}
                      </h4>
                      <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                        {proc.especificacao || "Sem descrição."}
                      </p>
                      
                      {/* Document indicators in search */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proc.documentos.map(d => (
                          <span key={d.id} className="text-[8px] bg-sky-50 dark:bg-slate-800 text-sky-700 font-bold px-1.5 py-0.2 rounded border border-sky-100 uppercase">
                            {d.tipo} ({d.seiNumero.split(" ")[1]})
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectProcesso(proc.id)}
                      className="py-1 px-2 border rounded hover:bg-black/5 text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1 self-center"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Mesa
                    </button>
                  </div>
                );
              })}

              {results.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center p-16 text-center opacity-65">
                  <SlidersHorizontal className="w-12 h-12 mb-3 text-red-400 stroke-1" />
                  <p className="text-xs font-semibold text-gray-700">Nenhum processo ou documento atende a esses filtros.</p>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-sm">Tente redefinir a classificação arquivística ou os números dos CPFs/CNPJs.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}

