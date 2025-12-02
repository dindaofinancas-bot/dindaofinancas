# Endpoints CURL para FinanceHub API

Este documento contém todos os endpoints da API FinanceHub em formato CURL para integração com n8n.

## URL Base
```
https://app.semprecheioapp.com.br
```

## Autenticação

### 1. Autenticação via Cookie (Aplicação Web)
- Usado pela aplicação web
- Cookie: `connect.sid`
- Automático após login

### 2. Autenticação via API Key (Integrações)
- Header: `apikey: SEU_API_KEY`
- Para integrações externas como n8n

### 3. Autenticação via Bearer Token (JWT)
- Header: `Authorization: Bearer SEU_TOKEN_JWT`
- Para autenticação programática

---

## Endpoints

### Autenticação

#### 1. Login
```bash
curl -X POST "https://app.semprecheioapp.com.br/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "senha": "senha123"
  }'
```

#### 2. Obter Usuário Atual
```bash
# Com cookie (após login)
curl -X GET "https://app.semprecheioapp.com.br/auth/me" \
  -H "Cookie: connect.sid=SEU_COOKIE_SESSION_ID"

# Com API Key
curl -X GET "https://app.semprecheioapp.com.br/auth/me" \
  -H "apikey: SEU_API_KEY"

# Com Bearer Token
curl -X GET "https://app.semprecheioapp.com.br/auth/me" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

#### 3. Logout
```bash
# Com cookie
curl -X POST "https://app.semprecheioapp.com.br/auth/logout" \
  -H "Cookie: connect.sid=SEU_COOKIE_SESSION_ID"

# Com API Key
curl -X POST "https://app.semprecheioapp.com.br/auth/logout" \
  -H "apikey: SEU_API_KEY"
```

### Carteiras

#### 4. Obter Carteira Principal
```bash
curl -X GET "https://app.semprecheioapp.com.br/wallet/current" \
  -H "apikey: SEU_API_KEY"
```

#### 5. Listar Todas as Carteiras
```bash
curl -X GET "https://app.semprecheioapp.com.br/wallet" \
  -H "apikey: SEU_API_KEY"
```

#### 6. Criar Nova Carteira
```bash
curl -X POST "https://app.semprecheioapp.com.br/wallet" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Carteira Principal",
    "saldo_inicial": 1000.00,
    "moeda": "BRL",
    "cor": "#3B82F6"
  }'
```

#### 7. Obter Carteira por ID
```bash
curl -X GET "https://app.semprecheioapp.com.br/wallet/1" \
  -H "apikey: SEU_API_KEY"
```

#### 8. Atualizar Carteira
```bash
curl -X PUT "https://app.semprecheioapp.com.br/wallet/1" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Carteira Atualizada",
    "cor": "#10B981"
  }'
```

#### 9. Excluir Carteira
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/wallet/1" \
  -H "apikey: SEU_API_KEY"
```

### Transações

#### 10. Listar Transações
```bash
curl -X GET "https://app.semprecheioapp.com.br/transaction" \
  -H "apikey: SEU_API_KEY"
```

#### 11. Criar Transação
```bash
curl -X POST "https://app.semprecheioapp.com.br/transaction" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "carteira_id": 1,
    "categoria_id": 1,
    "metodo_pagamento_id": 1,
    "descricao": "Compra no mercado",
    "valor": 150.75,
    "tipo": "despesa",
    "data": "2025-12-02T14:30:00Z"
  }'
```

#### 12. Obter Transação por ID
```bash
curl -X GET "https://app.semprecheioapp.com.br/transaction/1" \
  -H "apikey: SEU_API_KEY"
```

#### 13. Atualizar Transação
```bash
curl -X PUT "https://app.semprecheioapp.com.br/transaction/1" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "descricao": "Compra atualizada no mercado",
    "valor": 160.00
  }'
```

#### 14. Excluir Transação
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/transaction/1" \
  -H "apikey: SEU_API_KEY"
```

### Categorias

#### 15. Listar Categorias
```bash
curl -X GET "https://app.semprecheioapp.com.br/category" \
  -H "apikey: SEU_API_KEY"
```

#### 16. Criar Categoria
```bash
curl -X POST "https://app.semprecheioapp.com.br/category" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Alimentação",
    "cor": "#EF4444",
    "icone": "utensils"
  }'
```

#### 17. Obter Categoria por ID
```bash
curl -X GET "https://app.semprecheioapp.com.br/category/1" \
  -H "apikey: SEU_API_KEY"
```

#### 18. Atualizar Categoria
```bash
curl -X PUT "https://app.semprecheioapp.com.br/category/1" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Alimentação e Bebidas",
    "cor": "#DC2626"
  }'
```

#### 19. Excluir Categoria
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/category/1" \
  -H "apikey: SEU_API_KEY"
```

### Métodos de Pagamento

#### 20. Listar Métodos de Pagamento
```bash
curl -X GET "https://app.semprecheioapp.com.br/payment-method" \
  -H "apikey: SEU_API_KEY"
```

#### 21. Criar Método de Pagamento
```bash
curl -X POST "https://app.semprecheioapp.com.br/payment-method" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Cartão de Crédito",
    "icone": "credit-card"
  }'
```

#### 22. Obter Método de Pagamento por ID
```bash
curl -X GET "https://app.semprecheioapp.com.br/payment-method/1" \
  -H "apikey: SEU_API_KEY"
```

#### 23. Atualizar Método de Pagamento
```bash
curl -X PUT "https://app.semprecheioapp.com.br/payment-method/1" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Cartão de Crédito Visa",
    "icone": "credit-card"
  }'
```

#### 24. Excluir Método de Pagamento
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/payment-method/1" \
  -H "apikey: SEU_API_KEY"
```

### Lembretes

#### 25. Listar Lembretes
```bash
curl -X GET "https://app.semprecheioapp.com.br/reminder" \
  -H "apikey: SEU_API_KEY"
```

#### 26. Criar Lembrete
```bash
curl -X POST "https://app.semprecheioapp.com.br/reminder" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "titulo": "Reunião de equipe",
    "descricao": "Discutir os novos projetos",
    "data_lembrete": "2025-12-15T14:30:00Z"
  }'
```

#### 27. Obter Lembrete por ID
```bash
curl -X GET "https://app.semprecheioapp.com.br/reminder/1" \
  -H "apikey: SEU_API_KEY"
```

#### 28. Atualizar Lembrete
```bash
curl -X PUT "https://app.semprecheioapp.com.br/reminder/1" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "titulo": "Reunião atualizada",
    "concluido": true
  }'
```

#### 29. Excluir Lembrete
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/reminder/1" \
  -H "apikey: SEU_API_KEY"
```

### Relatórios e Estatísticas

#### 30. Obter Resumo Financeiro
```bash
curl -X GET "https://app.semprecheioapp.com.br/report/summary" \
  -H "apikey: SEU_API_KEY"
```

#### 31. Obter Transações por Período
```bash
curl -X GET "https://app.semprecheioapp.com.br/report/transactions?start=2025-12-01&end=2025-12-31" \
  -H "apikey: SEU_API_KEY"
```

#### 32. Obter Gastos por Categoria
```bash
curl -X GET "https://app.semprecheioapp.com.br/report/categories?start=2025-12-01&end=2025-12-31" \
  -H "apikey: SEU_API_KEY"
```

#### 33. Obter Saldo ao Longo do Tempo
```bash
curl -X GET "https://app.semprecheioapp.com.br/report/balance?start=2025-12-01&end=2025-12-31" \
  -H "apikey: SEU_API_KEY"
```

### API Tokens

#### 34. Listar API Tokens
```bash
curl -X GET "https://app.semprecheioapp.com.br/api-token" \
  -H "apikey: SEU_API_KEY"
```

#### 35. Criar API Token
```bash
curl -X POST "https://app.semprecheioapp.com.br/api-token" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_API_KEY" \
  -d '{
    "nome": "Token para n8n",
    "permissoes": ["read", "write"]
  }'
```

#### 36. Revogar API Token
```bash
curl -X DELETE "https://app.semprecheioapp.com.br/api-token/1" \
  -H "apikey: SEU_API_KEY"
```

### Informações da API

#### 37. Obter Informações da API
```bash
curl -X GET "https://app.semprecheioapp.com.br/api"
```

---

## Como Usar no n8n

### 1. Configuração Inicial
1. Crie um nó "HTTP Request" no n8n
2. Configure a URL base: `https://app.semprecheioapp.com.br`
3. Adicione header de autenticação:
   - Chave: `apikey`
   - Valor: `SEU_API_KEY` (obtenha na seção API Tokens)

### 2. Exemplo de Fluxo
```
HTTP Request (Login) → Extrair Cookie → HTTP Request (Operações)
```

### 3. Tratamento de Erros
- **401 Unauthorized**: Token inválido ou expirado
- **400 Bad Request**: Dados de entrada inválidos
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro no servidor

### 4. Dicas
- Sempre use HTTPS
- Armazene API Keys em variáveis de ambiente do n8n
- Implemente retry lógico para falhas temporárias
- Valide respostas antes de processar dados

---

## Notas Importantes

1. **Rate Limiting**: A API pode ter limitação de requisições por minuto
2. **Versão**: Esta documentação é para API v1.0.0
3. **Atualizações**: Endpoints podem mudar em versões futuras
4. **Suporte**: Para suporte técnico, contate support@financeiro.app

## Changelog
- **2025-12-02**: Documentação inicial criada com base no swagger.json
- **Endpoints**: 37 endpoints documentados
- **Autenticação**: 3 métodos suportados