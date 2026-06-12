import { Processo, NivelAcesso, StatusRetorno } from "../types";

// Raw SQL Schemas (Relational mapping for Architect Panel)
export const RAW_POSTGRES_SCHEMA = `
-- =====================================================================
-- DATABASE SCHEMA: SPFCAS - SISTEMA DE PROCESSOS FUNDAÇÃO CAS
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types representing metadata restrictions
CREATE TYPE nivel_acesso_enum AS ENUM ('Público', 'Restrito', 'Sigiloso');
CREATE TYPE status_retorno_enum AS ENUM ('Dentro do Prazo', 'Retorno Cumprido', 'Prazo Expirado');
CREATE TYPE tipo_bloco_enum AS ENUM ('Bloco Interno', 'Bloco de Reunião', 'Bloco de Assinatura');
CREATE TYPE tipo_setor_enum AS ENUM ('Diretoria', 'Gerência', 'Departamento', 'Núcleo', 'Unidade Extensão');

-- 1. Setores e Estrutura Hierárquica Civil da Fundação CAS (Auto-Relacionamento)
CREATE TABLE setores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    sigla VARCHAR(20) UNIQUE NOT NULL, -- Ex: DIR-PRES, GBE, NADEQ
    id_setor_pai UUID REFERENCES setores(id) ON DELETE SET NULL,
    tipo tipo_setor_enum NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Perfis de Acesso (RBAC Roles)
CREATE TABLE Roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(50) UNIQUE NOT NULL, -- 'ROLE_USER' ou 'ROLE_TI_ADMIN'
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Permissões do Sistema
CREATE TABLE Permissoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL, -- Ex: 'PROCESSOS_ADD', 'LOGS_VIEW'
    nome VARCHAR(150) NOT NULL,
    descricao TEXT
);

-- 1.4 Pivot de Controle de Permissões das Roles (Muitos-para-Muitos)
CREATE TABLE Roles_Permissoes (
    role_id UUID REFERENCES Roles(id) ON DELETE CASCADE,
    permissao_id UUID REFERENCES Permissoes(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permissao_id)
);

-- 2. Tabela Integrada de Cadastro de Pessoas / Usuários
CREATE TABLE Usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email_institucional VARCHAR(150) UNIQUE NOT NULL,
    id_setor_atual UUID REFERENCES setores(id), -- Vínculo Civil ao Setor da Fundação CAS
    role_id UUID REFERENCES Roles(id) NOT NULL, -- FK de Perfil de Acesso
    chave_totp_secret VARCHAR(64),
    ativo BOOLEAN DEFAULT TRUE, -- Ativo/Inativo
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Entidade de Processos Administrativos (NUP)
CREATE TABLE Processos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nup VARCHAR(25) UNIQUE NOT NULL, -- Format: 23546.077406/2026-02
    tipo_processo VARCHAR(150) NOT NULL,
    especificacao TEXT,
    interessados VARCHAR(255),
    id_setor_gerador UUID REFERENCES setores(id) NOT NULL,
    nivel_acesso nivel_acesso_enum NOT NULL DEFAULT 'Público',
    hipotese_legal_restricao VARCHAR(255),
    esta_concluido BOOLEAN DEFAULT FALSE,
    bloqueado_tramite BOOLEAN DEFAULT FALSE,
    criado_por_usuario_id UUID REFERENCES Usuarios(id),
    marcador_cor VARCHAR(30),
    marcador_nome VARCHAR(100),
    marcador_texto TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documentos Eletrônicos (Durable custody)
CREATE TABLE Documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processo_id UUID REFERENCES Processos(id) ON DELETE CASCADE NOT NULL,
    sei_numero VARCHAR(30) UNIQUE NOT NULL, -- Format: OFÍCIO 6 (5181271)
    titulo VARCHAR(150) NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- Ex: Ofício, Memorando, Despacho, Relatório
    formato_documento VARCHAR(15) CHECK (formato_documento IN ('Interno', 'Externo')) NOT NULL,
    id_setor_gerador UUID REFERENCES setores(id) NOT NULL,
    criado_por_usuario_id UUID REFERENCES Usuarios(id) NOT NULL,
    nivel_acesso nivel_acesso_enum NOT NULL DEFAULT 'Público',
    hipotese_legal_restricao VARCHAR(255),
    conteudo_html TEXT, -- In-app editing content
    arquivo_url VARCHAR(512), -- PDF/A location in S3 Object Storage
    assinado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assinaturas Eletrônicas Multipessoais
CREATE TABLE Assinaturas_Documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID REFERENCES Documentos(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES Usuarios(id) NOT NULL,
    cargo_utilizado VARCHAR(100) NOT NULL,
    id_setor_assinante UUID REFERENCES setores(id) NOT NULL,
    ip_origem VARCHAR(45) NOT NULL,
    data_hora_assinatura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unica_assinatura_usuario_doc UNIQUE (documento_id, usuario_id)
);

-- 6. Tramitações de Processos (Audit Trail)
CREATE TABLE Tramitacoes_Processo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processo_id UUID REFERENCES Processos(id) ON DELETE CASCADE NOT NULL,
    id_setor_origem UUID REFERENCES setores(id) NOT NULL,
    id_setor_destino UUID REFERENCES setores(id) NOT NULL,
    usuario_id UUID REFERENCES Usuarios(id) NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retorno_programado_data DATE,
    retorno_programado_status status_retorno_enum,
    retorno_programado_cumprido_em TIMESTAMP WITH TIME ZONE
);

-- 7. Comentários Administrativos (Shared / Indexable)
CREATE TABLE Comentarios_Processo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processo_id UUID REFERENCES Processos(id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES Usuarios(id) NOT NULL,
    id_setor UUID REFERENCES setores(id) NOT NULL,
    texto TEXT NOT NULL,
    nivel_acesso nivel_acesso_enum NOT NULL DEFAULT 'Público',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Anotações Internas (Private / Isolated to current Unit)
CREATE TABLE Anotacoes_Processo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processo_id UUID REFERENCES Processos(id) ON DELETE CASCADE NOT NULL,
    id_setor_proprietario UUID REFERENCES setores(id) NOT NULL,
    usuario_criador_id UUID REFERENCES Usuarios(id) NOT NULL,
    texto TEXT NOT NULL,
    prioridade BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unica_anotacao_setor UNIQUE (processo_id, id_setor_proprietario)
);

-- 9. Blocos de Trabalho Compartilhados
CREATE TABLE Blocos_Trabalho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo tipo_bloco_enum NOT NULL DEFAULT 'Bloco Interno',
    id_setor_gerador UUID REFERENCES setores(id) NOT NULL,
    usuario_atribuido_id UUID REFERENCES Usuarios(id),
    grupo_nome VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Itens Relacionados aos Blocos de Trabalho
CREATE TABLE Itens_Bloco_Trabalho (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bloco_id UUID REFERENCES Blocos_Trabalho(id) ON DELETE CASCADE NOT NULL,
    processo_id UUID REFERENCES Processos(id) ON DELETE CASCADE,
    documento_id UUID REFERENCES Documentos(id) ON DELETE CASCADE,
    disponibilizado_para_setor_id UUID REFERENCES setores(id),
    disponibilizado_em TIMESTAMP WITH TIME ZONE,
    concluido BOOLEAN DEFAULT FALSE
);

-- 11. Relacionamento Mapeamento de Paletas de Cores de Usuário
CREATE TABLE Config_Paleta_Usuario (
    usuario_id UUID REFERENCES Usuarios(id) ON DELETE CASCADE NOT NULL,
    paleta_id_preferida VARCHAR(50) NOT NULL DEFAULT 'padrao',
    PRIMARY KEY (usuario_id)
);

-- =====================================================================
-- SEED DATA: CARGA INICIAL DE DADOS DA FUNDAÇÃO CAS (OS 25 SETORES CIVIS)
-- =====================================================================

-- Nível 1: Alta Administração / Diretoria Colegiada
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000001', 'DIR-PRES', 'Diretoria - Diretor Presidente', NULL, 'Diretoria'),
('00000000-0000-0000-0000-000000000002', 'DIR-FIN-ADM', 'Diretoria - Diretor Financeiro e Administrativo', '00000000-0000-0000-0000-000000000001', 'Diretoria'),
('00000000-0000-0000-0000-000000000003', 'SEC-EXEC', 'Secretaria Executiva', '00000000-0000-0000-0000-000000000001', 'Diretoria');

-- Nível 2: Órgãos de Assessoramento e Apoio Direto
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000004', 'DEJUR', 'Departamento Jurídico', '00000000-0000-0000-0000-000000000001', 'Departamento'),
('00000000-0000-0000-0000-000000000005', 'NAJUR', 'Departamento Jurídico Najur', '00000000-0000-0000-0000-000000000004', 'Departamento');

-- Nível 3: Grandes Gerências
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000006', 'GER-ADM', 'Gerência - Gerente Administrativo', '00000000-0000-0000-0000-000000000002', 'Gerência'),
('00000000-0000-0000-0000-000000000007', 'GER-FIN', 'Gerência - Gerente Financeiro', '00000000-0000-0000-0000-000000000002', 'Gerência'),
('00000000-0000-0000-0000-000000000008', 'GBE', 'Gerência - Gerência de Bem-Estar', '00000000-0000-0000-0000-000000000001', 'Gerência');

-- Nível 4: Departamentos e Coordenações Subordinados às Gerências
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000009', 'DRH', 'Departamento de Recursos Humanos (RH)', '00000000-0000-0000-0000-000000000006', 'Departamento'),
('00000000-0000-0000-0000-000000000010', 'DCOMP', 'Departamento de Compras', '00000000-0000-0000-0000-000000000006', 'Departamento'),
('00000000-0000-0000-0000-000000000011', 'DALM-OBR', 'Departamento de Almoxarifado e Obras', '00000000-0000-0000-0000-000000000006', 'Departamento'),
('00000000-0000-0000-0000-000000000012', 'DPAT', 'Departamento de Patrimônio', '00000000-0000-0000-0000-000000000006', 'Departamento'),
('00000000-0000-0000-0000-000000000013', 'CGTI', 'Coordenação GTI', '00000000-0000-0000-0000-000000000006', 'Departamento'),
('00000000-0000-0000-0000-000000000014', 'STI', 'Setor de T.I', '00000000-0000-0000-0000-000000000013', 'Departamento');

-- Nível 5: Núcleos Especializados e de Atendimento
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000015', 'NADEQ', 'Núcleo de Apoio ao Dependente Químico', '00000000-0000-0000-0000-000000000008', 'Núcleo'),
('00000000-0000-0000-0000-000000000016', 'NSS', 'Núcleo de Serviço Social', '00000000-0000-0000-0000-000000000008', 'Núcleo'),
('00000000-0000-0000-0000-000000000017', 'NAC', 'Núcleo de Atendimento ao Contribuinte', '00000000-0000-0000-0000-000000000007', 'Núcleo'),
('00000000-0000-0000-0000-000000000018', 'PSI-I', 'Psicologia I', '00000000-0000-0000-0000-000000000016', 'Núcleo'),
('00000000-0000-0000-0000-000000000019', 'PSI-II', 'Psicologia II', '00000000-0000-0000-0000-000000000016', 'Núcleo');

-- Nível 6: Unidades de Extensão, Apoio e Vetores Regionais
INSERT INTO setores (id, sigla, nome, id_setor_pai, tipo) VALUES 
('00000000-0000-0000-0000-000000000020', 'CVET', 'Casa dos Veteranos', '00000000-0000-0000-0000-000000000008', 'Unidade Extensão'),
('00000000-0000-0000-0000-000000000021', 'CTRAN', 'Casa de Trânsito', '00000000-0000-0000-0000-000000000008', 'Unidade Extensão'),
('00000000-0000-0000-0000-000000000022', 'HTRAN', 'Hotel de Trânsito', '00000000-0000-0000-0000-000000000008', 'Unidade Extensão'),
('00000000-0000-0000-0000-000000000023', 'N-GAR', 'Núcleo Garanhuns', '00000000-0000-0000-0000-000000000006', 'Unidade Extensão'),
('00000000-0000-0000-0000-000000000024', 'N-MAZ', 'Núcleo Nazaré da Mata', '00000000-0000-0000-0000-000000000006', 'Unidade Extensão'),
('00000000-0000-0000-0000-000000000025', 'N-CAR', 'Núcleo Caruaru', '00000000-0000-0000-0000-000000000006', 'Unidade Extensão');


-- =====================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- =====================================================================
CREATE INDEX idx_setores_sigla ON setores(sigla);
CREATE INDEX idx_processos_nup ON Processos(nup);
CREATE INDEX idx_documentos_sei_numero ON Documentos(sei_numero);
CREATE INDEX idx_doc_html_trgm ON Documentos USING gin (conteudo_html gin_trgm_ops);
CREATE INDEX idx_tramitacoes_processo ON Tramitacoes_Processo(processo_id);
`;

export const ELASTICSEARCH_MAPPING = {
  "index": "spfcas_documentos_index",
  "settings": {
    "analysis": {
      "analyzer": {
        "document_pt_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "asciifolding",
            "portuguese_stemmer"
          ]
        }
      },
      "filter": {
        "portuguese_stemmer": {
          "type": "stemmer",
          "language": "light_portuguese"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "processo_id": { "type": "keyword" },
      "nup": { "type": "keyword" },
      "sei_numero": { "type": "keyword" },
      "titulo_documento": { "type": "text", "analyzer": "document_pt_analyzer" },
      "tipo_documento": { "type": "keyword" },
      "unidade_geradora": { "type": "keyword" },
      "criador_nome": { "type": "text" },
      "conteudo_textual": {
        "type": "text",
        "analyzer": "document_pt_analyzer",
        "term_vector": "with_positions_offsets"
      },
      "nivel_acesso": { "type": "keyword" },
      "data_criacao": { "type": "date" },
      "interessados": { "type": "text", "analyzer": "document_pt_analyzer" },
      "classificacao_arquivistica": { "type": "text" }
    }
  }
};

export const INITIAL_UNIDADES = [
  { id: "00000000-0000-0000-0000-000000000001", sigla: "DIR-PRES", nome: "Diretoria - Diretor Presidente", vinculoSuperiorId: null },
  { id: "00000000-0000-0000-0000-000000000002", sigla: "DIR-FIN-ADM", nome: "Diretoria - Diretor Financeiro e Administrativo", vinculoSuperiorId: "00000000-0000-0000-0000-000000000001" },
  { id: "00000000-0000-0000-0000-000000000003", sigla: "SEC-EXEC", nome: "Secretaria Executiva", vinculoSuperiorId: "00000000-0000-0000-0000-000000000001" },
  { id: "00000000-0000-0000-0000-000000000004", sigla: "DEJUR", nome: "Departamento Jurídico", vinculoSuperiorId: "00000000-0000-0000-0000-000000000001" },
  { id: "00000000-0000-0000-0000-000000000005", sigla: "NAJUR", nome: "Departamento Jurídico Najur", vinculoSuperiorId: "00000000-0000-0000-0000-000000000004" },
  { id: "00000000-0000-0000-0000-000000000006", sigla: "GER-ADM", nome: "Gerência - Gerente Administrativo", vinculoSuperiorId: "00000000-0000-0000-0000-000000000002" },
  { id: "00000000-0000-0000-0000-000000000007", sigla: "GER-FIN", nome: "Gerência - Gerente Financeiro", vinculoSuperiorId: "00000000-0000-0000-0000-000000000002" },
  { id: "00000000-0000-0000-0000-000000000008", sigla: "GBE", nome: "Gerência - Gerência de Bem-Estar", vinculoSuperiorId: "00000000-0000-0000-0000-000000000001" },
  { id: "00000000-0000-0000-0000-000000000009", sigla: "DRH", nome: "Departamento de Recursos Humanos (RH)", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000010", sigla: "DCOMP", nome: "Departamento de Compras", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000011", sigla: "DALM-OBR", nome: "Departamento de Almoxarifado e Obras", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000012", sigla: "DPAT", nome: "Departamento de Patrimônio", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000013", sigla: "CGTI", nome: "Coordenação GTI", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000014", sigla: "STI", nome: "Setor de T.I", vinculoSuperiorId: "00000000-0000-0000-0000-000000000013" },
  { id: "00000000-0000-0000-0000-000000000015", sigla: "NADEQ", nome: "Núcleo de Apoio ao Dependente Químico", vinculoSuperiorId: "00000000-0000-0000-0000-000000000008" },
  { id: "00000000-0000-0000-0000-000000000016", sigla: "NSS", nome: "Núcleo de Serviço Social", vinculoSuperiorId: "00000000-0000-0000-0000-000000000008" },
  { id: "00000000-0000-0000-0000-000000000017", sigla: "NAC", nome: "Núcleo de Atendimento ao Contribuinte", vinculoSuperiorId: "00000000-0000-0000-0000-000000000007" },
  { id: "00000000-0000-0000-0000-000000000018", sigla: "PSI-I", nome: "Psicologia I", vinculoSuperiorId: "00000000-0000-0000-0000-000000000016" },
  { id: "00000000-0000-0000-0000-000000000019", sigla: "PSI-II", nome: "Psicologia II", vinculoSuperiorId: "00000000-0000-0000-0000-000000000016" },
  { id: "00000000-0000-0000-0000-000000000020", sigla: "CVET", nome: "Casa dos Veteranos", vinculoSuperiorId: "00000000-0000-0000-0000-000000000008" },
  { id: "00000000-0000-0000-0000-000000000021", sigla: "CTRAN", nome: "Casa de Trânsito", vinculoSuperiorId: "00000000-0000-0000-0000-000000000008" },
  { id: "00000000-0000-0000-0000-000000000022", sigla: "HTRAN", nome: "Hotel de Trânsito", vinculoSuperiorId: "00000000-0000-0000-0000-000000000008" },
  { id: "00000000-0000-0000-0000-000000000023", sigla: "N-GAR", nome: "Núcleo Garanhuns", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000024", sigla: "N-MAZ", nome: "Núcleo Nazaré da Mata", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" },
  { id: "00000000-0000-0000-0000-000000000025", sigla: "N-CAR", nome: "Núcleo Caruaru", vinculoSuperiorId: "00000000-0000-0000-0000-000000000006" }
];

export const INITIAL_USUARIOS = [
  { id: "usr-1", nome: "Dr. Rafael de Almeida", cargo: "Diretor-Presidente", unidade: "DIR-PRES", login: "rafael.almeida", role: "ROLE_USER", matricula: "CAS-1011-A", cpf: "111.222.333-44", email: "rafael.almeida@fundacaocas.org.br" },
  { id: "usr-2", nome: "Dra. Helena Silva", cargo: "Gerente de Bem-Estar", unidade: "GBE", login: "helena.silva", role: "ROLE_USER", matricula: "CAS-4299-A", cpf: "222.333.444-55", email: "helena.silva@fundacaocas.org.br" },
  { id: "usr-3", nome: "Dra. Clarice Mendes", cargo: "Gerente Administrativo", unidade: "GER-ADM", login: "clarice.mendes", role: "ROLE_USER", matricula: "CAS-8812-B", cpf: "333.444.555-66", email: "clarice.mendes@fundacaocas.org.br" },
  { id: "usr-4", nome: "Arquiteto Lucas Viana", cargo: "Analista de Sistemas de T.I", unidade: "STI", login: "lucas.viana", role: "ROLE_TI_ADMIN", matricula: "CAS-0021-T", cpf: "444.555.666-77", email: "lucas.viana@fundacaocas.org.br" }
];

// Rich Seed Data conforming to the instructions
export const INITIAL_PROCESSOS: Processo[] = [
  {
    id: "p-1",
    nup: "23546.077406/2026-02",
    tipo: "Gestão Estrutural: Modernização de Prédios Administrativos",
    unidadeGeradora: "GER-ADM",
    interessados: "Fundação CAS / Diretoria Geral",
    especificacao: "Projeto de revitalização das fachadas termoacústicas e acessibilidade integral da sede Fundação CAS",
    dataGeracao: "2026-05-15T10:00:00Z",
    nivelAcesso: NivelAcesso.PUBLICO,
    lido: false,
    estaConcluido: false,
    bloqueadoTramite: false,
    historicoTramitacoes: [
      {
        origem: "DIR-PRES",
        destino: "GER-ADM",
        dataEnvio: "2026-05-16T14:22:00Z",
        usuario: "Dr. Rafael de Almeida",
        retornoProgramado: {
          dataLimite: "2026-06-15",
          status: StatusRetorno.DENTRO_DO_PRAZO
        }
      }
    ],
    comentarios: [
      {
        id: "c-1",
        autor: "Dr. Rafael de Almeida",
        unidade: "DIR-PRES",
        texto: "Encaminho para análise de orçamento preliminar sob ótica da Lei de Diretrizes Orçamentárias.",
        dataHora: "2026-05-16T14:20:00Z",
        nivelAcesso: NivelAcesso.PUBLICO
      }
    ],
    anotacao: {
      id: "a-1",
      autor: "Dra. Clarice Mendes",
      texto: "Necessita de parecer da engenharia estrutural CAS antes do envio final ao Conselho Deliberativo.",
      dataHora: "2026-05-17T09:12:00Z",
      prioridade: true
    },
    documentos: [
      {
        id: "p1-d1",
        seiNumero: "MEMORANDO 14 (503024)",
        titulo: "Proposta Geral de Adaptação Física Sede CAS",
        tipo: "Memorando",
        formato: "Interno",
        unidadeGeradora: "DIR-PRES",
        criador: "Dr. Rafael de Almeida",
        dataCriacao: "2026-05-16T11:00:00Z",
        nivelAcesso: NivelAcesso.PUBLICO,
        conteudoHtml: `<h2>Memorando de Alinhamento Nº 14/2026-DIR-PRES</h2>
<p><strong>De:</strong> Dr. Rafael de Almeida (Diretoria-Presidente)</p>
<p><strong>Para:</strong> Gerência Administrativa (GER-ADM)</p>
<br/>
<p>Prezados,</p>
<p>Instauro este expediente processual eletrônico para balizar os termos de referência da obra civil necessária na sede institucional da Fundação CAS. Ressalta-se que todos os arquivos de custódia devem observar o padrão PDF/A de preservação de longo prazo e estar indexados de forma imutável em nosso sistema relacional.</p>
<p>O foco principal deve residir na sustentabilidade, isolamento termoacústico para redução das perdas enérgicas e conforto ergonômico no ambiente corporativo.</p>
<p>Atenciosamente,<br/><strong>Dr. Rafael de Almeida</strong><br/>Diretor-Presidente da Fundação CAS</p>`,
        assinado: true,
        assinantes: [
          { nome: "Dr. Rafael de Almeida", cargo: "Diretor-Presidente", dataHora: "2026-05-16T11:45:00Z" }
        ],
        nomeNaArvore: "Memorando 14 - Proposta Geral Adaptação"
      },
      {
        id: "p1-d2",
        seiNumero: "PARECER 302 (518127)",
        titulo: "Viabilidade Técnica e Impactos Ambientais",
        tipo: "Parecer",
        formato: "Interno",
        unidadeGeradora: "GER-ADM",
        criador: "Dra. Clarice Mendes",
        dataCriacao: "2026-05-20T16:30:00Z",
        nivelAcesso: NivelAcesso.PUBLICO,
        conteudoHtml: `<h3>PARECER DE VIABILIDADE TÉCNICA Nº 302/2026-GER-ADM</h3>
<p><strong>Interessados:</strong> Coordenação de Infraestrutura e Diretoria Geral</p>
<br/>
<p>Após profunda varredura textual e consulta aos dados históricos de edificações similares no Elasticsearch institucional, constatamos viabilidade total com nota ponderada de Aprovabilidade de 9.4/10.</p>
<p>Recomenda-se a adoção de vidros triplos de insuflação de argônio e captação fotovoltaica de mini-geração distribuída.</p>
<p>Este parecer é indexado em conformidade com as regras arquivísticas rígidas.</p>`,
        assinado: false,
        assinantes: [],
        nomeNaArvore: "Parecer 302 - Viabilidade e Meio Ambiente"
      }
    ],
    marcadorCor: "marinho",
    marcadorNome: "PRIORITÁRIO",
    marcadorTexto: "Discussão na próxima plenária Fundação CAS"
  },
  {
    id: "p-2",
    nup: "23546.081120/2026-10",
    tipo: "Contratação Coletiva: Plano de Saúde Suplementar da Fundação CAS",
    unidadeGeradora: "GBE",
    interessados: "Servidores da Fundação CAS / Conselho CAS",
    especificacao: "Termo de referência para seleção de operadora de plano de saúde integral com abrangência estadual",
    dataGeracao: "2026-06-01T08:30:00Z",
    nivelAcesso: NivelAcesso.RESTRITO,
    hipoteseLegal: "Informação Pessoal (Art. 31 da Lei nº 12.527/2011)",
    lido: true,
    estaConcluido: false,
    bloqueadoTramite: false,
    historicoTramitacoes: [],
    comentarios: [],
    documentos: [
      {
        id: "p2-d1",
        seiNumero: "OFÍCIO 6 (518532)",
        titulo: "Termo de Referência - Saúde Coletiva",
        tipo: "Ofício",
        formato: "Interno",
        unidadeGeradora: "GBE",
        criador: "Dra. Helena Silva",
        dataCriacao: "2026-06-01T09:00:00Z",
        nivelAcesso: NivelAcesso.RESTRITO,
        hipoteseLegal: "Informação Pessoal (Art. 31 da Lei nº 12.527/2011)",
        conteudoHtml: `<h2>OFÍCIO Nº 6/2026-GBE</h2>
<p>Prezados Diretores,</p>
<p>Apresentamos nesta esteira o Termo de Referência consolidado para o convênio coletivo de saúde. Por razões de privacidade (classificação LAI de Dados Pessoais do efetivo), as planilhas de sinistros e coparticipações constam sob sigilo restrito.</p>
<p>A meta de saúde preventiva CAS visa reduzir os afastamentos médicos em até 22% no trimestre subsequente.</p>`,
        assinado: true,
        assinantes: [
          { nome: "Dra. Helena Silva", cargo: "Coordenadora da GBE", dataHora: "2026-06-01T09:30:00Z" }
        ],
        nomeNaArvore: "Ofício 6 - Termo de Referência Plano de Saúde"
      }
    ],
    marcadorCor: "dourado",
    marcadorNome: "RESTRITO",
    marcadorTexto: "Contém CPF e listagem funcional de beneficiários"
  },
  {
    id: "p-3",
    nup: "23546.036524/2026-99",
    tipo: "Investigação Interna: Segurança Cibernética e Integridade de Dados",
    unidadeGeradora: "STI",
    interessados: "Comissão de Ética e Segurança de Informação",
    especificacao: "Avaliação forense sobre tentativas de violação de buffers de controle de acesso ao sistema de custódia CAS",
    dataGeracao: "2026-06-05T17:15:00Z",
    nivelAcesso: NivelAcesso.SIGILOSO,
    hipoteseLegal: "Investigação de Responsabilidade de Servidor (Art. 150 da Lei nº 8.112/1990)",
    lido: false,
    estaConcluido: false,
    bloqueadoTramite: true,
    historicoTramitacoes: [],
    comentarios: [
      {
        id: "c-2",
        autor: "Arquiteto Lucas Viana",
        unidade: "STI",
        texto: "Trilha de auditoria cryptografada e persistência imutável PostgreSQL validada. Sem brechas expostas.",
        dataHora: "2026-06-05T17:30:00Z",
        nivelAcesso: NivelAcesso.SIGILOSO
      }
    ],
    documentos: [
      {
        id: "p3-d1",
        seiNumero: "RELATÓRIO 99 (520031)",
        titulo: "Laudo Tecnológico e Correções de Buffer",
        tipo: "Relatório",
        formato: "Interno",
        unidadeGeradora: "STI",
        criador: "Arquiteto Lucas Viana",
        dataCriacao: "2026-06-05T17:20:00Z",
        nivelAcesso: NivelAcesso.SIGILOSO,
        hipoteseLegal: "Investigação de Responsabilidade de Servidor (Art. 150 da Lei nº 8.112/1990)",
        conteudoHtml: `<h3>RELATÓRIO DE AUDITORIA DE REDE Nº 99/2026-STI</h3>
<p><strong>Nível de Segurança:</strong> Altamente Sigiloso / Apenas Credenciados</p>
<br/>
<p>Este relatório pauta-se no monitoramento granular do tráfego do barramento da Fundação CAS.</p>
<p>Filtros de tráfego ativos rejeitam requisições estranhas aos microsserviços. Os bancos PostgreSQL e elasticsearch de espelhamento textual estão operando em canais fechados.</p>`,
        assinado: true,
        assinantes: [
          { nome: "Arquiteto Lucas Viana", cargo: "Engenheiro de Custódia STI", dataHora: "2026-06-05T17:40:00Z" }
        ],
        nomeNaArvore: "Relatório 99 - Laudo Tecnológico Rede"
      }
    ]
  }
];
