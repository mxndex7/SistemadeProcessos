import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, KeyRound, Users, LogIn, AlertCircle, ArrowLeft, CheckCircle2, QrCode, Clipboard } from "lucide-react";
import { INITIAL_UNIDADES, INITIAL_USUARIOS } from "../data/schemas";
import { ThemeVariant, Usuario } from "../types";
import fcasLogo from "../assets/logofcas.png";

interface LoginScreenProps {
  theme: ThemeVariant;
  usuarios: any[];
  onLoginSuccess: (usuario: Usuario, unidadeSigla: string) => void;
}

export default function LoginScreen({ theme, usuarios, onLoginSuccess }: LoginScreenProps) {
  const [usuario, setUsuario] = useState("rafael.almeida");
  const [senha, setSenha] = useState("••••••••");
  const [unidade, setUnidade] = useState(INITIAL_UNIDADES[0].sigla);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpCodeError] = useState("");
  const [copied, setCopied] = useState(false);

  const backupKey = "FCAS-A98B-772C-SPFCAS";

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setError("");
    
    // Autenticar diretamente sem 2FA (remover por hora conforme solicitação)
    const matchedUserObj = usuarios.find(u => u.login.toLowerCase() === usuario.trim().toLowerCase()) 
      || usuarios.find(u => u.nome.toLowerCase().includes(usuario.trim().toLowerCase()))
      || usuarios[0];

    const matchedUnit = INITIAL_UNIDADES.find(u => u.sigla === unidade) || INITIAL_UNIDADES[0];
    onLoginSuccess(matchedUserObj as Usuario, matchedUnit.sigla);
  };

  const handleTotpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) {
      setTotpCodeError("Código inválido. Digite os 6 dígitos gerados pelo aplicativo.");
      return;
    }
    setTotpCodeError("");

    // Simulate validation matching users list to handle RBAC separation automatically in-app
    const matchedUserObj = usuarios.find(u => u.login.toLowerCase() === usuario.trim().toLowerCase()) 
      || usuarios.find(u => u.nome.toLowerCase().includes(usuario.trim().toLowerCase()))
      || usuarios[0];

    const matchedUnit = INITIAL_UNIDADES.find(u => u.sigla === unidade) || INITIAL_UNIDADES[0];
    onLoginSuccess(matchedUserObj as Usuario, matchedUnit.sigla);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(backupKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Dynamic style mapper based on selected brand theme parameters
  const brandBg = theme.isDark ? theme.cardBg : "#FFFFFF";
  const textDark = theme.textPrimary;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: theme.bgDesktop, color: theme.textPrimary }}
    >
      <div 
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-opacity-10 transition-all duration-300"
        style={{ 
          backgroundColor: brandBg, 
          borderColor: theme.border,
          boxShadow: theme.isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }}
        id="login_card"
      >
        {/* Cabecalho da Fundação CAS */}
        <div 
          className="p-6 text-center border-b flex flex-col items-center select-none"
          style={{ 
            backgroundColor: theme.primary, 
            color: "#FFFFFF",
            borderColor: theme.border 
          }}
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-slate-100 p-1 animate-fade-in">
            <img src={fcasLogo} alt="Logo FCAS" className="w-full h-full object-contain" />
          </div>          <h1 className="text-xl font-sans font-bold tracking-tight uppercase">
            Fundação CAS
          </h1>
          <p className="text-xs font-semibold tracking-wider opacity-90 mt-1 uppercase" style={{ color: theme.secondary }}>
            Processos & Documentos Eletrônicos
          </p>
          <span className="text-[10px] opacity-65 mt-0.5 font-medium">SPFCAS - Sistema de Processos Fundação CAS</span>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-semibold" style={{ color: textDark }}>Autenticação Segura</h2>
                  <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>Insira suas credenciais institucionais para acesso unificado</p>
                </div>



                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg border flex items-center gap-2 text-xs bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Usuário / Matrícula
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Users className="h-4 w-4" style={{ color: theme.textSecondary }} />
                      </div>
                      <input
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-transparent transition-all"
                        style={{ 
                          borderColor: theme.border, 
                          color: textDark,
                        }}
                        placeholder="nome.sobrenome"
                        required
                        id="input_usuario"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-4 w-4" style={{ color: theme.textSecondary }} />
                      </div>
                      <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-transparent transition-all"
                        style={{ 
                          borderColor: theme.border, 
                          color: textDark,
                        }}
                        placeholder="Matrícula ou Senha portal CAS"
                        required
                        id="input_senha"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Selecione sua Unidade de Atuação
                    </label>
                    <select
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                      className="block w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-transparent transition-all"
                      style={{ 
                        borderColor: theme.border, 
                        color: textDark,
                        backgroundColor: theme.isDark ? theme.cardBg : "#FFFFFF"
                      }}
                      id="select_unidade"
                    >
                      {INITIAL_UNIDADES.map((u) => (
                        <option 
                          key={u.id} 
                          value={u.sigla}
                          style={{ backgroundColor: theme.cardBg, color: textDark }}
                        >
                          {u.sigla} - {u.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md filter hover:brightness-105 active:scale-[0.98] transition-all"
                    style={{ 
                      backgroundColor: theme.primary, 
                      color: "#FFFFFF"
                    }}
                    id="btn_login_submit"
                  >
                    <LogIn className="w-4 h-4" />
                    Autenticar Credenciais
                  </button>
                </form>

                <div className="mt-6 text-center text-[10px]" style={{ color: theme.textSecondary }}>
                  Para assistência técnica de custódia, abra um chamado junto à DITEC.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-semibold" style={{ color: textDark }}>Verificação em Duas Etapas (2FA)</h2>
                  <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                    Utilize o Google Authenticator ou Microsoft Authenticator
                  </p>
                </div>

                <div 
                  className="p-4 rounded-xl border mb-4 flex flex-col items-center text-center shadow-inner"
                  style={{ backgroundColor: theme.bgDesktop, borderColor: theme.border }}
                >
                  {/* Central QR simulator */}
                  <div className="bg-white p-3 rounded-lg shadow-md mb-3 relative group">
                    <div className="w-36 h-36 bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                      <QrCode className="w-24 h-24 text-gray-800" />
                      <span className="text-[9px] text-gray-500 font-mono mt-1">TOTP: admin.cas@spfcas</span>
                    </div>
                    <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-[10px] text-gray-700 font-semibold select-none">
                      Aponte a câmera do aplicativo autenticador para registrar no barramento da CAS.
                    </div>
                  </div>

                  {/* Chave de Backup */}
                  <div className="w-full text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: theme.textSecondary }}>
                      Chave Secreta de Pareamento
                    </span>
                    <div className="mt-1 flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-lg p-2 border border-dashed border-gray-400/40">
                      <span className="font-mono text-xs font-bold tracking-wider" style={{ color: theme.primary }}>
                        {backupKey}
                      </span>
                      <button 
                        onClick={copyToClipboard}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-xs flex items-center gap-1 font-semibold"
                        type="button"
                        title="Copiar chave"
                      >
                        <Clipboard className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{copied ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {totpError && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 rounded-lg border flex items-center gap-2 text-xs bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{totpError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleTotpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-center uppercase tracking-wider" style={{ color: theme.textSecondary }}>
                      Código de 6 Dígitos Autenticador
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      className="block w-full text-center py-2.5 px-4 font-mono text-xl tracking-[0.5em] font-bold border rounded-lg focus:outline-none focus:ring-2 bg-transparent"
                      style={{ 
                        borderColor: theme.border, 
                        color: textDark,
                      }}
                      placeholder="000000"
                      required
                      id="input_2fa_code"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("credentials")}
                      className="flex-1 py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      style={{ borderColor: theme.border, color: theme.textSecondary }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Retornar
                    </button>
                    
                    <button
                      type="submit"
                      className="flex-2 py-2 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md filter hover:brightness-105 active:scale-[0.98] transition-all"
                      style={{ 
                        backgroundColor: theme.primary, 
                        color: "#FFFFFF"
                      }}
                      id="btn_2fa_confirm"
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: theme.secondary }} />
                      Confirmar Token
                    </button>
                  </div>
                </form>

                <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 text-[10px] text-yellow-800 dark:text-yellow-300">
                  <strong>Aviso de Segurança:</strong> Nunca forneça este código a terceiros. A Fundação CAS segue as regras estritas da LGPD e LAI sobre custódia arquivística eletrônica.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
