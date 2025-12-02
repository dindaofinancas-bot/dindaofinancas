#!/usr/bin/env node

/**
 * Script de Migração para Supabase
 * Migra dados do PostgreSQL local para Supabase na nuvem
 */

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.production') });

// Configurações
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fiancehub';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas');
  console.error('💡 Crie um projeto em https://supabase.com e obtenha as credenciais');
  process.exit(1);
}

async function migrateToSupabase() {
  console.log('🚀 Iniciando migração para Supabase...');
  console.log('📊 Fonte:', LOCAL_DB_URL.replace(/:[^:@]*@/, ':****@'));
  console.log('☁️  Destino:', SUPABASE_URL);

  // Conectar aos bancos
  const localClient = postgres(LOCAL_DB_URL, { prepare: false });
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 1. Verificar conexões
    console.log('🔍 Testando conexões...');
    await localClient`SELECT NOW()`;
    console.log('✅ Conexão local OK');

    // Testar Supabase
    const { error: supabaseError } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
    if (supabaseError && supabaseError.code !== 'PGRST116') {
      throw supabaseError;
    }
    console.log('✅ Conexão Supabase OK');

    // 2. Listar tabelas para migração
    const tables = [
      'usuarios',
      'carteiras',
      'categorias',
      'formas_pagamento',
      'transacoes',
      'lembretes',
      'api_tokens',
      'cancelamentos',
      'user_sessions_admin'
    ];

    // 3. Migrar cada tabela
    for (const table of tables) {
      console.log(`\n📦 Migrando tabela: ${table}`);

      try {
        // Ler dados da tabela local
        const rows = await localClient`SELECT * FROM ${localClient(table)}`;
        console.log(`   📊 ${rows.length} registros encontrados`);

        if (rows.length === 0) {
          console.log(`   ⏭️  Tabela vazia, pulando...`);
          continue;
        }

        // Inserir no Supabase
        const { error } = await supabase
          .from(table)
          .insert(rows);

        if (error) {
          console.error(`   ❌ Erro ao migrar ${table}:`, error.message);

          // Tentar migrar linha por linha para identificar problema
          if (error.code === '23505') {
            console.log(`   🔄 Tentando migração com upsert (ignorar duplicatas)...`);
            let successCount = 0;
            let errorCount = 0;

            for (const row of rows) {
              try {
                const { error: rowError } = await supabase
                  .from(table)
                  .upsert(row, { onConflict: 'id' });

                if (rowError) {
                  console.error(`      Erro na linha ${row.id}:`, rowError.message);
                  errorCount++;
                } else {
                  successCount++;
                }
              } catch (rowErr) {
                errorCount++;
              }
            }
            console.log(`   ✅ ${successCount} registros migrados, ${errorCount} erros`);
          }
        } else {
          console.log(`   ✅ ${rows.length} registros migrados com sucesso`);
        }

      } catch (tableError) {
        console.error(`   ❌ Erro na tabela ${table}:`, tableError.message);
        // Continuar com próxima tabela
      }
    }

    // 4. Verificar contagem final
    console.log('\n📋 Resumo da migração:');
    for (const table of tables) {
      try {
        const localCount = await localClient`SELECT COUNT(*) as count FROM ${localClient(table)}`;
        const { count: supabaseCount, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`   ${table}: Local=${localCount[0].count} | Supabase=${supabaseCount}`);
        }
      } catch (error) {
        console.log(`   ${table}: Erro na contagem - ${error.message}`);
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log('🔗 Acesse seu projeto Supabase:', SUPABASE_URL.replace('/rest/v1', ''));
    console.log('📝 Configure DATABASE_URL no .env.production:');
    console.log(`DATABASE_URL=${SUPABASE_URL.replace('/rest/v1', '')}/postgresql?sslmode=require`);

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    process.exit(1);
  } finally {
    await localClient.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToSupabase().catch(console.error);
}

export { migrateToSupabase };