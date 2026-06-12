import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Send, CalendarClock, Briefcase, ChevronRight, X, 
  MapPin, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Users 
} from "lucide-react";
import { Processo, StatusRetorno, TipoBloco, Usuario } from "../types";
import { INITIAL_UNIDADES } from "../data/schemas";

interface TramitacaoModalProps {
  processo: Processo;
  currentUnit: string;
  isOpen: boolean;
  onClose: () => void;
  usuarios: Usuario[];
  onConfirmTramitacao: (
    destinoSigla: string, 
    retornoData?: string, 
    retornoStatus?: StatusRetorno,
    blocoAdicionadoId?: string,
    blocoAdicionadoTipo?: TipoBloco,
    despachoRestrito?: boolean,
    usuariosPermitidos?: string[]
  ) => void;
}

export default function TramitacaoModal({ 
  processo, currentUnit, isOpen, onClose, onConfirmTramitacao, usuarios 
}: TramitacaoModalProps) {
  const [destino, setDestino] = useState("");
  const [hasRetornoProgramado, setHasRetornoProgramado] = useState(false);
  const [retornoData, setRetornoData] = useState("2026-06-30");
  const [retornoStatus, setRetornoStatus] = useState<StatusRetorno>(StatusRetorno.DENTRO_DO_PRAZO);
  const [hasDespachoRestrito, setHasDespachoRestrito] = useState(false);
  const [usuariosPermitidos, setUsuariosPermitidos] = useState<string[]>([]);

  // Shared work blocks simulation
  const [hasBlocoDeTrabalho, setHasBlocoDeTrabalho] = useState(false);
  const [tipoBloco, setTipoBloco] = useState<TipoBloco>(TipoBloco.INTERNO);
  const [selectedBlocoId, setSelectedBlocoId] = useState("bloco-padrao");

  if (!isOpen) return null;

  // Destination units list (excludes active unit to make clean routing)
  const availableDestinations = INITIAL_UNIDADES.filter(u => u.sigla !== currentUnit);
  const destinoUsuarios = usuarios.filter((usuario) => usuario.unidade === destino);

  const toggleUsuarioPermitido = (login: string) => {
    setUsuariosPermitidos((prev) =>
      prev.includes(login)
        ? prev.filter((item) => item !== login)
        : [...prev, login]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino) return;
    if (hasDespachoRestrito && usuariosPermitidos.length === 0) {
      alert("Selecione ao menos uma pessoa do setor destinatário para acessar o despacho restrito.");
      return;
    }

    onConfirmTramitacao(
      destino,
      hasRetornoProgramado ? retornoData : undefined,
      hasRetornoProgramado ? retornoStatus : undefined,
      hasBlocoDeTrabalho ? selectedBlocoId : undefined,
      hasBlocoDeTrabalho ? tipoBloco : undefined,
      hasDespachoRestrito,
      hasDespachoRestrito ? usuariosPermitidos : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white text-black rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col text-left"
        id="tramitacao_modal_card"
      >
        {/* Top Header custom colored under Deep Navy banner */}
        <div className="bg-[#00264D] text-white p-4 font-sans flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-white animate-pulse" />
            <div>
              <h3 className="font-bold text-sm uppercase">Tramitação e Envio Eletrônico</h3>
              <p className="text-[10px] opacity-75">NUP: {processo.nup}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-full cursor-pointer text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. SELEÇÃO DE DESTINO DA TRAMITAÇÃO */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Selecione a Unidade / Força de Destino
            </label>
            <select
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                setUsuariosPermitidos([]);
              }}
              className="w-full text-xs p-2.5 border rounded-lg bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Selecione uma unidade destinatária...</option>
              {availableDestinations.map(u => (
                <option key={u.id} value={u.sigla}>
                  {u.sigla} - {u.nome}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-gray-400 block mt-1">O processo sairá temporariamente da mesa da unidade {currentUnit} e será autuado de forma prioritária no destino.</span>
          </div>

          <hr className="border-gray-100" />

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Despacho Restrito
              </label>
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#00264D] cursor-pointer"
                checked={hasDespachoRestrito}
                onChange={(e) => setHasDespachoRestrito(e.target.checked)}
              />
            </div>

            {hasDespachoRestrito && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-2"
              >
                <div className="p-2.5 rounded bg-white border border-[#D9E2EC] text-[10px] text-[#00264D] flex items-start gap-2 leading-relaxed">
                  <Users className="w-4 h-4 text-[#004A99] shrink-0 mt-0.5" />
                  <span>
                    O processo ficará visível na mesa do setor destinatário, mas somente os usuários selecionados poderão abrir a árvore documental.
                  </span>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {destinoUsuarios.map((usuario) => (
                    <label
                      key={usuario.login}
                      className="flex items-center justify-between gap-3 p-2 rounded border border-gray-200 bg-white text-xs cursor-pointer hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold text-gray-800 truncate">{usuario.nome}</span>
                        <span className="block text-[9px] text-gray-500 truncate">{usuario.cargo} · {usuario.login}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={usuariosPermitidos.includes(usuario.login)}
                        onChange={() => toggleUsuarioPermitido(usuario.login)}
                        className="w-4 h-4 accent-[#00264D] shrink-0"
                      />
                    </label>
                  ))}

                  {destino && destinoUsuarios.length === 0 && (
                    <p className="text-[10px] text-red-600 bg-red-50 border border-red-100 rounded p-2">
                      Nenhum usuário cadastrado para a unidade {destino}. Cadastre usuários antes de restringir o despacho.
                    </p>
                  )}

                  {!destino && (
                    <p className="text-[10px] text-gray-500 bg-white border border-gray-200 rounded p-2">
                      Selecione uma unidade destinatária para listar as pessoas disponíveis.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* 2. SUB-MÓDULO: RETORNO PROGRAMADO (CASCATA DE PRAZOS) */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-[#004A99] shrink-0" />
                Configurar Retorno Programado (Prazos)
              </label>
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#00264D] cursor-pointer"
                checked={hasRetornoProgramado}
                onChange={(e) => setHasRetornoProgramado(e.target.checked)}
              />
            </div>

            {hasRetornoProgramado && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-2"
              >
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Data Limite</span>
                    <input
                      type="date"
                      value={retornoData}
                      onChange={(e) => setRetornoData(e.target.value)}
                      className="w-full text-xs p-2 border rounded bg-white"
                      required
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Status de Instauro</span>
                    <select
                      value={retornoStatus}
                      onChange={(e) => setRetornoStatus(e.target.value as StatusRetorno)}
                      className="w-full text-xs p-2 border rounded bg-white"
                    >
                      <option value="Dentro do Prazo">✓ {StatusRetorno.DENTRO_DO_PRAZO}</option>
                      <option value="Retorno Cumprido">✓ {StatusRetorno.RETORNO_CUMPRIDO}</option>
                      <option value="Prazo Expirado">✗ {StatusRetorno.PRAZO_EXPIRADO}</option>
                    </select>
                  </div>
                </div>

                {/* Micro instructions explaining icons */}
                <div className="p-2.5 rounded bg-[#EDF4FF] border border-[#D9E2EC] flex items-start gap-2 text-[10px] leading-relaxed text-[#00264D]">
                  <AlertTriangle className="w-4 h-4 text-[#004A99] shrink-0 mt-0.5" />
                  <p>
                    <strong>Efeito de Status do SPFCAS:</strong> Prazos vencidos alteram automaticamente as setinhas indicadoras do processo para vermelho na mesa de controle geral, forçando alertas regulamentares.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* 3. BLOCOS DE TRABALHO COMPARTILHADOS */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                Vincular a Blocos de Trabalho
              </label>
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#00264D] cursor-pointer"
                checked={hasBlocoDeTrabalho}
                onChange={(e) => setHasBlocoDeTrabalho(e.target.checked)}
              />
            </div>

            {hasBlocoDeTrabalho && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-2"
              >
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Selecione o Tipo de Bloco</span>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(TipoBloco).map((tipoVal) => (
                      <button
                        key={tipoVal}
                        type="button"
                        onClick={() => {
                          setTipoBloco(tipoVal);
                          if (tipoVal === TipoBloco.INTERNO) setSelectedBlocoId("bl-int-1");
                          else if (tipoVal === TipoBloco.REUNIAO) setSelectedBlocoId("bl-re-1");
                          else setSelectedBlocoId("bl-as-1");
                        }}
                        className={`p-2 rounded text-[10px] font-bold text-center border cursor-pointer transition-all ${
                          tipoBloco === tipoVal 
                            ? "bg-indigo-600 text-white border-indigo-600" 
                            : "bg-white hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tipoVal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Definir Título do Painel</span>
                  <select 
                    value={selectedBlocoId}
                    onChange={(e) => setSelectedBlocoId(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    {tipoBloco === TipoBloco.INTERNO && (
                      <>
                        <option value="bl-int-1">BLOCO 108: Organização Interna GER-ADM - Auditoria</option>
                        <option value="bl-int-2">BLOCO 109: Processos de Custódia Local</option>
                      </>
                    )}
                    {tipoBloco === TipoBloco.REUNIAO && (
                      <>
                        <option value="bl-re-1">BLOCO 110: Reunião do Conselho Fundação CAS (Sem Perda Custódia)</option>
                        <option value="bl-re-2">BLOCO 111: Revisão do Conselho Fiscal Plenário</option>
                      </>
                    )}
                    {tipoBloco === TipoBloco.ASSINATURA && (
                      <>
                        <option value="bl-as-1">BLOCO 113: Assinatura Multipessoal Convênio Saúde GBE</option>
                        <option value="bl-as-2">BLOCO 114: Despacho Terminativo Diretor-Geral</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Bullet details on requested blocks */}
                <div className="text-[10px] text-gray-500 leading-normal pl-2 border-l-2 border-indigo-400">
                  {tipoBloco === TipoBloco.INTERNO && "✓ Blocos Internos: Isolamento estrito de visualização para a equipe atual."}
                  {tipoBloco === TipoBloco.REUNIAO && "✓ Blocos de Reunião: Visualização compartilhada temporária com conselhos deliberativos."}
                  {tipoBloco === TipoBloco.ASSINATURA && "✓ Blocos de Assinatura: Coleta remota multiunidade simultânea certificada."}
                </div>
              </motion.div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!destino || (hasDespachoRestrito && usuariosPermitidos.length === 0)}
              className="flex-1 py-2 bg-[#00264D] hover:bg-[#004A99] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
              Transferir Processo
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
