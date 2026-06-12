export enum NivelAcesso {
  PUBLICO = "Público",
  RESTRITO = "Restrito",
  SIGILOSO = "Sigiloso",
}

export enum StatusRetorno {
  DENTRO_DO_PRAZO = "Dentro do Prazo",
  RETORNO_CUMPRIDO = "Retorno Cumprido",
  PRAZO_EXPIRADO = "Prazo Expirado",
}

export enum TipoBloco {
  INTERNO = "Bloco Interno",
  REUNIAO = "Bloco de Reunião",
  ASSINATURA = "Bloco de Assinatura",
}

export interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  unidade: string;
  login: string;
  role: "ROLE_USER" | "ROLE_TI_ADMIN";
  matricula?: string;
  cpf?: string;
  email?: string;
  fone?: string;
}

export type PrioridadeProcesso = "baixa" | "media" | "alta";

export interface Comentario {
  id: string;
  autor: string;
  unidade: string;
  texto: string;
  dataHora: string;
  nivelAcesso: NivelAcesso;
}

export interface Anotacao {
  id: string;
  autor: string;
  texto: string;
  dataHora: string;
  prioridade: boolean;
}

export interface DocumentoAnexo {
  id: string;
  nome: string;
  mimeType: string;
  tamanhoBytes: number;
  dataUpload: string;
  criador: string;
  unidadeGeradora: string;
  dataUrl: string;
}

export interface Documento {
  id: string;
  seiNumero: string;
  titulo: string;
  tipo: string;
  formato: "Interno" | "Externo";
  unidadeGeradora: string;
  criador: string;
  dataCriacao: string;
  nivelAcesso: NivelAcesso;
  conteudoHtml: string;
  assinado: boolean;
  assinantes: { nome: string; cargo: string; dataHora: string }[];
  descricao?: string;
  nomeNaArvore?: string;
  hipoteseLegal?: string;
  numeroExterno?: string;
  tipoConferencia?: string;
  anexos?: DocumentoAnexo[];
}

export interface Tramitacao {
  origem: string;
  destino: string;
  dataEnvio: string;
  usuario: string;
  despachoRestrito?: boolean;
  usuariosPermitidos?: string[];
  retornoProgramado?: {
    dataLimite: string;
    status: StatusRetorno;
  };
}

export interface Processo {
  id: string;
  nup: string; // Número Único de Protocolo
  tipo: string;
  unidadeGeradora: string;
  interessados: string;
  especificacao: string;
  dataGeracao: string;
  nivelAcesso: NivelAcesso;
  lido: boolean;
  estaConcluido: boolean;
  bloqueadoTramite: boolean;
  hipoteseLegal?: string;
  anotacao?: Anotacao;
  comentarios: Comentario[];
  historicoTramitacoes: Tramitacao[];
  documentos: Documento[];
  marcadorCor?: string;
  marcadorNome?: string;
  marcadorTexto?: string;
  prioridade?: PrioridadeProcesso;
}

export interface ThemeVariant {
  id: string;
  nome: string;
  descricao: string;
  primary: string;       // main brand color (navy deep etc)
  secondary: string;     // accent/highlight color (gold etc)
  secondaryHover: string;
  bgDesktop: string;      // workspace canvas background
  bgPaper: string;        // document sheets background
  textPrimary: string;    // charcoal text dark
  textSecondary: string;  // muted gray text
  border: string;         // clean borders
  cardBg: string;         // workspace card bg
  isDark: boolean;
}
