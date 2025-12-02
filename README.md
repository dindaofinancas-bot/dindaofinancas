# Dindão Finanças

![Dindão Finanças](https://img.shields.io/badge/Dindão-Finanças-0FA7A0)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**Sistema completo de gestão financeira pessoal e empresarial**

> Controle suas finanças de forma simples, rápida e eficiente

## 🚀 **Demo Online**

- **Site**: https://app.dindaofinancas.com.br
- **Admin**: https://app.dindaofinancas.com.br/admin
- **API Docs**: https://api.dindaofinancas.com.br/api-docs

## ✨ **Funcionalidades**

### 📊 **Gestão Financeira**
- ✅ Controle de receitas e despesas
- ✅ Múltiplas carteiras/saldo
- ✅ Categorização inteligente
- ✅ Formas de pagamento personalizadas
- ✅ Relatórios e gráficos em tempo real

### 🤖 **Automação**
- ✅ Integração WhatsApp (envio/recebimento)
- ✅ API REST completa para n8n/Zapier
- ✅ Lembretes automáticos
- ✅ Exportação Excel/PDF

### 👥 **Multi-usuário**
- ✅ Perfis de acesso (usuário/admin)
- ✅ Impersonation (admin acessa como cliente)
- ✅ Assinaturas e planos
- ✅ White-label disponível

### 🔒 **Segurança**
- ✅ Autenticação com sessão
- ✅ API Keys com escopo
- ✅ Criptografia de dados
- ✅ Backup automático

## 🛠️ **Tecnologias**

**Frontend:**
- React 18 + TypeScript
- Vite + Tailwind CSS
- Radix UI Components
- Recharts + Date-fns

**Backend:**
- Node.js + Express
- PostgreSQL + Drizzle ORM
- Session Authentication
- WebSocket (notificações em tempo real)

**Infra:**
- Vercel (deploy frontend)
- Railway/Supabase (backend + banco)
- Cloudflare (DNS + SSL)
- GitHub Actions (CI/CD)

## 📦 **Instalação Local**

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dindao-financas.git
cd dindao-financas

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env
# Edite .env com suas configurações

# Inicie banco de dados
npm run db:push
npm run db:seed

# Inicie servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 🌐 **Deploy na Nuvem**

### **1. Vercel (Frontend)**
```bash
# Conecte seu repositório na Vercel
# Configure variáveis de ambiente
# Deploy automático com cada push
```

### **2. Railway/Supabase (Backend + Banco)**
```bash
# Crie projeto no Railway
# Conecte ao GitHub
# Configure DATABASE_URL e SESSION_SECRET
```

### **3. Configurar Domínio**
Siga [CONFIGURACAO_DNS.md](CONFIGURACAO_DNS.md)

## 📈 **Modelo de Negócio**

### **Planos Disponíveis:**
- **Grátis**: 1 carteira, 50 transações/mês
- **Básico** (R$29,90/mês): 3 carteiras, ilimitado
- **Profissional** (R$69,90/mês): WhatsApp + API
- **Empresarial** (R$199,90/mês): White-label + Suporte

### **Gateways de Pagamento:**
- Mercado Pago
- Stripe
- PagSeguro
- Asaas

## 🔌 **Integrações**

### **n8n/Zapier**
```bash
# Use os endpoints CURL disponíveis
# Documentação completa em API_ENDPOINTS_CURL.md
```

### **WhatsApp Business**
```bash
# Integração com WAHA (WhatsApp Web API)
# Envio/recebimento automático de mensagens
# Status de entrega em tempo real
```

### **Webhooks**
```bash
# Notificações para Discord/Slack
# Alertas por email
# SMS via Twilio
```

## 👨‍💻 **Desenvolvimento**

### **Estrutura do Projeto**
```
dindao-financas/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
├── server/                # Backend Express
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Middlewares
│   └── index.ts          # Ponto de entrada
├── shared/               # Schemas TypeScript
├── migrations/           # Migrações de banco
└── scripts/             # Scripts utilitários
```

### **Comandos Úteis**
```bash
# Desenvolvimento
npm run dev              # Inicia client + server
npm run check            # Type checking

# Banco de dados
npm run db:push          # Atualiza schema
npm run db:seed          # Popula dados iniciais
npm run db:migrate       # Executa migrações

# Build
npm run build            # Build produção
npm run start            # Inicia produção
```

## 📄 **Licença**

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 **Suporte**

- **Site**: https://dindaofinancas.com.br
- **Email**: suporte@dindaofinancas.com.br
- **WhatsApp**: (11) 99999-9999
- **Documentação**: https://docs.dindaofinancas.com.br

---

**Dindão Finanças** © 2025 - Transformando sua gestão financeira