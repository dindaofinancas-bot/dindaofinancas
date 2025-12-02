# Configuração DNS - dindaofinancas.com.br

## 📋 **O QUE CONFIGURAR NO PAINEL DO DOMÍNIO:**

### **1. RECORDS PRINCIPAIS:**

```
Tipo  | Nome          | Valor                          | TTL
------|---------------|--------------------------------|-----
A     | @             | 76.76.21.21 (IP da Vercel)     | Auto
CNAME | www           | cname.vercel-dns.com           | Auto
CNAME | app           | cname.vercel-dns.com           | Auto
CNAME | api           | cname.vercel-dns.com           | Auto
```

### **2. EMAIL (OPCIONAL):**
```
Tipo  | Nome          | Valor                          | TTL
------|---------------|--------------------------------|-----
MX    | @             | mx1.seudominio.com            | Auto
MX    | @             | mx2.seudominio.com            | Auto
TXT   | @             | v=spf1 include:_spf.google.com ~all | Auto
```

### **3. SEGURANÇA:**
```
Tipo  | Nome          | Valor                          | TTL
------|---------------|--------------------------------|-----
TXT   | _vercel       | vc-domain-verify=dindaofinancas.com.br,XXXXXXXX | Auto
TXT   | @             | google-site-verification=XXXXX | Auto
```

## 🚀 **PASSO A PASSO:**

### **No painel do domínio (Registro.br/GoDaddy):**

1. **Acessar Zona DNS**
2. **Adicionar records A**:
   - Host: `@`
   - Valor: `76.76.21.21` (IP da Vercel)
   - TTL: Automático

3. **Adicionar CNAMEs**:
   - Host: `www` → `cname.vercel-dns.com`
   - Host: `app` → `cname.vercel-dns.com`
   - Host: `api` → `cname.vercel-dns.com`

4. **Salvar e aguardar propagação** (2-48 horas)

## 🔧 **VERIFICAÇÃO:**

### **Após configurar DNS, verifique:**
```bash
# Verificar propagação
nslookup dindaofinancas.com.br
nslookup app.dindaofinancas.com.br
nslookup api.dindaofinancas.com.br

# Verificar SSL
curl -I https://dindaofinancas.com.br
```

## ⚠️ **IMPORTANTE:**

1. **Propagação DNS** pode levar até 48 horas
2. **SSL da Vercel** é automático (Let's Encrypt)
3. **Manter records antigos** se tiver email funcionando
4. **Backup** da configuração DNS atual

## 📞 **SUPORTE:**

- **Vercel DNS Docs**: https://vercel.com/docs/concepts/projects/custom-domains
- **Registro.br Suporte**: https://registro.br/atendimento/
- **GoDaddy Suporte**: https://br.godaddy.com/help

## ✅ **CHECKLIST FINAL:**

- [ ] Records A configurados
- [ ] CNAMEs configurados
- [ ] TXT de verificação (se necessário)
- [ ] MX records (se usar email)
- [ ] Propagação completa
- [ ] SSL funcionando
- [ ] Site acessível via HTTPS