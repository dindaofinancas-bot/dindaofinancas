-- ===========================================
-- SCRIPT DE SETUP SUPABASE - DINDÃO FINANÇAS
-- ===========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===========================================
-- TABELAS PRINCIPAIS
-- ===========================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  remotejid VARCHAR(255) NOT NULL DEFAULT '',
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  senha VARCHAR(255) NOT NULL,
  tipo_usuario VARCHAR(50) NOT NULL DEFAULT 'normal',
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_cadastro TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  ultimo_acesso TIMESTAMPTZ,
  data_cancelamento TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  data_expiracao_assinatura TIMESTAMPTZ,
  status_assinatura VARCHAR(20) DEFAULT 'ativa'
);

-- Tabela de carteiras
CREATE TABLE IF NOT EXISTS carteiras (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  saldo_atual NUMERIC(12,2) DEFAULT 0.00,
  data_criacao TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL DEFAULT 'Despesa',
  cor VARCHAR(50),
  icone VARCHAR(100),
  descricao TEXT,
  usuario_id INTEGER,
  global BOOLEAN NOT NULL DEFAULT false
);

-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  icone VARCHAR(100),
  cor VARCHAR(50),
  usuario_id INTEGER,
  global BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL PRIMARY KEY,
  carteira_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  forma_pagamento_id INTEGER,
  tipo VARCHAR(10) NOT NULL DEFAULT 'Despesa',
  valor NUMERIC(12,2) NOT NULL,
  data_transacao DATE NOT NULL,
  data_registro TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  descricao VARCHAR(255) NOT NULL,
  metodo_pagamento VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente'
);

-- Tabela de temas customizados
CREATE TABLE IF NOT EXISTS custom_themes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(100) NOT NULL,
  light_config JSONB NOT NULL,
  dark_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active_light BOOLEAN DEFAULT false,
  is_active_dark BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- TABELAS AUXILIARES
-- ===========================================

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_lembrete TIMESTAMPTZ NOT NULL,
  data_criacao TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  concluido BOOLEAN DEFAULT false
);

-- Tabela de tokens API
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  data_criacao TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  data_expiracao TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  master BOOLEAN NOT NULL DEFAULT false,
  rotacionavel BOOLEAN NOT NULL DEFAULT false
);

-- Tabela de histórico de cancelamentos
CREATE TABLE IF NOT EXISTS historico_cancelamentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  data_cancelamento TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  motivo_cancelamento TEXT NOT NULL,
  tipo_cancelamento VARCHAR(20) NOT NULL DEFAULT 'voluntario',
  observacoes TEXT,
  reativado_em TIMESTAMPTZ,
  data_criacao TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
);

-- Tabela de sessões admin
CREATE TABLE IF NOT EXISTS user_sessions_admin (
  id SERIAL PRIMARY KEY,
  super_admin_id INTEGER NOT NULL,
  target_user_id INTEGER NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo'),
  data_fim TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Tabela de mensagens de boas-vindas
CREATE TABLE IF NOT EXISTS welcome_messages (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  email_content TEXT,
  payment_link TEXT,
  send_email_welcome BOOLEAN DEFAULT true,
  send_email_activation BOOLEAN DEFAULT true,
  show_dashboard_message BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tabela de configuração WhatsApp
CREATE TABLE IF NOT EXISTS waha_config (
  id SERIAL PRIMARY KEY,
  waha_url TEXT NOT NULL,
  api_key TEXT,
  webhook_url TEXT,
  session_name VARCHAR(100) DEFAULT 'default',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  webhook_hash VARCHAR(10)
);

-- Tabela de webhooks WhatsApp
CREATE TABLE IF NOT EXISTS waha_session_webhooks (
  id SERIAL PRIMARY KEY,
  session_name VARCHAR(255) NOT NULL,
  webhook_hash VARCHAR(10) NOT NULL,
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- CONSTRAINTS E ÍNDICES
-- ===========================================

-- Constraints únicas
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique ON usuarios(email);
CREATE UNIQUE INDEX IF NOT EXISTS api_tokens_token_unique ON api_tokens(token);
CREATE UNIQUE INDEX IF NOT EXISTS api_tokens_usuario_id_master_unique ON api_tokens(usuario_id, master);
CREATE UNIQUE INDEX IF NOT EXISTS categorias_nome_global_unique ON categorias(nome, global);
CREATE UNIQUE INDEX IF NOT EXISTS formas_pagamento_nome_global_unique ON formas_pagamento(nome, global);
CREATE UNIQUE INDEX IF NOT EXISTS waha_config_webhook_hash_key ON waha_config(webhook_hash);
CREATE UNIQUE INDEX IF NOT EXISTS waha_session_webhooks_session_name_key ON waha_session_webhooks(session_name);
CREATE UNIQUE INDEX IF NOT EXISTS waha_session_webhooks_webhook_hash_key ON waha_session_webhooks(webhook_hash);
CREATE UNIQUE INDEX IF NOT EXISTS welcome_messages_type_key ON welcome_messages(type);

-- Índices para custom_themes
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_default ON custom_themes(is_default);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_active_light ON custom_themes(is_active_light);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_active_dark ON custom_themes(is_active_dark);
CREATE INDEX IF NOT EXISTS idx_custom_themes_created_at ON custom_themes(created_at);

-- Foreign keys
ALTER TABLE carteiras ADD CONSTRAINT carteiras_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE categorias ADD CONSTRAINT categorias_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE formas_pagamento ADD CONSTRAINT formas_pagamento_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE transacoes ADD CONSTRAINT transacoes_carteira_id_carteiras_id_fk FOREIGN KEY (carteira_id) REFERENCES carteiras(id);
ALTER TABLE transacoes ADD CONSTRAINT transacoes_categoria_id_categorias_id_fk FOREIGN KEY (categoria_id) REFERENCES categorias(id);
ALTER TABLE transacoes ADD CONSTRAINT transacoes_forma_pagamento_id_formas_pagamento_id_fk FOREIGN KEY (forma_pagamento_id) REFERENCES formas_pagamento(id);
ALTER TABLE lembretes ADD CONSTRAINT lembretes_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE api_tokens ADD CONSTRAINT api_tokens_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE historico_cancelamentos ADD CONSTRAINT historico_cancelamentos_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
ALTER TABLE user_sessions_admin ADD CONSTRAINT user_sessions_admin_super_admin_id_usuarios_id_fk FOREIGN KEY (super_admin_id) REFERENCES usuarios(id);
ALTER TABLE user_sessions_admin ADD CONSTRAINT user_sessions_admin_target_user_id_usuarios_id_fk FOREIGN KEY (target_user_id) REFERENCES usuarios(id);
ALTER TABLE custom_themes ADD CONSTRAINT custom_themes_user_id_usuarios_id_fk FOREIGN KEY (user_id) REFERENCES usuarios(id);

-- ===========================================
-- DADOS PADRÃO
-- ===========================================

-- Categorias globais de despesa
INSERT INTO categorias (nome, tipo, global, cor, icone) VALUES
('Alimentação', 'Despesa', true, '#EF4444', 'minus-circle'),
('Moradia', 'Despesa', true, '#EF4444', 'minus-circle'),
('Doações', 'Despesa', true, '#EF4444', 'minus-circle'),
('Educação', 'Despesa', true, '#EF4444', 'minus-circle'),
('Imposto', 'Despesa', true, '#EF4444', 'minus-circle'),
('Investimento', 'Despesa', true, '#EF4444', 'minus-circle'),
('Lazer', 'Despesa', true, '#EF4444', 'minus-circle'),
('Pets', 'Despesa', true, '#EF4444', 'minus-circle'),
('Saude', 'Despesa', true, '#EF4444', 'minus-circle'),
('Transporte', 'Despesa', true, '#EF4444', 'minus-circle'),
('Vestuário', 'Despesa', true, '#EF4444', 'minus-circle'),
('Viagem', 'Despesa', true, '#EF4444', 'minus-circle'),
('Outros', 'Despesa', true, '#EF4444', 'minus-circle')
ON CONFLICT (nome, global) DO NOTHING;

-- Categorias globais de receita
INSERT INTO categorias (nome, tipo, global, cor, icone) VALUES
('Investimentos', 'Receita', true, '#10B981', 'plus-circle'),
('Salário', 'Receita', true, '#10B981', 'plus-circle'),
('Freelance', 'Receita', true, '#10B981', 'plus-circle'),
('Outros', 'Receita', true, '#10B981', 'plus-circle')
ON CONFLICT (nome, global) DO NOTHING;

-- Formas de pagamento globais
INSERT INTO formas_pagamento (nome, global, cor, icone, ativo) VALUES
('PIX', true, '#10B981', 'smartphone', true),
('Cartão de Crédito', true, '#3B82F6', 'credit-card', true),
('Cartão de Débito', true, '#8B5CF6', 'credit-card', true),
('Dinheiro', true, '#F59E0B', 'banknote', true),
('TED/DOC', true, '#EF4444', 'building-bank', true),
('Cheque', true, '#6B7280', 'file-text', true)
ON CONFLICT (nome, global) DO NOTHING;

-- Mensagens de boas-vindas
INSERT INTO welcome_messages (type, title, message, email_content, send_email_welcome, send_email_activation, show_dashboard_message) VALUES
('new_user', 'Bem-vindo ao Dindão Finanças!', 'Olá {nome}! Seja bem-vindo ao Dindão Finanças. Estamos felizes em tê-lo conosco. Aqui você encontrará todas as ferramentas necessárias para gerenciar suas finanças de forma eficiente e organizada.', 'Olá {nome}, seja bem-vindo ao Dindão Finanças! Sua conta foi criada com sucesso. Acesse nossa plataforma para começar a gerenciar suas finanças de forma inteligente.', true, false, true)
ON CONFLICT (type) DO NOTHING;

INSERT INTO welcome_messages (type, title, message, email_content, payment_link, send_email_welcome, send_email_activation, show_dashboard_message) VALUES
('inactive_user', 'Ative sua conta para começar!', 'Olá {nome}! Sua conta foi criada com sucesso, mas ainda não está ativa. Para acessar todos os recursos do Dindão Finanças, você precisa ativar sua assinatura. Clique no botão abaixo para efetuar o pagamento e começar a usar nossa plataforma.', 'Olá {nome}, sua conta no Dindão Finanças foi criada com sucesso! Para começar a usar todos os recursos, você precisa ativar sua assinatura. Acesse o link abaixo para efetuar o pagamento: {link_pagamento}', 'https://financehub.com.br/pagamento', false, true, true)
ON CONFLICT (type) DO NOTHING;

INSERT INTO welcome_messages (type, title, message, email_content, send_email_welcome, send_email_activation, show_dashboard_message) VALUES
('activated', 'Sua conta foi ativada!', 'Olá {nome}! Temos uma ótima notícia: sua conta no Dindão Finanças foi ativada com sucesso! Agora você tem acesso completo a todos os recursos da plataforma.', 'Olá {nome}!\n\nSua conta no Dindão Finanças foi ativada com sucesso!\n\nAgora você tem acesso completo a todos os nossos recursos.', false, true, true)
ON CONFLICT (type) DO NOTHING;

-- Tema padrão Dindão Finanças
INSERT INTO custom_themes (
  name,
  light_config,
  dark_config,
  is_default
) VALUES (
  'Padrão Dindão Finanças',
  '{
    "background": "0 0% 98%",
    "foreground": "240 10% 3.9%",
    "primary": "142 76% 36%",
    "primaryForeground": "0 0% 98%",
    "secondary": "45 93% 47%",
    "secondaryForeground": "0 0% 9%",
    "muted": "240 4.8% 95.9%",
    "mutedForeground": "240 3.8% 46.1%",
    "accent": "240 4.8% 95.9%",
    "accentForeground": "240 5.9% 10%",
    "border": "240 5.9% 90%",
    "card": "0 0% 100%",
    "cardForeground": "240 10% 3.9%",
    "destructive": "0 84.2% 60.2%",
    "destructiveForeground": "0 0% 98%"
  }',
  '{
    "background": "240 10% 3.9%",
    "foreground": "0 0% 98%",
    "primary": "142 76% 36%",
    "primaryForeground": "0 0% 98%",
    "secondary": "45 93% 47%",
    "secondaryForeground": "0 0% 9%",
    "muted": "240 3.7% 15.9%",
    "mutedForeground": "240 5% 64.9%",
    "accent": "240 3.7% 15.9%",
    "accentForeground": "0 0% 98%",
    "border": "240 3.7% 15.9%",
    "card": "240 10% 3.9%",
    "cardForeground": "0 0% 98%",
    "destructive": "0 62.8% 30.6%",
    "destructiveForeground": "0 0% 98%"
  }',
  true
)
ON CONFLICT (name, is_default) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_custom_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_themes_updated_at_trigger
    BEFORE UPDATE ON custom_themes
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_themes_updated_at();

-- ===========================================
-- MENSAGEM DE SUCESSO
-- ===========================================

SELECT '✅ Setup do banco Dindão Finanças concluído com sucesso!' as message;