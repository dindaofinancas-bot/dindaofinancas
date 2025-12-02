# Guia para Push no GitHub

## Problema
Você está recebendo o erro:
```
remote: Permission to dindaofinancas-bot/dindaofinancas.git denied to semprecheioapp.
fatal: unable to access 'https://github.com/dindaofinancas-bot/dindaofinancas.git/': The requested URL returned error: 403
```

## Solução 1: Usar Token de Acesso Pessoal (Recomendado)

### Passo 1: Gerar Token no GitHub
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome (ex: "dindaofinancas-push")
4. Selecione escopos: `repo` (full control of private repositories)
5. Clique em "Generate token"
6. **COPIE O TOGER** (você só verá ele uma vez!)

### Passo 2: Configurar Remote com Token
Execute no PowerShell (substitua `SEU_TOKEN_AQUI` pelo token real):

```powershell
cd C:\Users\agenc\Downloads\fiancehub
git remote add origin https://SEU_TOKEN_AQUI@github.com/dindaofinancas-bot/dindaofinancas.git
```

### Passo 3: Fazer Push
```powershell
git push -u origin main
```

## Solução 2: Usar SSH (Alternativa)

### Passo 1: Gerar Chave SSH
```powershell
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
# Pressione Enter para todas as perguntas
```

### Passo 2: Adicionar Chave ao GitHub
```powershell
cat ~/.ssh/id_ed25519.pub
```
1. Copie a chave pública
2. Acesse: https://github.com/settings/keys
3. Clique em "New SSH key"
4. Cole a chave e salve

### Passo 3: Configurar Remote SSH
```powershell
cd C:\Users\agenc\Downloads\fiancehub
git remote add origin git@github.com:dindaofinancas-bot/dindaofinancas.git
git push -u origin main
```

## Solução 3: Usar Credential Manager (Windows)

### Passo 1: Limpar Credenciais Antigas
```powershell
git credential-manager reject https://github.com
```

### Passo 2: Configurar Remote Normal
```powershell
cd C:\Users\agenc\Downloads\fiancehub
git remote add origin https://github.com/dindaofinancas-bot/dindaofinancas.git
```

### Passo 3: Fazer Push (irá pedir login)
```powershell
git push -u origin main
```
- Quando pedir, use suas credenciais do GitHub

## Verificação
Após configurar, verifique com:
```powershell
git remote -v
```

## Comandos Rápidos (Solução 1 com Token)
```powershell
# 1. Remover remote atual (se existir)
git remote remove origin

# 2. Adicionar com token (SUBSTITUA SEU_TOKEN_AQUI)
git remote add origin https://SEU_TOKEN_AQUI@github.com/dindaofinancas-bot/dindaofinancas.git

# 3. Fazer push
git push -u origin main
```

## Dicas Importantes
- O token é como uma senha, mantenha-o seguro!
- Para produção, use tokens com escopos mínimos necessários
- Se usar SSH, certifique-se que o agente SSH está rodando
- No Windows, o Git Credential Manager geralmente funciona bem