import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, KeyRound, Server, Computer, Lock, Sparkles, Terminal, 
  ArrowRight, Users, Play, Radio, CheckCircle, AlertTriangle, RefreshCw, 
  FileLock, Timer, LogOut, Check, Info
} from "lucide-react";

interface SecurityArchitectureDocProps {
  currentUser: { nome: string; unity: string; role: string; login: string };
  localUsuarios: any[];
  onLogout: () => void;
}

export default function SecurityArchitectureDoc({ currentUser, localUsuarios, onLogout }: SecurityArchitectureDocProps) {
  const [activeTab, setActiveTab] = useState<"fluxo" | "cripto" | "jwt" | "middleware" | "front">("fluxo");
  
  // Pilar 1: Criptografia state
  const [rawPass, setRawPass] = useState("SenhaForter153@CAS");
  const [passSalt, setPassSalt] = useState("fcas_unique_salt_88A");
  const [computedHash, setComputedHash] = useState("");
  const [isHashing, setIsHashing] = useState(false);
  
  // Pilar 2: JWT token state
  const [jwtUserLogin, setJwtUserLogin] = useState(currentUser.login || "rafael.almeida");
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [jwtTokenString, setJwtTokenString] = useState("");

  // Pilar 3: Middleware backend state
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/v1/cadastro/pessoas");
  const [simulatedUserRole, setSimulatedUserRole] = useState(currentUser.role || "ROLE_USER");
  const [middlewareLogs, setMiddlewareLogs] = useState<string[]>([]);
  const [middlewareVerdict, setMiddlewareVerdict] = useState<"PENDING" | "APPROVED" | "DENIED">("PENDING");
  const [isRequesting, setIsRequesting] = useState(false);

  // Pilar 4: Front-end countdown session expired state
  const [isExpiredSimulationActive, setIsExpiredSimulationActive] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Hash Generator logic (Argon2id Mock calculation)
  const generateHash = (pass: string, salt: string) => {
    setIsHashing(true);
    setTimeout(() => {
      // Create a deterministic pseudo-argon2 hash based on string
      const binaryRepresentation = btoa(pass + salt).substring(0, 24);
      const hash = `$argon2id$v=19$m=65536,t=3,p=4$spfcas$${binaryRepresentation}`;
      setComputedHash(hash);
      setIsHashing(false);
    }, 450);
  };

  useEffect(() => {
    generateHash(rawPass, passSalt);
  }, [rawPass, passSalt]);

  // JWT generator logic
  useEffect(() => {
    const matchedUser = localUsuarios.find(u => u.login === jwtUserLogin) || localUsuarios[0] || currentUser;
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      sub: matchedUser.id || "usr-1",
      name: matchedUser.nome,
      login: matchedUser.login,
      role: matchedUser.role,
      unidade: matchedUser.unidade || "DG",
      matricula: matchedUser.matricula || "CAS-1011-A",
      iss: "spfcas-central-auth",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 Hours Lifespan
    };
    
    setJwtPayload(payload);
    
    // Base64Url Encodes
    const base64UrlEncode = (obj: any) => {
      return btoa(JSON.stringify(obj))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    };

    const hEnc = base64UrlEncode(header);
    const pEnc = base64UrlEncode(payload);
    const signature = btoa(`HMAC-SHA256(${hEnc}.${pEnc}, "SPFCAS_JWT_SUPER_SECRET_KEY_2026")`).substring(0, 43)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    setJwtTokenString(`${hEnc}.${pEnc}.${signature}`);
  }, [jwtUserLogin, localUsuarios, currentUser]);

  // Middleware simulation runner
  const handleSimulateMiddleware = () => {
    setIsRequesting(true);
    setMiddlewareVerdict("PENDING");
    setMiddlewareLogs([
      `[GATEWAY] [${new Date().toLocaleTimeString()}] Recebida requisição pendente...`,
    ]);

    setTimeout(() => {
      const logs = [
        `[GATEWAY] Conectado na porta 3000 de forma segura.`,
        `[METRICA] Rota chamada: ${selectedEndpoint}`,
        `[AUTH_MIDDLEWARE] Extraindo Cabeçalho extraído: 'Authorization Bearer eyJhbGciOi...'`,
        `[AUTH_MIDDLEWARE] Decodificando token eletrônico JWT com sucesso.`,
        `[AUTH_MIDDLEWARE] Identidade comprovada: Papel associado [${simulatedUserRole}]`,
      ];

      // Verification logic based on endpoint and role
      let verdict: "APPROVED" | "DENIED" = "APPROVED";
      if (selectedEndpoint === "/api/v1/cadastro/pessoas" && simulatedUserRole !== "ROLE_TI_ADMIN") {
        verdict = "DENIED";
        logs.push(`[RBAC_GUARD] ERP Falhou! Escopo restrito a desenvolvedores e analistas de T.I.`);
        logs.push(`[RBAC_GUARD] ERRO 403: Usuário não possui 'ROLE_TI_ADMIN'. Permissão recusada.`);
      } else if (selectedEndpoint === "/api/v1/admin/infra-purge" && simulatedUserRole !== "ROLE_TI_ADMIN") {
        verdict = "DENIED";
        logs.push(`[RBAC_GUARD] Operação destrutiva detectada de nível de infraestrutura!`);
        logs.push(`[RBAC_GUARD] ERRO 403: Acesso bloqueado por restrição física do gateway.`);
      } else {
        logs.push(`[RBAC_GUARD] Autorização aprovada com sucesso.`);
        logs.push(`[ROUTING] Encaminhando fluxo do banco de dados para o container SPFCAS.`);
        logs.push(`[GATEWAY] Retorno de dados: HTTP 200 OK.`);
      }

      setMiddlewareLogs(prev => [...prev, ...logs]);
      setMiddlewareVerdict(verdict);
      setIsRequesting(false);
    }, 800);
  };

  // Turn session countdown triggers
  useEffect(() => {
    let timer: any;
    if (isExpiredSimulationActive && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isExpiredSimulationActive && countdown === 0) {
      setIsExpiredSimulationActive(false);
      onLogout(); // Disparar logout limpo
    }
    return () => clearTimeout(timer);
  }, [isExpiredSimulationActive, countdown, onLogout]);

  const triggerSessionExpirationSimulation = () => {
    setCountdown(5);
    setIsExpiredSimulationActive(true);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Overlay screen representing front-end interceptor locking user */}
      <AnimatePresence>
        {isExpiredSimulationActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 text-white"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-md space-y-6 p-8 bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              {/* background alert glows */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 blur-3xl rounded-full" />
              
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <Timer className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  Pilar 4: Front-end Client Guard
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">Sessão Expirada por Turno (8h)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para garantir a segurança institucional da Fundação CAS, sessões ativas são duramente limitadas a <strong>8 horas de expediente</strong> contínuo. 
                  Sua sessão expirou e os dados sensíveis estão sendo invalidados localmente.
                </p>
              </div>

              {/* Countdown bar */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Inutilizando chaves...</span>
                  <span className="font-bold text-red-400">{countdown} segundos</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="h-full bg-red-500"
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                Ação do Engenheiro de Segurança: Removendo token localStorage...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs switcher */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1" id="security_tabs_container">
        <button
          onClick={() => setActiveTab("fluxo")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "fluxo" 
              ? "border-sky-600 text-sky-700 bg-sky-50/50" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Mapa do Fluxo Geral
        </button>
        <button
          onClick={() => setActiveTab("cripto")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "cripto" 
              ? "border-sky-600 text-sky-700 bg-sky-50/50" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Pilar 1: Criptografia
        </button>
        <button
          onClick={() => setActiveTab("jwt")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "jwt" 
              ? "border-sky-600 text-sky-700 bg-sky-50/50" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileLock className="w-3.5 h-3.5" />
          Pilar 2: Token JWT
        </button>
        <button
          onClick={() => setActiveTab("middleware")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "middleware" 
              ? "border-sky-600 text-sky-700 bg-sky-50/50" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Pilar 3: Middlewares
        </button>
        <button
          onClick={() => setActiveTab("front")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeTab === "front" 
              ? "border-sky-600 text-sky-700 bg-sky-50/50" 
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Computer className="w-3.5 h-3.5" />
          Pilar 4: Front & Sessão
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          {/* TAB 1: FLUXO COMPLETO INTERATIVO */}
          {activeTab === "fluxo" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
                    <Shield className="w-5 h-5 text-sky-600" />
                    Engenharia de Autenticação SPFCAS (4 Pilares Interligados)
                  </h3>
                  <p className="text-xs text-slate-500">Mapeamento integrado do fluxo de autenticação seguro e controle de níveis de acesso.</p>
                </div>
                <div className="text-[10px] bg-sky-50 text-sky-800 font-bold px-3 py-1 rounded-full border border-sky-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                  Arquitetura Transparente Ativa
                </div>
              </div>

              {/* Graphical Visual Diagram styled with pure HTML grids & flexboxes */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 relative">
                {/* Connection lines for visual beauty on desktop */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 hidden md:block z-0" />

                {/* Step 1 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative z-10 text-center flex flex-col items-center justify-between min-h-48 group hover:border-sky-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    1
                  </div>
                  <div className="my-3 space-y-1">
                    <p className="font-extrabold text-[#00264D] text-xs">Pilar 1: Criptografia</p>
                    <p className="text-[10px] text-slate-500">O usuário preenche os campos. A senha nunca é transmitida ou salva em texto limpo, gerando hash com salt via Argon2id.</p>
                  </div>
                  <div className="text-[9px] font-mono tracking-wider text-sky-700 uppercase font-bold bg-sky-100/50 px-2 py-0.5 rounded">
                    Unidirecional
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative z-10 text-center flex flex-col items-center justify-between min-h-48 group hover:border-sky-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    2
                  </div>
                  <div className="my-3 space-y-1">
                    <p className="font-extrabold text-[#00264D] text-xs">Pilar 2: Geração Token</p>
                    <p className="text-[10px] text-slate-500">O servidor autentica e emite um JSON Web Token assinado pelo segredo do SPFCAS, contendo Matrícula/Role/Setor.</p>
                  </div>
                  <div className="text-[9px] font-mono tracking-wider text-violet-700 uppercase font-bold bg-violet-100/50 px-2 py-0.5 rounded">
                    JWT Compacto
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative z-10 text-center flex flex-col items-center justify-between min-h-48 group hover:border-sky-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    3
                  </div>
                  <div className="my-3 space-y-1">
                    <p className="font-extrabold text-[#00264D] text-xs">Pilar 3: Middlewares</p>
                    <p className="text-[10px] text-slate-500">Nas requisições, filtros do back-end barram agressivamente ações indevidas, inspecionando tokens no servidor remoto.</p>
                  </div>
                  <div className="text-[9px] font-mono tracking-wider text-amber-700 uppercase font-bold bg-amber-100/50 px-2 py-0.5 rounded">
                    Express Guards
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative z-10 text-center flex flex-col items-center justify-between min-h-48 group hover:border-sky-400 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                    4
                  </div>
                  <div className="my-3 space-y-1">
                    <p className="font-extrabold text-[#00264D] text-xs">Pilar 4: Client Protection</p>
                    <p className="text-[10px] text-slate-500">No front, rotas e menus mudam dinamicamente. Caso ocorra fim de expediente (8h), a tela é travada imediatamente.</p>
                  </div>
                  <div className="text-[9px] font-mono tracking-wider text-emerald-700 uppercase font-bold bg-emerald-100/50 px-2 py-0.5 rounded">
                    8h Lifespan Guard
                  </div>
                </div>
              </div>

              {/* Documentation summary text for final presentation */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-[#00264D] text-sm flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  Filosofia de Segurança SPFCAS (Zero Trust Client-to-Server)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
                  <div className="space-y-3">
                    <p>
                      O SPFCAS implementa o modelo de <strong>Segurança de Confiança Zero (Zero Trust)</strong>. Isso significa que nem o front-end confia em estados locais não autenticados, nem o back-end confia em representações visuais sem tokens validados.
                    </p>
                    <p>
                      A <strong>Criptografia Unidirecional</strong> garante a inviolabilidade das chaves no banco, impedindo que mesmo administradores tenham acesso a senhas legíveis.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p>
                      Com os <strong>Tokens JWT Emitidos Eletronicamente</strong> e controlados por tempo (expirabilidade de turno rigorosa de 8 horas), chaves vazadas perdem eficácia de forma acelerada, impedindo persistência de ataques.
                    </p>
                    <p>
                      Por fim, <strong>Middlewares no Servidor</strong> atuam como guardas de infraestrutura inexpugnáveis, protegendo ações críticas contra o controle indevido de usuários normais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PILAR 1 - CRIPTOGRAFIA */}
          {activeTab === "cripto" && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  Pilar 1
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1.5 flex items-center gap-1.5">
                  <Lock className="w-5 h-5 text-sky-600" />
                  Criptografia Unidirecional de Senhas (Argon2id)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Senhas salvas em texto limpo representam falhas graves de integridade. O SPFCAS exige hash estruturado com salts dinâmicos por usuário.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Input Playground */}
                <div className="space-y-4">
                  <h4 className="font-bold text-[#00264D] text-xs uppercase tracking-wider">Simulador de Argon2id Live-Hasher</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Senha de Entrada (Plaintext Password)</label>
                      <input 
                        type="text"
                        value={rawPass}
                        onChange={(e) => setRawPass(e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Salt Dinâmico Institucional (Evita Rainbow Tables)</label>
                      <input 
                        type="text"
                        value={passSalt}
                        onChange={(e) => setPassSalt(e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/60 px-1.5 py-0.5 rounded">
                      Metadados de Custo Argon2
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal pt-1.5">
                      <strong>Tempo de Cômputo:</strong> 3 passados (t=3)<br />
                      <strong>Memória Utilizada:</strong> 64 MB (m=65536)<br />
                      <strong>Paralelismo de Threads:</strong> 4 canais síncronos (p=4)
                    </p>
                  </div>
                </div>

                {/* Right: Output visualization */}
                <div className="bg-slate-900 text-[#F1F1F1] rounded-xl p-5 font-mono text-xs flex flex-col justify-between border border-slate-800">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-bold text-slate-400">Database Save String (Formato de Armazenamento)</span>
                      <span className="text-[10px] text-emerald-400 animate-pulse flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Unidirecional Ativo
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner break-all space-y-2 select-all min-h-[80px]">
                      {isHashing ? (
                        <div className="flex items-center gap-1.5 text-slate-400 italic">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                          Processando 100,000 passes criptográficos em hardware virtual...
                        </div>
                      ) : (
                        <p className="text-emerald-400 font-semibold">{computedHash}</p>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 leading-normal space-y-2">
                      <p>
                        <strong>Por que é seguro?</strong><br />
                        Note que a string gerada começa com <code className="text-sky-300">$argon2id$...</code> de forma explícita. O banco de dados sabe qual algoritmo de comparação usar, porém o hash resultante não retém nenhum resquício da senha real de forma reversível.
                      </p>
                      <p className="text-[10px] text-slate-500 italic">
                        * No fluxo verdadeiro de login, quando o usuário digita a senha dela, o sistema roda o Argon2id sobre a entrada usando o mesmo salt extraído do banco. Se os hashes baterem síncronos, o login é autorizado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PILAR 2 - TOKEN JWT */}
          {activeTab === "jwt" && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  Pilar 2
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1.5 flex items-center gap-1.5">
                  <FileLock className="w-5 h-5 text-sky-600" />
                  Geração de Tokens de Sessão Seguros (RFC-7519 JSON Web Token)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">O token representa a identidade digital irrefutável do colaborador durante o turno, assinado eletronicamente pelo SPFCAS Core.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Column 1: Config (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <h4 className="font-bold text-[#00264D] text-xs uppercase tracking-wider">Metadados da Sessão Emitida</h4>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">Colaborador Conectado</label>
                    <select 
                      value={jwtUserLogin}
                      onChange={(e) => setJwtUserLogin(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    >
                      {localUsuarios.map(u => (
                        <option key={u.login} value={u.login}>{u.nome} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-2 leading-relaxed text-slate-600">
                    <p className="font-semibold text-[#00264D] flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-sky-600" />
                      Assinatura de Algoritmo: HS256
                    </p>
                    <p>
                      O cabeçalho criptográfico contém o tipo e o algoritmo. O payload guarda o subsetor de atuação, papel de acesso e parâmetros do turno institucional.
                    </p>
                    <p className="font-extrabold text-amber-800">
                      ⚠️ Expira rigidamente em 8 horas!
                    </p>
                  </div>
                </div>

                {/* Column 2: Interactive Decoder details (8 cols) */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left part: Token elements */}
                  <div className="space-y-3">
                    <p className="font-bold text-slate-700 text-xs">Aparência do JSON Deserializado (Seguro)</p>
                    
                    <div className="bg-slate-950 text-slate-300 rounded-xl p-4 font-mono text-[10.5px] space-y-3 shadow-inner border border-slate-800">
                      <div>
                        <span className="text-red-400 font-bold">// HEADER</span>
                        <pre className="text-red-300 overflow-x-auto select-all p-1 bg-slate-900 rounded mt-0.5">
                          {JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="text-violet-400 font-bold">// PAYLOAD (Metadados do Colaborador)</span>
                        <pre className="text-violet-300 overflow-x-auto select-all p-1 bg-slate-900 rounded mt-0.5">
                          {jwtPayload ? JSON.stringify(jwtPayload, null, 2) : "Carregando..."}
                        </pre>
                      </div>

                      <div>
                        <span className="text-cyan-400 font-bold">// VERIFY SIGNATURE (Base Secreta)</span>
                        <div className="text-cyan-300 bg-slate-900 p-1.5 rounded text-[9.5px] leading-snug break-all border border-cyan-950/40">
                          HMACSHA256(<br />
                          &nbsp;&nbsp;base64UrlEncode(header) + "." +<br />
                          &nbsp;&nbsp;base64UrlEncode(payload),<br />
                          &nbsp;&nbsp;<span className="bg-purple-950 text-yellow-300 px-1 rounded">"SPFCAS_JWT_SUPER_SECRET_KEY_2026"</span><br />
                          )
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right part: Raw Token colorized */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-slate-700 text-xs">Raw JSON Web Token String (Enviado em cabeçalhos HTTP)</p>
                      <p className="text-[10px] text-slate-500">Note a separação por pontos coloridos representando Header, Payload e Assinatura.</p>
                    </div>

                    <div className="bg-[#121820] text-slate-200 p-4 border border-slate-800 rounded-xl font-mono text-[11px] leading-relaxed break-all select-all flex-1 flex flex-col justify-center min-h-[140px] shadow-lg">
                      <p className="text-left font-semibold">
                        <span className="text-red-400">{jwtTokenString.split('.')[0]}</span>
                        <span className="text-white">.</span>
                        <span className="text-violet-400">{jwtTokenString.split('.')[1]}</span>
                        <span className="text-white">.</span>
                        <span className="text-cyan-400">{jwtTokenString.split('.')[2]}</span>
                      </p>
                    </div>

                    <div className="p-3 bg-cyan-50 text-cyan-800 rounded-xl border border-cyan-150 text-[11.5px] leading-normal flex gap-1.5">
                      <Shield className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Garantia de Antialteração:</strong> Se qualquer atacante alterar um único byte do payload (ex: mudar o papel 'ROLE_USER' para 'ROLE_TI_ADMIN' no cliente), o servidor detectará imediatamente, pois a assinatura gerada não baterá com a do hash recalculado com a chave secreta.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PILAR 3 - MIDDLEWARES */}
          {activeTab === "middleware" && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  Pilar 3
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1.5 flex items-center gap-1.5">
                  <Server className="w-5 h-5 text-sky-600" />
                  Middlewares de Segurança no Back-End (Express Guards)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">O front-end é apenas visual. Quem autoriza ou barra modificações estruturais e consulta de dados sensíveis é o conjunto de middlewares na API.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Simulator settings (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="font-bold text-[#00264D] text-xs uppercase tracking-wider">Painel do Testador de Endpoints & Middleware</h4>
                  
                  <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">1. Qual papel do Usuário simular?</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSimulatedUserRole("ROLE_USER")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded border transition-all ${
                            simulatedUserRole === "ROLE_USER" 
                              ? "bg-sky-50 border-sky-500 text-sky-800" 
                              : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
                          }`}
                        >
                          Usuário Comum (ROLE_USER)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedUserRole("ROLE_TI_ADMIN")}
                          className={`flex-1 py-1.5 text-xs font-bold rounded border transition-all ${
                            simulatedUserRole === "ROLE_TI_ADMIN" 
                              ? "bg-red-50 border-red-500 text-red-800" 
                              : "bg-white hover:bg-slate-100 border-slate-300 text-slate-600"
                          }`}
                        >
                          Equipe de T.I (ROLE_TI_ADMIN)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">2. Endpoint Alvo da Requisição API</label>
                      <select
                        value={selectedEndpoint}
                        onChange={(e) => setSelectedEndpoint(e.target.value)}
                        className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                      >
                        <option value="/api/v1/processos">GET /api/v1/processos (Acesso de Negócio)</option>
                        <option value="/api/v1/cadastro/pessoas">POST /api/v1/cadastro/pessoas (Permissão Especial)</option>
                        <option value="/api/v1/admin/infra-purge">DELETE /api/v1/admin/infra-purge (Célula Crítica)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSimulateMiddleware}
                      disabled={isRequesting}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                    >
                      {isRequesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Processando Guard...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Simular Chamada Eletrônica
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-900 leading-normal flex gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Regra de Ouro Back-end:</strong> Sempre decodificar o token remotamente, extraindo os privilégios vindos das claims assinadas no banco em cada requisição de escrita (POST/PUT/PATCH/DELETE).
                    </div>
                  </div>
                </div>

                {/* Interactive console logger output (7 cols) */}
                <div className="lg:col-span-7 bg-neutral-950 text-[#F1F1F1] rounded-xl font-mono text-xs p-5 flex flex-col justify-between border border-neutral-900 shadow-2xl">
                  <div>
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-3 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        <span>Console do Servidor (Express Router Guard Log)</span>
                      </div>
                      
                      {middlewareVerdict === "APPROVED" && (
                        <span className="bg-emerald-950/80 border border-emerald-900 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-extrabold">
                          HTTP 200 OK
                        </span>
                      )}
                      {middlewareVerdict === "DENIED" && (
                        <span className="bg-red-950/80 border border-red-900 px-2 py-0.5 rounded text-[10px] text-red-400 font-extrabold">
                          HTTP 403 FORBIDDEN
                        </span>
                      )}
                      {middlewareVerdict === "PENDING" && (
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400 font-extrabold animate-pulse">
                          Aguardando Teste...
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {middlewareLogs.length === 0 ? (
                        <p className="text-gray-500 italic p-1">Insira as configurações ao lado e clique em "Simular Chamada Eletrônica" para avaliar o veredito do Middleware de Proteção do SPFCAS.</p>
                      ) : (
                        middlewareLogs.map((log, index) => {
                          const isError = log.includes("ERRO") || log.includes("Falhou") || log.includes("REJECTED") || log.includes("403");
                          const isSuccess = log.includes("200 OK") || log.includes("aprovada") || log.includes("autorizado");
                          return (
                            <div key={index} className={`text-[11px] leading-relaxed ${isError ? "text-red-400 font-bold" : isSuccess ? "text-emerald-400 font-semibold" : "text-neutral-300"}`}>
                              {log}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-900 text-[9.5px] text-gray-500 flex justify-between">
                    <span>Instanciado síncrono via Cluster SPFCAS</span>
                    <span>Proteções do Back-end sinaleiras: Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PILAR 4 - FRONT-END & CUSTODIA */}
          {activeTab === "front" && (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                  Pilar 4
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1.5 flex items-center gap-1.5">
                  <Computer className="w-5 h-5 text-sky-600" />
                  Experiência Visual e Proteção de Rotas (Client Protection Guides)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Como o navegador protege o fluxo de tela. Isso impede que usuários normais acessem abas restritas e destrói tokens localmente após logout limpo ou timeout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Explicação dos guias de segurança do front */}
                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                  <h4 className="font-bold text-[#00264D] text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
                    Medidas Protegidas no Front-end SPFCAS
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <p className="font-bold text-[#00264D]">1. Ocultação Dinâmica de Menus (Visual Filtering)</p>
                      <p className="text-[11px] text-slate-500">
                        O menu não exibe atalhos restritos para quem não possui privilégios de T.I. Por exemplo, contas normais não visualizam links de gerenciamento, reduzindo riscos de engenharia reversa visual.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <p className="font-bold text-[#00264D]">2. Interceptadores Client-Side (Route Guards)</p>
                      <p className="text-[11px] text-slate-500">
                        Caso o usuário tente adivinhar caminhos e digitar rotas restritas no navegador, o re-roteamento automático React inspeciona o localStorage/Cookie-State de imediato e barra a renderização, enviando para a página "Acesso Negado (403)".
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <p className="font-bold text-[#00264D]">3. Logout Limpo (State Purge)</p>
                      <p className="text-[11px] text-slate-500">
                        Clicar em "Sair" do SPFCAS apaga completamente chaves e permissões do LocalStorage, eliminando vestígios residuais no navegador de computadores compartilhados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Simulação interativa de Expiração de Turno */}
                <div className="p-5 border border-red-100 bg-red-50/50 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold bg-red-100 text-red-700 animate-pulse border border-red-200">
                      Dispositivo Crítico de Custódia
                    </span>
                    <h4 className="font-bold text-red-900 text-sm">Simulador de Limite de Sessão do Turno (8 horas)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Conforme determinações técnicas corporativas, computadores ativados dentro da Fundação CAS não podem permanecer abertos indefinidamente. 
                      Para simular o encerramento rígido por limite de turno de 8h e purga instantânea do token no front-end, clique no controle de emergência abaixo:
                    </p>
                  </div>

                  <button
                    onClick={triggerSessionExpirationSimulation}
                    className="w-full py-3 bg-[#0a1128] hover:bg-[#1C2D5A] text-white rounded-xl text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
                  >
                    <Timer className="w-4 h-4 text-red-400 animate-pulse" />
                    SIMULAR EXPIRAÇÃO DE 8 HORAS (LOGOUT SEGURO)
                  </button>

                  <div className="p-3 rounded-lg bg-sky-50 text-sky-800 text-[10.5px] border border-sky-100 flex gap-1.5 leading-normal">
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Comportamento Esperado:</strong> O front-end SPFCAS acionará o timer de purga e, após invalidar os dados locais, chamará a reinicialização segura de sessão redirecionando para a tela de autenticação unificada sem vazamentos residuais.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
