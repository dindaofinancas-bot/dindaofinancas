#!/usr/bin/env node

/**
 * Script para configurar GitHub para deploy na Vercel
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Configurando GitHub para deploy na Vercel...\n');

// Verificar se é Windows
const isWindows = process.platform === 'win32';

// Verificar configuração atual do git
try {
  console.log('🔍 Verificando configuração atual do git...');
  const remoteOutput = execSync('git remote -v', { encoding: 'utf8' });
  console.log('📡 Remotes configurados:');
  console.log(remoteOutput);
} catch (error) {
  console.log('⚠️ Nenhum remote configurado ou não é um repositório git');
}

// Verificar package.json
console.log('\n📦 Verificando package.json...');
const packageJsonPath = join(process.cwd(), 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ Nome do projeto: ${packageJson.name}`);
  console.log(`✅ Versão: ${packageJson.version}`);
} else {
  console.error('❌ package.json não encontrado');
}

// Instruções para resolver erro 403
console.log('\n🔧 INSTRUÇÕES PARA RESOLVER ERRO 403:');
console.log('=====================================');
console.log('\nO erro "403 - Permission denied" geralmente significa:');
console.log('1. Token sem permissões suficientes');
console.log('2. Repositório não existe');
console.log('3. Token expirado');
console.log('4. Problema de autenticação');

console.log('\n📝 PASSO A PASSO:');
console.log('1. Verifique se o repositório existe:');
console.log('   https://github.com/dindaofinancas-bot/dindaofinancas');
console.log('\n2. Verifique permissões do token:');
console.log('   - Acesse: https://github.com/settings/tokens');
console.log('   - Verifique se o token tem escopo "repo"');
console.log('\n3. Teste o token com curl:');
console.log('   curl -H "Authorization: token SEU_TOKEN_AQUI" \\');
console.log('        https://api.github.com/user');
console.log('\n4. Se não funcionar, gere novo token:');
console.log('   - Delete o token atual');
console.log('   - Crie novo com escopo "repo"');
console.log('   - Use no comando git:');
console.log('     git remote set-url origin https://NOVO_TOKEN@github.com/dindaofinancas-bot/dindaofinancas.git');

console.log('\n🔄 COMANDOS PARA EXECUTAR:');
console.log('========================');
console.log('\n# 1. Verificar se pode clonar (teste público)');
console.log('git ls-remote https://github.com/dindaofinancas-bot/dindaofinancas.git');

console.log('\n# 2. Configurar com novo token (substitua NOVO_TOKEN)');
console.log('git remote remove origin');
console.log('git remote add origin https://NOVO_TOKEN@github.com/dindaofinancas-bot/dindaofinancas.git');

console.log('\n# 3. Configurar usuário git');
console.log('git config user.name "dindaofinancas-bot"');
console.log('git config user.email "bot@dindaofinancas.com.br"');

console.log('\n# 4. Fazer commit e push');
console.log('git add .');
console.log('git commit -m "Initial commit for Vercel deployment"');
console.log('git push -u origin main');

console.log('\n🔗 LINKS ÚTEIS:');
console.log('- GitHub Tokens: https://github.com/settings/tokens');
console.log('- Vercel Docs: https://vercel.com/docs');
console.log('- GitHub SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh');

console.log('\n🎯 SOLUÇÃO ALTERNATIVA:');
console.log('Se continuar com erro 403, crie novo repositório:');
console.log('1. Acesse: https://github.com/new');
console.log('2. Nome: dindaofinancas');
console.log('3. Público ou Privado (recomendado privado)');
console.log('4. Não inicialize com README');
console.log('5. Use novo token para push');

console.log('\n✅ Pronto! Siga as instruções acima.');

// Executar verificação de token se fornecido
if (process.argv[2] === '--test-token' && process.argv[3]) {
  const token = process.argv[3];
  console.log(`\n🔐 Testando token: ${token.substring(0, 10)}...`);

  try {
    const testCmd = `curl -s -H "Authorization: token ${token}" https://api.github.com/user`;
    const result = execSync(testCmd, { encoding: 'utf8' });
    const userData = JSON.parse(result);
    console.log(`✅ Token válido! Usuário: ${userData.login}`);
    console.log(`✅ Permissões: ${userData.type}`);
  } catch (error) {
    console.error('❌ Token inválido ou sem permissões');
  }
}