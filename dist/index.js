var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
function initializeDatabase(databaseUrl) {
  if (client) {
    client.end();
  }
  client = postgres(databaseUrl);
  db = drizzle(client);
  return db;
}
var client, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    client = null;
    db = null;
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      try {
        const url = new URL(dbUrl);
        const hostname = url.hostname;
        const port = parseInt(url.port) || 5432;
        const database = url.pathname.replace("/", "");
        const username = url.username;
        const password = decodeURIComponent(url.password);
        client = postgres({
          host: hostname,
          port,
          database,
          username,
          password,
          ssl: "require"
        });
        db = drizzle(client);
      } catch (error) {
        console.error("\u274C Erro ao parsear DATABASE_URL, usando URL direta:", error);
        client = postgres(dbUrl);
        db = drizzle(client);
      }
    }
  }
});

// shared/schema.ts
import { pgTable, text, serial, integer, decimal, timestamp, boolean, date, varchar, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var getSaoPauloTimestamp, users, wallets, categories, paymentMethods, transactions, apiTokens, historicoCancelamentos, insertUserSchema, loginUserSchema, insertWalletSchema, insertCategorySchema, insertPaymentMethodSchema, stringToNumber, normalizeTransactionType, flexibleNumberSchema, normalizeDateFormat, insertTransactionSchema, updateTransactionSchema, insertApiTokenSchema, updateApiTokenSchema, reminders, userSessionsAdmin, flexibleDateSchema, insertReminderSchema, updateReminderSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    getSaoPauloTimestamp = () => {
      const date2 = /* @__PURE__ */ new Date();
      return new Date(date2.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    };
    users = pgTable("usuarios", {
      id: serial("id").primaryKey(),
      remoteJid: varchar("remotejid", { length: 255 }).notNull().default(""),
      nome: varchar("nome", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      telefone: varchar("telefone", { length: 20 }),
      senha: varchar("senha", { length: 255 }).notNull(),
      tipo_usuario: varchar("tipo_usuario", { length: 50 }).notNull().default("normal"),
      ativo: boolean("ativo").notNull().default(true),
      data_cadastro: timestamp("data_cadastro", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      ultimo_acesso: timestamp("ultimo_acesso", { withTimezone: true }),
      data_cancelamento: timestamp("data_cancelamento", { withTimezone: true }),
      motivo_cancelamento: text("motivo_cancelamento"),
      data_expiracao_assinatura: timestamp("data_expiracao_assinatura", { withTimezone: true }),
      status_assinatura: varchar("status_assinatura", { length: 20 }).default("ativa")
    });
    wallets = pgTable("carteiras", {
      id: serial("id").primaryKey(),
      usuario_id: integer("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      nome: varchar("nome", { length: 255 }).notNull(),
      descricao: text("descricao"),
      saldo_atual: decimal("saldo_atual", { precision: 12, scale: 2 }).default("0.00"),
      data_criacao: timestamp("data_criacao", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`)
    });
    categories = pgTable("categorias", {
      id: serial("id").primaryKey(),
      nome: varchar("nome", { length: 255 }).notNull(),
      tipo: varchar("tipo", { length: 10 }).notNull().default("Despesa"),
      cor: varchar("cor", { length: 50 }),
      icone: varchar("icone", { length: 100 }),
      descricao: text("descricao"),
      usuario_id: integer("usuario_id").references(() => users.id, { onDelete: "cascade" }),
      global: boolean("global").notNull().default(false)
    }, (table) => [
      unique().on(table.nome, table.global)
    ]);
    paymentMethods = pgTable("formas_pagamento", {
      id: serial("id").primaryKey(),
      nome: varchar("nome", { length: 255 }).notNull(),
      descricao: text("descricao"),
      icone: varchar("icone", { length: 100 }),
      cor: varchar("cor", { length: 50 }),
      usuario_id: integer("usuario_id").references(() => users.id, { onDelete: "cascade" }),
      global: boolean("global").notNull().default(false),
      ativo: boolean("ativo").notNull().default(true),
      data_criacao: timestamp("data_criacao", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`)
    }, (table) => [
      unique().on(table.nome, table.global)
    ]);
    transactions = pgTable("transacoes", {
      id: serial("id").primaryKey(),
      carteira_id: integer("carteira_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
      categoria_id: integer("categoria_id").notNull().references(() => categories.id),
      forma_pagamento_id: integer("forma_pagamento_id").references(() => paymentMethods.id),
      tipo: varchar("tipo", { length: 10 }).notNull().default("Despesa"),
      valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
      data_transacao: date("data_transacao").notNull(),
      data_registro: timestamp("data_registro", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      descricao: varchar("descricao", { length: 255 }).notNull(),
      metodo_pagamento: varchar("metodo_pagamento", { length: 100 }),
      status: varchar("status", { length: 20 }).notNull().default("Pendente")
    });
    apiTokens = pgTable("api_tokens", {
      id: serial("id").primaryKey(),
      usuario_id: integer("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: varchar("token", { length: 255 }).notNull().unique(),
      nome: varchar("nome", { length: 100 }).notNull(),
      descricao: text("descricao"),
      data_criacao: timestamp("data_criacao", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      data_expiracao: timestamp("data_expiracao", { withTimezone: true }),
      ativo: boolean("ativo").notNull().default(true),
      master: boolean("master").notNull().default(false),
      // Indica se é o MasterToken
      rotacionavel: boolean("rotacionavel").notNull().default(false)
      // Só MasterToken pode rotacionar
    }, (table) => [
      unique().on(table.usuario_id, table.master)
    ]);
    historicoCancelamentos = pgTable("historico_cancelamentos", {
      id: serial("id").primaryKey(),
      usuario_id: integer("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      data_cancelamento: timestamp("data_cancelamento", { withTimezone: true }).notNull().default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      motivo_cancelamento: text("motivo_cancelamento").notNull(),
      tipo_cancelamento: varchar("tipo_cancelamento", { length: 20 }).notNull().default("voluntario"),
      observacoes: text("observacoes"),
      reativado_em: timestamp("reativado_em", { withTimezone: true }),
      data_criacao: timestamp("data_criacao", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`)
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, data_cadastro: true, ultimo_acesso: true });
    loginUserSchema = z.object({
      email: z.string().email({ message: "Email inv\xE1lido" }),
      senha: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" })
    });
    insertWalletSchema = createInsertSchema(wallets).omit({ id: true, data_criacao: true, saldo_atual: true });
    insertCategorySchema = createInsertSchema(categories).omit({ id: true });
    insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ id: true, data_criacao: true });
    stringToNumber = (value) => {
      if (typeof value === "number") return value;
      if (value === "" || value === null || value === void 0) return 0;
      const sanitized = value.replace(/[^\d.]/g, "");
      const parsed = parseFloat(sanitized);
      return isNaN(parsed) ? 0 : parsed;
    };
    normalizeTransactionType = (tipo) => {
      if (!tipo) return "Despesa";
      const tipoLower = tipo.toLowerCase();
      if (tipoLower === "entrada" || tipoLower === "receita" || tipoLower === "income" || tipoLower === "recebimento") {
        return "Receita";
      } else if (tipoLower === "saida" || tipoLower === "sa\xEDda" || tipoLower === "despesa" || tipoLower === "expense" || tipoLower === "gasto" || tipoLower === "pagamento") {
        return "Despesa";
      }
      return tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
    };
    flexibleNumberSchema = z.union([
      z.number(),
      z.string().transform((val) => stringToNumber(val))
    ]);
    normalizeDateFormat = (dateStr) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
      }
      try {
        const date2 = new Date(dateStr);
        if (!isNaN(date2.getTime())) {
          return date2.toISOString().split("T")[0];
        }
      } catch (error) {
      }
      return dateStr;
    };
    insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, data_registro: true }).extend({
      // Permitir que esses campos aceitem strings ou números
      carteira_id: flexibleNumberSchema,
      categoria_id: flexibleNumberSchema,
      forma_pagamento_id: flexibleNumberSchema.optional(),
      valor: flexibleNumberSchema,
      // Normalizar o tipo de transação para case insensitive
      tipo: z.string().transform(normalizeTransactionType),
      // Normalizar formato de data para ISO
      data_transacao: z.string().transform(normalizeDateFormat)
    });
    updateTransactionSchema = createInsertSchema(transactions).omit({ id: true, data_registro: true, carteira_id: true }).partial().extend({
      // Permitir que esses campos aceitem strings ou números quando fornecidos
      categoria_id: flexibleNumberSchema.optional(),
      valor: flexibleNumberSchema.optional(),
      // Normalizar o tipo de transação para case insensitive quando fornecido
      tipo: z.string().transform(normalizeTransactionType).optional(),
      // Normalizar formato de data para ISO quando fornecido
      data_transacao: z.string().transform(normalizeDateFormat).optional()
    });
    insertApiTokenSchema = createInsertSchema(apiTokens).omit({
      id: true,
      data_criacao: true,
      token: true,
      usuario_id: true
    });
    updateApiTokenSchema = createInsertSchema(apiTokens).omit({ id: true, data_criacao: true, token: true, usuario_id: true }).partial();
    reminders = pgTable("lembretes", {
      id: serial("id").primaryKey(),
      usuario_id: integer("usuario_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      titulo: varchar("titulo", { length: 255 }).notNull(),
      descricao: text("descricao"),
      data_lembrete: timestamp("data_lembrete", { withTimezone: true }).notNull(),
      data_criacao: timestamp("data_criacao", { withTimezone: true }).default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      concluido: boolean("concluido").default(false)
    });
    userSessionsAdmin = pgTable("user_sessions_admin", {
      id: serial("id").primaryKey(),
      super_admin_id: integer("super_admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      target_user_id: integer("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      data_inicio: timestamp("data_inicio", { withTimezone: true }).notNull().default(sql`(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')`),
      data_fim: timestamp("data_fim", { withTimezone: true }),
      ativo: boolean("ativo").notNull().default(true)
    });
    flexibleDateSchema = z.union([
      z.date(),
      z.string()
      // Manter como string para conversão manual no controller
    ]);
    insertReminderSchema = createInsertSchema(reminders).omit({
      id: true,
      usuario_id: true,
      data_criacao: true
    }).extend({
      // Permitir que a data do lembrete seja uma string ou um objeto Date
      data_lembrete: flexibleDateSchema,
      // Tornar o campo concluido opcional com padrão false
      concluido: z.boolean().optional().default(false)
    });
    updateReminderSchema = createInsertSchema(reminders).omit({
      id: true,
      usuario_id: true,
      data_criacao: true
    }).extend({
      // Permitir que a data do lembrete seja uma string ou um objeto Date quando fornecida
      data_lembrete: flexibleDateSchema.optional()
    }).partial();
  }
});

// server/storage.ts
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq, and, desc, gte, lte, isNull, count, sql as sql2 } from "drizzle-orm";
var DbStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    DbStorage = class {
      // User methods
      async getUserById(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
      }
      async getUserByEmail(email) {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0];
      }
      async getUserByRemoteJid(remoteJid) {
        try {
          const result = await db.select().from(users).where(eq(users.remoteJid, remoteJid)).limit(1);
          return result[0];
        } catch (error) {
          console.error("Error in getUserByRemoteJid:", error);
          return void 0;
        }
      }
      async getUserByPhone(telefone) {
        const result = await db.select().from(users).where(eq(users.telefone, telefone)).limit(1);
        return result[0];
      }
      async createUser(userData) {
        const hashedPassword = await bcrypt.hash(userData.senha, 10);
        const result = await db.insert(users).values({
          ...userData,
          senha: hashedPassword,
          data_cadastro: /* @__PURE__ */ new Date(),
          ultimo_acesso: /* @__PURE__ */ new Date()
        }).returning();
        const user = result[0];
        await this.createApiToken(user.id, {
          nome: "MasterToken",
          descricao: "Token principal do usu\xE1rio, n\xE3o remov\xEDvel.",
          data_expiracao: null,
          ativo: true,
          master: true,
          rotacionavel: true
        });
        return user;
      }
      async updateUser(id, userData) {
        const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
        return result[0];
      }
      async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await db.update(users).set({ senha: hashedPassword }).where(eq(users.id, id)).returning({ id: users.id });
        return result.length > 0;
      }
      // Wallet methods
      async getWalletByUserId(userId) {
        const result = await db.select().from(wallets).where(eq(wallets.usuario_id, userId)).limit(1);
        if (!result[0]) return void 0;
        const wallet = result[0];
        const realBalance = await this.calculateWalletBalance(wallet.id);
        return {
          ...wallet,
          saldo_atual: realBalance.toFixed(2)
        };
      }
      async calculateWalletBalance(walletId) {
        try {
          const result = await db.execute(sql2`
        SELECT COALESCE(SUM(
          CASE WHEN tipo = 'Receita' THEN valor::numeric 
               WHEN tipo = 'Despesa' THEN -valor::numeric 
               ELSE 0 END
        ), 0) as balance
        FROM transacoes
        WHERE carteira_id = ${walletId}
      `);
          return parseFloat(result[0]?.balance || "0") || 0;
        } catch (error) {
          console.error("Error calculating wallet balance:", error);
          return 0;
        }
      }
      async createWallet(walletData) {
        const result = await db.insert(wallets).values({
          ...walletData,
          data_criacao: /* @__PURE__ */ new Date()
        }).returning();
        return result[0];
      }
      async updateWallet(id, walletData) {
        const result = await db.update(wallets).set(walletData).where(eq(wallets.id, id)).returning();
        return result[0];
      }
      // Category methods
      async getCategoriesByUserId(userId) {
        return db.select().from(categories).where(
          sql2`${categories.usuario_id} = ${userId} OR ${categories.global} = true`
        ).orderBy(desc(categories.global), categories.nome);
      }
      async getGlobalCategories() {
        return db.select().from(categories).where(eq(categories.global, true)).orderBy(categories.nome);
      }
      async getCategoryById(id) {
        const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
        return result[0];
      }
      async createCategory(categoryData) {
        const result = await db.insert(categories).values(categoryData).returning();
        return result[0];
      }
      async updateCategory(id, categoryData) {
        const result = await db.update(categories).set(categoryData).where(eq(categories.id, id)).returning();
        return result[0];
      }
      async deleteCategory(id) {
        try {
          const usedInTransactions = await db.select({ count: count() }).from(transactions).where(eq(transactions.categoria_id, id));
          if (usedInTransactions[0].count > 0) {
            return false;
          }
          const category = await this.getCategoryById(id);
          if (category?.global) {
            return false;
          }
          const result = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
          return result.length > 0;
        } catch (error) {
          console.error("Error deleting category:", error);
          return false;
        }
      }
      // Payment Method methods
      async getPaymentMethodsByUserId(userId) {
        return db.select().from(paymentMethods).where(
          and(
            eq(paymentMethods.usuario_id, userId),
            eq(paymentMethods.ativo, true)
          )
        ).orderBy(paymentMethods.nome);
      }
      async getGlobalPaymentMethods() {
        return db.select().from(paymentMethods).where(
          and(
            eq(paymentMethods.global, true),
            eq(paymentMethods.ativo, true)
          )
        ).orderBy(paymentMethods.nome);
      }
      async getPaymentMethodById(id) {
        const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
        return result[0];
      }
      async getPaymentMethodByName(name) {
        const result = await db.select().from(paymentMethods).where(
          and(
            eq(paymentMethods.nome, name),
            eq(paymentMethods.global, true),
            eq(paymentMethods.ativo, true)
          )
        ).limit(1);
        return result[0];
      }
      async createPaymentMethod(paymentMethodData) {
        const result = await db.insert(paymentMethods).values({
          ...paymentMethodData,
          data_criacao: /* @__PURE__ */ new Date()
        }).returning();
        return result[0];
      }
      async updatePaymentMethod(id, paymentMethodData) {
        const result = await db.update(paymentMethods).set(paymentMethodData).where(eq(paymentMethods.id, id)).returning();
        return result[0];
      }
      async deletePaymentMethod(id) {
        try {
          const usedInTransactions = await db.select({ count: count() }).from(transactions).where(eq(transactions.forma_pagamento_id, id));
          if (usedInTransactions[0].count > 0) {
            return false;
          }
          const paymentMethod = await this.getPaymentMethodById(id);
          if (paymentMethod?.global) {
            return false;
          }
          const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning({ id: paymentMethods.id });
          return result.length > 0;
        } catch (error) {
          console.error("Error deleting payment method:", error);
          return false;
        }
      }
      async getTransactionTotalsByPaymentMethod(userId) {
        const wallet = await this.getWalletByUserId(userId);
        if (!wallet) {
          return [];
        }
        const allPaymentMethods = await this.getPaymentMethodsByUserId(userId);
        const globalPaymentMethods = await this.getGlobalPaymentMethods();
        const paymentMethods2 = [...allPaymentMethods, ...globalPaymentMethods];
        const allTransactions = await db.select().from(transactions).where(
          eq(transactions.carteira_id, wallet.id)
        );
        const totalsMap = /* @__PURE__ */ new Map();
        for (const transaction of allTransactions) {
          let matchedPaymentMethodId = null;
          if (transaction.forma_pagamento_id) {
            matchedPaymentMethodId = transaction.forma_pagamento_id;
          } else if (transaction.metodo_pagamento) {
            const matchedMethod = paymentMethods2.find((pm) => pm.nome === transaction.metodo_pagamento);
            if (matchedMethod) {
              matchedPaymentMethodId = matchedMethod.id;
            }
          }
          if (matchedPaymentMethodId) {
            const valor = Number(transaction.valor) || 0;
            const currentTotals = totalsMap.get(matchedPaymentMethodId) || { total: 0, incomeTotal: 0, expenseTotal: 0 };
            if (transaction.tipo === "Receita") {
              currentTotals.incomeTotal += valor;
              currentTotals.total += valor;
            } else if (transaction.tipo === "Despesa") {
              currentTotals.expenseTotal += valor;
              currentTotals.total -= valor;
            }
            totalsMap.set(matchedPaymentMethodId, currentTotals);
          }
        }
        const result = Array.from(totalsMap.entries()).map(([paymentMethodId, totals]) => ({
          paymentMethodId,
          total: totals.total,
          incomeTotal: totals.incomeTotal,
          expenseTotal: totals.expenseTotal
        }));
        return result;
      }
      // Transaction methods
      async getTransactionsByWalletId(walletId) {
        const result = await db.select({
          id: transactions.id,
          carteira_id: transactions.carteira_id,
          categoria_id: transactions.categoria_id,
          forma_pagamento_id: transactions.forma_pagamento_id,
          tipo: transactions.tipo,
          valor: transactions.valor,
          data_transacao: transactions.data_transacao,
          data_registro: transactions.data_registro,
          descricao: transactions.descricao,
          metodo_pagamento: paymentMethods.nome,
          status: transactions.status,
          categoria_name: categories.nome
        }).from(transactions).leftJoin(paymentMethods, eq(transactions.forma_pagamento_id, paymentMethods.id)).leftJoin(categories, eq(transactions.categoria_id, categories.id)).where(eq(transactions.carteira_id, walletId)).orderBy(desc(transactions.data_transacao), desc(transactions.data_registro));
        return result;
      }
      async getRecentTransactionsByWalletId(walletId, limit = 5) {
        const result = await db.select({
          id: transactions.id,
          carteira_id: transactions.carteira_id,
          categoria_id: transactions.categoria_id,
          forma_pagamento_id: transactions.forma_pagamento_id,
          tipo: transactions.tipo,
          valor: transactions.valor,
          data_transacao: transactions.data_transacao,
          data_registro: transactions.data_registro,
          descricao: transactions.descricao,
          metodo_pagamento: paymentMethods.nome,
          status: transactions.status,
          categoria_name: categories.nome
        }).from(transactions).leftJoin(paymentMethods, eq(transactions.forma_pagamento_id, paymentMethods.id)).leftJoin(categories, eq(transactions.categoria_id, categories.id)).where(eq(transactions.carteira_id, walletId)).orderBy(desc(transactions.data_transacao), desc(transactions.data_registro)).limit(limit);
        return result;
      }
      async getTransactionById(id) {
        const result = await db.select({
          id: transactions.id,
          carteira_id: transactions.carteira_id,
          categoria_id: transactions.categoria_id,
          forma_pagamento_id: transactions.forma_pagamento_id,
          tipo: transactions.tipo,
          valor: transactions.valor,
          data_transacao: transactions.data_transacao,
          data_registro: transactions.data_registro,
          descricao: transactions.descricao,
          metodo_pagamento: paymentMethods.nome,
          status: transactions.status,
          categoria_name: categories.nome
        }).from(transactions).leftJoin(paymentMethods, eq(transactions.forma_pagamento_id, paymentMethods.id)).leftJoin(categories, eq(transactions.categoria_id, categories.id)).where(eq(transactions.id, id)).limit(1);
        return result[0];
      }
      async createTransaction(transactionData) {
        const result = await db.insert(transactions).values({
          ...transactionData,
          valor: transactionData.valor.toString(),
          data_registro: /* @__PURE__ */ new Date()
        }).returning();
        const completeTransaction = await this.getTransactionById(result[0].id);
        return completeTransaction || result[0];
      }
      async updateTransaction(id, transactionData) {
        const result = await db.update(transactions).set(transactionData).where(eq(transactions.id, id)).returning();
        return result[0];
      }
      async deleteTransaction(id) {
        const result = await db.delete(transactions).where(eq(transactions.id, id)).returning({ id: transactions.id });
        return result.length > 0;
      }
      // Dashboard methods
      async getMonthlyTransactionSummary(walletId) {
        const now = /* @__PURE__ */ new Date();
        const lastYear = /* @__PURE__ */ new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        try {
          const monthlyData = await db.execute(sql2`
        SELECT 
          EXTRACT(MONTH FROM data_transacao) as month_num,
          EXTRACT(YEAR FROM data_transacao) as year,
          SUM(CASE WHEN tipo = 'Receita' THEN valor ELSE 0 END) as income,
          SUM(CASE WHEN tipo = 'Despesa' THEN valor ELSE 0 END) as expense
        FROM transacoes
        WHERE 
          carteira_id = ${walletId}
        GROUP BY month_num, year
        ORDER BY year, month_num
      `);
          const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
          const convertedData = monthlyData.map((row) => ({
            month: monthNames[Number(row.month_num) - 1],
            month_num: Number(row.month_num),
            year: Number(row.year),
            income: Number(row.income) || 0,
            expense: Number(row.expense) || 0
          }));
          console.log("\u{1F4CA} Monthly data converted:", JSON.stringify(convertedData, null, 2));
          return convertedData;
        } catch (error) {
          console.error("Error in getMonthlyTransactionSummary:", error);
          return [];
        }
      }
      async getExpensesByCategory(walletId) {
        const startOfMonth = /* @__PURE__ */ new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = /* @__PURE__ */ new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        try {
          const result = await db.execute(sql2`
        SELECT 
          c.id as category_id,
          c.nome as name,
          c.cor as color,
          c.icone as icon,
          SUM(t.valor) as total
        FROM transacoes t
        JOIN categorias c ON t.categoria_id = c.id
        WHERE 
          t.carteira_id = ${walletId}
          AND t.tipo = 'Despesa'
          AND t.data_transacao >= ${startOfMonth.toISOString()}
          AND t.data_transacao <= ${endOfMonth.toISOString()}
        GROUP BY c.id, c.nome, c.cor, c.icone
        ORDER BY total DESC
      `);
          return result;
        } catch (error) {
          console.error("Error in getExpensesByCategory:", error);
          return [];
        }
      }
      async getIncomeExpenseTotals(walletId) {
        try {
          const result = await db.execute(sql2`
        SELECT 
          SUM(CASE WHEN tipo = 'Receita' THEN valor ELSE 0 END) as total_income,
          SUM(CASE WHEN tipo = 'Despesa' THEN valor ELSE 0 END) as total_expenses
        FROM transacoes
        WHERE 
          carteira_id = ${walletId}
      `);
          if (result && result[0]) {
            return {
              totalIncome: Number(result[0].total_income) || 0,
              totalExpenses: Number(result[0].total_expenses) || 0
            };
          }
          return { totalIncome: 0, totalExpenses: 0 };
        } catch (error) {
          console.error("Error in getIncomeExpenseTotals:", error);
          return { totalIncome: 0, totalExpenses: 0 };
        }
      }
      async getWalletStatsForAllUsers() {
        try {
          const result = await db.execute(sql2`
        SELECT 
          w.id as wallet_id,
          w.usuario_id as user_id,
          COALESCE(SUM(
            CASE WHEN t.tipo = 'Receita' THEN t.valor::numeric 
                 WHEN t.tipo = 'Despesa' THEN -t.valor::numeric 
                 ELSE 0 END
          ), 0) as balance,
          COUNT(t.id) as transaction_count
        FROM carteiras w
        INNER JOIN usuarios u ON w.usuario_id = u.id
        LEFT JOIN transacoes t ON w.id = t.carteira_id
        GROUP BY w.id, w.usuario_id
        ORDER BY w.usuario_id
      `);
          return result.map((row) => ({
            walletId: row.wallet_id,
            userId: row.user_id,
            balance: parseFloat(row.balance) || 0,
            transactionCount: parseInt(row.transaction_count) || 0
          }));
        } catch (error) {
          console.error("Error in getWalletStatsForAllUsers:", error);
          return [];
        }
      }
      // Função para gerar token de API aleatório e seguro
      generateApiToken() {
        return `fin_${randomBytes(32).toString("hex")}`;
      }
      // Métodos da API Token
      async getApiTokensByUserId(userId) {
        return db.select().from(apiTokens).where(eq(apiTokens.usuario_id, userId)).orderBy(desc(apiTokens.data_criacao));
      }
      async getApiTokenById(id) {
        const result = await db.select().from(apiTokens).where(eq(apiTokens.id, id)).limit(1);
        return result[0];
      }
      async getApiTokenByToken(token) {
        const result = await db.select().from(apiTokens).where(eq(apiTokens.token, token)).limit(1);
        return result[0];
      }
      async createApiToken(userId, tokenData) {
        const token = this.generateApiToken();
        const result = await db.insert(apiTokens).values({
          ...tokenData,
          usuario_id: userId,
          token,
          data_criacao: /* @__PURE__ */ new Date(),
          ativo: true
        }).returning();
        return result[0];
      }
      async updateApiToken(id, tokenData) {
        const result = await db.update(apiTokens).set(tokenData).where(eq(apiTokens.id, id)).returning();
        return result[0];
      }
      async deleteApiToken(id) {
        const result = await db.delete(apiTokens).where(eq(apiTokens.id, id)).returning({ id: apiTokens.id });
        return result.length > 0;
      }
      // Reminder methods
      async getRemindersByUserId(userId) {
        try {
          const result = await db.select().from(reminders).where(eq(reminders.usuario_id, userId)).orderBy(desc(reminders.data_lembrete));
          return result;
        } catch (error) {
          console.error("Error in getRemindersByUserId:", error);
          return [];
        }
      }
      async getReminderById(id) {
        try {
          const result = await db.select().from(reminders).where(eq(reminders.id, id)).limit(1);
          return result[0];
        } catch (error) {
          console.error("Error in getReminderById:", error);
          return void 0;
        }
      }
      async createReminder(reminderData) {
        try {
          const result = await db.insert(reminders).values(reminderData).returning();
          return result[0];
        } catch (error) {
          console.error("Error in createReminder:", error);
          throw error;
        }
      }
      async updateReminder(id, reminderData) {
        try {
          const result = await db.update(reminders).set(reminderData).where(eq(reminders.id, id)).returning();
          return result[0];
        } catch (error) {
          console.error("Error in updateReminder:", error);
          return void 0;
        }
      }
      async deleteReminder(id) {
        try {
          const result = await db.delete(reminders).where(eq(reminders.id, id)).returning({ id: reminders.id });
          return result.length > 0;
        } catch (error) {
          console.error("Error in deleteReminder:", error);
          return false;
        }
      }
      async getRemindersByDateRange(userId, startDate, endDate) {
        try {
          const result = await db.select().from(reminders).where(
            and(
              eq(reminders.usuario_id, userId),
              gte(reminders.data_lembrete, startDate),
              lte(reminders.data_lembrete, endDate)
            )
          ).orderBy(reminders.data_lembrete);
          return result;
        } catch (error) {
          console.error("Error in getRemindersByDateRange:", error);
          return [];
        }
      }
      // Admin Session methods
      async getActiveImpersonationSession(targetUserId) {
        try {
          const result = await db.select().from(userSessionsAdmin).where(
            and(
              eq(userSessionsAdmin.target_user_id, targetUserId),
              eq(userSessionsAdmin.ativo, true),
              isNull(userSessionsAdmin.data_fim)
            )
          ).limit(1);
          return result[0];
        } catch (error) {
          console.error("Error in getActiveImpersonationSession:", error);
          return void 0;
        }
      }
      async createImpersonationSession(superAdminId, targetUserId) {
        try {
          await db.update(userSessionsAdmin).set({
            ativo: false,
            data_fim: /* @__PURE__ */ new Date()
          }).where(
            and(
              eq(userSessionsAdmin.target_user_id, targetUserId),
              eq(userSessionsAdmin.ativo, true)
            )
          );
          const result = await db.insert(userSessionsAdmin).values({
            super_admin_id: superAdminId,
            target_user_id: targetUserId,
            ativo: true
          }).returning();
          return result[0];
        } catch (error) {
          console.error("Error in createImpersonationSession:", error);
          throw error;
        }
      }
      async endImpersonationSession(sessionId) {
        try {
          const result = await db.update(userSessionsAdmin).set({
            ativo: false,
            data_fim: /* @__PURE__ */ new Date()
          }).where(eq(userSessionsAdmin.id, sessionId)).returning();
          return result.length > 0;
        } catch (error) {
          console.error("Error in endImpersonationSession:", error);
          return false;
        }
      }
      async getAllUsers() {
        try {
          const result = await db.select().from(users).orderBy(users.nome);
          return result;
        } catch (error) {
          console.error("Error in getAllUsers:", error);
          return [];
        }
      }
      async getRecentUsers(limit = 5) {
        try {
          const result = await db.select().from(users).orderBy(desc(users.data_cadastro)).limit(limit);
          return result;
        } catch (error) {
          console.error("Error in getRecentUsers:", error);
          return [];
        }
      }
      async getAllAdminSessions() {
        try {
          const result = await db.select().from(userSessionsAdmin).orderBy(desc(userSessionsAdmin.data_inicio));
          return result;
        } catch (error) {
          console.error("Error in getAllAdminSessions:", error);
          return [];
        }
      }
      async deleteAllGlobalCategories() {
        await db.delete(categories).where(eq(categories.global, true));
      }
      async deleteAllGlobalPaymentMethods() {
        await db.delete(paymentMethods).where(eq(paymentMethods.global, true));
      }
      // Exclusão definitiva de usuário e todos os dados relacionados
      async deleteUserCascade(userId) {
        try {
          const userWallets = await db.select().from(wallets).where(eq(wallets.usuario_id, userId));
          const walletIds = userWallets.map((w) => w.id);
          if (walletIds.length > 0) {
            const arrayStr = `'{${walletIds.join(",")}}'::int[]`;
            await db.delete(transactions).where(sql2`carteira_id = ANY(${sql2.raw(arrayStr)})`);
          }
          await db.delete(reminders).where(eq(reminders.usuario_id, userId));
          await db.delete(categories).where(eq(categories.usuario_id, userId));
          await db.delete(wallets).where(eq(wallets.usuario_id, userId));
          await db.delete(apiTokens).where(eq(apiTokens.usuario_id, userId));
          await db.delete(userSessionsAdmin).where(eq(userSessionsAdmin.target_user_id, userId));
          await db.delete(paymentMethods).where(eq(paymentMethods.usuario_id, userId));
          await db.delete(users).where(eq(users.id, userId));
          return true;
        } catch (error) {
          console.error("Erro ao deletar usu\xE1rio em cascata:", error);
          return false;
        }
      }
    };
    storage = new DbStorage();
  }
});

// server/controllers/pdf-simple.controller.ts
var pdf_simple_controller_exports = {};
__export(pdf_simple_controller_exports, {
  generateSimpleReportPDF: () => generateSimpleReportPDF
});
import fs4 from "fs";
import path4 from "path";
import { jsPDF } from "jspdf";
async function generateSimpleReportPDF(req, res) {
  try {
    console.log("=== PDF GENERATION - SIMPLE VERSION ===");
    console.log("PDF Generation: User ID", req.user.id);
    const wallet = await storage.getWalletByUserId(req.user.id);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const expensesByCategory = await storage.getExpensesByCategory(wallet.id);
    const monthlyData = await storage.getMonthlyTransactionSummary(wallet.id);
    const { totalIncome, totalExpenses } = await storage.getIncomeExpenseTotals(
      wallet.id
    );
    console.log("PDF Generation: Dados processados com sucesso", {
      expensesByCategory: expensesByCategory.length,
      monthlyData: monthlyData.length,
      totalIncome,
      totalExpenses
    });
    const COLORS = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#A569BD",
      "#FF6B6B",
      "#6BCB77",
      "#4D96FF"
    ];
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Relat\xF3rios", 20, 25);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("Acompanhe suas finan\xE7as com an\xE1lises detalhadas", 20, 35);
    const reportDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    doc.setTextColor(255, 255, 255);
    doc.text(`${req.user?.nome} \u2022 ${wallet.nome} \u2022 ${reportDate}`, 20, 45);
    let currentY = 60;
    if (monthlyData && monthlyData.length > 0) {
      doc.setFillColor(31, 41, 55);
      doc.rect(10, currentY, 95, 80, "F");
      doc.setDrawColor(0, 136, 254);
      doc.setLineWidth(0.5);
      doc.rect(10, currentY, 95, 80);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Receitas vs Despesas", 15, currentY + 12);
      const chartStartY = currentY + 20;
      const chartHeight = 45;
      const barWidth = 6;
      const maxValue = Math.max(
        ...monthlyData.map(
          (d) => Math.max(Number(d.receitas || 0), Number(d.despesas || 0))
        )
      );
      console.log("PDF: Escala gr\xE1fico barras - maxValue:", maxValue);
      monthlyData.slice(0, 6).forEach((data, index) => {
        const x = 15 + index * 12;
        const receitas = Number(data.receitas || 0);
        const despesas = Number(data.despesas || 0);
        console.log(
          `PDF: M\xEAs ${data.mes} - Receitas: ${receitas}, Despesas: ${despesas}`
        );
        const incomeHeight = maxValue > 0 ? Math.max(2, receitas / maxValue * chartHeight) : receitas > 0 ? 5 : 0;
        if (receitas > 0) {
          doc.setFillColor(74, 222, 128);
          doc.rect(
            x,
            chartStartY + chartHeight - incomeHeight,
            barWidth,
            incomeHeight,
            "F"
          );
          console.log(
            `PDF: Barra receita - x:${x}, y:${chartStartY + chartHeight - incomeHeight}, w:${barWidth}, h:${incomeHeight}`
          );
        }
        const expenseHeight = maxValue > 0 ? Math.max(2, despesas / maxValue * chartHeight) : despesas > 0 ? 5 : 0;
        if (despesas > 0) {
          doc.setFillColor(248, 113, 113);
          doc.rect(
            x + barWidth + 1,
            chartStartY + chartHeight - expenseHeight,
            barWidth,
            expenseHeight,
            "F"
          );
          console.log(
            `PDF: Barra despesa - x:${x + barWidth + 1}, y:${chartStartY + chartHeight - expenseHeight}, w:${barWidth}, h:${expenseHeight}`
          );
        }
        doc.setTextColor(136, 136, 136);
        doc.setFontSize(8);
        doc.text(
          data.mes?.substring(0, 3) || `M${index + 1}`,
          x + 2,
          chartStartY + chartHeight + 8
        );
      });
    }
    if (monthlyData && monthlyData.length > 0) {
      doc.setFillColor(31, 41, 55);
      doc.rect(110, currentY, 95, 80, "F");
      doc.setDrawColor(0, 136, 254);
      doc.setLineWidth(0.5);
      doc.rect(110, currentY, 95, 80);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fluxo de Caixa", 115, currentY + 12);
      const chartStartY = currentY + 20;
      const chartHeight = 45;
      const chartWidth = 80;
      const balances = monthlyData.slice(0, 6).map((d) => Number(d.receitas || 0) - Number(d.despesas || 0));
      const minBalance = Math.min(...balances);
      const maxBalance = Math.max(...balances);
      const range = maxBalance - minBalance || 1;
      console.log("PDF: Gr\xE1fico linha - saldos:", balances);
      console.log("PDF: Range:", range, "Min:", minBalance, "Max:", maxBalance);
      if (balances.length === 1) {
        const currentBalance2 = balances[0];
        const extendedBalances = [
          currentBalance2 * 0.8,
          currentBalance2 * 0.9,
          currentBalance2
        ];
        const extendedRange = Math.abs(currentBalance2 * 0.2) || 100;
        doc.setDrawColor(136, 132, 216);
        doc.setLineWidth(2);
        for (let i = 0; i < extendedBalances.length - 1; i++) {
          const x1 = 115 + i / (extendedBalances.length - 1) * chartWidth;
          const y1 = chartStartY + chartHeight - (extendedBalances[i] - currentBalance2 * 0.8) / extendedRange * chartHeight;
          const x2 = 115 + (i + 1) / (extendedBalances.length - 1) * chartWidth;
          const y2 = chartStartY + chartHeight - (extendedBalances[i + 1] - currentBalance2 * 0.8) / extendedRange * chartHeight;
          doc.line(x1, y1, x2, y2);
          doc.setFillColor(136, 132, 216);
          doc.circle(x1, y1, 1.5, "F");
        }
        const lastX = 115 + chartWidth;
        const lastY = chartStartY + chartHeight - (currentBalance2 - currentBalance2 * 0.8) / extendedRange * chartHeight;
        doc.circle(lastX, lastY, 1.5, "F");
      } else {
        doc.setDrawColor(136, 132, 216);
        doc.setLineWidth(2);
        for (let i = 0; i < balances.length - 1; i++) {
          const x1 = 115 + i / Math.max(1, balances.length - 1) * chartWidth;
          const y1 = chartStartY + chartHeight - (balances[i] - minBalance) / range * chartHeight;
          const x2 = 115 + (i + 1) / Math.max(1, balances.length - 1) * chartWidth;
          const y2 = chartStartY + chartHeight - (balances[i + 1] - minBalance) / range * chartHeight;
          doc.line(x1, y1, x2, y2);
          doc.setFillColor(136, 132, 216);
          doc.circle(x1, y1, 1.5, "F");
        }
        if (balances.length > 0) {
          const lastX = 115 + chartWidth;
          const lastY = chartStartY + chartHeight - (balances[balances.length - 1] - minBalance) / range * chartHeight;
          doc.circle(lastX, lastY, 1.5, "F");
        }
      }
    }
    currentY += 90;
    if (expensesByCategory && expensesByCategory.length > 0) {
      const cardHeight = Math.max(100, expensesByCategory.length * 15 + 60);
      doc.setFillColor(31, 41, 55);
      doc.rect(10, currentY, 190, cardHeight, "F");
      doc.setDrawColor(0, 136, 254);
      doc.setLineWidth(0.5);
      doc.rect(10, currentY, 190, cardHeight);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Despesas por Categoria", 15, currentY + 12);
      const pieX = 60;
      const pieY = currentY + 50;
      const radius = 25;
      const totalExpenses2 = expensesByCategory.reduce(
        (sum2, cat) => sum2 + Number(cat.total || 0),
        0
      );
      let currentAngle = 0;
      expensesByCategory.forEach((category, index) => {
        const value = Number(category.total || 0);
        const percentage = totalExpenses2 > 0 ? value / totalExpenses2 : 0;
        const angle = percentage * 2 * Math.PI;
        const colorIndex = index % COLORS.length;
        const hex = COLORS[colorIndex].replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        doc.setFillColor(r, g, b);
        const steps = Math.max(8, Math.floor(angle * 20));
        for (let i = 0; i < steps; i++) {
          const a1 = currentAngle + i / steps * angle;
          const a2 = currentAngle + (i + 1) / steps * angle;
          const x1 = pieX + Math.cos(a1) * radius;
          const y1 = pieY + Math.sin(a1) * radius;
          const x2 = pieX + Math.cos(a2) * radius;
          const y2 = pieY + Math.sin(a2) * radius;
          doc.triangle(pieX, pieY, x1, y1, x2, y2, "F");
        }
        currentAngle += angle;
      });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento", 120, currentY + 25);
      let detailY = currentY + 35;
      expensesByCategory.forEach((category, index) => {
        const colorIndex = index % COLORS.length;
        const hex = COLORS[colorIndex].replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        doc.setFillColor(r, g, b);
        doc.circle(120, detailY + 1, 1.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(category.name || "", 125, detailY + 2);
        doc.setTextColor(248, 113, 113);
        doc.setFont("helvetica", "bold");
        doc.text(
          `R$ ${Number(category.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          195,
          detailY + 2,
          { align: "right" }
        );
        const barY = detailY + 5;
        const barWidth = 70;
        const percentage = Number(category.percentage || 0);
        doc.setFillColor(55, 65, 81);
        doc.rect(120, barY, barWidth, 2, "F");
        if (percentage > 0) {
          doc.setFillColor(r, g, b);
          doc.rect(120, barY, barWidth * percentage / 100, 2, "F");
        }
        detailY += 12;
      });
      currentY += cardHeight + 10;
    }
    doc.setFillColor(31, 41, 55);
    doc.rect(10, currentY, 190, 70, "F");
    doc.setDrawColor(0, 136, 254);
    doc.setLineWidth(0.5);
    doc.rect(10, currentY, 190, 70);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro", 15, currentY + 12);
    const cardStartY = currentY + 25;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total de Receitas", 15, cardStartY);
    doc.setTextColor(74, 222, 128);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      `R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      15,
      cardStartY + 15
    );
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total de Despesas", 80, cardStartY);
    doc.setTextColor(248, 113, 113);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      `R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      80,
      cardStartY + 15
    );
    const currentBalance = Number(wallet.saldo_atual);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Saldo Atual", 145, cardStartY);
    if (currentBalance >= 0) {
      doc.setTextColor(59, 130, 246);
    } else {
      doc.setTextColor(248, 113, 113);
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(
      `R$ ${currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      145,
      cardStartY + 15
    );
    currentY += 80;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Relat\xF3rio gerado em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} \u2022 FinanceHub`,
      105,
      285,
      { align: "center" }
    );
    doc.text("P\xE1gina 1 de 1", 190, 285, { align: "right" });
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.getTime().toString();
    const hash = Buffer.from(`${req.user.id}-${timeStr}`).toString("base64").substring(0, 8);
    const filename = `relatorio-${dateStr}-${hash}.pdf`;
    const filepath = path4.join(process.cwd(), "public", "reports", filename);
    const reportsDir = path4.dirname(filepath);
    if (!fs4.existsSync(reportsDir)) {
      fs4.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfBuffer = doc.output("arraybuffer");
    fs4.writeFileSync(filepath, Buffer.from(pdfBuffer));
    console.log(`PDF Generation: Arquivo PDF salvo em ${filepath}`);
    const downloadUrl = `/api/reports/download/${filename}`;
    res.status(200).json({
      success: true,
      downloadUrl,
      filename,
      message: "Relat\xF3rio PDF gerado com sucesso."
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Erro ao gerar PDF do relat\xF3rio" });
  }
}
var init_pdf_simple_controller = __esm({
  "server/controllers/pdf-simple.controller.ts"() {
    "use strict";
    init_storage();
  }
});

// server/controllers/pdf.controller.ts
var pdf_controller_exports = {};
__export(pdf_controller_exports, {
  downloadReportPDF: () => downloadReportPDF,
  generateReportPDF: () => generateReportPDF
});
import fs5 from "fs";
import path5 from "path";
import { jsPDF as jsPDF2 } from "jspdf";
async function generateReportPDF(req, res) {
  console.log("\n=== PDF GENERATION - START ===");
  try {
    if (!req.user) {
      console.log("PDF Generation: User not authenticated");
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    console.log(`PDF Generation: User ID ${userId}`);
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const monthlyData = await storage.getMonthlyTransactionSummary(wallet.id);
    const expensesData = await storage.getExpensesByCategory(wallet.id);
    const { totalIncome, totalExpenses } = await storage.getIncomeExpenseTotals(wallet.id);
    const totalExpensesAmount = expensesData.reduce(
      (total, item) => total + Number(item.total),
      0
    );
    const expensesByCategory = expensesData.map((item) => ({
      categoryId: Number(item.category_id || 0),
      name: item.name || "Categoria",
      total: Number(item.total || 0),
      color: item.color || "#6B7280",
      icon: item.icon || "\u{1F4CA}",
      percentage: totalExpensesAmount > 0 ? Math.round(Number(item.total || 0) / totalExpensesAmount * 100) : 0
    }));
    console.log("PDF Generation: Dados processados com sucesso", {
      expensesByCategory: expensesByCategory.length,
      monthlyData: monthlyData.length
    });
    const monthlyChartData = monthlyData.map((month) => ({
      month: month.mes,
      income: Number(month.receitas || 0),
      expense: Number(month.despesas || 0),
      balance: Number(month.receitas || 0) - Number(month.despesas || 0)
    }));
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", "#FF6B6B", "#6BCB77", "#4D96FF"];
    console.log("PDF Generation: Criando PDF final com hash \xFAnico para evitar cache");
    const doc = new jsPDF2({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    doc.setFillColor(16, 16, 20);
    doc.rect(0, 0, 210, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Relat\xF3rios", 20, 25);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("Acompanhe suas finan\xE7as com an\xE1lises detalhadas", 20, 35);
    const reportDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    doc.setTextColor(255, 255, 255);
    doc.text(`${req.user.nome} \u2022 ${wallet.nome} \u2022 ${reportDate}`, 20, 45);
    let currentY = 60;
    if (monthlyChartData.length > 0) {
      doc.setFillColor(31, 41, 55);
      doc.rect(10, currentY, 90, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Receitas vs Despesas", 55, currentY + 10, { align: "center" });
      const maxValue = Math.max(
        ...monthlyChartData.map((d) => Math.max(d.income, d.expense))
      );
      const barWidth = 6;
      const chartHeight = 35;
      const startX = 15;
      const startY = currentY + 15;
      monthlyChartData.forEach((data, index) => {
        const x = startX + index * 15;
        const incomeHeight = Math.max(0, data.income / maxValue * chartHeight);
        doc.setFillColor(74, 222, 128);
        if (incomeHeight > 0) {
          doc.rect(x, startY + chartHeight - incomeHeight, barWidth, incomeHeight, "F");
        }
        const expenseHeight = Math.max(0, data.expense / maxValue * chartHeight);
        doc.setFillColor(248, 113, 113);
        if (expenseHeight > 0) {
          doc.rect(x + barWidth + 1, startY + chartHeight - expenseHeight, barWidth, expenseHeight, "F");
        }
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.text(data.month || "", x + barWidth, startY + chartHeight + 5);
      });
      doc.setFontSize(8);
      doc.setFillColor(74, 222, 128);
      doc.rect(15, currentY + 55, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.text("Receitas", 20, currentY + 57);
      doc.setFillColor(248, 113, 113);
      doc.rect(50, currentY + 55, 3, 3, "F");
      doc.text("Despesas", 55, currentY + 57);
    }
    if (monthlyChartData.length > 0) {
      doc.setFillColor(31, 41, 55);
      doc.rect(110, currentY, 90, 60, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Fluxo de Caixa", 155, currentY + 10, { align: "center" });
      const balances = monthlyChartData.map((d) => d.balance);
      const minBalance = Math.min(...balances);
      const maxBalance = Math.max(...balances);
      const range = maxBalance - minBalance;
      const chartHeight = 35;
      const chartWidth = 70;
      const startX = 115;
      const startY = currentY + 15;
      doc.setDrawColor(136, 132, 216);
      doc.setLineWidth(0.5);
      for (let i = 0; i < monthlyChartData.length - 1; i++) {
        const x1 = startX + i / (monthlyChartData.length - 1) * chartWidth;
        const y1 = startY + chartHeight - (balances[i] - minBalance) / range * chartHeight;
        const x2 = startX + (i + 1) / (monthlyChartData.length - 1) * chartWidth;
        const y2 = startY + chartHeight - (balances[i + 1] - minBalance) / range * chartHeight;
        doc.line(x1, y1, x2, y2);
        doc.setFillColor(136, 132, 216);
        doc.circle(x1, y1, 1, "F");
      }
      if (monthlyChartData.length > 0) {
        const lastIndex = monthlyChartData.length - 1;
        const x = startX + chartWidth;
        const y = startY + chartHeight - (balances[lastIndex] - minBalance) / range * chartHeight;
        doc.circle(x, y, 1, "F");
      }
      monthlyChartData.forEach((data, index) => {
        const x = startX + index / Math.max(1, monthlyChartData.length - 1) * chartWidth;
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.text(data.month, x, startY + chartHeight + 5);
      });
    }
    currentY += 70;
    if (expensesByCategory.length > 0) {
      doc.setFillColor(31, 41, 55);
      doc.rect(10, currentY, 190, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Despesas por Categoria", 15, currentY + 15);
      const total = expensesByCategory.reduce((sum2, cat) => sum2 + cat.total, 0);
      const centerX = 60;
      const centerY = currentY + 45;
      const radius = 25;
      let currentAngle = 0;
      expensesByCategory.forEach((category, index) => {
        const angle = category.total / total * 2 * Math.PI;
        const color = category.color || COLORS[index % COLORS.length];
        const hex = color.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        doc.setFillColor(r, g, b);
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        const points = [];
        points.push([centerX, centerY]);
        for (let a = startAngle; a <= endAngle; a += 0.1) {
          points.push([
            centerX + Math.cos(a) * radius,
            centerY + Math.sin(a) * radius
          ]);
        }
        points.push([
          centerX + Math.cos(endAngle) * radius,
          centerY + Math.sin(endAngle) * radius
        ]);
        for (let i = 1; i < points.length - 1; i++) {
          doc.triangle(
            points[0][0],
            points[0][1],
            points[i][0],
            points[i][1],
            points[i + 1][0],
            points[i + 1][1],
            "F"
          );
        }
        currentAngle += angle;
      });
      let legendY = currentY + 25;
      expensesByCategory.forEach((category, index) => {
        const color = category.color || COLORS[index % COLORS.length];
        const hex = color.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        doc.setFillColor(r, g, b);
        doc.rect(110, legendY - 2, 4, 4, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(
          `${category.name}: R$ ${category.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${category.percentage}%)`,
          117,
          legendY
        );
        legendY += 8;
      });
      currentY += 90;
    }
    doc.setFillColor(31, 41, 55);
    doc.rect(10, currentY, 190, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro", 15, currentY + 15);
    const cardY = currentY + 25;
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.text("Total de Receitas", 15, cardY);
    doc.setTextColor(74, 222, 128);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 15, cardY + 10);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Total de Despesas", 75, cardY);
    doc.setTextColor(248, 113, 113);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 75, cardY + 10);
    const saldoAtual = Number(wallet.saldo_atual);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Saldo Atual", 135, cardY);
    doc.setTextColor(saldoAtual >= 0 ? 59 : 248, saldoAtual >= 0 ? 130 : 113, saldoAtual >= 0 ? 246 : 113);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 135, cardY + 10);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Relat\xF3rio gerado em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} \u2022 FinanceHub`, 105, 285, { align: "center" });
    doc.text("P\xE1gina 1 de 1", 190, 285, { align: "right" });
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.getTime().toString();
    const hash = Buffer.from(`${req.user.id}-${timeStr}`).toString("base64").substring(0, 8);
    const filename = `relatorio-financeiro-${dateStr}-${hash}.pdf`;
    const filepath = path5.join(process.cwd(), "public", "reports", filename);
    const reportsDir = path5.dirname(filepath);
    if (!fs5.existsSync(reportsDir)) {
      fs5.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfBuffer = doc.output("arraybuffer");
    fs5.writeFileSync(filepath, Buffer.from(pdfBuffer));
    console.log(`PDF Generation: Arquivo PDF salvo em ${filepath}`);
    const downloadUrl = `/api/reports/download/${filename}`;
    res.status(200).json({
      success: true,
      downloadUrl,
      filename,
      message: "Relat\xF3rio PDF gerado com sucesso."
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Erro ao gerar PDF do relat\xF3rio" });
  }
}
async function downloadReportPDF(req, res) {
  try {
    const { filename } = req.params;
    const filepath = path5.join(process.cwd(), "public", "reports", filename);
    if (!fs5.existsSync(filepath)) {
      return res.status(404).json({ message: "Arquivo n\xE3o encontrado" });
    }
    const isHtml = filename.endsWith(".html");
    if (isHtml) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    } else {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
    res.sendFile(filepath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: "Erro ao fazer download do arquivo" });
  }
}
var init_pdf_controller = __esm({
  "server/controllers/pdf.controller.ts"() {
    "use strict";
    init_storage();
  }
});

// server/index.ts
import { readFileSync, existsSync as existsSync2, mkdirSync as mkdirSync2, chmodSync } from "fs";
import { join as join2, resolve } from "path";
import express3 from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// server/routes.ts
import { createServer } from "http";

// server/middleware/auth.middleware.ts
init_storage();
async function auth(req, res, next) {
  try {
    const session2 = req.session;
    if (session2.isImpersonating && session2.user) {
      const impersonatedUser = await storage.getUserById(session2.user.id);
      if (!impersonatedUser) {
        session2.isImpersonating = false;
        delete session2.user;
        delete session2.originalAdmin;
        return res.status(401).json({ error: "Usu\xE1rio impersonificado n\xE3o encontrado" });
      }
      req.user = impersonatedUser;
      return next();
    }
    const userId = session2.userId;
    if (!userId) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const user = await storage.getUserById(userId);
    if (!user) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
      return res.status(401).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Erro de autentica\xE7\xE3o" });
  }
}

// server/middleware/apiKey.middleware.ts
init_storage();
async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers.apikey;
    if (!apiKey) {
      return res.status(401).json({ error: "Token de API ausente" });
    }
    const token = await storage.getApiTokenByToken(apiKey);
    if (!token) {
      return res.status(401).json({ error: "Token de API inv\xE1lido" });
    }
    if (!token.ativo) {
      return res.status(401).json({ error: "Token de API inativo" });
    }
    if (token.data_expiracao && new Date(token.data_expiracao) < /* @__PURE__ */ new Date()) {
      return res.status(401).json({ error: "Token de API expirado" });
    }
    const user = await storage.getUserById(token.usuario_id);
    if (!user) {
      return res.status(401).json({ error: "Usu\xE1rio associado ao token n\xE3o encontrado" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("API Key auth error:", error);
    res.status(500).json({ error: "Erro de autentica\xE7\xE3o" });
  }
}

// server/middleware/combinedAuth.middleware.ts
async function combinedAuth(req, res, next) {
  if (req.headers.apikey) {
    return apiKeyAuth(req, res, next);
  }
  return auth(req, res, next);
}

// server/middleware/adminAuth.middleware.ts
init_storage();
async function requireSuperAdmin(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userToCheck = req.originalUser || req.user;
    if (userToCheck.tipo_usuario !== "super_admin") {
      console.log(`=== ACESSO NEGADO - SUPER ADMIN REQUERIDO ===`);
      console.log(`Usu\xE1rio: ${userToCheck.email} (${userToCheck.tipo_usuario})`);
      console.log(`Endpoint: ${req.method} ${req.originalUrl}`);
      console.log(`==========================================`);
      return res.status(403).json({
        error: "Acesso negado",
        message: "Apenas super administradores podem acessar este recurso"
      });
    }
    console.log(`=== ACESSO AUTORIZADO - SUPER ADMIN ===`);
    console.log(`Super Admin: ${userToCheck.email}`);
    if (req.isImpersonating) {
      console.log(`Personificando: ${req.user.email}`);
    }
    console.log(`Endpoint: ${req.method} ${req.originalUrl}`);
    console.log(`====================================`);
    next();
  } catch (error) {
    console.error("Erro no middleware requireSuperAdmin:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
async function checkImpersonation(req, res, next) {
  try {
    if (!req.user) {
      return next();
    }
    const activeSession = await storage.getActiveImpersonationSession(req.user.id);
    if (activeSession) {
      const originalUser = await storage.getUserById(activeSession.super_admin_id);
      if (originalUser && originalUser.tipo_usuario === "super_admin") {
        req.originalUser = {
          id: originalUser.id,
          tipo_usuario: originalUser.tipo_usuario,
          nome: originalUser.nome,
          email: originalUser.email
        };
        req.isImpersonating = true;
        req.impersonationContext = {
          originalAdmin: originalUser,
          impersonatedUser: req.user
        };
        console.log(`=== SESS\xC3O DE PERSONIFICA\xC7\xC3O ATIVA ===`);
        console.log(`Super Admin Original: ${originalUser.email}`);
        console.log(`Usu\xE1rio Personificado: ${req.user.email}`);
        console.log(`===================================`);
      }
    }
    next();
  } catch (error) {
    console.error("Erro no middleware checkImpersonation:", error);
    next();
  }
}

// server/swagger.ts
import swaggerUi from "swagger-ui-express";
var swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "XPIRIA - API Completa de Controle Financeiro",
    version: "2.0.0",
    description: "API completa para gerenciamento de finan\xE7as pessoais com suporte a transa\xE7\xF5es, categorias, m\xE9todos de pagamento, relat\xF3rios, gr\xE1ficos e administra\xE7\xE3o",
    contact: {
      name: "Suporte XPIRIA",
      email: "support@xpiria.com"
    }
  },
  servers: [
    {
      url: "/",
      description: "Servidor de desenvolvimento"
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
        description: "Autentica\xE7\xE3o via cookie de sess\xE3o (para aplica\xE7\xE3o web)"
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "apikey",
        description: "Token de acesso \xE0 API (para integra\xE7\xF5es externas)"
      }
    },
    schemas: {
      // === SCHEMAS DE USUÁRIO ===
      Usuario: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID do usu\xE1rio" },
          email: { type: "string", format: "email", description: "Email do usu\xE1rio" },
          nome: { type: "string", description: "Nome do usu\xE1rio" },
          tipo: { type: "string", enum: ["usuario", "admin", "super_admin"], description: "Tipo de usu\xE1rio" },
          ativo: { type: "boolean", description: "Se o usu\xE1rio est\xE1 ativo" },
          data_criacao: { type: "string", format: "date-time", description: "Data de cria\xE7\xE3o" }
        }
      },
      NovoUsuario: {
        type: "object",
        required: ["email", "senha", "nome"],
        properties: {
          email: { type: "string", format: "email", description: "Email do usu\xE1rio" },
          senha: { type: "string", minLength: 6, description: "Senha do usu\xE1rio" },
          nome: { type: "string", description: "Nome do usu\xE1rio" }
        }
      },
      Login: {
        type: "object",
        required: ["email", "senha"],
        properties: {
          email: { type: "string", format: "email", description: "Email do usu\xE1rio" },
          senha: { type: "string", description: "Senha do usu\xE1rio" }
        }
      },
      // === SCHEMAS DE CARTEIRA ===
      Carteira: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da carteira" },
          nome: { type: "string", description: "Nome da carteira" },
          descricao: { type: "string", description: "Descri\xE7\xE3o da carteira" },
          saldo_atual: { type: "number", format: "decimal", description: "Saldo atual" },
          usuario_id: { type: "integer", description: "ID do usu\xE1rio propriet\xE1rio" }
        }
      },
      // === SCHEMAS DE CATEGORIA ===
      Categoria: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da categoria" },
          nome: { type: "string", description: "Nome da categoria" },
          descricao: { type: "string", description: "Descri\xE7\xE3o da categoria" },
          icone: { type: "string", description: "\xCDcone da categoria" },
          cor: { type: "string", description: "Cor da categoria" },
          global: { type: "boolean", description: "Se \xE9 uma categoria global" },
          ativo: { type: "boolean", description: "Se a categoria est\xE1 ativa" }
        }
      },
      NovaCategoria: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string", description: "Nome da categoria" },
          descricao: { type: "string", description: "Descri\xE7\xE3o da categoria" },
          icone: { type: "string", description: "\xCDcone da categoria" },
          cor: { type: "string", description: "Cor da categoria em hexadecimal" }
        }
      },
      // === SCHEMAS DE TOKEN API ===
      ApiToken: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID do token" },
          nome: { type: "string", description: "Nome do token" },
          token_hash: { type: "string", description: "Hash do token" },
          ativo: { type: "boolean", description: "Se o token est\xE1 ativo" },
          data_criacao: { type: "string", format: "date-time", description: "Data de cria\xE7\xE3o" },
          ultimo_uso: { type: "string", format: "date-time", description: "Data do \xFAltimo uso" }
        }
      },
      NovoApiToken: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string", description: "Nome do token" }
        }
      },
      // === SCHEMAS DE LEMBRETE ===
      Lembrete: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID do lembrete" },
          titulo: { type: "string", description: "T\xEDtulo do lembrete" },
          descricao: { type: "string", description: "Descri\xE7\xE3o do lembrete" },
          data_vencimento: { type: "string", format: "date", description: "Data de vencimento" },
          valor: { type: "number", format: "decimal", description: "Valor do lembrete" },
          status: { type: "string", enum: ["Pendente", "Concluido", "Cancelado"], description: "Status do lembrete" },
          recorrencia: { type: "string", enum: ["Nenhuma", "Diaria", "Semanal", "Mensal", "Anual"], description: "Tipo de recorr\xEAncia" }
        }
      },
      NovoLembrete: {
        type: "object",
        required: ["titulo", "data_vencimento"],
        properties: {
          titulo: { type: "string", description: "T\xEDtulo do lembrete" },
          descricao: { type: "string", description: "Descri\xE7\xE3o do lembrete" },
          data_vencimento: { type: "string", format: "date", description: "Data de vencimento" },
          valor: { type: "number", format: "decimal", description: "Valor do lembrete" },
          recorrencia: { type: "string", enum: ["Nenhuma", "Diaria", "Semanal", "Mensal", "Anual"], default: "Nenhuma", description: "Tipo de recorr\xEAncia" }
        }
      },
      MetodoPagamento: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "ID do m\xE9todo de pagamento"
          },
          nome: {
            type: "string",
            description: "Nome do m\xE9todo de pagamento"
          },
          descricao: {
            type: "string",
            description: "Descri\xE7\xE3o do m\xE9todo"
          },
          icone: {
            type: "string",
            description: "\xCDcone do m\xE9todo"
          },
          cor: {
            type: "string",
            description: "Cor associada ao m\xE9todo"
          },
          global: {
            type: "boolean",
            description: "Se \xE9 um m\xE9todo global (dispon\xEDvel para todos)"
          },
          ativo: {
            type: "boolean",
            description: "Se o m\xE9todo est\xE1 ativo"
          }
        },
        example: {
          id: 1,
          nome: "PIX",
          descricao: "Transfer\xEAncias instant\xE2neas via PIX",
          icone: "Smartphone",
          cor: "#10B981",
          global: true,
          ativo: true
        }
      },
      NovaTransacao: {
        type: "object",
        required: ["descricao", "valor", "tipo", "categoria_id", "data_transacao"],
        properties: {
          descricao: {
            type: "string",
            description: "Descri\xE7\xE3o da transa\xE7\xE3o (obrigat\xF3rio)",
            example: "Almo\xE7o no restaurante"
          },
          valor: {
            type: "number",
            format: "decimal",
            description: "Valor da transa\xE7\xE3o (obrigat\xF3rio)",
            example: 45.9
          },
          tipo: {
            type: "string",
            enum: ["Despesa", "Receita"],
            description: "Tipo da transa\xE7\xE3o (obrigat\xF3rio)",
            example: "Despesa"
          },
          categoria_id: {
            type: "integer",
            description: "ID da categoria (obrigat\xF3rio)",
            example: 3
          },
          forma_pagamento_id: {
            type: "integer",
            description: "ID do m\xE9todo de pagamento (OPCIONAL)\n\nSe n\xE3o informado ou 0, ser\xE1 automaticamente atribu\xEDdo PIX (ID: 1)\n\nM\xE9todos dispon\xEDveis:\n- PIX: 1 (padr\xE3o)\n- Cart\xE3o de Cr\xE9dito: 2\n- Dinheiro: 3\n- Cart\xE3o de D\xE9bito: 4\n- Transfer\xEAncia: 5\n- Boleto: 6",
            example: 1
          },
          data_transacao: {
            type: "string",
            format: "date",
            description: "Data da transa\xE7\xE3o no formato YYYY-MM-DD (obrigat\xF3rio)",
            example: "2025-01-15"
          },
          status: {
            type: "string",
            enum: ["Efetivada", "Pendente", "Agendada", "Cancelada"],
            default: "Efetivada",
            description: "Status da transa\xE7\xE3o (OPCIONAL - padr\xE3o: Efetivada)",
            example: "Efetivada"
          },
          carteira_id: {
            type: "integer",
            description: "ID da carteira (OPCIONAL)\n\nSe n\xE3o informado, ser\xE1 automaticamente atribu\xEDda a carteira do usu\xE1rio logado",
            example: 1
          }
        },
        example: {
          descricao: "Almo\xE7o Executivo",
          valor: 45.9,
          tipo: "Despesa",
          categoria_id: 3,
          forma_pagamento_id: 1,
          data_transacao: "2025-01-15",
          status: "Efetivada",
          carteira_id: 1
        }
      },
      Transacao: {
        type: "object",
        properties: {
          id: { type: "integer", description: "ID da transa\xE7\xE3o" },
          descricao: { type: "string", description: "Descri\xE7\xE3o da transa\xE7\xE3o" },
          valor: { type: "number", format: "decimal", description: "Valor da transa\xE7\xE3o" },
          tipo: { type: "string", enum: ["Despesa", "Receita"], description: "Tipo da transa\xE7\xE3o" },
          categoria_id: { type: "integer", description: "ID da categoria" },
          forma_pagamento_id: { type: "integer", description: "ID do m\xE9todo de pagamento" },
          data_transacao: { type: "string", format: "date", description: "Data da transa\xE7\xE3o" },
          status: { type: "string", enum: ["Efetivada", "Pendente", "Agendada", "Cancelada"] },
          carteira_id: { type: "integer", description: "ID da carteira" },
          data_registro: { type: "string", format: "date-time", description: "Data de registro" }
        }
      }
    }
  },
  paths: {
    // === AUTENTICAÇÃO ===
    "/api/auth/register": {
      post: {
        summary: "Registrar novo usu\xE1rio",
        tags: ["Autentica\xE7\xE3o"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovoUsuario" }
            }
          }
        },
        responses: {
          "201": {
            description: "Usu\xE1rio criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos ou email j\xE1 existe" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        summary: "Fazer login",
        tags: ["Autentica\xE7\xE3o"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/Usuario" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": { description: "Credenciais inv\xE1lidas" }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        summary: "Fazer logout",
        tags: ["Autentica\xE7\xE3o"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Logout realizado com sucesso" }
        }
      }
    },
    "/api/auth/verify": {
      get: {
        summary: "Verificar autentica\xE7\xE3o",
        tags: ["Autentica\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Usu\xE1rio autenticado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    // === USUÁRIOS ===
    "/api/users/profile": {
      get: {
        summary: "Obter perfil do usu\xE1rio",
        tags: ["Usu\xE1rios"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Perfil do usu\xE1rio",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      put: {
        summary: "Atualizar perfil do usu\xE1rio",
        tags: ["Usu\xE1rios"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome do usu\xE1rio" },
                  email: { type: "string", format: "email", description: "Email do usu\xE1rio" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Perfil atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/users/password": {
      put: {
        summary: "Alterar senha do usu\xE1rio",
        tags: ["Usu\xE1rios"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["senhaAtual", "novaSenha"],
                properties: {
                  senhaAtual: { type: "string", description: "Senha atual" },
                  novaSenha: { type: "string", minLength: 6, description: "Nova senha" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Senha alterada com sucesso" },
          "400": { description: "Senha atual incorreta ou nova senha inv\xE1lida" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    // === CARTEIRAS ===
    "/api/wallet/current": {
      get: {
        summary: "Obter carteira atual do usu\xE1rio",
        tags: ["Carteiras"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Carteira atual",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Carteira" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      put: {
        summary: "Atualizar carteira atual",
        tags: ["Carteiras"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome da carteira" },
                  descricao: { type: "string", description: "Descri\xE7\xE3o da carteira" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Carteira atualizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Carteira" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    // === CATEGORIAS ===
    "/api/categories": {
      get: {
        summary: "Obter todas as categorias do usu\xE1rio",
        tags: ["Categorias"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de categorias",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Categoria" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      post: {
        summary: "Criar nova categoria",
        tags: ["Categorias"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovaCategoria" }
            }
          }
        },
        responses: {
          "201": {
            description: "Categoria criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Categoria" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos ou nome j\xE1 existe" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/categories/{id}": {
      get: {
        summary: "Obter categoria espec\xEDfica",
        tags: ["Categorias"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID da categoria"
          }
        ],
        responses: {
          "200": {
            description: "Dados da categoria",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Categoria" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Categoria n\xE3o encontrada" }
        }
      },
      put: {
        summary: "Atualizar categoria",
        tags: ["Categorias"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID da categoria"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovaCategoria" }
            }
          }
        },
        responses: {
          "200": {
            description: "Categoria atualizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Categoria" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Sem permiss\xE3o para editar categoria global" },
          "404": { description: "Categoria n\xE3o encontrada" }
        }
      },
      delete: {
        summary: "Excluir categoria",
        tags: ["Categorias"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID da categoria"
          }
        ],
        responses: {
          "200": { description: "Categoria exclu\xEDda com sucesso" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Sem permiss\xE3o para excluir categoria global" },
          "404": { description: "Categoria n\xE3o encontrada" }
        }
      }
    },
    // === TOKENS DE API ===
    "/api/tokens": {
      get: {
        summary: "Obter tokens de API do usu\xE1rio",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Lista de tokens",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ApiToken" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      post: {
        summary: "Criar novo token de API",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovoApiToken" }
            }
          }
        },
        responses: {
          "201": {
            description: "Token criado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Token de acesso (mostrado apenas uma vez)" },
                    tokenData: { $ref: "#/components/schemas/ApiToken" }
                  }
                }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/tokens/{id}": {
      get: {
        summary: "Obter token espec\xEDfico",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do token"
          }
        ],
        responses: {
          "200": {
            description: "Dados do token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiToken" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Token n\xE3o encontrado" }
        }
      },
      put: {
        summary: "Atualizar token",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do token"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome do token" },
                  ativo: { type: "boolean", description: "Se o token est\xE1 ativo" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Token atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiToken" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Token n\xE3o encontrado" }
        }
      },
      delete: {
        summary: "Excluir token",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do token"
          }
        ],
        responses: {
          "200": { description: "Token exclu\xEDdo com sucesso" },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Token n\xE3o encontrado" }
        }
      }
    },
    "/api/tokens/{id}/rotate": {
      post: {
        summary: "Regenerar token",
        tags: ["Tokens de API"],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do token"
          }
        ],
        responses: {
          "200": {
            description: "Token regenerado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Novo token de acesso" },
                    tokenData: { $ref: "#/components/schemas/ApiToken" }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Token n\xE3o encontrado" }
        }
      }
    },
    // === LEMBRETES ===
    "/api/reminders": {
      get: {
        summary: "Obter lembretes do usu\xE1rio",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de lembretes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Lembrete" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      post: {
        summary: "Criar novo lembrete",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovoLembrete" }
            }
          }
        },
        responses: {
          "201": {
            description: "Lembrete criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Lembrete" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/reminders/{id}": {
      get: {
        summary: "Obter lembrete espec\xEDfico",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do lembrete"
          }
        ],
        responses: {
          "200": {
            description: "Dados do lembrete",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Lembrete" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Lembrete n\xE3o encontrado" }
        }
      },
      put: {
        summary: "Atualizar lembrete",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do lembrete"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovoLembrete" }
            }
          }
        },
        responses: {
          "200": {
            description: "Lembrete atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Lembrete" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Lembrete n\xE3o encontrado" }
        }
      },
      delete: {
        summary: "Excluir lembrete",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do lembrete"
          }
        ],
        responses: {
          "200": { description: "Lembrete exclu\xEDdo com sucesso" },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Lembrete n\xE3o encontrado" }
        }
      },
      patch: {
        summary: "Marcar lembrete como conclu\xEDdo",
        tags: ["Lembretes"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do lembrete"
          }
        ],
        responses: {
          "200": {
            description: "Lembrete marcado como conclu\xEDdo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Lembrete" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Lembrete n\xE3o encontrado" }
        }
      }
    },
    // === RELATÓRIOS ===
    "/api/reports/monthly": {
      get: {
        summary: "Gerar relat\xF3rio mensal",
        tags: ["Relat\xF3rios"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "ano",
            schema: { type: "integer" },
            description: "Ano do relat\xF3rio"
          },
          {
            in: "query",
            name: "mes",
            schema: { type: "integer", minimum: 1, maximum: 12 },
            description: "M\xEAs do relat\xF3rio"
          },
          {
            in: "query",
            name: "formato",
            schema: { type: "string", enum: ["json", "pdf", "excel"] },
            description: "Formato do relat\xF3rio"
          }
        ],
        responses: {
          "200": {
            description: "Relat\xF3rio gerado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    periodo: { type: "string", description: "Per\xEDodo do relat\xF3rio" },
                    totalReceitas: { type: "number", description: "Total de receitas" },
                    totalDespesas: { type: "number", description: "Total de despesas" },
                    saldoFinal: { type: "number", description: "Saldo final do per\xEDodo" },
                    transacoes: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Transacao" }
                    }
                  }
                }
              },
              "application/pdf": {
                schema: { type: "string", format: "binary" }
              },
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/reports/annual": {
      get: {
        summary: "Gerar relat\xF3rio anual",
        tags: ["Relat\xF3rios"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "ano",
            schema: { type: "integer" },
            description: "Ano do relat\xF3rio"
          },
          {
            in: "query",
            name: "formato",
            schema: { type: "string", enum: ["json", "pdf", "excel"] },
            description: "Formato do relat\xF3rio"
          }
        ],
        responses: {
          "200": {
            description: "Relat\xF3rio anual gerado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ano: { type: "integer", description: "Ano do relat\xF3rio" },
                    totalReceitas: { type: "number", description: "Total de receitas" },
                    totalDespesas: { type: "number", description: "Total de despesas" },
                    saldoFinal: { type: "number", description: "Saldo final do ano" },
                    meses: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          mes: { type: "integer" },
                          receitas: { type: "number" },
                          despesas: { type: "number" },
                          saldo: { type: "number" }
                        }
                      }
                    }
                  }
                }
              },
              "application/pdf": {
                schema: { type: "string", format: "binary" }
              },
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/reports/download/{filename}": {
      get: {
        summary: "Download de arquivo de relat\xF3rio",
        tags: ["Relat\xF3rios"],
        parameters: [
          {
            in: "path",
            name: "filename",
            required: true,
            schema: { type: "string" },
            description: "Nome do arquivo"
          }
        ],
        responses: {
          "200": {
            description: "Arquivo de relat\xF3rio",
            content: {
              "application/pdf": {
                schema: { type: "string", format: "binary" }
              },
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          "404": { description: "Arquivo n\xE3o encontrado" }
        }
      }
    },
    // === GRÁFICOS ===
    "/api/charts/bar": {
      get: {
        summary: "Gerar gr\xE1fico de barras SVG",
        tags: ["Gr\xE1ficos"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "periodo",
            schema: { type: "string", enum: ["mensal", "anual"] },
            description: "Per\xEDodo do gr\xE1fico"
          },
          {
            in: "query",
            name: "ano",
            schema: { type: "integer" },
            description: "Ano"
          },
          {
            in: "query",
            name: "mes",
            schema: { type: "integer" },
            description: "M\xEAs"
          }
        ],
        responses: {
          "200": {
            description: "Gr\xE1fico SVG gerado",
            content: {
              "image/svg+xml": {
                schema: { type: "string" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/charts/pizza": {
      get: {
        summary: "Gerar gr\xE1fico de pizza SVG",
        tags: ["Gr\xE1ficos"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "periodo",
            schema: { type: "string", enum: ["mensal", "anual"] },
            description: "Per\xEDodo do gr\xE1fico"
          },
          {
            in: "query",
            name: "ano",
            schema: { type: "integer" },
            description: "Ano"
          },
          {
            in: "query",
            name: "mes",
            schema: { type: "integer" },
            description: "M\xEAs"
          }
        ],
        responses: {
          "200": {
            description: "Gr\xE1fico de pizza SVG gerado",
            content: {
              "image/svg+xml": {
                schema: { type: "string" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/charts/line-evolution": {
      get: {
        summary: "Gerar gr\xE1fico de evolu\xE7\xE3o em linha SVG",
        tags: ["Gr\xE1ficos"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "periodo",
            schema: { type: "string", enum: ["mensal", "anual"] },
            description: "Per\xEDodo do gr\xE1fico"
          },
          {
            in: "query",
            name: "ano",
            schema: { type: "integer" },
            description: "Ano"
          },
          {
            in: "query",
            name: "mes",
            schema: { type: "integer" },
            description: "M\xEAs"
          }
        ],
        responses: {
          "200": {
            description: "Gr\xE1fico de evolu\xE7\xE3o SVG gerado",
            content: {
              "image/svg+xml": {
                schema: { type: "string" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/charts/download/{filename}": {
      get: {
        summary: "Download de arquivo de gr\xE1fico",
        tags: ["Gr\xE1ficos"],
        parameters: [
          {
            in: "path",
            name: "filename",
            required: true,
            schema: { type: "string" },
            description: "Nome do arquivo"
          }
        ],
        responses: {
          "200": {
            description: "Arquivo de gr\xE1fico",
            content: {
              "image/svg+xml": {
                schema: { type: "string" }
              },
              "image/png": {
                schema: { type: "string", format: "binary" }
              }
            }
          },
          "404": { description: "Arquivo n\xE3o encontrado" }
        }
      }
    },
    "/api/transactions": {
      get: {
        summary: "Obt\xE9m todas as transa\xE7\xF5es da carteira atual",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de transa\xE7\xF5es",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Transacao" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      },
      post: {
        summary: "Cria uma nova transa\xE7\xE3o",
        description: "Cria uma nova transa\xE7\xE3o financeira.\n\n**M\xE9todo de Pagamento**: Se `forma_pagamento_id` n\xE3o for informado ou for 0, ser\xE1 automaticamente atribu\xEDdo PIX como padr\xE3o.\n\n**M\xE9todos de Pagamento Globais Dispon\xEDveis**:\n- PIX (ID: 1) - Padr\xE3o\n- Cart\xE3o de Cr\xE9dito (ID: 2)\n- Dinheiro (ID: 3)",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovaTransacao" },
              examples: {
                completo: {
                  summary: "Exemplo com todos os campos",
                  description: "Transa\xE7\xE3o com todos os campos preenchidos (opcionais e obrigat\xF3rios)",
                  value: {
                    descricao: "Almo\xE7o Executivo",
                    valor: 45.9,
                    tipo: "Despesa",
                    categoria_id: 3,
                    forma_pagamento_id: 1,
                    data_transacao: "2025-01-15",
                    status: "Efetivada",
                    carteira_id: 1
                  }
                },
                minimo: {
                  summary: "Exemplo apenas campos obrigat\xF3rios",
                  description: "PIX e carteira do usu\xE1rio ser\xE3o atribu\xEDdos automaticamente",
                  value: {
                    descricao: "Compras no supermercado",
                    valor: 125.5,
                    tipo: "Despesa",
                    categoria_id: 1,
                    data_transacao: "2025-01-15"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Transa\xE7\xE3o criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transacao" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Categoria n\xE3o encontrada" }
        }
      }
    },
    "/api/transactions/recent": {
      get: {
        summary: "Obt\xE9m as transa\xE7\xF5es recentes da carteira atual",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de transa\xE7\xF5es recentes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Transacao" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/transactions/{id}": {
      get: {
        summary: "Obt\xE9m uma transa\xE7\xE3o espec\xEDfica",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            schema: { type: "integer" },
            required: true,
            description: "ID da transa\xE7\xE3o"
          }
        ],
        responses: {
          "200": {
            description: "Dados da transa\xE7\xE3o",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transacao" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "404": { description: "Transa\xE7\xE3o n\xE3o encontrada" },
          "403": { description: "Acesso negado (transa\xE7\xE3o de outra carteira)" }
        }
      },
      put: {
        summary: "Atualiza uma transa\xE7\xE3o",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            schema: { type: "integer" },
            required: true,
            description: "ID da transa\xE7\xE3o"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovaTransacao" },
              examples: {
                atualizacao: {
                  summary: "Atualiza\xE7\xE3o completa da transa\xE7\xE3o",
                  description: "Exemplo de atualiza\xE7\xE3o de uma transa\xE7\xE3o existente",
                  value: {
                    descricao: "Jantar no restaurante - Atualizado",
                    valor: 89.5,
                    tipo: "Despesa",
                    categoria_id: 3,
                    forma_pagamento_id: 2,
                    data_transacao: "2025-01-16",
                    status: "Efetivada",
                    carteira_id: 1
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Transa\xE7\xE3o atualizada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transacao" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Acesso negado (transa\xE7\xE3o de outra carteira)" },
          "404": { description: "Transa\xE7\xE3o n\xE3o encontrada" }
        }
      },
      patch: {
        summary: "Atualiza parcialmente uma transa\xE7\xE3o",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            schema: { type: "integer" },
            required: true,
            description: "ID da transa\xE7\xE3o"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  descricao: { type: "string", description: "Nova descri\xE7\xE3o da transa\xE7\xE3o" },
                  valor: { type: "number", format: "decimal", description: "Novo valor da transa\xE7\xE3o" },
                  tipo: { type: "string", enum: ["Despesa", "Receita"], description: "Novo tipo da transa\xE7\xE3o" },
                  categoria_id: { type: "integer", description: "Novo ID da categoria" },
                  forma_pagamento_id: { type: "integer", description: "Novo ID do m\xE9todo de pagamento" },
                  data_transacao: { type: "string", format: "date", description: "Nova data da transa\xE7\xE3o" },
                  status: { type: "string", enum: ["Efetivada", "Pendente", "Agendada", "Cancelada"], description: "Novo status da transa\xE7\xE3o" }
                }
              },
              examples: {
                mudancaStatus: {
                  summary: "Alterar apenas o status",
                  description: "Exemplo de altera\xE7\xE3o apenas do status da transa\xE7\xE3o",
                  value: {
                    status: "Cancelada"
                  }
                },
                mudancaValor: {
                  summary: "Alterar valor e descri\xE7\xE3o",
                  description: "Exemplo de altera\xE7\xE3o do valor e descri\xE7\xE3o",
                  value: {
                    descricao: "Compra corrigida",
                    valor: 75.3
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Transa\xE7\xE3o atualizada parcialmente com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transacao" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Acesso negado (transa\xE7\xE3o de outra carteira)" },
          "404": { description: "Transa\xE7\xE3o n\xE3o encontrada" }
        }
      },
      delete: {
        summary: "Remove uma transa\xE7\xE3o",
        tags: ["Transa\xE7\xF5es"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            schema: { type: "integer" },
            required: true,
            description: "ID da transa\xE7\xE3o"
          }
        ],
        responses: {
          "200": {
            description: "Transa\xE7\xE3o removida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Transa\xE7\xE3o removida com sucesso" }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Acesso negado (transa\xE7\xE3o de outra carteira)" },
          "404": { description: "Transa\xE7\xE3o n\xE3o encontrada" }
        }
      }
    },
    // === DASHBOARD ===
    "/api/dashboard/summary": {
      get: {
        summary: "Obt\xE9m resumo estat\xEDstico do dashboard",
        description: "Retorna dados consolidados para exibi\xE7\xE3o no dashboard: receitas/despesas por categoria, dados mensais, totais e m\xE9tricas financeiras",
        tags: ["Dashboard"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Dados do dashboard obtidos com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    monthlyData: {
                      type: "array",
                      description: "Dados mensais de receitas e despesas",
                      items: {
                        type: "object",
                        properties: {
                          month: { type: "string", description: "Nome do m\xEAs", example: "Jan" },
                          income: { type: "number", description: "Total de receitas do m\xEAs", example: 5e3 },
                          expenses: { type: "number", description: "Total de despesas do m\xEAs", example: 3200.5 }
                        }
                      }
                    },
                    expensesByCategory: {
                      type: "array",
                      description: "Despesas agrupadas por categoria",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Nome da categoria", example: "Alimenta\xE7\xE3o" },
                          value: { type: "number", description: "Total gasto na categoria", example: 1200.5 },
                          fill: { type: "string", description: "Cor para gr\xE1ficos", example: "#8884d8" }
                        }
                      }
                    },
                    incomeByCategory: {
                      type: "array",
                      description: "Receitas agrupadas por categoria",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Nome da categoria", example: "Sal\xE1rio" },
                          value: { type: "number", description: "Total recebido na categoria", example: 4500 },
                          fill: { type: "string", description: "Cor para gr\xE1ficos", example: "#82ca9d" }
                        }
                      }
                    },
                    totalIncome: {
                      type: "number",
                      description: "Total de receitas no per\xEDodo",
                      example: 5e3
                    },
                    totalExpenses: {
                      type: "number",
                      description: "Total de despesas no per\xEDodo",
                      example: 3200.5
                    },
                    balance: {
                      type: "number",
                      description: "Saldo l\xEDquido (receitas - despesas)",
                      example: 1799.5
                    }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "500": { description: "Erro interno do servidor" }
        }
      }
    },
    "/api/payment-methods": {
      get: {
        summary: "Obter formas de pagamento do usu\xE1rio (globais + personalizadas)",
        tags: ["Formas de Pagamento"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de formas de pagamento",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MetodoPagamento" }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Criar nova forma de pagamento personalizada",
        tags: ["Formas de Pagamento"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nome"],
                properties: {
                  nome: {
                    type: "string",
                    description: "Nome da forma de pagamento (obrigat\xF3rio)",
                    example: "Cart\xE3o Empresa"
                  },
                  descricao: {
                    type: "string",
                    description: "Descri\xE7\xE3o da forma de pagamento (opcional)",
                    example: "Cart\xE3o corporativo da empresa"
                  },
                  icone: {
                    type: "string",
                    description: "\xCDcone da forma de pagamento (opcional)",
                    example: "\u{1F3E2}"
                  },
                  cor: {
                    type: "string",
                    description: "Cor em hexadecimal (opcional)",
                    example: "#2196F3"
                  }
                },
                example: {
                  nome: "Cart\xE3o Empresa",
                  descricao: "Cart\xE3o corporativo da empresa",
                  icone: "\u{1F3E2}",
                  cor: "#2196F3"
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Forma de pagamento criada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MetodoPagamento" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos ou nome j\xE1 existe" },
          "401": { description: "N\xE3o autenticado" }
        }
      }
    },
    "/api/payment-methods/global": {
      get: {
        summary: "Obter m\xE9todos de pagamento globais",
        description: "Lista os m\xE9todos de pagamento globais dispon\xEDveis para todas as transa\xE7\xF5es.\n\n**M\xE9todos Globais Padr\xE3o**:\n- PIX (ID: 1) - Usado como padr\xE3o quando n\xE3o especificado\n- Cart\xE3o de Cr\xE9dito (ID: 2)\n- Dinheiro (ID: 3)",
        tags: ["Formas de Pagamento"],
        responses: {
          "200": {
            description: "Lista de m\xE9todos de pagamento globais",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/MetodoPagamento" }
                },
                example: [
                  {
                    id: 1,
                    nome: "PIX",
                    descricao: "Transfer\xEAncias instant\xE2neas via PIX",
                    icone: "Smartphone",
                    cor: "#10B981",
                    global: true,
                    ativo: true
                  },
                  {
                    id: 2,
                    nome: "Cart\xE3o de Cr\xE9dito",
                    descricao: "Pagamentos realizados com cart\xE3o de cr\xE9dito",
                    icone: "CreditCard",
                    cor: "#3B82F6",
                    global: true,
                    ativo: true
                  }
                ]
              }
            }
          }
        }
      }
    },
    // === SETUP DO SISTEMA ===
    "/api/setup/status": {
      get: {
        summary: "Verificar status do setup",
        tags: ["Setup"],
        responses: {
          "200": {
            description: "Status do setup",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    isSetupComplete: { type: "boolean", description: "Se o setup foi conclu\xEDdo" },
                    dbConnected: { type: "boolean", description: "Se o banco est\xE1 conectado" },
                    hasAdmin: { type: "boolean", description: "Se existe um usu\xE1rio admin" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/setup/test-connection": {
      post: {
        summary: "Testar conex\xE3o com banco de dados",
        tags: ["Setup"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["dbUrl"],
                properties: {
                  dbUrl: { type: "string", description: "URL de conex\xE3o do banco de dados" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Conex\xE3o testada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { description: "Erro na conex\xE3o" }
        }
      }
    },
    "/api/setup/create-admin": {
      post: {
        summary: "Criar usu\xE1rio administrador",
        tags: ["Setup"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "senha", "nome"],
                properties: {
                  email: { type: "string", format: "email", description: "Email do admin" },
                  senha: { type: "string", minLength: 6, description: "Senha do admin" },
                  nome: { type: "string", description: "Nome do admin" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Admin criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" }
        }
      }
    },
    "/api/setup/run": {
      post: {
        summary: "Executar setup completo do sistema",
        tags: ["Setup"],
        responses: {
          "200": {
            description: "Setup executado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "500": { description: "Erro no setup" }
        }
      }
    },
    "/api/setup/finish": {
      post: {
        summary: "Finalizar setup do sistema",
        tags: ["Setup"],
        responses: {
          "200": {
            description: "Setup finalizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    // === ADMINISTRAÇÃO ===
    "/api/admin/stats": {
      get: {
        summary: "Obter estat\xEDsticas do sistema",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Estat\xEDsticas do sistema",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalUsers: { type: "integer", description: "Total de usu\xE1rios" },
                    totalTransactions: { type: "integer", description: "Total de transa\xE7\xF5es" },
                    totalWallets: { type: "integer", description: "Total de carteiras" },
                    systemUptime: { type: "string", description: "Tempo de atividade do sistema" }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      }
    },
    "/api/admin/users": {
      get: {
        summary: "Listar todos os usu\xE1rios (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de usu\xE1rios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Usuario" }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      },
      post: {
        summary: "Criar novo usu\xE1rio (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NovoUsuario" }
            }
          }
        },
        responses: {
          "201": {
            description: "Usu\xE1rio criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      }
    },
    "/api/admin/users/{id}": {
      get: {
        summary: "Obter usu\xE1rio espec\xEDfico (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do usu\xE1rio"
          }
        ],
        responses: {
          "200": {
            description: "Dados do usu\xE1rio",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Usu\xE1rio n\xE3o encontrado" }
        }
      },
      put: {
        summary: "Atualizar usu\xE1rio (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do usu\xE1rio"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Nome do usu\xE1rio" },
                  email: { type: "string", format: "email", description: "Email do usu\xE1rio" },
                  tipo: { type: "string", enum: ["usuario", "admin", "super_admin"], description: "Tipo do usu\xE1rio" },
                  ativo: { type: "boolean", description: "Se o usu\xE1rio est\xE1 ativo" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Usu\xE1rio atualizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Usu\xE1rio n\xE3o encontrado" }
        }
      },
      delete: {
        summary: "Excluir usu\xE1rio (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "ID do usu\xE1rio"
          }
        ],
        responses: {
          "200": { description: "Usu\xE1rio exclu\xEDdo com sucesso" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Usu\xE1rio n\xE3o encontrado" }
        }
      }
    },
    "/api/admin/impersonate": {
      post: {
        summary: "Personificar usu\xE1rio (admin)",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "integer", description: "ID do usu\xE1rio a ser personificado" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Personifica\xE7\xE3o iniciada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    impersonatedUser: { $ref: "#/components/schemas/Usuario" }
                  }
                }
              }
            }
          },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Usu\xE1rio n\xE3o encontrado" }
        }
      }
    },
    "/api/admin/stop-impersonation": {
      post: {
        summary: "Parar personifica\xE7\xE3o",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Personifica\xE7\xE3o finalizada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      }
    },
    "/api/admin/logo": {
      post: {
        summary: "Upload de logo da empresa",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  logo: { type: "string", format: "binary", description: "Arquivo de logo" },
                  favicon: { type: "string", format: "binary", description: "Arquivo de favicon" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Logo atualizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    logoPath: { type: "string" },
                    faviconPath: { type: "string" }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      },
      delete: {
        summary: "Remover logo da empresa",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": { description: "Logo removido com sucesso" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      }
    },
    "/api/logo": {
      get: {
        summary: "Obter logo atual da empresa",
        tags: ["Administra\xE7\xE3o"],
        responses: {
          "200": {
            description: "Logo da empresa",
            content: {
              "image/png": { schema: { type: "string", format: "binary" } },
              "image/jpeg": { schema: { type: "string", format: "binary" } },
              "image/svg+xml": { schema: { type: "string" } }
            }
          },
          "404": { description: "Logo n\xE3o encontrado" }
        }
      }
    },
    "/api/admin/welcome-messages": {
      get: {
        summary: "Obter mensagens de boas-vindas",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Lista de mensagens de boas-vindas",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      tipo: { type: "string" },
                      titulo: { type: "string" },
                      mensagem: { type: "string" },
                      ativo: { type: "boolean" }
                    }
                  }
                }
              }
            }
          },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      },
      post: {
        summary: "Criar nova mensagem de boas-vindas",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tipo", "titulo", "mensagem"],
                properties: {
                  tipo: { type: "string", description: "Tipo da mensagem" },
                  titulo: { type: "string", description: "T\xEDtulo da mensagem" },
                  mensagem: { type: "string", description: "Conte\xFAdo da mensagem" },
                  ativo: { type: "boolean", default: true, description: "Se a mensagem est\xE1 ativa" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Mensagem criada com sucesso" },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" }
        }
      }
    },
    "/api/admin/welcome-messages/{type}": {
      get: {
        summary: "Obter mensagem de boas-vindas por tipo",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "type",
            required: true,
            schema: { type: "string" },
            description: "Tipo da mensagem"
          }
        ],
        responses: {
          "200": { description: "Mensagem encontrada" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Mensagem n\xE3o encontrada" }
        }
      },
      put: {
        summary: "Atualizar mensagem de boas-vindas",
        tags: ["Administra\xE7\xE3o"],
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "type",
            required: true,
            schema: { type: "string" },
            description: "Tipo da mensagem"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  mensagem: { type: "string" },
                  ativo: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Mensagem atualizada com sucesso" },
          "400": { description: "Dados inv\xE1lidos" },
          "401": { description: "N\xE3o autenticado" },
          "403": { description: "Permiss\xE3o negada" },
          "404": { description: "Mensagem n\xE3o encontrada" }
        }
      }
    },
    // === OUTROS ENDPOINTS ===
    "/api/api-guide": {
      get: {
        summary: "Obter guia da API",
        tags: ["Documenta\xE7\xE3o"],
        responses: {
          "200": {
            description: "Guia de uso da API",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    version: { type: "string" },
                    endpoints: { type: "array", items: { type: "object" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/changelog": {
      get: {
        summary: "Obter changelog do sistema",
        tags: ["Documenta\xE7\xE3o"],
        responses: {
          "200": {
            description: "Changelog do sistema",
            content: {
              "text/plain": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};
function setupSwagger(app2) {
  app2.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app2.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerDocument);
  });
  console.log("Documenta\xE7\xE3o Swagger dispon\xEDvel em /docs");
  console.log("JSON do Swagger dispon\xEDvel em /docs.json");
}

// server/websocket.ts
init_storage();
import { WebSocket, WebSocketServer } from "ws";
import { parse } from "url";
var activeConnections = /* @__PURE__ */ new Map();
var wss = null;
var validateUserSession = async (req) => {
  try {
    const parsedUrl = parse(req.url || "", true);
    const { token } = parsedUrl.query;
    if (!token) {
      return { user: null, isValid: false, error: "Token n\xE3o fornecido" };
    }
    const userId = parseInt(token);
    console.log("[WebSocket] Validando sess\xE3o diretamente para userId:", userId);
    if (isNaN(userId)) {
      return { user: null, isValid: false, error: "User ID inv\xE1lido" };
    }
    const user = await storage.getUserById(userId);
    if (!user) {
      console.log("[WebSocket] Usu\xE1rio n\xE3o encontrado no banco:", userId);
      return { user: null, isValid: false, error: "Usu\xE1rio n\xE3o encontrado" };
    }
    console.log("[WebSocket] \u2705 Sess\xE3o v\xE1lida para usu\xE1rio:", user.nome, `(${user.tipo_usuario})`);
    console.log("[WebSocket] User ID:", user.id);
    return { user, isValid: true };
  } catch (error) {
    console.error("[WebSocket] Erro na valida\xE7\xE3o da sess\xE3o:", error);
    return { user: null, isValid: false, error: "Erro interno na valida\xE7\xE3o" };
  }
};
var initializeWebSocketServer = (server) => {
  wss = new WebSocketServer({
    server,
    path: "/ws",
    clientTracking: true
  });
  wss.on("connection", async (ws, req) => {
    console.log("[WebSocket] Nova conex\xE3o recebida");
    const { user, isValid, error } = await validateUserSession(req);
    if (!isValid || !user) {
      console.log(`[WebSocket] \u274C Conex\xE3o rejeitada - ${error}`);
      ws.close(1008, `Acesso negado: ${error}`);
      return;
    }
    console.log(`[WebSocket] \u2705 Usu\xE1rio autenticado: ${user.nome} (${user.tipo_usuario})`);
    const connection = {
      ws,
      userId: user.id.toString(),
      userRole: user.tipo_usuario,
      userName: user.nome,
      connectedAt: /* @__PURE__ */ new Date(),
      lastPing: /* @__PURE__ */ new Date()
    };
    activeConnections.set(user.id.toString(), connection);
    console.log(`[WebSocket] Usu\xE1rio conectado: ${user.nome} (${user.tipo_usuario}) - Total: ${activeConnections.size}`);
    ws.send(JSON.stringify({
      type: "connection_established",
      message: "Conectado ao sistema de notifica\xE7\xF5es",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      connectionId: user.id.toString()
    }));
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(connection, message);
      } catch (error2) {
        console.error("[WebSocket] Erro ao processar mensagem:", error2);
      }
    });
    ws.on("pong", () => {
      connection.lastPing = /* @__PURE__ */ new Date();
    });
    ws.on("close", (code, reason) => {
      console.log(`[WebSocket] Usu\xE1rio desconectado: ${user.nome} (${code}: ${reason})`);
      activeConnections.delete(user.id.toString());
    });
    ws.on("error", (error2) => {
      console.error(`[WebSocket] Erro na conex\xE3o de ${user.nome}:`, error2);
      activeConnections.delete(user.id.toString());
    });
  });
  const pingInterval = setInterval(() => {
    const now = /* @__PURE__ */ new Date();
    const timeout = 3e4;
    activeConnections.forEach((connection, userId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        if (now.getTime() - connection.lastPing.getTime() > timeout) {
          console.log(`[WebSocket] Timeout para usu\xE1rio ${connection.userName}`);
          connection.ws.terminate();
          activeConnections.delete(userId);
        } else {
          connection.ws.ping();
        }
      } else {
        activeConnections.delete(userId);
      }
    });
  }, 15e3);
  wss.on("close", () => {
    clearInterval(pingInterval);
  });
  console.log("[WebSocket] Servidor WebSocket inicializado na rota /ws");
};
var handleWebSocketMessage = (connection, message) => {
  switch (message.type) {
    case "ping":
      connection.ws.send(JSON.stringify({
        type: "pong",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }));
      break;
    case "notification_read":
      console.log(`[WebSocket] Notifica\xE7\xE3o ${message.notificationId} marcada como lida por ${connection.userName}`);
      break;
    default:
      console.log(`[WebSocket] Mensagem n\xE3o reconhecida de ${connection.userName}:`, message.type);
  }
};
var broadcastNotification = (notification, targetUserIds = []) => {
  console.log("[WebSocket] \u{1F680} IN\xCDCIO broadcastNotification - vers\xE3o com corre\xE7\xE3o");
  console.log("[WebSocket] broadcastNotification chamada com:", {
    notificationId: notification.id,
    targetUserIds,
    activeConnections: activeConnections.size
  });
  console.log("[WebSocket] \u{1F50D} Listando conex\xF5es ativas:");
  if (activeConnections.size === 0) {
    console.log("[WebSocket] \u274C NENHUMA CONEX\xC3O ATIVA!");
  } else {
    activeConnections.forEach((connection, userId) => {
      console.log(`[WebSocket]   - UserId: "${userId}" (${typeof userId}) -> ${connection.userName} (${connection.userRole})`);
    });
  }
  if (!wss) {
    console.error("[WebSocket] Servidor WebSocket n\xE3o inicializado");
    return false;
  }
  let sentCount = 0;
  if (targetUserIds.length === 0) {
    console.log("[WebSocket] Enviando para todos os usu\xE1rios conectados");
    activeConnections.forEach((connection) => {
      console.log(`[WebSocket] Verificando conex\xE3o: ${connection.userName} (${connection.userRole})`);
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          console.log(`[WebSocket] Enviando notifica\xE7\xE3o para ${connection.userName}`);
          connection.ws.send(JSON.stringify({
            type: "notification",
            data: notification
          }));
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Erro ao enviar para ${connection.userName}:`, error);
        }
      }
    });
  } else {
    console.log("[WebSocket] Enviando para usu\xE1rios espec\xEDficos:", targetUserIds);
    targetUserIds.forEach((userId) => {
      const userIdString = userId.toString();
      const connection = activeConnections.get(userIdString);
      console.log(`[WebSocket] Procurando usu\xE1rio ${userId} (como string: ${userIdString}):`, connection ? "encontrado" : "n\xE3o encontrado");
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          console.log(`[WebSocket] Enviando notifica\xE7\xE3o para usu\xE1rio ${userIdString} (${connection.userName})`);
          connection.ws.send(JSON.stringify({
            type: "notification",
            data: notification
          }));
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Erro ao enviar para usu\xE1rio ${userIdString}:`, error);
        }
      }
    });
  }
  console.log(`[WebSocket] Notifica\xE7\xE3o enviada para ${sentCount} conex\xF5es ativas`);
  return sentCount > 0;
};

// server/controllers/waha-session-webhooks.controller.ts
import postgres2 from "postgres";
var getClient = () => postgres2(process.env.DATABASE_URL || "", { prepare: false });
var generateSessionWebhookHash = async (sessionName) => {
  const crypto = await import("crypto");
  const data = `${sessionName}_${Date.now()}_${Math.random()}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  const base = hash.substring(0, 8);
  let result = "";
  for (let i = 0; i < 5; i++) {
    const char = base[i];
    if (i % 3 === 0) {
      result += char.toUpperCase();
    } else if (i % 3 === 1) {
      result += char.toLowerCase();
    } else {
      const num = parseInt(char, 16) % 10;
      result += num.toString();
    }
  }
  return result;
};
var generateSessionWebhookUrl = (hash) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/api/waha/webhook/${hash}`;
};
var ensureSessionWebhookTable = async (client2) => {
  try {
    const tableExists = await client2`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'waha_session_webhooks'
    `;
    if (tableExists.length === 0) {
      console.log("[WAHA Session Webhooks] Criando tabela waha_session_webhooks...");
      await client2`
        CREATE TABLE waha_session_webhooks (
          id SERIAL PRIMARY KEY,
          session_name VARCHAR(255) NOT NULL UNIQUE,
          webhook_hash VARCHAR(10) NOT NULL UNIQUE,
          webhook_url TEXT NOT NULL,
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log("[WAHA Session Webhooks] \u2705 Tabela waha_session_webhooks criada com sucesso");
    }
  } catch (error) {
    console.error("[WAHA Session Webhooks] Erro ao verificar/criar tabela:", error);
  }
};
var WahaSessionWebhooksController = class {
  /**
   * Obter webhook para uma sessão específica
   */
  static async getSessionWebhook(req, res) {
    const client2 = getClient();
    try {
      const { sessionName } = req.params;
      if (!sessionName) {
        return res.status(400).json({
          success: false,
          message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
        });
      }
      await ensureSessionWebhookTable(client2);
      let webhook = await client2`
        SELECT * FROM waha_session_webhooks 
        WHERE session_name = ${sessionName}
        LIMIT 1
      `;
      if (webhook.length === 0) {
        const webhookHash = await generateSessionWebhookHash(sessionName);
        const webhookUrl = generateSessionWebhookUrl(webhookHash);
        webhook = await client2`
          INSERT INTO waha_session_webhooks (
            session_name, webhook_hash, webhook_url, enabled
          ) VALUES (
            ${sessionName}, ${webhookHash}, ${webhookUrl}, true
          )
          RETURNING *
        `;
      }
      res.json({
        success: true,
        data: webhook[0]
      });
    } catch (error) {
      console.error("Erro ao obter webhook da sess\xE3o:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      await client2.end();
    }
  }
  /**
   * Regenerar hash do webhook para uma sessão
   */
  static async regenerateSessionWebhook(req, res) {
    const client2 = getClient();
    try {
      const { sessionName } = req.params;
      if (!sessionName) {
        return res.status(400).json({
          success: false,
          message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
        });
      }
      await ensureSessionWebhookTable(client2);
      const webhookHash = await generateSessionWebhookHash(sessionName);
      const webhookUrl = generateSessionWebhookUrl(webhookHash);
      const existing = await client2`
        SELECT id FROM waha_session_webhooks 
        WHERE session_name = ${sessionName}
        LIMIT 1
      `;
      let result;
      if (existing.length > 0) {
        result = await client2`
          UPDATE waha_session_webhooks 
          SET 
            webhook_hash = ${webhookHash},
            webhook_url = ${webhookUrl},
            updated_at = NOW()
          WHERE session_name = ${sessionName}
          RETURNING *
        `;
      } else {
        result = await client2`
          INSERT INTO waha_session_webhooks (
            session_name, webhook_hash, webhook_url, enabled
          ) VALUES (
            ${sessionName}, ${webhookHash}, ${webhookUrl}, true
          )
          RETURNING *
        `;
      }
      res.json({
        success: true,
        message: "Webhook regenerado com sucesso",
        data: result[0]
      });
    } catch (error) {
      console.error("Erro ao regenerar webhook da sess\xE3o:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      await client2.end();
    }
  }
  /**
   * Listar todos os webhooks de sessões
   */
  static async listSessionWebhooks(req, res) {
    const client2 = getClient();
    try {
      await ensureSessionWebhookTable(client2);
      const webhooks = await client2`
        SELECT * FROM waha_session_webhooks 
        ORDER BY session_name ASC
      `;
      res.json({
        success: true,
        data: webhooks
      });
    } catch (error) {
      console.error("Erro ao listar webhooks das sess\xF5es:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      await client2.end();
    }
  }
  /**
   * Ativar/desativar webhook de uma sessão
   */
  static async toggleSessionWebhook(req, res) {
    const client2 = getClient();
    try {
      const { sessionName } = req.params;
      const { enabled } = req.body;
      if (!sessionName) {
        return res.status(400).json({
          success: false,
          message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
        });
      }
      await ensureSessionWebhookTable(client2);
      const result = await client2`
        UPDATE waha_session_webhooks 
        SET 
          enabled = ${enabled ?? true},
          updated_at = NOW()
        WHERE session_name = ${sessionName}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Webhook da sess\xE3o n\xE3o encontrado"
        });
      }
      res.json({
        success: true,
        message: `Webhook ${enabled ? "ativado" : "desativado"} com sucesso`,
        data: result[0]
      });
    } catch (error) {
      console.error("Erro ao ativar/desativar webhook da sess\xE3o:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      await client2.end();
    }
  }
  /**
   * Validar hash do webhook de sessão (usado internamente)
   */
  static async validateSessionWebhookHash(hash) {
    const client2 = getClient();
    try {
      await ensureSessionWebhookTable(client2);
      const result = await client2`
        SELECT session_name FROM waha_session_webhooks 
        WHERE webhook_hash = ${hash} 
        AND enabled = true
        LIMIT 1
      `;
      await client2.end();
      if (result.length > 0) {
        return { isValid: true, sessionName: result[0].session_name };
      }
      return { isValid: false };
    } catch (error) {
      console.error("[WAHA Session Webhooks] Erro ao validar hash:", error);
      return { isValid: false };
    }
  }
};

// server/controllers/waha-webhook.controller.ts
var WahaWebhookController = class _WahaWebhookController {
  /**
   * Receber eventos do WAHA via webhook (com hash de segurança)
   */
  static async receiveWahaEvent(req, res) {
    try {
      const webhookHash = req.params.hash;
      console.log("\n" + "=".repeat(80));
      console.log("[WAHA Webhook] \u{1F4E8} NOVA REQUISI\xC7\xC3O RECEBIDA");
      console.log("=".repeat(80));
      console.log(`\u{1F552} Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
      console.log(`\u{1F310} URL: ${req.method} ${req.originalUrl}`);
      console.log(`\u{1F511} Hash: ${webhookHash || "SEM HASH"}`);
      console.log(`\u{1F4CD} IP: ${req.ip || req.connection.remoteAddress}`);
      console.log(`\u{1F3F7}\uFE0F  User-Agent: ${req.headers["user-agent"] || "N/A"}`);
      console.log("\n\u{1F4CB} HEADERS:");
      Object.entries(req.headers).forEach(([key, value]) => {
        if (key.toLowerCase().includes("content") || key.toLowerCase().includes("auth") || key.toLowerCase().includes("x-")) {
          console.log(`   ${key}: ${value}`);
        }
      });
      console.log("\n\u{1F4E6} PAYLOAD RECEBIDO:");
      console.log(JSON.stringify(req.body, null, 2));
      console.log("=".repeat(80));
      let validatedSessionName = null;
      if (webhookHash) {
        const validation = await WahaSessionWebhooksController.validateSessionWebhookHash(webhookHash);
        if (!validation.isValid) {
          console.warn("[WAHA Webhook] \u274C Hash inv\xE1lido:", webhookHash);
          return res.status(401).json({
            error: "Hash inv\xE1lido",
            message: "Webhook hash n\xE3o autorizado"
          });
        }
        validatedSessionName = validation.sessionName;
        console.log("[WAHA Webhook] \u2705 Hash validado com sucesso para sess\xE3o:", validatedSessionName);
      }
      const event = req.body;
      if (!event.event || !event.session) {
        console.warn("[WAHA Webhook] \u26A0\uFE0F Evento inv\xE1lido - faltam campos obrigat\xF3rios");
        return res.status(400).json({
          error: "Evento inv\xE1lido",
          message: "Campos event e session s\xE3o obrigat\xF3rios"
        });
      }
      console.log(`
\u{1F3AF} [WAHA Webhook] PROCESSANDO EVENTO: ${event.event.toUpperCase()}`);
      console.log(`   \u{1F4F1} Sess\xE3o: ${event.session}`);
      console.log(`   \u{1F511} Hash validado: ${validatedSessionName || "N/A"}`);
      console.log("   " + "-".repeat(50));
      if (validatedSessionName && event.session !== validatedSessionName) {
        console.warn(`[WAHA Webhook] \u26A0\uFE0F Sess\xE3o do evento (${event.session}) n\xE3o corresponde \xE0 sess\xE3o do hash (${validatedSessionName})`);
        return res.status(403).json({
          error: "Sess\xE3o n\xE3o autorizada",
          message: `Este webhook s\xF3 aceita eventos da sess\xE3o: ${validatedSessionName}`
        });
      }
      await _WahaWebhookController.processWahaEvent(event);
      console.log(`
\u2705 [WAHA Webhook] EVENTO PROCESSADO COM SUCESSO`);
      console.log(`   \u{1F4E7} Tipo: ${event.event}`);
      console.log(`   \u{1F3F7}\uFE0F  Sess\xE3o: ${event.session}`);
      console.log(`   \u2714\uFE0F  Sess\xE3o validada: ${validatedSessionName || "N/A"}`);
      console.log(`   \u23F0 Processado em: ${(/* @__PURE__ */ new Date()).toISOString()}`);
      console.log("=".repeat(80) + "\n");
      res.status(200).json({
        success: true,
        message: "Evento processado com sucesso",
        receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
        webhookHash: webhookHash || "sem-hash",
        sessionName: event.session,
        validatedSessionName
      });
    } catch (error) {
      console.log("\n" + "=".repeat(80));
      console.error("[WAHA Webhook] \u274C ERRO AO PROCESSAR EVENTO");
      console.log("=".repeat(80));
      console.error(`\u{1F552} Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
      console.error(`\u{1F310} URL: ${req.method} ${req.originalUrl}`);
      console.error(`\u{1F511} Hash: ${req.params.hash || "SEM HASH"}`);
      console.error("\u{1F4E6} Payload que causou erro:");
      console.error(JSON.stringify(req.body, null, 2));
      console.error("\n\u{1F4A5} Detalhes do erro:");
      console.error(error);
      console.log("=".repeat(80) + "\n");
      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Falha ao processar evento do WAHA",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  /**
   * Processar diferentes tipos de eventos do WAHA
   */
  static async processWahaEvent(event) {
    switch (event.event) {
      case "message":
        await _WahaWebhookController.handleMessageEvent(event);
        break;
      case "message.status":
        await _WahaWebhookController.handleMessageStatusEvent(event);
        break;
      case "session.status":
        await _WahaWebhookController.handleSessionStatusEvent(event);
        break;
      case "state.change":
        await _WahaWebhookController.handleStateChangeEvent(event);
        break;
      default:
        console.log(`[WAHA Webhook] \u2139\uFE0F Evento n\xE3o tratado: ${event.event}`);
    }
  }
  /**
   * Processar evento de nova mensagem
   */
  static async handleMessageEvent(event) {
    console.log("\n\u{1F4E9} [WAHA Webhook] PROCESSANDO NOVA MENSAGEM");
    console.log(`   \u{1F4F1} Sess\xE3o: ${event.session}`);
    console.log(`   \u{1F4E7} De: ${event.payload.from}`);
    console.log(`   \u{1F4E8} Para: ${event.payload.to}`);
    console.log(`   \u{1F4DD} Texto: ${event.payload.body || event.payload.text || "[sem texto]"}`);
    console.log(`   \u{1F4C2} Tipo: ${event.payload.type}`);
    console.log(`   \u{1F464} De mim: ${event.payload.fromMe ? "Sim" : "N\xE3o"}`);
    console.log(`   \u{1F552} Timestamp: ${new Date(event.payload.timestamp * 1e3).toISOString()}`);
    const messageData = event.payload;
    const notification = {
      id: `waha_message_${Date.now()}`,
      type: "info",
      title: "Nova Mensagem WhatsApp",
      message: `Mensagem recebida na sess\xE3o ${event.session}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: "waha",
        name: "WAHA",
        role: "system"
      },
      data: {
        event: "waha.message",
        session: event.session,
        message: messageData
      }
    };
    console.log(`   \u{1F4E1} Enviando notifica\xE7\xE3o via WebSocket para SuperAdmins...`);
    broadcastNotification(notification);
    console.log(`   \u2705 Mensagem processada e enviada via WebSocket`);
  }
  /**
   * Processar evento de mudança de status de mensagem
   */
  static async handleMessageStatusEvent(event) {
    console.log("\n\u{1F4CA} [WAHA Webhook] PROCESSANDO STATUS DE MENSAGEM");
    console.log(`   \u{1F4F1} Sess\xE3o: ${event.session}`);
    console.log(`   \u{1F194} ID da mensagem: ${event.payload.id}`);
    console.log(`   \u2705 Status (ACK): ${event.payload.ack}`);
    console.log(`   \u{1F552} Timestamp: ${new Date(event.payload.timestamp * 1e3).toISOString()}`);
    const statusData = event.payload;
    const notification = {
      id: `waha_status_${Date.now()}`,
      type: "info",
      title: "Status da Mensagem Atualizado",
      message: `Status atualizado na sess\xE3o ${event.session}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: "waha",
        name: "WAHA",
        role: "system"
      },
      data: {
        event: "waha.message.status",
        session: event.session,
        status: statusData
      }
    };
    broadcastNotification(notification);
    console.log(`   \u2705 Status de mensagem processado`);
  }
  /**
   * Processar evento de mudança de status da sessão
   */
  static async handleSessionStatusEvent(event) {
    console.log("\n\u{1F504} [WAHA Webhook] PROCESSANDO STATUS DA SESS\xC3O");
    console.log(`   \u{1F4F1} Sess\xE3o: ${event.session}`);
    console.log(`   \u{1F4CA} Status: ${event.payload.status}`);
    console.log(`   \u{1F3F7}\uFE0F  Nome: ${event.payload.name}`);
    const sessionData = event.payload;
    const notification = {
      id: `waha_session_${Date.now()}`,
      type: sessionData.status === "WORKING" ? "success" : "warning",
      title: "Status da Sess\xE3o WhatsApp",
      message: `Sess\xE3o ${event.session}: ${sessionData.status}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: "waha",
        name: "WAHA",
        role: "system"
      },
      data: {
        event: "waha.session.status",
        session: event.session,
        sessionData
      }
    };
    broadcastNotification(notification);
    console.log(`   \u2705 Status da sess\xE3o processado`);
  }
  /**
   * Processar evento de mudança de estado
   */
  static async handleStateChangeEvent(event) {
    console.log("\n\u{1F500} [WAHA Webhook] PROCESSANDO MUDAN\xC7A DE ESTADO");
    console.log(`   \u{1F4F1} Sess\xE3o: ${event.session}`);
    console.log(`   \u{1F504} Estado: ${event.payload.state}`);
    console.log(`   \u{1F4AC} Mensagem: ${event.payload.message || "N/A"}`);
    const stateData = event.payload;
    const notification = {
      id: `waha_state_${Date.now()}`,
      type: "info",
      title: "Estado do WhatsApp Alterado",
      message: `Estado da sess\xE3o ${event.session} foi alterado`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: "waha",
        name: "WAHA",
        role: "system"
      },
      data: {
        event: "waha.state.change",
        session: event.session,
        state: stateData
      }
    };
    broadcastNotification(notification);
    console.log(`   \u2705 Mudan\xE7a de estado processada`);
  }
  /**
   * Obter estatísticas dos eventos recebidos
   */
  static async getWebhookStats(req, res) {
    try {
      const stats = {
        message: "Webhook funcionando corretamente",
        endpoint: "/api/waha/webhook",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active"
      };
      res.json(stats);
    } catch (error) {
      console.error("[WAHA Webhook] Erro ao obter estat\xEDsticas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

// server/routes.ts
import multer from "multer";
import path6 from "path";
import fs6 from "fs";

// server/controllers/user.controller.ts
init_storage();
init_schema();
import bcrypt2 from "bcryptjs";
import { z as z2 } from "zod";
function validateTelefone(telefone) {
  const digits = telefone.toString();
  if (!digits.startsWith("55")) return "O telefone deve come\xE7ar com o c\xF3digo do Brasil (55)";
  if (digits.length < 12 || digits.length > 13) return "Telefone deve ter 12 ou 13 d\xEDgitos (incluindo DDI)";
  if (!/^\d+$/.test(digits)) return "Telefone deve conter apenas n\xFAmeros";
  return null;
}
async function register(req, res) {
  try {
    const registerSchema = z2.object({
      nome: z2.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z2.string().email("Email inv\xE1lido"),
      senha: z2.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
      telefone: z2.union([z2.string(), z2.number()]).optional().refine((val) => {
        if (val === void 0 || val === null || val === "") return true;
        const digits = typeof val === "number" ? val.toString() : val;
        return /^55\d{10,11}$/.test(digits);
      }, "Telefone deve ser num\xE9rico, come\xE7ar com 55 e ter 12 ou 13 d\xEDgitos"),
      remoteJid: z2.string().optional(),
      tipo_usuario: z2.string().optional()
    });
    const userData = registerSchema.parse(req.body);
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email j\xE1 est\xE1 em uso." });
    }
    if (userData.remoteJid) {
      const existingRemoteJid = await storage.getUserByRemoteJid(userData.remoteJid);
      if (existingRemoteJid) {
        return res.status(400).json({ message: "RemoteJid j\xE1 est\xE1 em uso." });
      }
    }
    let telefoneNum = void 0;
    if (userData.telefone !== void 0 && userData.telefone !== null && userData.telefone !== "") {
      telefoneNum = Number(userData.telefone);
      const err = validateTelefone(telefoneNum);
      if (err) return res.status(400).json({ message: err });
      userData.telefone = telefoneNum.toString();
    }
    if (userData.telefone) {
      const existingPhoneUser = await storage.getUserByPhone(userData.telefone);
      if (existingPhoneUser) {
        return res.status(400).json({ message: "Este n\xFAmero de telefone j\xE1 est\xE1 em uso por outro usu\xE1rio." });
      }
    }
    const userDataToSave = {
      ...userData,
      telefone: telefoneNum ? telefoneNum.toString() : void 0
    };
    const newUser = await storage.createUser(userDataToSave);
    await storage.createWallet({
      usuario_id: newUser.id,
      nome: "Principal"
    });
    const { senha, ...userWithoutPassword } = newUser;
    req.session.userId = newUser.id;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in register:", error);
    res.status(500).json({ message: "Erro ao registrar usu\xE1rio" });
  }
}
async function login(req, res) {
  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", req.body.email);
    const loginData = loginUserSchema.parse(req.body);
    const user = await storage.getUserByEmail(loginData.email);
    console.log("User found:", user ? { id: user.id, email: user.email, ativo: user.ativo } : "not found");
    if (!user) {
      console.log("LOGIN DENIED: User not found");
      return res.status(401).json({ message: "Usu\xE1rio ou senha incorretos ou inexistentes!" });
    }
    const isPasswordValid = await bcrypt2.compare(loginData.senha, user.senha);
    if (!isPasswordValid) {
      console.log("LOGIN DENIED: Invalid password");
      return res.status(401).json({ message: "Usu\xE1rio ou senha incorretos ou inexistentes!" });
    }
    if (user.data_expiracao_assinatura) {
      const now = /* @__PURE__ */ new Date();
      const expirationDate = new Date(user.data_expiracao_assinatura);
      console.log("=== SUBSCRIPTION EXPIRATION CHECK ===");
      console.log(`Current date: ${now.toISOString()}`);
      console.log(`Expiration date: ${expirationDate.toISOString()}`);
      console.log(`Is expired: ${now > expirationDate}`);
      console.log("====================================");
      if (now > expirationDate) {
        console.log("LOGIN DENIED: Subscription expired - ensuring user is deactivated");
        if (user.ativo) {
          await storage.updateUser(user.id, {
            ativo: false,
            ultimo_acesso: /* @__PURE__ */ new Date()
          });
        }
        return res.status(401).json({
          message: "Sua assinatura expirou. Entre em contato com o administrador.",
          subscriptionExpired: true
        });
      }
    }
    if (user.ativo !== true) {
      console.log("LOGIN DENIED: User is not active. Status:", user.ativo);
      return res.status(401).json({ message: "Usu\xE1rio ou senha incorretos ou inexistentes!" });
    }
    console.log("LOGIN SUCCESS: User authenticated successfully");
    await storage.updateUser(user.id, { ultimo_acesso: /* @__PURE__ */ new Date() });
    req.session.userId = user.id;
    const { senha, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in login:", error);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
}
async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Erro ao fazer logout" });
  }
}
async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const session2 = req.session;
    const impersonationContext = req.impersonationContext;
    const { senha, ...userWithoutPassword } = req.user;
    const response = {
      ...userWithoutPassword,
      isImpersonating: false,
      originalAdmin: null
    };
    if (session2.isImpersonating) {
      response.isImpersonating = true;
      if (session2.originalAdmin) {
        const { senha: adminPassword, ...originalAdminWithoutPassword } = session2.originalAdmin;
        response.originalAdmin = originalAdminWithoutPassword;
        console.log("=== SESS\xC3O COM IMPERSONIFICA\xC7\xC3O ===");
        console.log("Usu\xE1rio atual (impersonificado):", userWithoutPassword.email);
        console.log("Admin original:", originalAdminWithoutPassword.email);
        console.log("=====================================");
      } else if (impersonationContext) {
        const { senha: adminPassword, ...originalAdminWithoutPassword } = impersonationContext.originalAdmin;
        response.originalAdmin = originalAdminWithoutPassword;
        console.log("=== SESS\xC3O COM IMPERSONIFICA\xC7\xC3O (CONTEXT) ===");
        console.log("Usu\xE1rio atual (impersonificado):", userWithoutPassword.email);
        console.log("Admin original:", originalAdminWithoutPassword.email);
        console.log("==========================================");
      }
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ message: "Erro ao obter usu\xE1rio atual" });
  }
}
async function getProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usu\xE1rio n\xE3o encontrado" });
    }
    const { senha, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Erro ao obter perfil do usu\xE1rio" });
  }
}
async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const updateSchema = z2.object({
      nome: z2.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z2.string().email("Email inv\xE1lido"),
      telefone: z2.union([z2.string(), z2.number()]).optional().refine((val) => {
        if (val === void 0 || val === null || val === "") return true;
        const digits = typeof val === "number" ? val.toString() : val;
        return /^55\d{10,11}$/.test(digits);
      }, "Telefone deve ser num\xE9rico, come\xE7ar com 55 e ter 12 ou 13 d\xEDgitos")
    });
    const updateData = updateSchema.parse(req.body);
    if (updateData.email) {
      const existingUser = await storage.getUserByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email j\xE1 est\xE1 em uso por outro usu\xE1rio." });
      }
    }
    let telefoneNum = void 0;
    if (updateData.telefone) {
      telefoneNum = Number(updateData.telefone);
      const existingPhoneUser = await storage.getUserByPhone(telefoneNum.toString());
      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        return res.status(400).json({ message: "Este n\xFAmero de telefone j\xE1 est\xE1 em uso por outro usu\xE1rio." });
      }
    }
    if (telefoneNum) {
      const err = validateTelefone(telefoneNum);
      if (err) return res.status(400).json({ message: err });
    }
    const updateDataToSave = {
      ...updateData,
      telefone: telefoneNum ? telefoneNum.toString() : void 0
    };
    const updatedUser = await storage.updateUser(userId, updateDataToSave);
    if (!updatedUser) {
      return res.status(404).json({ message: "Usu\xE1rio n\xE3o encontrado" });
    }
    const { senha, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Erro ao atualizar perfil do usu\xE1rio" });
  }
}
async function updatePassword(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const passwordSchema = z2.object({
      senhaAtual: z2.string().min(1, "Senha atual \xE9 obrigat\xF3ria").optional(),
      novaSenha: z2.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
      senha_atual: z2.string().min(1, "Senha atual \xE9 obrigat\xF3ria").optional(),
      nova_senha: z2.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional()
    }).refine(
      (data) => (data.senhaAtual || data.senha_atual) && (data.novaSenha || data.nova_senha),
      { message: "Senha atual e nova senha s\xE3o obrigat\xF3rias" }
    );
    const parsedData = passwordSchema.parse(req.body);
    const passwordData = {
      senhaAtual: parsedData.senhaAtual || parsedData.senha_atual || "",
      novaSenha: parsedData.novaSenha || parsedData.nova_senha || ""
    };
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usu\xE1rio n\xE3o encontrado" });
    }
    const isPasswordValid = await bcrypt2.compare(passwordData.senhaAtual, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Senha atual incorreta" });
    }
    const success = await storage.updatePassword(userId, passwordData.novaSenha);
    if (!success) {
      return res.status(500).json({ message: "Erro ao atualizar senha" });
    }
    res.status(200).json({ message: "Senha atualizada com sucesso" });
  } catch (error) {
    if (error instanceof z2.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in updatePassword:", error);
    res.status(500).json({ message: "Erro ao atualizar senha" });
  }
}

// server/controllers/transaction.controller.ts
init_storage();
init_schema();
import { z as z3 } from "zod";

// server/utils.ts
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

// server/controllers/transaction.controller.ts
async function getTransactions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
    res.status(200).json(transactions2);
  } catch (error) {
    console.error("Error in getTransactions:", error);
    res.status(500).json({ message: "Erro ao obter transa\xE7\xF5es" });
  }
}
async function getRecentTransactions(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const transactions2 = await storage.getRecentTransactionsByWalletId(wallet.id, limit);
    res.status(200).json(transactions2);
  } catch (error) {
    console.error("Error in getRecentTransactions:", error);
    res.status(500).json({ message: "Erro ao obter transa\xE7\xF5es recentes" });
  }
}
async function getTransaction(req, res) {
  try {
    console.log("\n=== TRANSACTION GET - REQUEST ===");
    console.log(`ID: ${req.params.id}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log("=================================\n");
    if (!req.user) {
      console.log("\n=== TRANSACTION GET - UNAUTHORIZED ===");
      console.log("======================================\n");
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      console.log("\n=== TRANSACTION GET - INVALID ID ===");
      console.log(`Valor do par\xE2metro id: ${req.params.id}`);
      console.log("===================================\n");
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const wallet = await storage.getWalletByUserId(req.user.id);
    if (!wallet) {
      console.log("\n=== TRANSACTION GET - WALLET NOT FOUND ===");
      console.log(`User ID: ${req.user.id}`);
      console.log("========================================\n");
      return res.status(404).json({ error: "Carteira n\xE3o encontrada" });
    }
    const transaction = await storage.getTransactionById(transactionId);
    if (!transaction) {
      console.log("\n=== TRANSACTION GET - NOT FOUND ===");
      console.log(`Transaction ID: ${transactionId}`);
      console.log("==================================\n");
      return res.status(404).json({ error: "Transa\xE7\xE3o n\xE3o encontrada" });
    }
    if (transaction.carteira_id !== wallet.id) {
      console.log("\n=== TRANSACTION GET - FORBIDDEN ===");
      console.log(`Transaction wallet ID: ${transaction.carteira_id}, User wallet ID: ${wallet.id}`);
      console.log("==================================\n");
      return res.status(403).json({ error: "Acesso negado" });
    }
    console.log("\n=== TRANSACTION GET - SUCCESS ===");
    console.log(`Transaction ID: ${transactionId} encontrada com sucesso`);
    console.log("================================\n");
    return res.status(200).json(transaction);
  } catch (error) {
    console.error("\n=== TRANSACTION GET - ERROR ===");
    console.error("Error in getTransaction:", error);
    console.error("==============================\n");
    return res.status(500).json({ error: "Erro ao obter transa\xE7\xE3o" });
  }
}
async function createTransaction(req, res) {
  console.log("\n=== TRANSACTION CREATE - REQUEST PAYLOAD ===");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("==========================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(401).json(errorResponse);
    }
    console.log("\n=== USER AUTHENTICATED ===");
    console.log(`User ID: ${req.user.id}`);
    console.log(`User Email: ${req.user.email}`);
    console.log(`User Type: ${req.user.tipo_usuario}`);
    console.log("==========================\n");
    const userId = req.user.id;
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      const errorResponse = { message: "Carteira n\xE3o encontrada" };
      console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (404) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(404).json(errorResponse);
    }
    const transactionData = insertTransactionSchema.parse(req.body);
    if (!transactionData.carteira_id || transactionData.carteira_id === 0) {
      transactionData.carteira_id = wallet.id;
      console.log(`
=== AUTO-ASSIGNED WALLET ID ===`);
      console.log(`Wallet ID automaticamente atribu\xEDdo: ${wallet.id}`);
      console.log(`=============================
`);
    }
    if (!transactionData.forma_pagamento_id || transactionData.forma_pagamento_id === 0) {
      const pixPaymentMethod = await storage.getPaymentMethodByName("PIX");
      if (pixPaymentMethod) {
        transactionData.forma_pagamento_id = pixPaymentMethod.id;
        console.log(`
=== AUTO-ASSIGNED PAYMENT METHOD ===`);
        console.log(`Forma de pagamento automaticamente atribu\xEDda: PIX (ID: ${pixPaymentMethod.id})`);
        console.log(`====================================
`);
      } else {
        let availablePaymentMethods = await storage.getGlobalPaymentMethods();
        if (availablePaymentMethods.length === 0) {
          availablePaymentMethods = await storage.getPaymentMethodsByUserId(userId);
        }
        if (availablePaymentMethods.length > 0) {
          transactionData.forma_pagamento_id = availablePaymentMethods[0].id;
          console.log(`
=== AUTO-ASSIGNED PAYMENT METHOD (FALLBACK) ===`);
          console.log(`PIX n\xE3o encontrado, usando: ${availablePaymentMethods[0].nome} (ID: ${availablePaymentMethods[0].id})`);
          console.log(`===============================================
`);
        } else {
          const errorResponse = { message: "Nenhum m\xE9todo de pagamento dispon\xEDvel" };
          console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (400) ===");
          console.log(JSON.stringify(errorResponse, null, 2));
          console.log("============================================\n");
          return res.status(400).json(errorResponse);
        }
      }
    }
    if (transactionData.carteira_id !== wallet.id) {
      const errorResponse = { message: "Acesso negado - voc\xEA s\xF3 pode criar transa\xE7\xF5es na sua pr\xF3pria carteira" };
      console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (403) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(403).json(errorResponse);
    }
    const category = await storage.getCategoryById(transactionData.categoria_id);
    if (!category) {
      const errorResponse = { message: "Categoria n\xE3o encontrada" };
      console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (404) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(404).json(errorResponse);
    }
    if (transactionData.tipo !== category.tipo) {
      const errorResponse = {
        message: `Tipo de transa\xE7\xE3o incompat\xEDvel com a categoria. A categoria \xE9 do tipo ${category.tipo}`
      };
      console.log("\n=== TRANSACTION CREATE - ERROR RESPONSE (400) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(400).json(errorResponse);
    }
    const newTransaction = await storage.createTransaction(transactionData);
    const notification = {
      id: `transaction_created_${newTransaction.id}`,
      type: "success",
      title: "Nova Transa\xE7\xE3o Criada",
      message: `${newTransaction.tipo === "receita" ? "Receita" : "Despesa"} de ${formatCurrency(newTransaction.valor)} - ${newTransaction.descricao}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: req.user.id.toString(),
        name: req.user.nome,
        role: req.user.tipo_usuario
      },
      data: {
        event: "transaction.created",
        transaction: newTransaction,
        userId: req.user.id,
        isImpersonated: req.isImpersonating || false
      }
    };
    console.log("\n=== ENVIANDO NOTIFICA\xC7\xC3O WEBSOCKET ===");
    console.log("Notifica\xE7\xE3o:", JSON.stringify(notification, null, 2));
    console.log("Usu\xE1rio ID:", req.user.id);
    console.log("Transa\xE7\xE3o ID:", newTransaction.id);
    console.log("=====================================\n");
    const broadcastResult = broadcastNotification(notification, [req.user.id.toString()]);
    console.log("Resultado do broadcast:", broadcastResult);
    console.log("Broadcast enviado para usu\xE1rio:", req.user.id);
    console.log("\n=== TRANSACTION CREATE - SUCCESS RESPONSE (201) ===");
    console.log(JSON.stringify(newTransaction, null, 2));
    console.log("===============================================\n");
    res.status(201).json(newTransaction);
  } catch (error) {
    if (error instanceof z3.ZodError) {
      const errorResponse2 = { message: "Dados inv\xE1lidos", errors: error.errors };
      console.log("\n=== TRANSACTION CREATE - VALIDATION ERROR (400) ===");
      console.log(JSON.stringify(errorResponse2, null, 2));
      console.log("=================================================\n");
      return res.status(400).json(errorResponse2);
    }
    console.error("Error in createTransaction:", error);
    const errorResponse = { message: "Erro ao criar transa\xE7\xE3o" };
    console.log("\n=== TRANSACTION CREATE - SERVER ERROR (500) ===");
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("===========================================\n");
    res.status(500).json(errorResponse);
  }
}
async function updateTransaction(req, res) {
  console.log("\n=== TRANSACTION UPDATE - REQUEST PAYLOAD ===");
  console.log(`Transaction ID: ${req.params.id}`);
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log("==========================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(401).json(errorResponse);
    }
    const userId = req.user.id;
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      const errorResponse = { error: "ID inv\xE1lido" };
      console.log("\n=== TRANSACTION UPDATE - INVALID ID ===");
      console.log(`Valor do par\xE2metro id: ${req.params.id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("===================================\n");
      return res.status(400).json(errorResponse);
    }
    const validationResult = updateTransactionSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorResponse = { error: "Dados inv\xE1lidos", details: validationResult.error.errors };
      console.log("\n=== TRANSACTION UPDATE - VALIDATION ERROR ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("========================================\n");
      return res.status(400).json(errorResponse);
    }
    const transactionData = validationResult.data;
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      const errorResponse = { error: "Carteira n\xE3o encontrada" };
      console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (404) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(404).json(errorResponse);
    }
    const transaction = await storage.getTransactionById(transactionId);
    if (!transaction) {
      const errorResponse = { error: "Transa\xE7\xE3o n\xE3o encontrada" };
      console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (404) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(404).json(errorResponse);
    }
    if (transaction.carteira_id !== wallet.id) {
      const errorResponse = { error: "Acesso negado" };
      console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (403) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(403).json(errorResponse);
    }
    if (transactionData.categoria_id) {
      const category = await storage.getCategoryById(transactionData.categoria_id);
      if (!category) {
        const errorResponse = { message: "Categoria n\xE3o encontrada" };
        console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (404) ===");
        console.log(JSON.stringify(errorResponse, null, 2));
        console.log("============================================\n");
        return res.status(404).json(errorResponse);
      }
      if (!transactionData.tipo && category.tipo !== transaction.tipo) {
        const errorResponse = {
          message: `Categoria incompat\xEDvel com o tipo da transa\xE7\xE3o. A categoria \xE9 do tipo ${category.tipo}`
        };
        console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (400) ===");
        console.log(JSON.stringify(errorResponse, null, 2));
        console.log("============================================\n");
        return res.status(400).json(errorResponse);
      }
      if (transactionData.tipo && category.tipo !== transactionData.tipo) {
        const errorResponse = {
          message: `Categoria incompat\xEDvel com o tipo da transa\xE7\xE3o. A categoria \xE9 do tipo ${category.tipo}`
        };
        console.log("\n=== TRANSACTION UPDATE - ERROR RESPONSE (400) ===");
        console.log(JSON.stringify(errorResponse, null, 2));
        console.log("============================================\n");
        return res.status(400).json(errorResponse);
      }
    }
    try {
      const updatedTransaction = await storage.updateTransaction(transactionId, transactionData);
      if (!updatedTransaction) {
        const errorResponse = { error: "Transa\xE7\xE3o n\xE3o encontrada ou n\xE3o foi poss\xEDvel atualizar" };
        console.log("\n=== TRANSACTION UPDATE - UPDATE FAILED ===");
        console.log(`Transaction ID: ${transactionId}`);
        console.log(JSON.stringify(errorResponse, null, 2));
        console.log("=====================================\n");
        return res.status(404).json(errorResponse);
      }
      const notification = {
        id: `transaction_updated_${updatedTransaction.id}`,
        type: "info",
        title: "Transa\xE7\xE3o Atualizada",
        message: `${updatedTransaction.tipo === "receita" ? "Receita" : "Despesa"} de ${formatCurrency(updatedTransaction.valor)} - ${updatedTransaction.descricao}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        from: {
          id: req.user.id.toString(),
          name: req.user.nome,
          role: req.user.tipo_usuario
        },
        data: {
          event: "transaction.updated",
          transaction: updatedTransaction,
          userId: req.user.id,
          isImpersonated: req.isImpersonating || false
        }
      };
      broadcastNotification(notification, [req.user.id.toString()]);
      console.log("\n=== TRANSACTION UPDATE - SUCCESS ===");
      console.log(`ID: ${transactionId}, M\xE9todo: ${req.method}`);
      console.log(JSON.stringify(updatedTransaction, null, 2));
      console.log("==================================\n");
      return res.status(200).json(updatedTransaction);
    } catch (dbError) {
      console.error("\n=== TRANSACTION UPDATE - DATABASE ERROR ===");
      console.error(`Transaction ID: ${transactionId}`);
      console.error(dbError);
      console.error("=======================================\n");
      return res.status(500).json({
        error: "Erro ao atualizar transa\xE7\xE3o no banco de dados",
        message: dbError.message || "Erro interno do servidor"
      });
    }
  } catch (error) {
    if (error instanceof z3.ZodError) {
      const errorResponse = { error: "Dados inv\xE1lidos", details: error.errors };
      console.log("\n=== TRANSACTION UPDATE - VALIDATION ERROR ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("========================================\n");
      return res.status(400).json(errorResponse);
    }
    console.error("\n=== TRANSACTION UPDATE - UNHANDLED ERROR ===");
    console.error("Error in updateTransaction:", error);
    console.error("=========================================\n");
    return res.status(500).json({
      error: "Erro ao atualizar transa\xE7\xE3o",
      message: error.message || "Erro interno do servidor"
    });
  }
}
async function deleteTransaction(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const transactionId = parseInt(req.params.id);
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const transaction = await storage.getTransactionById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transa\xE7\xE3o n\xE3o encontrada" });
    }
    if (transaction.carteira_id !== wallet.id) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    const success = await storage.deleteTransaction(transactionId);
    if (!success) {
      return res.status(500).json({ message: "Erro ao excluir transa\xE7\xE3o" });
    }
    const notification = {
      id: `transaction_deleted_${transactionId}`,
      type: "warning",
      title: "Transa\xE7\xE3o Exclu\xEDda",
      message: `${transaction.tipo === "receita" ? "Receita" : "Despesa"} de ${formatCurrency(transaction.valor)} - ${transaction.descricao}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      from: {
        id: req.user.id.toString(),
        name: req.user.nome,
        role: req.user.tipo_usuario
      },
      data: {
        event: "transaction.deleted",
        transactionId,
        transaction,
        userId: req.user.id,
        isImpersonated: req.isImpersonating || false
      }
    };
    broadcastNotification(notification, [req.user.id.toString()]);
    res.status(200).json({ message: "Transa\xE7\xE3o exclu\xEDda com sucesso" });
  } catch (error) {
    console.error("Error in deleteTransaction:", error);
    res.status(500).json({ message: "Erro ao excluir transa\xE7\xE3o" });
  }
}
async function getDashboardSummary(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    console.log("\u{1F50D} Dashboard Summary - UserId:", userId);
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      console.log("\u274C Carteira n\xE3o encontrada para userId:", userId);
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    console.log("\u{1F4BC} Carteira encontrada - ID:", wallet.id, "Saldo:", wallet.saldo_atual);
    const monthlyData = await storage.getMonthlyTransactionSummary(wallet.id);
    console.log("\u{1F4CA} Monthly Data:", JSON.stringify(monthlyData, null, 2));
    const expensesData = await storage.getExpensesByCategory(wallet.id);
    console.log("\u{1F4C8} Expenses Data:", JSON.stringify(expensesData, null, 2));
    const totalExpensesAmount = expensesData.reduce(
      (total, item) => total + Number(item.total),
      0
    );
    const expensesByCategory = expensesData.map((item) => ({
      categoryId: Number(item.category_id),
      name: item.name,
      total: Number(item.total),
      color: item.color,
      icon: item.icon,
      percentage: totalExpensesAmount > 0 ? Math.round(Number(item.total) / totalExpensesAmount * 100) : 0
    }));
    const { totalIncome, totalExpenses } = await storage.getIncomeExpenseTotals(wallet.id);
    console.log("\u{1F4B0} Dashboard totals:", { totalIncome, totalExpenses });
    console.log("\u{1F4DD} ExpensesByCategory processed:", JSON.stringify(expensesByCategory, null, 2));
    const responseData = {
      monthlyData,
      expensesByCategory,
      totalIncome,
      totalExpenses
    };
    console.log("\u{1F4E4} Final Response:", JSON.stringify(responseData, null, 2));
    res.status(200).json(responseData);
  } catch (error) {
    console.error("\u274C Error in getDashboardSummary:", error);
    res.status(500).json({ message: "Erro ao obter resumo do dashboard" });
  }
}

// server/controllers/category.controller.ts
init_storage();
init_schema();
import { z as z4 } from "zod";
async function getCategories(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const categories2 = await storage.getCategoriesByUserId(userId);
    res.status(200).json(categories2);
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ message: "Erro ao obter categorias" });
  }
}
async function getCategory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);
    const category = await storage.getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
    }
    if (!category.global && category.usuario_id !== userId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error in getCategory:", error);
    res.status(500).json({ message: "Erro ao obter categoria" });
  }
}
async function createCategory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const categorySchema = insertCategorySchema.extend({
      // Override some fields
      global: z4.boolean().default(false),
      usuario_id: z4.number().optional()
    });
    const categoryData = categorySchema.parse(req.body);
    categoryData.global = false;
    categoryData.usuario_id = userId;
    const userCategories = await storage.getCategoriesByUserId(userId);
    const existingCategory = userCategories.find(
      (c) => c.nome.toLowerCase() === categoryData.nome.toLowerCase() && c.tipo === categoryData.tipo
    );
    if (existingCategory) {
      return res.status(400).json({
        message: `J\xE1 existe uma categoria ${categoryData.tipo?.toLowerCase()} com este nome`
      });
    }
    const newCategory = await storage.createCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in createCategory:", error);
    res.status(500).json({ message: "Erro ao criar categoria" });
  }
}
async function updateCategory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);
    const updateSchema = z4.object({
      nome: z4.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
      tipo: z4.string().min(1, "Tipo \xE9 obrigat\xF3rio").optional(),
      cor: z4.string().optional(),
      icone: z4.string().optional()
    });
    const updateData = updateSchema.parse(req.body);
    const category = await storage.getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
    }
    if (category.global) {
      return res.status(403).json({ message: "Categorias globais n\xE3o podem ser modificadas" });
    }
    if (category.usuario_id !== userId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    if (updateData.nome) {
      const userCategories = await storage.getCategoriesByUserId(userId);
      const existingCategory = userCategories.find(
        (c) => c.id !== categoryId && c.nome.toLowerCase() === updateData.nome?.toLowerCase() && c.tipo === (updateData.tipo || category.tipo)
      );
      if (existingCategory) {
        return res.status(400).json({
          message: `J\xE1 existe uma categoria ${(updateData.tipo || category.tipo).toLowerCase()} com este nome`
        });
      }
    }
    const updatedCategory = await storage.updateCategory(categoryId, updateData);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    if (error instanceof z4.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in updateCategory:", error);
    res.status(500).json({ message: "Erro ao atualizar categoria" });
  }
}
async function deleteCategory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const categoryId = parseInt(req.params.id);
    const category = await storage.getCategoryById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Categoria n\xE3o encontrada" });
    }
    if (category.global) {
      return res.status(403).json({ message: "Categorias globais n\xE3o podem ser exclu\xEDdas" });
    }
    if (category.usuario_id !== userId) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    const success = await storage.deleteCategory(categoryId);
    if (!success) {
      return res.status(400).json({
        message: "N\xE3o \xE9 poss\xEDvel excluir a categoria porque ela est\xE1 sendo usada em transa\xE7\xF5es"
      });
    }
    res.status(200).json({ message: "Categoria exclu\xEDda com sucesso" });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    res.status(500).json({ message: "Erro ao excluir categoria" });
  }
}
async function colorizeGlobalCategories(req, res) {
  try {
    const userId = req.user?.id;
    const userType = req.user?.tipo_usuario;
    if (!userId || userType !== "super_admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas superadmins podem colorir categorias globais." });
    }
    const defaultColors = {
      "Alimenta\xE7\xE3o": "#FF6B6B",
      // Vermelho
      "Transporte": "#4ECDC4",
      // Azul-verde
      "Moradia": "#45B7D1",
      // Azul
      "Sa\xFAde": "#96CEB4",
      // Verde claro
      "Educa\xE7\xE3o": "#FFEAA7",
      // Amarelo
      "Lazer": "#DDA0DD",
      // Roxo claro
      "Vestu\xE1rio": "#F8BBD9",
      // Rosa
      "Servi\xE7os": "#FFB74D",
      // Laranja
      "Impostos": "#A1887F",
      // Marrom
      "Imposto": "#A1887F",
      // Marrom (variação)
      "Investimento": "#FFC107",
      // Dourado
      "Investimentos": "#FFC107",
      // Dourado (variação)
      "Doa\xE7\xF5es": "#E91E63",
      // Rosa escuro
      "Pets": "#8BC34A",
      // Verde
      "Viagem": "#9C27B0",
      // Roxo
      "Outros": "#90A4AE",
      // Cinza
      "Sal\xE1rio": "#4CAF50",
      // Verde
      "Freelance": "#8BC34A",
      // Verde claro
      "Presentes": "#E91E63",
      // Rosa escuro
      "Reembolso": "#9C27B0"
      // Roxo
    };
    const globalCategories = await storage.getGlobalCategories();
    let updatedCount = 0;
    for (const category of globalCategories) {
      const newColor = defaultColors[category.nome] || (category.tipo === "Receita" ? "#4CAF50" : "#FF6B6B");
      await storage.updateCategory(category.id, { cor: newColor });
      updatedCount++;
    }
    res.json({
      message: `${updatedCount} categorias globais foram colorizadas com sucesso!`,
      updatedCount
    });
  } catch (error) {
    console.error("Erro ao colorizar categorias globais:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// server/controllers/wallet.controller.ts
init_storage();
import { z as z5 } from "zod";
async function getCurrentWallet(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    console.log("=== WALLET - GET CURRENT - REQUEST ===");
    console.log("Usu\xE1rio ID:", userId);
    console.log("======================================");
    const wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      console.log("=== WALLET - CREATING NEW WALLET ===");
      const newWallet = await storage.createWallet({
        usuario_id: userId,
        nome: "Principal",
        descricao: "Carteira principal"
      });
      console.log("Nova carteira criada:", newWallet);
      console.log("=====================================");
      return res.status(200).json(newWallet);
    }
    console.log("=== WALLET - WALLET ENCONTRADA ===");
    console.log("Dados da carteira com saldo calculado:", wallet);
    console.log("===================================");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.status(200).json(wallet);
  } catch (error) {
    console.error("Error in getCurrentWallet:", error);
    res.status(500).json({ message: "Erro ao obter carteira" });
  }
}
async function updateWallet(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const userId = req.user.id;
    const updateSchema = z5.object({
      nome: z5.string().min(1, "Nome \xE9 obrigat\xF3rio").optional(),
      descricao: z5.string().optional()
    });
    const updateData = updateSchema.parse(req.body);
    let wallet = await storage.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await storage.createWallet({
        usuario_id: userId,
        nome: updateData.nome || "Principal",
        descricao: updateData.descricao || "Carteira principal"
      });
      return res.status(201).json(wallet);
    }
    const updatedWallet = await storage.updateWallet(wallet.id, updateData);
    if (!updatedWallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    res.status(200).json(updatedWallet);
  } catch (error) {
    if (error instanceof z5.ZodError) {
      return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
    }
    console.error("Error in updateWallet:", error);
    res.status(500).json({ message: "Erro ao atualizar carteira" });
  }
}

// server/controllers/apiToken.controller.ts
init_storage();
init_schema();
import bcrypt3 from "bcryptjs";
async function getApiTokens(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const tokens = await storage.getApiTokensByUserId(req.user.id);
    const safeTokens = tokens.map((token) => ({
      ...token,
      token: token.token.substring(0, 10) + "..." + token.token.substring(token.token.length - 4)
    }));
    return res.json(safeTokens);
  } catch (error) {
    console.error("Error getting API tokens:", error);
    return res.status(500).json({ error: "Erro ao obter tokens de API" });
  }
}
async function getApiToken(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const token = await storage.getApiTokenById(id);
    if (!token) {
      return res.status(404).json({ error: "Token n\xE3o encontrado" });
    }
    if (token.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const safeToken = {
      ...token,
      token: token.token.substring(0, 10) + "..." + token.token.substring(token.token.length - 4)
    };
    return res.json(safeToken);
  } catch (error) {
    console.error("Error getting API token:", error);
    return res.status(500).json({ error: "Erro ao obter token de API" });
  }
}
async function createApiToken(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const validationResult = insertApiTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Dados inv\xE1lidos",
        details: validationResult.error.errors
      });
    }
    const token = await storage.createApiToken(req.user.id, validationResult.data);
    return res.status(201).json(token);
  } catch (error) {
    console.error("Error creating API token:", error);
    return res.status(500).json({ error: "Erro ao criar token de API" });
  }
}
async function updateApiToken(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const token = await storage.getApiTokenById(id);
    if (!token) {
      return res.status(404).json({ error: "Token n\xE3o encontrado" });
    }
    if (token.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const validationResult = updateApiTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Dados inv\xE1lidos",
        details: validationResult.error.errors
      });
    }
    const updatedToken = await storage.updateApiToken(id, validationResult.data);
    if (!updatedToken) {
      return res.status(500).json({ error: "Erro ao atualizar token de API" });
    }
    const safeToken = {
      ...updatedToken,
      token: updatedToken.token.substring(0, 10) + "..." + updatedToken.token.substring(updatedToken.token.length - 4)
    };
    return res.json(safeToken);
  } catch (error) {
    console.error("Error updating API token:", error);
    return res.status(500).json({ error: "Erro ao atualizar token de API" });
  }
}
async function deleteApiToken(req, res) {
  try {
    console.log("\n=== API TOKEN DELETE - REQUEST ===");
    console.log(`ID: ${req.params.id}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log("====================================\n");
    if (!req.user) {
      console.log("\n=== API TOKEN DELETE - UNAUTHORIZED ===");
      console.log("========================================\n");
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      console.log("\n=== API TOKEN DELETE - INVALID ID ===");
      console.log(`Valor do par\xE2metro id: ${req.params.id}`);
      console.log("=====================================\n");
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const token = await storage.getApiTokenById(id);
    if (!token) {
      console.log("\n=== API TOKEN DELETE - NOT FOUND ===");
      console.log(`ID procurado: ${id}`);
      console.log("====================================\n");
      return res.status(404).json({ error: "Token n\xE3o encontrado" });
    }
    if (token.usuario_id !== req.user.id) {
      console.log("\n=== API TOKEN DELETE - FORBIDDEN ===");
      console.log(`Token ID: ${id}, User ID: ${req.user.id}, Token Owner: ${token.usuario_id}`);
      console.log("====================================\n");
      return res.status(403).json({ error: "Acesso negado" });
    }
    const success = await storage.deleteApiToken(id);
    if (success) {
      console.log("\n=== API TOKEN DELETE - SUCCESS ===");
      console.log(`Token ID: ${id} exclu\xEDdo com sucesso`);
      console.log("==================================\n");
      return res.status(204).end();
    } else {
      console.log("\n=== API TOKEN DELETE - FAILED ===");
      console.log(`Token ID: ${id} - falha na exclus\xE3o`);
      console.log("=================================\n");
      return res.status(500).json({ error: "Erro ao excluir token de API" });
    }
  } catch (error) {
    console.error("\n=== API TOKEN DELETE - ERROR ===");
    console.error("Error deleting API token:", error);
    console.error("================================\n");
    return res.status(500).json({ error: "Erro ao excluir token de API" });
  }
}
async function rotateApiToken(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const { senha } = req.body;
    if (!senha || typeof senha !== "string") {
      return res.status(400).json({ error: "Senha obrigat\xF3ria para rotacionar o token" });
    }
    const token = await storage.getApiTokenById(id);
    if (!token) {
      return res.status(404).json({ error: "Token n\xE3o encontrado" });
    }
    if (token.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    if (!token.master) {
      return res.status(400).json({ error: "S\xF3 \xE9 poss\xEDvel rotacionar o MasterToken" });
    }
    const user = await storage.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    const senhaOk = await bcrypt3.compare(senha, user.senha);
    if (!senhaOk) {
      return res.status(401).json({ error: "Senha incorreta" });
    }
    const newToken = storage["generateApiToken"]();
    await storage.updateApiToken(id, { token: newToken });
    return res.status(200).json({ token: newToken });
  } catch (error) {
    console.error("Erro ao rotacionar MasterToken:", error);
    return res.status(500).json({ error: "Erro ao rotacionar MasterToken" });
  }
}

// server/controllers/apiGuide.controller.ts
function getApiGuide(req, res) {
  const guideData = {
    titulo: "Guia de Integra\xE7\xE3o da API de Controle Financeiro",
    descricao: "Esta documenta\xE7\xE3o fornece instru\xE7\xF5es sobre como integrar com nossa API usando tokens de acesso.",
    autenticacao: {
      metodo: "API Key",
      header: "apikey",
      formato: "Token gerado na interface de usu\xE1rio (ex: fin_a8cd860385eaf6b2d74be8a4e3c72f9b1d61cd)"
    },
    endpoints: [
      {
        rota: "/api/transactions",
        metodo: "GET",
        descricao: "Lista todas as transa\xE7\xF5es do usu\xE1rio",
        parametros: "Nenhum"
      },
      {
        rota: "/api/transactions",
        metodo: "POST",
        descricao: "Cria uma nova transa\xE7\xE3o",
        parametros: "descricao, valor, tipo, categoria_id, data"
      },
      {
        rota: "/api/categories",
        metodo: "GET",
        descricao: "Lista todas as categorias do usu\xE1rio",
        parametros: "Nenhum"
      },
      {
        rota: "/api/dashboard/summary",
        metodo: "GET",
        descricao: "Obt\xE9m resumo do dashboard",
        parametros: "Nenhum"
      }
    ],
    exemplos: {
      curl: 'curl -X GET https://sua-aplicacao.com/api/transactions -H "apikey: seu_token_aqui"',
      javascript: `
fetch('https://sua-aplicacao.com/api/transactions', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'seu_token_aqui'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));`,
      python: `
import requests

headers = {
    'Content-Type': 'application/json',
    'apikey': 'seu_token_aqui'
}

response = requests.get('https://sua-aplicacao.com/api/transactions', headers=headers)
data = response.json()
print(data)`
    },
    codigosErro: [
      { codigo: 401, descricao: "Token ausente ou inv\xE1lido" },
      { codigo: 403, descricao: "Token sem permiss\xE3o para acessar o recurso" },
      { codigo: 404, descricao: "Recurso n\xE3o encontrado" },
      { codigo: 422, descricao: "Erro de valida\xE7\xE3o nos dados enviados" },
      { codigo: 500, descricao: "Erro interno do servidor" }
    ]
  };
  return res.status(200).json(guideData);
}

// server/controllers/reminder.controller.ts
init_storage();
init_schema();
var convertFromSaoPauloToUTC = (dateStr) => {
  console.log(`
=== DEBUG CONVERS\xC3O - INICIO ===`);
  console.log(`Tipo: ${typeof dateStr}`);
  console.log(`Valor: ${dateStr}`);
  if (typeof dateStr === "string") {
    console.log(`\xC9 string, verificando timezone...`);
    console.log(`Cont\xE9m -03:00? ${dateStr.includes("-03:00")}`);
    if (dateStr.includes("-03:00")) {
      const dateWithoutTz = dateStr.replace("-03:00", "");
      const localDate = new Date(dateWithoutTz);
      console.log(`Entrada: ${dateStr}`);
      console.log(`Sem timezone: ${dateWithoutTz}`);
      console.log(`Como local: ${localDate.toISOString()}`);
      console.log(`===============================
`);
      return localDate;
    }
    console.log(`Usando convers\xE3o direta para: ${dateStr}`);
    const directDate = new Date(dateStr);
    console.log(`Resultado direto: ${directDate.toISOString()}`);
    console.log(`===============================
`);
    return directDate;
  }
  console.log(`N\xE3o \xE9 string, retornando como est\xE1`);
  console.log(`===============================
`);
  return dateStr;
};
var convertToSaoPauloTimezone = (date2) => {
  const utcDate = new Date(date2);
  const saoPauloTime = new Date(utcDate.getTime() - 3 * 60 * 60 * 1e3);
  return saoPauloTime.toISOString().replace("Z", "-03:00");
};
var addTimezoneToReminder = (reminder) => ({
  ...reminder,
  data_lembrete: reminder.data_lembrete ? convertToSaoPauloTimezone(reminder.data_lembrete) : null,
  // data_lembrete: reminder.data_lembrete ?? null,
  data_criacao: reminder.data_criacao ? convertToSaoPauloTimezone(reminder.data_criacao) : null,
  timezone: "America/Sao_Paulo"
});
var addTimezoneToReminders = (reminders2) => reminders2.map(addTimezoneToReminder);
async function getReminders(req, res) {
  console.log("\n=== LEMBRETES - GET ALL - REQUEST ===");
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Usu\xE1rio ID: ${req.user?.id || "N\xE3o autenticado"}`);
  console.log("======================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== LEMBRETES - GET ALL - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("==============================================\n");
      return res.status(401).json(errorResponse);
    }
    console.log(`
=== LEMBRETES - GET ALL - PROCESSING ===`);
    console.log(`Buscando lembretes do usu\xE1rio ${req.user.id}`);
    console.log("=========================================\n");
    const reminders2 = await storage.getRemindersByUserId(req.user.id);
    console.log("\n=== LEMBRETES - DEBUG - DADOS ORIGINAIS DO BANCO ===");
    console.log(JSON.stringify(reminders2, null, 2));
    console.log("=================================================\n");
    const remindersWithTimezone = addTimezoneToReminders(reminders2);
    console.log("\n=== LEMBRETES - GET ALL - SUCCESS RESPONSE (200) ===");
    console.log(`Total de lembretes: ${remindersWithTimezone.length}`);
    console.log(JSON.stringify(remindersWithTimezone, null, 2));
    console.log("================================================\n");
    return res.status(200).json(remindersWithTimezone);
  } catch (error) {
    const errorResponse = { error: "Erro ao obter lembretes" };
    console.error("\n=== LEMBRETES - GET ALL - SERVER ERROR (500) ===");
    console.error(error);
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("=============================================\n");
    return res.status(500).json(errorResponse);
  }
}
async function getReminder(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inv\xE1lido" });
    }
    const reminder = await storage.getReminderById(id);
    if (!reminder) {
      return res.status(404).json({ error: "Lembrete n\xE3o encontrado" });
    }
    if (reminder.usuario_id !== req.user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const reminderWithTimezone = addTimezoneToReminder(reminder);
    return res.status(200).json(reminderWithTimezone);
  } catch (error) {
    console.error("Error getting reminder:", error);
    return res.status(500).json({ error: "Erro ao obter lembrete" });
  }
}
async function createReminder(req, res) {
  console.log("\n=== LEMBRETES - CREATE - REQUEST PAYLOAD ===");
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Usu\xE1rio ID: ${req.user?.id || "N\xE3o autenticado"}`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log("==========================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== LEMBRETES - CREATE - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(401).json(errorResponse);
    }
    const validationResult = insertReminderSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorResponse = {
        error: "Dados inv\xE1lidos",
        details: validationResult.error.errors
      };
      console.log("\n=== LEMBRETES - CREATE - VALIDATION ERROR ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("========================================\n");
      return res.status(400).json(errorResponse);
    }
    const reminderData = {
      ...validationResult.data,
      data_lembrete: convertFromSaoPauloToUTC(
        validationResult.data.data_lembrete
      ),
      usuario_id: req.user.id
    };
    console.log(
      "\n=== LEMBRETES - CREATE - VALIDATED DATA (PASSOU POR AQUI?) ==="
    );
    console.log(JSON.stringify(reminderData, null, 2));
    console.log("========================================\n");
    const reminder = await storage.createReminder(reminderData);
    const reminderWithTimezone = addTimezoneToReminder(reminder);
    console.log("\n=== LEMBRETES - CREATE - SUCCESS RESPONSE (201) ===");
    console.log(`ID do lembrete criado: ${reminderWithTimezone.id}`);
    console.log(JSON.stringify(reminderWithTimezone, null, 2));
    console.log("==============================================\n");
    return res.status(201).json(reminderWithTimezone);
  } catch (error) {
    const errorResponse = { error: "Erro ao criar lembrete" };
    console.error("\n=== LEMBRETES - CREATE - SERVER ERROR (500) ===");
    console.error(error);
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("============================================\n");
    return res.status(500).json(errorResponse);
  }
}
async function updateReminder(req, res) {
  console.log("\n=== LEMBRETES - UPDATE - REQUEST PAYLOAD ===");
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`ID do Lembrete: ${req.params.id}`);
  console.log(`Usu\xE1rio ID: ${req.user?.id || "N\xE3o autenticado"}`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log("===========================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== LEMBRETES - UPDATE - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("=============================================\n");
      return res.status(401).json(errorResponse);
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const errorResponse = { error: "ID inv\xE1lido" };
      console.log("\n=== LEMBRETES - UPDATE - INVALID ID ===");
      console.log(`Valor do par\xE2metro id: ${req.params.id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("====================================\n");
      return res.status(400).json(errorResponse);
    }
    const reminder = await storage.getReminderById(id);
    if (!reminder) {
      const errorResponse = { error: "Lembrete n\xE3o encontrado" };
      console.log("\n=== LEMBRETES - UPDATE - NOT FOUND (404) ===");
      console.log(`ID do lembrete buscado: ${id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("=========================================\n");
      return res.status(404).json(errorResponse);
    }
    if (reminder.usuario_id !== req.user.id) {
      const errorResponse = { error: "Acesso negado" };
      console.log("\n=== LEMBRETES - UPDATE - ACCESS DENIED (403) ===");
      console.log(
        `Usu\xE1rio solicitante: ${req.user.id}, Propriet\xE1rio do lembrete: ${reminder.usuario_id}`
      );
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("==============================================\n");
      return res.status(403).json(errorResponse);
    }
    const validationResult = updateReminderSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorResponse = {
        error: "Dados inv\xE1lidos",
        details: validationResult.error.errors
      };
      console.log("\n=== LEMBRETES - UPDATE - VALIDATION ERROR ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("==========================================\n");
      return res.status(400).json(errorResponse);
    }
    const updateData = { ...validationResult.data };
    if (updateData.data_lembrete) {
      updateData.data_lembrete = convertFromSaoPauloToUTC(
        updateData.data_lembrete
      );
    }
    console.log("\n=== LEMBRETES - UPDATE - VALIDATED DATA ===");
    console.log(`ID do lembrete: ${id}`);
    console.log(JSON.stringify(updateData, null, 2));
    console.log("========================================\n");
    const updatedReminder = await storage.updateReminder(id, updateData);
    if (!updatedReminder) {
      const errorResponse = { error: "Erro ao atualizar lembrete" };
      console.log("\n=== LEMBRETES - UPDATE - UPDATE FAILED (500) ===");
      console.log(`ID do lembrete: ${id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("============================================\n");
      return res.status(500).json(errorResponse);
    }
    const updatedReminderWithTimezone = addTimezoneToReminder(updatedReminder);
    console.log("\n=== LEMBRETES - UPDATE - SUCCESS RESPONSE (200) ===");
    console.log(`ID do lembrete atualizado: ${updatedReminderWithTimezone.id}`);
    console.log(JSON.stringify(updatedReminderWithTimezone, null, 2));
    console.log("================================================\n");
    return res.status(200).json(updatedReminderWithTimezone);
  } catch (error) {
    const errorResponse = { error: "Erro ao atualizar lembrete" };
    console.error("\n=== LEMBRETES - UPDATE - SERVER ERROR (500) ===");
    console.error(error);
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("============================================\n");
    return res.status(500).json(errorResponse);
  }
}
async function deleteReminder(req, res) {
  console.log("\n=== LEMBRETES - DELETE - REQUEST ===");
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`ID do Lembrete: ${req.params.id}`);
  console.log(`Usu\xE1rio ID: ${req.user?.id || "N\xE3o autenticado"}`);
  console.log("====================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log("\n=== LEMBRETES - DELETE - ERROR RESPONSE (401) ===");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("=============================================\n");
      return res.status(401).json(errorResponse);
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const errorResponse = { error: "ID inv\xE1lido" };
      console.log("\n=== LEMBRETES - DELETE - INVALID ID ===");
      console.log(`Valor do par\xE2metro id: ${req.params.id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("====================================\n");
      return res.status(400).json(errorResponse);
    }
    const reminder = await storage.getReminderById(id);
    if (!reminder) {
      const errorResponse = { error: "Lembrete n\xE3o encontrado" };
      console.log("\n=== LEMBRETES - DELETE - NOT FOUND (404) ===");
      console.log(`ID do lembrete buscado: ${id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("=========================================\n");
      return res.status(404).json(errorResponse);
    }
    if (reminder.usuario_id !== req.user.id) {
      const errorResponse = { error: "Acesso negado" };
      console.log("\n=== LEMBRETES - DELETE - ACCESS DENIED (403) ===");
      console.log(
        `Usu\xE1rio solicitante: ${req.user.id}, Propriet\xE1rio do lembrete: ${reminder.usuario_id}`
      );
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("==============================================\n");
      return res.status(403).json(errorResponse);
    }
    console.log("\n=== LEMBRETES - DELETE - PROCESSING ===");
    console.log(`Excluindo lembrete ID: ${id}`);
    console.log("=====================================\n");
    const success = await storage.deleteReminder(id);
    if (success) {
      console.log("\n=== LEMBRETES - DELETE - SUCCESS (204) ===");
      console.log(`Lembrete ID ${id} exclu\xEDdo com sucesso`);
      console.log("========================================\n");
      return res.status(204).end();
    } else {
      const errorResponse = { error: "Erro ao excluir lembrete" };
      console.log("\n=== LEMBRETES - DELETE - FAILED (500) ===");
      console.log(`ID do lembrete: ${id}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("======================================\n");
      return res.status(500).json(errorResponse);
    }
  } catch (error) {
    const errorResponse = { error: "Erro ao excluir lembrete" };
    console.error("\n=== LEMBRETES - DELETE - SERVER ERROR (500) ===");
    console.error(error);
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("============================================\n");
    return res.status(500).json(errorResponse);
  }
}
async function getRemindersByDateRange(req, res) {
  console.log("\n=== LEMBRETES - GET BY DATE RANGE - REQUEST ===");
  console.log(`M\xE9todo HTTP: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Usu\xE1rio ID: ${req.user?.id || "N\xE3o autenticado"}`);
  console.log(`Par\xE2metros: ${JSON.stringify(req.query)}`);
  console.log("============================================\n");
  try {
    if (!req.user) {
      const errorResponse = { error: "N\xE3o autenticado" };
      console.log(
        "\n=== LEMBRETES - GET BY DATE RANGE - ERROR RESPONSE (401) ==="
      );
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("======================================================\n");
      return res.status(401).json(errorResponse);
    }
    const startDateParam = req.query.start_date;
    const endDateParam = req.query.end_date;
    if (!startDateParam || !endDateParam) {
      const errorResponse = { error: "Datas de in\xEDcio e fim s\xE3o obrigat\xF3rias" };
      console.log(
        "\n=== LEMBRETES - GET BY DATE RANGE - MISSING PARAMETERS ==="
      );
      console.log(
        `Par\xE2metros recebidos: start_date=${startDateParam}, end_date=${endDateParam}`
      );
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("====================================================\n");
      return res.status(400).json(errorResponse);
    }
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const errorResponse = { error: "Datas inv\xE1lidas" };
      console.log("\n=== LEMBRETES - GET BY DATE RANGE - INVALID DATES ===");
      console.log(`start_date=${startDateParam}, end_date=${endDateParam}`);
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("===============================================\n");
      return res.status(400).json(errorResponse);
    }
    console.log("\n=== LEMBRETES - GET BY DATE RANGE - PROCESSING ===");
    console.log(`Usu\xE1rio: ${req.user.id}`);
    console.log(
      `Intervalo: ${startDate.toISOString()} at\xE9 ${endDate.toISOString()}`
    );
    console.log("===============================================\n");
    const reminders2 = await storage.getRemindersByDateRange(
      req.user.id,
      startDate,
      endDate
    );
    console.log(
      "\n=== LEMBRETES - GET BY DATE RANGE - SUCCESS RESPONSE (200) ==="
    );
    console.log(`Total de lembretes encontrados: ${reminders2.length}`);
    console.log(
      `Intervalo: ${startDate.toISOString()} at\xE9 ${endDate.toISOString()}`
    );
    console.log(JSON.stringify(reminders2, null, 2));
    console.log("========================================================\n");
    return res.status(200).json(reminders2);
  } catch (error) {
    const errorResponse = {
      error: "Erro ao obter lembretes por intervalo de datas"
    };
    console.error(
      "\n=== LEMBRETES - GET BY DATE RANGE - SERVER ERROR (500) ==="
    );
    console.error(error);
    console.log(JSON.stringify(errorResponse, null, 2));
    console.log("=====================================================\n");
    return res.status(500).json(errorResponse);
  }
}

// server/controllers/admin.controller.ts
init_storage();
import { z as z6 } from "zod";
import bcrypt4 from "bcryptjs";

// server/types/session.types.ts
import "express-session";

// server/controllers/admin.controller.ts
async function getAdminStats(req, res) {
  try {
    console.log("=== ADMIN STATS - REQUEST ===");
    console.log(`Super Admin: ${req.user?.email} (${req.user?.tipo_usuario})`);
    console.log("============================");
    const allUsers = await storage.getAllUsers();
    const usuariosAtivos = allUsers.filter(
      (user) => user.ativo === true && user.status_assinatura !== "cancelada" && !user.data_cancelamento
    );
    const usuariosCancelados = allUsers.filter(
      (user) => user.status_assinatura === "cancelada" || user.data_cancelamento !== null
    );
    const usuariosInativos = allUsers.filter(
      (user) => user.ativo === false && user.status_assinatura !== "cancelada" && !user.data_cancelamento
    );
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: usuariosAtivos.length,
      canceledUsers: usuariosCancelados.length,
      inactiveUsers: usuariosInativos.length,
      totalTransactions: 0,
      totalWallets: 0,
      totalCancelamentos: usuariosCancelados.length,
      systemHealth: "OK"
    };
    try {
      const walletStats = await storage.getWalletStatsForAllUsers();
      stats.totalWallets = walletStats.length;
      stats.totalTransactions = walletStats.reduce((total, wallet) => total + wallet.transactionCount, 0);
    } catch (error) {
      console.log("Erro ao buscar dados do sistema:", error);
    }
    console.log("=== ADMIN STATS - RESPONSE ===");
    console.log(JSON.stringify(stats, null, 2));
    console.log("==============================");
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getAdminStats:", error);
    res.status(500).json({ error: "Erro ao obter estat\xEDsticas do sistema" });
  }
}
var RecentUsersController = class {
  /**
   * @swagger
   * /api/admin/recent-users:
   *   get:
   *     summary: Get recent users (last 5 registered)
   *     tags: [Admin]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Recent users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  static async getRecentUsers(req, res) {
    try {
      console.log("=== RECENT USERS - REQUEST ===");
      console.log(`Admin: ${req.user?.email} (${req.user?.tipo_usuario})`);
      console.log("============================");
      if (req.user?.tipo_usuario !== "super_admin") {
        return res.status(403).json({ error: "Acesso negado: requer privil\xE9gios de super administrador" });
      }
      const recentUsers = await storage.getRecentUsers(5);
      console.log("=== RECENT USERS - RESPONSE ===");
      console.log(`Total de usu\xE1rios recentes: ${recentUsers.length}`);
      console.log("==============================");
      res.json(recentUsers);
    } catch (error) {
      console.error("Error in getRecentUsers:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
async function getAdminUsers(req, res) {
  try {
    console.log("=== ADMIN USERS - REQUEST ===");
    console.log(`Super Admin: ${req.user?.email}`);
    console.log("============================");
    const [allUsers, walletStats] = await Promise.all([
      storage.getAllUsers(),
      storage.getWalletStatsForAllUsers()
    ]);
    const statsMap = new Map(
      walletStats.map((stat) => [stat.userId, {
        transactionCount: stat.transactionCount,
        walletBalance: stat.balance
      }])
    );
    const usersWithStats = allUsers.map((user) => {
      const stats = statsMap.get(user.id) || { transactionCount: 0, walletBalance: 0 };
      return {
        ...user,
        transactionCount: stats.transactionCount,
        walletBalance: stats.walletBalance,
        lastAccess: user.ultimo_acesso
      };
    });
    console.log("=== ADMIN USERS - RESPONSE ===");
    console.log(`Total de usu\xE1rios: ${usersWithStats.length}`);
    console.log("==============================");
    res.status(200).json(usersWithStats);
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    res.status(500).json({ error: "Erro ao obter lista de usu\xE1rios" });
  }
}
async function impersonateUser(req, res) {
  try {
    console.log("=== ADMIN IMPERSONATE - REQUEST ===");
    console.log(`Super Admin: ${req.user?.email} (ID: ${req.user?.id})`);
    console.log("Request body:", req.body);
    console.log("==================================");
    const schema = z6.object({
      targetUserId: z6.number()
    });
    const { targetUserId } = schema.parse(req.body);
    const targetUser = await storage.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (!targetUser.ativo) {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel personificar um usu\xE1rio inativo" });
    }
    if (targetUser.tipo_usuario === "super_admin") {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel personificar outro super administrador" });
    }
    if (targetUser.id === req.user.id) {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel personificar a si mesmo" });
    }
    if (!req.session.originalAdmin) {
      req.session.originalAdmin = req.user;
    }
    const session2 = await storage.createImpersonationSession(req.user.id, targetUserId);
    req.session.user = {
      id: targetUser.id,
      email: targetUser.email,
      nome: targetUser.nome,
      tipo_usuario: targetUser.tipo_usuario
    };
    req.session.isImpersonating = true;
    console.log("=== ADMIN IMPERSONATE - SUCCESS ===");
    console.log(`Sess\xE3o criada: ${session2.id}`);
    console.log(`Personificando: ${targetUser.nome} (${targetUser.email})`);
    console.log("==================================");
    res.status(200).json({
      message: "Personifica\xE7\xE3o iniciada com sucesso",
      sessionId: session2.id,
      targetUser: {
        id: targetUser.id,
        nome: targetUser.nome,
        email: targetUser.email,
        tipo_usuario: targetUser.tipo_usuario
      }
    });
  } catch (error) {
    if (error instanceof z6.ZodError) {
      console.log("=== VALIDATION ERROR ===");
      console.log("Errors:", error.errors);
      console.log("========================");
      return res.status(400).json({ error: "Dados inv\xE1lidos", details: error.errors });
    }
    console.error("Error in impersonateUser:", error);
    res.status(500).json({ error: "Erro ao iniciar personifica\xE7\xE3o" });
  }
}
async function stopImpersonation(req, res) {
  try {
    console.log("=== ADMIN STOP IMPERSONATE - REQUEST ===");
    console.log(`Current User: ${req.user?.email} (ID: ${req.user?.id})`);
    console.log(`Session isImpersonating: ${req.session?.isImpersonating}`);
    console.log(`Session originalAdmin: ${req.session?.originalAdmin?.email}`);
    console.log("=======================================");
    if (!req.session?.isImpersonating || !req.session?.originalAdmin) {
      return res.status(404).json({ error: "Nenhuma sess\xE3o de personifica\xE7\xE3o ativa" });
    }
    const activeSession = await storage.getActiveImpersonationSession(req.user.id);
    if (activeSession) {
      await storage.endImpersonationSession(activeSession.id);
    }
    const originalAdmin = await storage.getUserById(req.session.originalAdmin.id);
    if (!originalAdmin) {
      return res.status(400).json({ error: "Administrador original n\xE3o encontrado" });
    }
    req.session.userId = originalAdmin.id;
    delete req.session.user;
    delete req.session.originalAdmin;
    req.session.isImpersonating = false;
    console.log("=== ADMIN STOP IMPERSONATE - SUCCESS ===");
    console.log(`Sess\xE3o encerrada. Retornando para: ${originalAdmin.nome}`);
    console.log("=======================================");
    res.status(200).json({
      message: "Personifica\xE7\xE3o encerrada com sucesso"
    });
  } catch (error) {
    console.error("Error in stopImpersonation:", error);
    res.status(500).json({ error: "Erro ao encerrar personifica\xE7\xE3o" });
  }
}
async function updateUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { ativo } = req.body;
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usu\xE1rio inv\xE1lido" });
    }
    if (typeof ativo !== "boolean") {
      return res.status(400).json({ error: "Status ativo deve ser um valor booleano" });
    }
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (targetUser.tipo_usuario === "super_admin" && !ativo) {
      return res.status(403).json({ error: "N\xE3o \xE9 poss\xEDvel desativar super administradores" });
    }
    const isActivatingInactiveUser = ativo === true && targetUser.ativo === false && req.user?.tipo_usuario === "super_admin";
    const updateData = { ativo };
    if (ativo && (targetUser.status_assinatura === "cancelada" || targetUser.data_cancelamento)) {
      updateData.status_assinatura = "ativa";
      updateData.data_cancelamento = null;
      updateData.motivo_cancelamento = null;
      console.log("=== LIMPANDO DADOS DE CANCELAMENTO ===");
      console.log(`Usu\xE1rio ${targetUser.nome} reativado - removendo status de cancelamento`);
      console.log("=====================================");
    }
    const updatedUser = await storage.updateUser(userId, updateData);
    if (isActivatingInactiveUser) {
      try {
        console.log("=== ENVIANDO WEBHOOK DE ATIVA\xC7\xC3O (STATUS) ===");
        console.log(`Super Admin ${req.user?.nome} ativou usu\xE1rio ${updatedUser.nome}`);
        const userTokens = await storage.getApiTokensByUserId(updatedUser.id);
        const userToken = userTokens && userTokens.length > 0 ? userTokens[0].token : null;
        const generateRandomPassword = (length = 8) => {
          const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let password = "";
          for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
          }
          return password;
        };
        const newPassword = generateRandomPassword(8);
        const hashedPassword = await bcrypt4.hash(newPassword, 10);
        await storage.updateUser(updatedUser.id, { senha: hashedPassword });
        console.log(`Nova senha gerada para o usu\xE1rio ${updatedUser.nome}: ${newPassword}`);
        let activationMessage = {
          title: "Sua conta foi ativada!",
          message: "Ol\xE1! Sua conta foi ativada com sucesso. Agora voc\xEA tem acesso completo a todos os recursos da plataforma.",
          email_content: "Sua conta foi ativada com sucesso!"
        };
        try {
          const postgres8 = (await import("postgres")).default;
          const client2 = postgres8(process.env.DATABASE_URL || "", { prepare: false });
          const result = await client2`
            SELECT title, message, email_content 
            FROM welcome_messages 
            WHERE type = 'activated'
          `;
          if (result.length > 0) {
            activationMessage = result[0];
            activationMessage.title = activationMessage.title.replace("{nome}", updatedUser.nome);
            activationMessage.message = activationMessage.message.replace("{nome}", updatedUser.nome);
            activationMessage.email_content = activationMessage.email_content?.replace("{nome}", updatedUser.nome) || activationMessage.message;
          }
          await client2.end();
        } catch (msgError) {
          console.error("Erro ao buscar mensagem de ativa\xE7\xE3o, usando padr\xE3o:", msgError);
        }
        const webhookData = {
          evento: "usuario_ativado",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          dominio: process.env.BASE_URL || "https://financehub.xpiria.com.br",
          id: updatedUser.id,
          nome: updatedUser.nome,
          email: updatedUser.email,
          telefone: updatedUser.telefone,
          tipo_usuario: updatedUser.tipo_usuario,
          data_cadastro: updatedUser.data_cadastro,
          token: userToken,
          acesso_web: {
            usuario: updatedUser.email,
            senha: newPassword
          },
          mensagem_ativacao: {
            titulo: activationMessage.title,
            mensagem: activationMessage.message,
            conteudo_email: activationMessage.email_content
          }
        };
        console.log("=== WEBHOOK DATA ===");
        console.log(JSON.stringify(webhookData, null, 2));
        console.log("====================");
        const webhookResponse = await fetch(process.env.WEBHOOK_ATIVACAO_URL || "https://prod-wf.pulsofinanceiro.net.br/webhook/ativacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(webhookData)
        });
        console.log(`Webhook Response Status: ${webhookResponse.status}`);
        const responseText = await webhookResponse.text();
        console.log(`Webhook Response Body: ${responseText}`);
        if (webhookResponse.ok) {
          console.log("\u2705 Webhook de ativa\xE7\xE3o enviado com sucesso");
        } else {
          console.error("\u274C Erro ao enviar webhook:", webhookResponse.status, responseText);
        }
        console.log("==============================================");
      } catch (webhookError) {
        console.error("Erro ao enviar webhook de ativa\xE7\xE3o:", webhookError);
      }
    }
    console.log("=== USER STATUS UPDATE ===");
    console.log(`Usu\xE1rio ${targetUser.nome} (${targetUser.email}) ${ativo ? "ativado" : "desativado"}`);
    console.log("==========================");
    res.json({
      message: `Usu\xE1rio ${ativo ? "ativado" : "desativado"} com sucesso`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Erro ao atualizar status do usu\xE1rio:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
async function getImpersonationStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const session2 = req.session;
    if (!session2.isImpersonating) {
      return res.status(200).json({
        isImpersonating: false,
        originalAdmin: null,
        currentUser: req.user
      });
    }
    const originalAdmin = await storage.getUserById(session2.originalAdmin.id);
    if (!originalAdmin) {
      session2.isImpersonating = false;
      delete session2.originalAdmin;
      delete session2.user;
      return res.status(200).json({
        isImpersonating: false,
        originalAdmin: null,
        currentUser: req.user
      });
    }
    const { senha, ...adminWithoutPassword } = originalAdmin;
    const response = {
      isImpersonating: true,
      originalAdmin: adminWithoutPassword,
      currentUser: req.user
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getImpersonationStatus:", error);
    res.status(500).json({ error: "Erro ao verificar status de personifica\xE7\xE3o" });
  }
}
async function resetUserData(req, res) {
  try {
    const userId = parseInt(req.params.id);
    console.log("=== ADMIN RESET USER - REQUEST ===");
    console.log(`Admin: ${req.user?.email}`);
    console.log(`Target User ID: ${userId}`);
    console.log("==================================");
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usu\xE1rio inv\xE1lido" });
    }
    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (userId === req.user?.id) {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel resetar seus pr\xF3prios dados" });
    }
    console.log(`Resetando dados do usu\xE1rio: ${targetUser.email}`);
    const wallet = await storage.getWalletByUserId(userId);
    let transactionsRemoved = 0;
    if (wallet) {
      const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
      transactionsRemoved = transactions2.length;
      for (const transaction of transactions2) {
        await storage.deleteTransaction(transaction.id);
      }
      await storage.updateWallet(wallet.id, { saldo_atual: "0.00" });
    }
    const reminders2 = await storage.getRemindersByUserId(userId);
    const remindersRemoved = reminders2.length;
    for (const reminder of reminders2) {
      await storage.deleteReminder(reminder.id);
    }
    const userCategories = await storage.getCategoriesByUserId(userId);
    const personalCategories = userCategories.filter((cat) => !cat.global);
    const categoriesRemoved = personalCategories.length;
    for (const category of personalCategories) {
      await storage.deleteCategory(category.id);
    }
    const apiTokens2 = await storage.getApiTokensByUserId(userId);
    const tokensToRemove = apiTokens2.slice(1);
    const tokensRemoved = tokensToRemove.length;
    for (const token of tokensToRemove) {
      await storage.deleteApiToken(token.id);
    }
    await storage.updateUser(userId, {
      ultimo_acesso: /* @__PURE__ */ new Date(),
      ativo: true,
      tipo_usuario: "usuario"
    });
    const resetData = {
      transactionsRemoved,
      remindersRemoved,
      categoriesRemoved,
      tokensRemoved
    };
    console.log("=== ADMIN RESET USER - SUCCESS ===");
    console.log(`Usu\xE1rio ${targetUser.email} resetado:`);
    console.log(`- Transa\xE7\xF5es removidas: ${transactionsRemoved}`);
    console.log(`- Lembretes removidos: ${remindersRemoved}`);
    console.log(`- Categorias removidas: ${categoriesRemoved}`);
    console.log(`- Tokens removidos: ${tokensRemoved}`);
    console.log("==================================");
    res.status(200).json({
      message: `Dados do usu\xE1rio ${targetUser.nome} foram resetados com sucesso`,
      userId,
      resetData
    });
  } catch (error) {
    console.error("Error in resetUserData:", error);
    res.status(500).json({ error: "Erro ao resetar dados do usu\xE1rio" });
  }
}
async function getAuditLog(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const allSessions = await storage.getAllAdminSessions();
    const paginatedLogs = allSessions.slice(offset, offset + limit);
    const enrichedLogs = await Promise.all(
      paginatedLogs.map(async (session2) => {
        const superAdmin = await storage.getUserById(session2.super_admin_id);
        const targetUser = await storage.getUserById(session2.target_user_id);
        return {
          ...session2,
          super_admin_name: superAdmin?.nome || "Usu\xE1rio removido",
          super_admin_email: superAdmin?.email || "",
          target_user_name: targetUser?.nome || "Usu\xE1rio removido",
          target_user_email: targetUser?.email || "",
          acao: session2.data_fim ? "Personifica\xE7\xE3o encerrada" : "Personifica\xE7\xE3o ativa"
        };
      })
    );
    console.log("=== AUDIT LOG REQUEST ===");
    console.log(`Retornando ${enrichedLogs.length} logs de auditoria`);
    console.log("========================");
    res.json({
      logs: enrichedLogs,
      total: allSessions.length,
      limit,
      offset
    });
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
async function createUser(req, res) {
  try {
    console.log("=== ADMIN CREATE USER - REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Super Admin:", req.user?.email);
    console.log("===============================");
    const { nome, email, senha, tipo_usuario = "usuario", telefone } = req.body;
    if (telefone && telefone.trim() !== "") {
      let digits = telefone.replace(/\D/g, "");
      if (!digits.startsWith("55")) {
        digits = "55" + digits;
      }
      if (digits.length < 12 || digits.length > 13) {
        return res.status(400).json({ error: "Telefone deve ter 10 ou 11 d\xEDgitos (sem DDI) ou 12/13 com DDI" });
      }
      req.body.telefone = digits;
    }
    if (req.body.telefone) {
      const existingPhoneUser = await storage.getUserByPhone(req.body.telefone);
      if (existingPhoneUser) {
        return res.status(400).json({ error: "Este n\xFAmero de telefone j\xE1 est\xE1 em uso por outro usu\xE1rio." });
      }
    }
    console.log("Dados extra\xEDdos:", { nome, email, senha: senha ? "***" : void 0, tipo_usuario });
    if (!nome || !email || !senha) {
      console.log("Erro: Campos obrigat\xF3rios faltando");
      return res.status(400).json({ error: "Nome, email e senha s\xE3o obrigat\xF3rios" });
    }
    console.log("Verificando se email j\xE1 existe...");
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      console.log("Erro: Email j\xE1 existe");
      return res.status(400).json({ error: "Email j\xE1 est\xE1 em uso" });
    }
    console.log("Criando usu\xE1rio no banco...");
    const userData = {
      nome,
      email,
      senha,
      // senha em texto puro
      tipo_usuario,
      ativo: true,
      telefone
      // incluir telefone se fornecido
    };
    console.log("User data:", { ...userData, senha: "***" });
    const newUser = await storage.createUser(userData);
    console.log("Usu\xE1rio criado:", { id: newUser.id, nome: newUser.nome, email: newUser.email });
    console.log("Criando carteira para o usu\xE1rio...");
    const walletData = {
      usuario_id: newUser.id,
      nome: "Principal",
      descricao: "Carteira principal",
      saldo_atual: 0
    };
    console.log("Wallet data:", walletData);
    const wallet = await storage.createWallet(walletData);
    console.log("Carteira criada:", { id: wallet.id, nome: wallet.nome });
    console.log("=== USU\xC1RIO CRIADO COM SUCESSO ===");
    res.status(201).json({
      message: "Usu\xE1rio criado com sucesso",
      user: { ...newUser, senha: void 0 }
    });
  } catch (error) {
    console.error("=== ERRO NA CRIA\xC7\xC3O DO USU\xC1RIO ===");
    console.error("Error details:", error);
    console.error("Error message:", error?.message || "Erro desconhecido");
    console.error("Error stack:", error?.stack);
    console.error("================================");
    res.status(500).json({ error: "Erro ao criar usu\xE1rio: " + (error?.message || "Erro desconhecido") });
  }
}
async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usu\xE1rio inv\xE1lido" });
    }
    const existingUser = await storage.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (userId === req.user.id && req.body.ativo === false) {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel desativar sua pr\xF3pria conta" });
    }
    console.log("=== ADMIN UPDATE USER - REQUEST ===");
    console.log(`Atualizando usu\xE1rio: ${existingUser.nome} (${existingUser.email})`);
    console.log("Dados recebidos:", JSON.stringify(req.body, null, 2));
    console.log("=====================================");
    const updateData = { ...req.body };
    delete updateData.nova_senha;
    if (updateData.telefone) {
      const existingPhoneUser = await storage.getUserByPhone(updateData.telefone);
      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        return res.status(400).json({ error: "Este n\xFAmero de telefone j\xE1 est\xE1 em uso por outro usu\xE1rio." });
      }
    }
    const isActivatingInactiveUser = req.body.ativo === true && existingUser.ativo === false && req.user?.tipo_usuario === "super_admin";
    if (req.body.ativo === true && (existingUser.status_assinatura === "cancelada" || existingUser.data_cancelamento)) {
      updateData.status_assinatura = "ativa";
      updateData.data_cancelamento = null;
      updateData.motivo_cancelamento = null;
      console.log("=== LIMPANDO DADOS DE CANCELAMENTO (UPDATE) ===");
      console.log(`Usu\xE1rio ${existingUser.nome} reativado - removendo status de cancelamento`);
      console.log("=============================================");
    }
    if (req.body.data_expiracao_assinatura) {
      const expirationDate = new Date(req.body.data_expiracao_assinatura);
      updateData.data_expiracao_assinatura = expirationDate;
      console.log(`Data de expira\xE7\xE3o definida: ${expirationDate.toISOString()}`);
    } else if (req.body.data_expiracao_assinatura === "") {
      updateData.data_expiracao_assinatura = null;
      console.log("Assinatura definida como ilimitada");
    }
    const updatedUser = await storage.updateUser(userId, updateData);
    if (!updatedUser) {
      return res.status(500).json({ error: "Erro ao atualizar usu\xE1rio" });
    }
    if (req.body.nova_senha && req.body.nova_senha.trim()) {
      console.log("Atualizando senha do usu\xE1rio...");
      const hashedPassword = await bcrypt4.hash(req.body.nova_senha, 10);
      await storage.updateUser(userId, { senha: hashedPassword });
      console.log("Senha atualizada com sucesso");
    }
    if (isActivatingInactiveUser) {
      try {
        console.log("=== ENVIANDO WEBHOOK DE ATIVA\xC7\xC3O ===");
        console.log(`Super Admin ${req.user?.nome} ativou usu\xE1rio ${updatedUser.nome}`);
        console.log(`isActivatingInactiveUser: ${isActivatingInactiveUser}`);
        console.log(`req.body.ativo: ${req.body.ativo}`);
        console.log(`existingUser.ativo: ${existingUser.ativo}`);
        console.log(`req.user?.tipo_usuario: ${req.user?.tipo_usuario}`);
        const userTokens = await storage.getApiTokensByUserId(updatedUser.id);
        const userToken = userTokens && userTokens.length > 0 ? userTokens[0].token : null;
        const generateRandomPassword = (length = 8) => {
          const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          let password = "";
          for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
          }
          return password;
        };
        const newPassword = generateRandomPassword(8);
        const hashedPassword = await bcrypt4.hash(newPassword, 10);
        await storage.updateUser(updatedUser.id, { senha: hashedPassword });
        console.log(`Nova senha gerada para o usu\xE1rio ${updatedUser.nome}: ${newPassword}`);
        let activationMessage = {
          title: "Sua conta foi ativada!",
          message: "Ol\xE1! Sua conta foi ativada com sucesso. Agora voc\xEA tem acesso completo a todos os recursos da plataforma.",
          email_content: "Sua conta foi ativada com sucesso!"
        };
        try {
          const postgres8 = (await import("postgres")).default;
          const client2 = postgres8(process.env.DATABASE_URL || "", { prepare: false });
          const result = await client2`
            SELECT title, message, email_content 
            FROM welcome_messages 
            WHERE type = 'activated'
          `;
          if (result.length > 0) {
            activationMessage = result[0];
            activationMessage.title = activationMessage.title.replace("{nome}", updatedUser.nome);
            activationMessage.message = activationMessage.message.replace("{nome}", updatedUser.nome);
            activationMessage.email_content = activationMessage.email_content?.replace("{nome}", updatedUser.nome) || activationMessage.message;
          }
          await client2.end();
        } catch (msgError) {
          console.error("Erro ao buscar mensagem de ativa\xE7\xE3o, usando padr\xE3o:", msgError);
        }
        const webhookData = {
          evento: "usuario_ativado",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          dominio: process.env.BASE_URL || "https://financehub.xpiria.com.br",
          id: updatedUser.id,
          nome: updatedUser.nome,
          email: updatedUser.email,
          telefone: updatedUser.telefone,
          tipo_usuario: updatedUser.tipo_usuario,
          data_cadastro: updatedUser.data_cadastro,
          token: userToken,
          acesso_web: {
            usuario: updatedUser.email,
            senha: newPassword
          },
          mensagem_ativacao: {
            titulo: activationMessage.title,
            mensagem: activationMessage.message,
            conteudo_email: activationMessage.email_content
          }
        };
        console.log("=== WEBHOOK DATA ===");
        console.log(JSON.stringify(webhookData, null, 2));
        console.log("====================");
        const webhookResponse = await fetch(process.env.WEBHOOK_ATIVACAO_URL || "https://prod-wf.pulsofinanceiro.net.br/webhook/ativacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(webhookData)
        });
        console.log(`Webhook Response Status: ${webhookResponse.status}`);
        const responseText = await webhookResponse.text();
        console.log(`Webhook Response Body: ${responseText}`);
        if (webhookResponse.ok) {
          console.log("\u2705 Webhook de ativa\xE7\xE3o enviado com sucesso");
        } else {
          console.error("\u274C Erro ao enviar webhook:", webhookResponse.status, responseText);
        }
        console.log("=====================================");
      } catch (webhookError) {
        console.error("Erro ao enviar webhook de ativa\xE7\xE3o:", webhookError);
      }
    }
    console.log("=== ADMIN UPDATE USER - SUCCESS ===");
    console.log(`Usu\xE1rio ${updatedUser.nome} atualizado com sucesso`);
    console.log("===================================");
    res.status(200).json({
      message: "Usu\xE1rio atualizado com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Erro ao atualizar usu\xE1rio" });
  }
}
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usu\xE1rio inv\xE1lido" });
    }
    const existingUser = await storage.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel deletar sua pr\xF3pria conta" });
    }
    if (req.query.permanente === "true") {
      const ok = await storage.deleteUserCascade(userId);
      if (!ok) {
        return res.status(500).json({ error: "Erro ao excluir usu\xE1rio permanentemente" });
      }
      return res.status(200).json({ message: "Usu\xE1rio exclu\xEDdo permanentemente" });
    }
    const updatedUser = await storage.updateUser(userId, { ativo: false });
    if (!updatedUser) {
      return res.status(500).json({ error: "Erro ao desativar usu\xE1rio" });
    }
    res.status(200).json({
      message: "Usu\xE1rio desativado com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Erro ao deletar usu\xE1rio" });
  }
}
async function resetGlobals(req, res) {
  try {
    if (!req.user || req.user.tipo_usuario !== "super_admin") {
      return res.status(403).json({ error: "Acesso negado: requer superadmin" });
    }
    await storage.deleteAllGlobalCategories();
    await storage.deleteAllGlobalPaymentMethods();
    const defaultCategories = [
      { nome: "Alimenta\xE7\xE3o", tipo: "Despesa", cor: "#FF6B6B", icone: "\u{1F37D}\uFE0F", descricao: "Gastos com alimenta\xE7\xE3o e refei\xE7\xF5es", global: true },
      { nome: "Transporte", tipo: "Despesa", cor: "#4ECDC4", icone: "\u{1F697}", descricao: "Gastos com transporte e locomo\xE7\xE3o", global: true },
      { nome: "Moradia", tipo: "Despesa", cor: "#45B7D1", icone: "\u{1F3E0}", descricao: "Gastos com moradia e aluguel", global: true },
      { nome: "Sa\xFAde", tipo: "Despesa", cor: "#96CEB4", icone: "\u{1F3E5}", descricao: "Gastos com sa\xFAde e medicamentos", global: true },
      { nome: "Educa\xE7\xE3o", tipo: "Despesa", cor: "#FFEAA7", icone: "\u{1F4DA}", descricao: "Gastos com educa\xE7\xE3o e cursos", global: true },
      { nome: "Lazer", tipo: "Despesa", cor: "#DDA0DD", icone: "\u{1F3AE}", descricao: "Gastos com lazer e entretenimento", global: true },
      { nome: "Vestu\xE1rio", tipo: "Despesa", cor: "#F8BBD9", icone: "\u{1F455}", descricao: "Gastos com roupas e acess\xF3rios", global: true },
      { nome: "Servi\xE7os", tipo: "Despesa", cor: "#FFB74D", icone: "\u{1F527}", descricao: "Gastos com servi\xE7os diversos", global: true },
      { nome: "Impostos", tipo: "Despesa", cor: "#A1887F", icone: "\u{1F4B0}", descricao: "Pagamento de impostos e taxas", global: true },
      { nome: "Outros", tipo: "Despesa", cor: "#90A4AE", icone: "\u{1F4E6}", descricao: "Outros gastos diversos", global: true },
      { nome: "Sal\xE1rio", tipo: "Receita", cor: "#4CAF50", icone: "\u{1F4BC}", descricao: "Receita de sal\xE1rio e trabalho", global: true },
      { nome: "Freelance", tipo: "Receita", cor: "#8BC34A", icone: "\u{1F4BB}", descricao: "Receita de trabalhos freelancer", global: true },
      { nome: "Investimentos", tipo: "Receita", cor: "#FFC107", icone: "\u{1F4C8}", descricao: "Receita de investimentos", global: true },
      { nome: "Presentes", tipo: "Receita", cor: "#E91E63", icone: "\u{1F381}", descricao: "Receita de presentes e doa\xE7\xF5es", global: true },
      { nome: "Reembolso", tipo: "Receita", cor: "#9C27B0", icone: "\u{1F4B8}", descricao: "Reembolsos e devolu\xE7\xF5es", global: true },
      { nome: "Outros", tipo: "Receita", cor: "#607D8B", icone: "\u{1F4E6}", descricao: "Outras receitas diversas", global: true }
    ];
    for (const category of defaultCategories) {
      await storage.createCategory(category);
    }
    const defaultPaymentMethods = [
      { nome: "PIX", descricao: "Pagamento via PIX", icone: "\u{1F4F1}", cor: "#32CD32", global: true, ativo: true },
      { nome: "Cart\xE3o de Cr\xE9dito", descricao: "Pagamento com cart\xE3o de cr\xE9dito", icone: "\u{1F4B3}", cor: "#FF6B35", global: true, ativo: true },
      { nome: "Dinheiro", descricao: "Pagamento em dinheiro", icone: "\u{1F4B5}", cor: "#4CAF50", global: true, ativo: true },
      { nome: "Cart\xE3o de D\xE9bito", descricao: "Pagamento com cart\xE3o de d\xE9bito", icone: "\u{1F3E6}", cor: "#2196F3", global: true, ativo: true },
      { nome: "Transfer\xEAncia", descricao: "Transfer\xEAncia banc\xE1ria", icone: "\u{1F3DB}\uFE0F", cor: "#9C27B0", global: true, ativo: true },
      { nome: "Boleto", descricao: "Pagamento via boleto", icone: "\u{1F4C4}", cor: "#FF9800", global: true, ativo: true }
    ];
    for (const method of defaultPaymentMethods) {
      await storage.createPaymentMethod(method);
    }
    res.json({ success: true, message: "Categorias e formas de pagamento globais resetadas com sucesso!" });
  } catch (error) {
    console.error("Erro ao resetar globais:", error);
    res.status(500).json({ success: false, message: "Erro ao resetar globais", error: error instanceof Error ? error.message : "Erro desconhecido" });
  }
}

// server/controllers/chart-svg.controller.ts
init_storage();
import fs from "fs";
import path from "path";
import sharp from "sharp";
async function generateBarChartSVG(req, res) {
  try {
    console.log("=== CHART GENERATION - BAR CHART SVG ===");
    console.log("Chart Generation: User ID", req.user?.id);
    const wallet = await storage.getWalletByUserId(req.user?.id);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const { date: date2 } = req.query;
    let startDate;
    let endDate;
    let periodType;
    let inputDate;
    if (date2) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date2)) {
        return res.status(400).json({ message: "Formato de data inv\xE1lido. Use YYYY-MM-DD" });
      }
      inputDate = new Date(date2);
      if (isNaN(inputDate.getTime())) {
        return res.status(400).json({ message: "Data inv\xE1lida" });
      }
      const [year, month, day] = date2.split("-").map(Number);
      inputDate = new Date(year, month - 1, day);
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        return res.status(400).json({ message: "Data n\xE3o pode ser no futuro" });
      }
      endDate = new Date(inputDate);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(inputDate);
      startDate.setDate(inputDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      console.log(`Chart Generation: Debug - Data informada: ${inputDate.toISOString().split("T")[0]}`);
      console.log(`Chart Generation: Debug - StartDate calculado: ${startDate.toISOString().split("T")[0]} (deveria ser ${inputDate.getDate() - 6}/${inputDate.getMonth() + 1}/${inputDate.getFullYear()})`);
      console.log(`Chart Generation: Debug - EndDate calculado: ${endDate.toISOString().split("T")[0]}`);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      console.log(`Chart Generation: Debug - Diferen\xE7a em dias: ${daysDiff} (deveria ser 7)`);
      periodType = "\xFAltimos 7 dias";
    } else {
      const today = /* @__PURE__ */ new Date();
      const currentDayOfWeek = today.getDay();
      const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - 7 - daysFromMonday);
      lastWeekStart.setHours(0, 0, 0, 0);
      startDate = lastWeekStart;
      endDate = new Date(lastWeekStart);
      endDate.setDate(lastWeekStart.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      periodType = "semana passada";
    }
    console.log(
      `Chart Generation: ${periodType} de`,
      startDate.toISOString(),
      "at\xE9",
      endDate.toISOString()
    );
    console.log(`Chart Generation: Data informada: ${date2}, Input date: ${inputDate?.toISOString()}`);
    const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
    console.log(`Chart Generation: Total de transa\xE7\xF5es encontradas: ${transactions2.length}`);
    const periodTransactions = transactions2.filter((t) => {
      const transactionDate = new Date(t.data_transacao);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    console.log(`Chart Generation: Transa\xE7\xF5es do per\xEDodo: ${periodTransactions.length}`);
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayTransactions = periodTransactions.filter((t) => {
        const transactionDate = new Date(t.data_transacao);
        const transactionDateLocal = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        const currentDateLocal = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        return transactionDateLocal.getTime() === currentDateLocal.getTime();
      });
      const income = dayTransactions.filter((t) => t.tipo === "Receita").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      const expense = dayTransactions.filter((t) => t.tipo === "Despesa").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      const dayName = currentDate.toLocaleDateString("pt-BR", {
        weekday: "short"
      });
      console.log(`Chart Generation: Dia ${i + 1} - ${currentDate.toISOString().split("T")[0]} (${dayName}): Receitas: ${income}, Despesas: ${expense}, Transa\xE7\xF5es: ${dayTransactions.length}`);
      if (dayTransactions.length > 0) {
        console.log(`Chart Generation: Transa\xE7\xF5es do dia ${currentDate.toISOString().split("T")[0]}:`, dayTransactions.map((t) => ({
          id: t.id,
          data: t.data_transacao,
          tipo: t.tipo,
          valor: t.valor,
          descricao: t.descricao
        })));
      }
      if (i === 6) {
        console.log(`Chart Generation: \xDALTIMO DIA - Este deveria ser a data informada: ${currentDate.toISOString().split("T")[0]}`);
      }
      dailyData.push({
        day: dayName,
        date: currentDate.toISOString().split("T")[0],
        income,
        expense
      });
    }
    console.log("Chart Generation: Dados processados", dailyData);
    const hasTransactions = dailyData.some((d) => d.income > 0 || d.expense > 0);
    if (!hasTransactions) {
      return res.status(200).json({
        success: false,
        message: `Nenhuma transa\xE7\xE3o encontrada no per\xEDodo de ${startDate.toLocaleDateString("pt-BR")} a ${endDate.toLocaleDateString("pt-BR")}`,
        period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0]
        },
        data: dailyData
      });
    }
    const width = 1280;
    const height = 720;
    const chartX = 100;
    const chartY = 120;
    const chartWidth = width - 200;
    const chartHeight = height - 240;
    const maxValue = Math.max(
      ...dailyData.map((d) => Math.max(d.income, d.expense))
    );
    const roundedMax = Math.ceil(maxValue / 1e3) * 1e3 || 1e3;
    const ySteps = 5;
    let yAxisLabels = "";
    let gridLines = "";
    for (let i = 0; i <= ySteps; i++) {
      const y = chartY + chartHeight - i * chartHeight / ySteps;
      const value = roundedMax / ySteps * i;
      gridLines += `<line x1="${chartX}" y1="${y}" x2="${chartX + chartWidth}" y2="${y}" stroke="#374151" stroke-width="1" stroke-dasharray="5,5"/>`;
      yAxisLabels += `<text x="${chartX - 10}" y="${y + 5}" fill="#9ca3af" font-family="Arial" font-size="16" text-anchor="end">R$${value.toLocaleString("pt-BR")}</text>`;
    }
    const barWidth = chartWidth / dailyData.length * 0.6;
    const barSpacing = chartWidth / dailyData.length;
    let bars = "";
    let dayLabels = "";
    dailyData.forEach((data, index) => {
      const x = chartX + index * barSpacing + (barSpacing - barWidth) / 2;
      const scale = chartHeight / roundedMax;
      if (data.income > 0) {
        const incomeHeight = data.income * scale;
        bars += `<rect x="${x}" y="${chartY + chartHeight - incomeHeight}" width="${barWidth * 0.45}" height="${incomeHeight}" fill="#4ade80"/>`;
        bars += `<text x="${x + barWidth * 0.225}" y="${chartY + chartHeight - incomeHeight - 5}" fill="#ffcc00" font-family="Arial" font-size="16" text-anchor="middle">R$${data.income.toLocaleString("pt-BR")}</text>`;
      }
      if (data.expense > 0) {
        const expenseHeight = data.expense * scale;
        bars += `<rect x="${x + barWidth * 0.55}" y="${chartY + chartHeight - expenseHeight}" width="${barWidth * 0.45}" height="${expenseHeight}" fill="#f87171"/>`;
        bars += `<text x="${x + barWidth * 0.775}" y="${chartY + chartHeight - expenseHeight - 5}" fill="#ffcc00" font-family="Arial" font-size="16" text-anchor="middle">R$${data.expense.toLocaleString("pt-BR")}</text>`;
      }
      dayLabels += `<text x="${x + barWidth / 2}" y="${chartY + chartHeight + 25}" fill="#9ca3af" font-family="Arial" font-size="14" text-anchor="middle">${data.day}</text>`;
    });
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#1f2937"/>
        
        <!-- Border -->
        <rect x="5" y="5" width="${width - 10}" height="${height - 10}" fill="none" stroke="#0088fe" stroke-width="2"/>
        
        <!-- Title -->
        <!-- Centralized Title -->
        <text x="50%" y="60" fill="#ffffff" font-family="Arial" font-size="32" font-weight="bold" text-anchor="middle">Receitas vs Despesas</text>
        <text x="50%" y="90" fill="#ffffff" font-family="Arial" font-size="16" text-anchor="middle">(${startDate.toLocaleDateString("pt-BR")} \xE0 ${endDate.toLocaleDateString("pt-BR")})</text>
        
        <!-- Grid lines -->
        ${gridLines}
        
        <!-- Y-axis labels -->
        ${yAxisLabels}
        
        <!-- Bars -->
        ${bars}
        
        <!-- Day labels -->
        ${dayLabels}
        <!-- Dates -->
        ${dailyData.map((data) => {
      const formattedDate = data.date.split("-").reverse().slice(0, 2).join("/");
      return `<text x="${chartX + dailyData.indexOf(data) * barSpacing + barWidth / 2 + 30}" y="${chartY + chartHeight + 45}" fill="#9ca3af" font-family="Arial" font-size="14" text-anchor="middle">${formattedDate}</text>`;
    }).join("")}        
        
        <!-- Legend -->
        <rect x="${width / 2 - 100}" y="${height - 60}" width="15" height="15" fill="#4ade80"/>
        <text x="${width / 2 - 80}" y="${height - 50}" fill="#ffffff" font-family="Arial" font-size="14">Receitas</text>

        <rect x="${width / 2 + 20}" y="${height - 60}" width="15" height="15" fill="#f87171"/>
        <text x="${width / 2 + 40}" y="${height - 50}" fill="#ffffff" font-family="Arial" font-size="14">Despesas</text>

        <!-- Totals -->
        <text x="${width / 2 - 230}" y="${height - 20}" fill="#ffffff" font-family="Arial" font-size="14">Total Receitas: R$${dailyData.reduce((sum2, data) => sum2 + data.income, 0).toLocaleString("pt-BR")}</text>
        <text x="${width / 2 + 60}" y="${height - 20}" fill="#ffffff" font-family="Arial" font-size="14">Total Despesas: R$${dailyData.reduce((sum2, data) => sum2 + data.expense, 0).toLocaleString("pt-BR")}</text>
      </svg>
    `;
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.getTime().toString();
    const randomId = Math.random().toString(36).substring(2, 10);
    const periodStartStr = startDate.toISOString().split("T")[0].replace(/-/g, "");
    const periodEndStr = endDate.toISOString().split("T")[0].replace(/-/g, "");
    const userHash = Buffer.from(`${req.user?.id}-${timeStr}-${randomId}`).toString("base64").substring(0, 8);
    const filename = `chart-receitas-despesas-svg-${periodStartStr}-${periodEndStr}-${timeStr.slice(-6)}-${userHash}.png`;
    const filepath = path.join(process.cwd(), "public", "charts", filename);
    const chartsDir = path.dirname(filepath);
    if (!fs.existsSync(chartsDir)) {
      fs.mkdirSync(chartsDir, { recursive: true });
    }
    const svgBuffer = Buffer.from(svgContent.trim());
    await sharp(svgBuffer).png({ quality: 100 }).toFile(filepath);
    console.log(`Chart Generation: Arquivo PNG salvo em ${filepath}`);
    const protocol = req.headers["x-forwarded-proto"] || req.connection?.encrypted ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const fullDownloadUrl = `${protocol}://${host}/api/charts/download/${filename}`;
    res.status(200).json({
      success: true,
      downloadUrl: fullDownloadUrl,
      filename,
      data: dailyData,
      message: "Gr\xE1fico de barras gerado com sucesso."
    });
  } catch (error) {
    console.error("Error generating bar chart:", error);
    res.status(500).json({ message: "Erro ao gerar gr\xE1fico de barras" });
  }
}
async function generatePieChartSVG(req, res) {
  try {
    console.log("=== CHART GENERATION - PIE CHART SVG ===");
    console.log("Chart Generation: User ID", req.user?.id);
    const wallet = await storage.getWalletByUserId(req.user?.id);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    let startDate;
    let endDate;
    let periodType;
    let inputDate;
    const { date: date2 } = req.query;
    if (date2) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date2)) {
        return res.status(400).json({ message: "Formato de data inv\xE1lido. Use YYYY-MM-DD" });
      }
      inputDate = new Date(date2);
      if (isNaN(inputDate.getTime())) {
        return res.status(400).json({ message: "Data inv\xE1lida" });
      }
      const [year, month, day] = date2.split("-").map(Number);
      inputDate = new Date(year, month - 1, day);
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        return res.status(400).json({ message: "Data n\xE3o pode ser no futuro" });
      }
      endDate = new Date(inputDate);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(inputDate);
      startDate.setDate(inputDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      console.log(`Chart Generation: Debug - Data informada: ${inputDate.toISOString().split("T")[0]}`);
      console.log(`Chart Generation: Debug - StartDate calculado: ${startDate.toISOString().split("T")[0]} (deveria ser ${inputDate.getDate() - 6}/${inputDate.getMonth() + 1}/${inputDate.getFullYear()})`);
      console.log(`Chart Generation: Debug - EndDate calculado: ${endDate.toISOString().split("T")[0]}`);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
      console.log(`Chart Generation: Debug - Diferen\xE7a em dias: ${daysDiff} (deveria ser 7)`);
      periodType = "\xFAltimos 7 dias";
    } else {
      const today = /* @__PURE__ */ new Date();
      const currentDayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - currentDayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      periodType = "semana atual (domingo a s\xE1bado)";
    }
    console.log(
      `Chart Generation: ${periodType} de`,
      startDate.toISOString(),
      "at\xE9",
      endDate.toISOString()
    );
    console.log(`Chart Generation: Data informada: ${date2}, Input date: ${inputDate?.toISOString()}`);
    const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
    console.log(`Chart Generation: Total de transa\xE7\xF5es encontradas: ${transactions2.length}`);
    const periodTransactions = transactions2.filter((t) => {
      const transactionDate = new Date(t.data_transacao);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    console.log(`Chart Generation: Transa\xE7\xF5es do per\xEDodo: ${periodTransactions.length}`);
    const expenses = periodTransactions.filter((t) => t.tipo === "Despesa");
    if (expenses.length === 0) {
      return res.status(200).json({
        success: false,
        message: `Nenhuma despesa encontrada no per\xEDodo de ${startDate.toLocaleDateString("pt-BR")} a ${endDate.toLocaleDateString("pt-BR")}`,
        period: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0]
        }
      });
    }
    const categories2 = await storage.getCategoriesByUserId(req.user?.id);
    const globalCategories = await storage.getGlobalCategories();
    const allCategories = [...categories2, ...globalCategories];
    const categoryExpenses = /* @__PURE__ */ new Map();
    expenses.forEach((transaction) => {
      const categoryId = transaction.categoria_id;
      const amount = Number(transaction.valor);
      categoryExpenses.set(
        categoryId,
        (categoryExpenses.get(categoryId) || 0) + amount
      );
    });
    const pieData = [];
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
      "#54a0ff",
      "#5f27cd",
      "#00d2d3",
      "#ff9f43",
      "#10ac84",
      "#ee5a52",
      "#0abde3",
      "#3867d6",
      "#8854d0"
    ];
    let colorIndex = 0;
    categoryExpenses.forEach((amount, categoryId) => {
      const category = allCategories.find((c) => c.id === categoryId);
      if (category && amount > 0) {
        pieData.push({
          category: category.nome,
          amount,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });
    pieData.sort((a, b) => b.amount - a.amount);
    const totalExpenses = pieData.reduce((sum2, item) => sum2 + item.amount, 0);
    if (totalExpenses === 0) {
      return res.status(400).json({ message: "Nenhuma despesa encontrada no per\xEDodo" });
    }
    const width = 800;
    const height = 450;
    const centerX = 250;
    const centerY = 225;
    const radius = 100;
    const startDateFormatted = startDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
    const endDateFormatted = endDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
    const title = `Despesas por Categoria (${startDateFormatted} - ${endDateFormatted})`;
    let pieSlices = "";
    let externalLabels = "";
    let rightLegend = "";
    let bottomLegend = "";
    let currentAngle = -Math.PI / 2;
    const legendX = 480;
    let legendY = 100;
    rightLegend += `<text x="${legendX}" y="80" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Detalhamento</text>`;
    const categoryColors = {
      "Compras": "#4ecdc4",
      "Alimenta\xE7\xE3o": "#ff6b6b",
      "Lazer": "#8b5cf6",
      "Transporte": "#10b981"
    };
    pieData.forEach((data, index) => {
      const percentage = data.amount / totalExpenses;
      const sliceAngle = percentage * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(currentAngle + sliceAngle);
      const y2 = centerY + radius * Math.sin(currentAngle + sliceAngle);
      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z"
      ].join(" ");
      const sliceColor = categoryColors[data.category] || data.color;
      pieSlices += `<path d="${pathData}" fill="${sliceColor}" stroke="none"/>`;
      const midAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius + 50;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);
      const percentageText = (data.amount / totalExpenses * 100).toFixed(0);
      externalLabels += `<text x="${labelX}" y="${labelY}" fill="${sliceColor}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" alignment-baseline="central">${data.category}: ${percentageText}%</text>`;
      const amount = data.amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });
      rightLegend += `<circle cx="${legendX}" cy="${legendY - 5}" r="6" fill="${sliceColor}"/>`;
      rightLegend += `<text x="${legendX + 15}" y="${legendY}" fill="#ffffff" font-family="Arial, sans-serif" font-size="14">${data.category}</text>`;
      rightLegend += `<text x="${width - 20}" y="${legendY}" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" text-anchor="end">${amount}</text>`;
      rightLegend += `<line x1="${legendX}" y1="${legendY + 8}" x2="${width - 20}" y2="${legendY + 8}" stroke="${sliceColor}" stroke-width="2"/>`;
      legendY += 30;
      currentAngle += sliceAngle;
    });
    let bottomLegendX = centerX - pieData.length * 60 / 2;
    const bottomLegendY = height - 50;
    pieData.forEach((data, index) => {
      const sliceColor = categoryColors[data.category] || data.color;
      bottomLegend += `<rect x="${bottomLegendX}" y="${bottomLegendY}" width="12" height="12" fill="${sliceColor}"/>`;
      bottomLegend += `<text x="${bottomLegendX + 18}" y="${bottomLegendY + 10}" fill="#ffffff" font-family="Arial, sans-serif" font-size="12">${data.category}</text>`;
      bottomLegendX += 120;
    });
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#1f2937"/>
        
        <!-- Border -->
        <rect x="5" y="5" width="${width - 10}" height="${height - 10}" fill="none" stroke="#0088fe" stroke-width="2" style="border-radius:10px"/>
        
        <!-- Title -->
        <text x="50%" y="40" fill="#ffffff" font-family="Arial" font-size="30" font-weight="bold" text-anchor="middle">${title}</text>
        
        <!-- Pie Chart -->
        ${pieSlices}
        
        <!-- External Labels -->
        ${externalLabels}
        
        <!-- Right Legend -->
        ${rightLegend}
        
        <!-- Bottom Legend -->
        ${bottomLegend}
      </svg>
    `;
    const now = /* @__PURE__ */ new Date();
    const timeStr = now.getTime().toString();
    const randomId = Math.random().toString(36).substring(2, 10);
    const periodStartStr = startDate.toISOString().split("T")[0].replace(/-/g, "");
    const periodEndStr = endDate.toISOString().split("T")[0].replace(/-/g, "");
    const userHash = Buffer.from(`${req.user?.id}-${timeStr}-${randomId}`).toString("base64").substring(0, 8);
    const filename = `chart-despesas-categoria-svg-${periodStartStr}-${periodEndStr}-${timeStr.slice(-6)}-${userHash}.png`;
    const filepath = path.join(process.cwd(), "public", "charts", filename);
    const chartsDir = path.dirname(filepath);
    if (!fs.existsSync(chartsDir)) {
      fs.mkdirSync(chartsDir, { recursive: true });
    }
    const svgBuffer = Buffer.from(svgContent.trim());
    await sharp(svgBuffer).png({ quality: 100 }).toFile(filepath);
    console.log(`Chart Generation: Arquivo PNG salvo em ${filepath}`);
    const protocol = req.headers["x-forwarded-proto"] || req.connection?.encrypted ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const fullDownloadUrl = `${protocol}://${host}/api/charts/download/${filename}`;
    res.status(200).json({
      success: true,
      downloadUrl: fullDownloadUrl,
      filename,
      data: pieData,
      message: "Gr\xE1fico de pizza gerado com sucesso."
    });
  } catch (error) {
    console.error("Error generating pie chart:", error);
    res.status(500).json({ message: "Erro ao gerar gr\xE1fico de pizza" });
  }
}
async function downloadChartFile(req, res) {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), "public", "charts", filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: "Arquivo n\xE3o encontrado" });
    }
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    const fileExt = path.extname(filename).toLowerCase();
    if (fileExt === ".jpg" || fileExt === ".jpeg") {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (fileExt === ".png") {
      res.setHeader("Content-Type", "image/png");
    } else if (fileExt === ".svg") {
      res.setHeader("Content-Type", "image/svg+xml");
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading chart:", error);
    res.status(500).json({ message: "Erro ao baixar gr\xE1fico" });
  }
}

// server/controllers/chart.controller.ts
init_storage();
import fs2 from "fs";
import path2 from "path";
async function generateBarChartImage(req, res) {
  try {
    console.log("=== CHART GENERATION - BAR CHART ===");
    console.log("Chart Generation: User ID", req.user?.id);
    const { createCanvas } = await import("canvas");
    const wallet = await storage.getWalletByUserId(req.user?.id);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(endDate.getDate() - 6);
    console.log(
      "Chart Generation: Per\xEDodo",
      startDate.toISOString(),
      "at\xE9",
      endDate.toISOString()
    );
    const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayTransactions = transactions2.filter((t) => {
        const transactionDate = new Date(t.data_transacao);
        return transactionDate.toDateString() === currentDate.toDateString();
      });
      const income = dayTransactions.filter((t) => t.tipo === "Receita").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      const expense = dayTransactions.filter((t) => t.tipo === "Despesa").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      dailyData.push({
        day: currentDate.toLocaleDateString("pt-BR", { weekday: "short" }),
        date: currentDate.toISOString().split("T")[0],
        income,
        expense
      });
    }
    console.log("Chart Generation: Dados processados", dailyData);
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#0088fe";
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, width - 10, height - 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Receitas vs Despesas", 40, 55);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#9ca3af";
    const periodText = `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`;
    ctx.fillText(periodText, 40, 85);
    const chartX = 80;
    const chartY = 100;
    const chartWidth = width - 160;
    const chartHeight = height - 200;
    const maxValue = Math.max(
      ...dailyData.map((d) => Math.max(d.income, d.expense))
    );
    const roundedMax = Math.ceil(maxValue / 1e3) * 1e3;
    const scale = chartHeight / (roundedMax || 1e3);
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = chartY + chartHeight - i * chartHeight / ySteps;
      const value = roundedMax / ySteps * i;
      ctx.beginPath();
      ctx.moveTo(chartX, y);
      ctx.lineTo(chartX + chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = "#9ca3af";
      ctx.font = "18px Arial";
      ctx.textAlign = "right";
      ctx.fillText(`R$${value.toLocaleString("pt-BR")}`, chartX - 10, y + 6);
    }
    ctx.setLineDash([]);
    const barWidth = chartWidth / dailyData.length * 0.6;
    const barSpacing = chartWidth / dailyData.length;
    dailyData.forEach((data, index) => {
      const x = chartX + index * barSpacing + (barSpacing - barWidth) / 2;
      if (data.income > 0) {
        const incomeHeight = data.income * scale;
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(
          x,
          chartY + chartHeight - incomeHeight,
          barWidth * 0.45,
          incomeHeight
        );
      }
      if (data.expense > 0) {
        const expenseHeight = data.expense * scale;
        ctx.fillStyle = "#f87171";
        ctx.fillRect(
          x + barWidth * 0.55,
          chartY + chartHeight - expenseHeight,
          barWidth * 0.45,
          expenseHeight
        );
      }
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(data.day, x + barWidth / 2, chartY + chartHeight + 25);
    });
    const legendY = height - 50;
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(width / 2 - 100, legendY - 10, 15, 15);
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Receitas", width / 2 - 80, legendY);
    ctx.fillStyle = "#f87171";
    ctx.fillRect(width / 2 + 20, legendY - 10, 15, 15);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Despesas", width / 2 + 40, legendY);
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.getTime().toString();
    const randomId = Math.random().toString(36).substring(2, 10);
    const hash = Buffer.from(`${req.user?.id}-${timeStr}-${randomId}`).toString("base64").substring(0, 12);
    const filename = `chart-receitas-despesas-${dateStr}-${timeStr.slice(-6)}-${hash}-novo.png`;
    const filepath = path2.join(process.cwd(), "public", "charts", filename);
    const chartsDir = path2.dirname(filepath);
    if (!fs2.existsSync(chartsDir)) {
      fs2.mkdirSync(chartsDir, { recursive: true });
    }
    const buffer = canvas.toBuffer("image/png");
    fs2.writeFileSync(filepath, buffer);
    console.log(`Chart Generation: Arquivo PNG salvo em ${filepath}`);
    const protocol = req.headers["x-forwarded-proto"] || req.connection?.encrypted ? "https" : "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const fullDownloadUrl = `${protocol}://${host}/api/charts/download/${filename}`;
    console.log(`Gr\xE1fico de barras gerado com sucesso.${fullDownloadUrl}`);
    res.status(200).json({
      success: true,
      downloadUrl: fullDownloadUrl,
      filename,
      data: dailyData,
      message: "Gr\xE1fico de barras gerado com sucesso."
    });
  } catch (error) {
    console.error("Error generating bar chart:", error);
    res.status(500).json({ message: "Erro ao gerar gr\xE1fico de barras" });
  }
}

// server/controllers/report-image.controller.ts
init_storage();
import * as fs3 from "fs";
import * as path3 from "path";
import sharp2 from "sharp";
async function generateWeeklyReportImage(req, res) {
  try {
    console.log("=== WEEKLY REPORT IMAGE GENERATION ===");
    console.log("Report Generation: User ID", req.user?.id);
    if (!req.user) {
      return res.status(401).json({ message: "Usu\xE1rio n\xE3o autenticado" });
    }
    const wallet = await storage.getWalletByUserId(req.user.id);
    if (!wallet) {
      return res.status(404).json({ message: "Carteira n\xE3o encontrada" });
    }
    const { date: date2 } = req.query;
    let startDate;
    if (date2 && typeof date2 === "string") {
      const providedDate = new Date(date2);
      const dayOfWeek = providedDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(providedDate);
      startDate.setDate(providedDate.getDate() - daysFromMonday);
    } else {
      const today = /* @__PURE__ */ new Date();
      const currentDayOfWeek = today.getDay();
      const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - daysFromMonday);
    }
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    console.log("Report Generation: Semana de", startDate.toISOString(), "at\xE9", endDate.toISOString());
    const transactions2 = await storage.getTransactionsByWalletId(wallet.id);
    const weeklyData = [];
    const dayNames = ["seg.", "ter.", "qua.", "qui.", "sex.", "s\xE1b.", "dom."];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayTransactions = transactions2.filter((t) => {
        const transactionDate = new Date(t.data_transacao);
        return transactionDate.toDateString() === currentDate.toDateString();
      });
      const income = dayTransactions.filter((t) => t.tipo === "Receita").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      const expense = dayTransactions.filter((t) => t.tipo === "Despesa").reduce((sum2, t) => sum2 + Number(t.valor), 0);
      weeklyData.push({
        day: dayNames[i],
        date: currentDate.toISOString().split("T")[0],
        income,
        expense
      });
    }
    const totalIncome = weeklyData.reduce((sum2, d) => sum2 + d.income, 0);
    const totalExpenses = weeklyData.reduce((sum2, d) => sum2 + d.expense, 0);
    const currentBalance = Number(wallet.saldo_atual);
    const weekTransactions = transactions2.filter((t) => {
      const transactionDate = new Date(t.data_transacao);
      return transactionDate >= startDate && transactionDate <= endDate && t.tipo === "Despesa";
    });
    const categories2 = await storage.getCategoriesByUserId(req.user.id);
    const categoryMap = /* @__PURE__ */ new Map();
    for (const transaction of weekTransactions) {
      const category = categories2.find((c) => c.id === transaction.categoria_id);
      const categoryName = category ? category.nome : "Outros";
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(transaction.valor));
    }
    const categoryColors = ["#22d3ee", "#f87171", "#a78bfa", "#34d399"];
    const categoryData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: totalExpenses > 0 ? Math.round(value / totalExpenses * 100) : 0,
      color: categoryColors[index % categoryColors.length]
    })).sort((a, b) => b.value - a.value).slice(0, 4);
    console.log("Report Generation: Dados processados", { weeklyData, totalIncome, totalExpenses, categoryData });
    const svgContent = generateReportSVG(weeklyData, totalIncome, totalExpenses, currentBalance, categoryData);
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.getTime().toString();
    const hash = Buffer.from(`${req.user?.id}-${timeStr}`).toString("base64").substring(0, 8);
    const filename = `relatorio-semanal-${dateStr}-${hash}.png`;
    const filepath = path3.join(process.cwd(), "public", "charts", filename);
    const chartsDir = path3.dirname(filepath);
    if (!fs3.existsSync(chartsDir)) {
      fs3.mkdirSync(chartsDir, { recursive: true });
    }
    const svgBuffer = Buffer.from(svgContent.trim());
    await sharp2(svgBuffer).png({ quality: 100 }).toFile(filepath);
    console.log(`Report Generation: Arquivo PNG salvo em ${filepath}`);
    const downloadUrl = `/api/charts/download/${filename}`;
    res.json({
      success: true,
      downloadUrl,
      filename,
      data: {
        weeklyData,
        totalIncome,
        totalExpenses,
        currentBalance,
        categoryData
      },
      message: "Relat\xF3rio semanal gerado com sucesso."
    });
  } catch (error) {
    console.error("Erro ao gerar relat\xF3rio semanal:", error);
    res.status(500).json({ message: "Erro interno do servidor ao gerar relat\xF3rio" });
  }
}
function generateReportSVG(weeklyData, totalIncome, totalExpenses, currentBalance, categoryData) {
  const width = 1920;
  const height = 1080;
  const padding = 40;
  const formatCurrency2 = (value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const today = /* @__PURE__ */ new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() + mondayOffset);
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const formatDate = (date2) => date2.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const periodText = `${formatDate(mondayDate)} - ${formatDate(sundayDate)}`;
  const cardWidth = 470;
  const cardHeight = 250;
  const gap = 30;
  const topRowY = 130;
  const bottomRowY = 400;
  const summaryY = 680;
  const summaryHeight = 80;
  const incomeExpensesChart = generateWeeklyBarChart(weeklyData, totalIncome, totalExpenses, cardWidth, cardHeight);
  const cashFlowChart = generateWeeklyCashFlow(weeklyData, cardWidth, cardHeight);
  const categoryPieChart = generateCategoryPieChart(categoryData, totalExpenses, cardWidth, cardHeight);
  const categoryDetails = generateCategoryDetailPanel(categoryData, cardWidth, cardHeight);
  const financialSummary = generateBottomSummary(totalIncome, totalExpenses, currentBalance, width - padding * 2, summaryHeight);
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .header-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 28px; font-weight: 600; fill: white; }
          .header-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; fill: #94a3b8; }
          .period-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; fill: #94a3b8; }
          .card-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 600; fill: white; }
          .axis-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: #94a3b8; }
          .day-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; fill: #94a3b8; }
          .legend-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #94a3b8; }
          .legend-value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; fill: white; }
          .percentage-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; fill: white; }
          .summary-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; fill: white; }
          .summary-label { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: #94a3b8; }
          .summary-value { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 700; }
          .export-button { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: white; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0a0a0a"/>
      
      <!-- Header -->
      <text x="${padding}" y="50" class="header-title">Relat\xF3rios</text>
      <text x="${padding}" y="75" class="header-subtitle">Acompanhe suas finan\xE7as com an\xE1lises detalhadas</text>
      <text x="${padding}" y="95" class="period-text">Per\xEDodo: ${periodText}</text>
      
      <!-- Period Selector -->
      <rect x="${width - 200}" y="25" width="80" height="30" fill="#374151" stroke="#4b5563" stroke-width="1" rx="6"/>
      <text x="${width - 160}" y="43" text-anchor="middle" class="legend-text">Este m\xEAs</text>
      
      <!-- Export Button -->
      <rect x="${width - 110}" y="25" width="70" height="30" fill="#3b82f6" stroke="none" rx="6"/>
      <text x="${width - 75}" y="43" text-anchor="middle" class="export-button">Exportar</text>
      
      <!-- Top Row: Receitas vs Despesas (Left) + Fluxo de Caixa (Right) -->
      <g transform="translate(${padding}, ${topRowY})">
        ${incomeExpensesChart}
      </g>
      
      <g transform="translate(${padding + cardWidth + gap}, ${topRowY})">
        ${cashFlowChart}
      </g>
      
      <!-- Bottom Row: Despesas por Categoria (Left) + Detalhamento (Right) -->
      <g transform="translate(${padding}, ${bottomRowY})">
        ${categoryPieChart}
      </g>
      
      <g transform="translate(${padding + cardWidth + gap}, ${bottomRowY})">
        ${categoryDetails}
      </g>
      
      <!-- Bottom: Resumo Financeiro -->
      <g transform="translate(${padding}, ${summaryY})">
        ${financialSummary}
      </g>
    </svg>
  `.trim();
}
function generateWeeklyBarChart(weeklyData, totalIncome, totalExpenses, width, height) {
  const chartPadding = 40;
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - 80;
  const barWidth = chartWidth / 7;
  const maxValue = Math.max(...weeklyData.map((d) => Math.max(d.income, d.expense)), 1e3);
  const dayLabels = ["ter.", "qua.", "qui.", "sex.", "s\xE1b.", "dom.", "seg."];
  let bars = "";
  let labels = "";
  weeklyData.forEach((data, index) => {
    const x = chartPadding + index * barWidth;
    const incomeHeight = data.income / maxValue * (chartHeight - 60);
    const expenseHeight = data.expense / maxValue * (chartHeight - 60);
    if (data.income > 0) {
      bars += `<rect x="${x + 8}" y="${chartHeight - incomeHeight + 40}" width="${barWidth * 0.4}" height="${incomeHeight}" fill="#10b981" rx="2"/>`;
    }
    if (data.expense > 0) {
      bars += `<rect x="${x + barWidth * 0.52}" y="${chartHeight - expenseHeight + 40}" width="${barWidth * 0.4}" height="${expenseHeight}" fill="#ef4444" rx="2"/>`;
    }
    labels += `<text x="${x + barWidth / 2}" y="${height - 15}" text-anchor="middle" class="day-label">${dayLabels[index]}</text>`;
  });
  return `
    <!-- Card Background -->
    <rect width="${width}" height="${height}" fill="#374151" stroke="#4b5563" stroke-width="1" rx="8"/>
    
    <!-- Title -->
    <text x="20" y="30" class="card-title">Receitas vs Despesas</text>
    
    <!-- Y-axis labels -->
    <text x="35" y="60" text-anchor="end" class="axis-label">R$6k</text>
    <text x="35" y="100" text-anchor="end" class="axis-label">R$4.5k</text>
    <text x="35" y="140" text-anchor="end" class="axis-label">R$3k</text>
    <text x="35" y="180" text-anchor="end" class="axis-label">R$1.5k</text>
    <text x="35" y="220" text-anchor="end" class="axis-label">R$0</text>
    
    <!-- Grid lines -->
    <line x1="${chartPadding}" y1="60" x2="${width - 20}" y2="60" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="100" x2="${width - 20}" y2="100" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="140" x2="${width - 20}" y2="140" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="180" x2="${width - 20}" y2="180" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="220" x2="${width - 20}" y2="220" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    
    <!-- Bars -->
    ${bars}
    
    <!-- Day labels -->
    ${labels}
  `;
}
function generateWeeklyCashFlow(weeklyData, width, height) {
  const chartPadding = 40;
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - 80;
  let cumulativeBalance = 0;
  const points = [];
  weeklyData.forEach((data, index) => {
    cumulativeBalance += data.income - data.expense;
    const x = chartPadding + index / (weeklyData.length - 1) * chartWidth;
    const y = chartHeight - Math.max(0, cumulativeBalance / 4e3 * (chartHeight - 60)) + 40;
    points.push({ x, y: Math.max(60, Math.min(chartHeight + 40, y)) });
  });
  const pathData = points.map(
    (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ");
  return `
    <!-- Card Background -->
    <rect width="${width}" height="${height}" fill="#374151" stroke="#4b5563" stroke-width="1" rx="8"/>
    
    <!-- Title -->
    <text x="20" y="30" class="card-title">Fluxo de Caixa</text>
    
    <!-- Y-axis labels -->
    <text x="35" y="60" text-anchor="end" class="axis-label">R$4000</text>
    <text x="35" y="100" text-anchor="end" class="axis-label">R$3000</text>
    <text x="35" y="140" text-anchor="end" class="axis-label">R$2000</text>
    <text x="35" y="180" text-anchor="end" class="axis-label">R$1000</text>
    <text x="35" y="220" text-anchor="end" class="axis-label">R$0</text>
    
    <!-- Grid lines -->
    <line x1="${chartPadding}" y1="60" x2="${width - 20}" y2="60" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="100" x2="${width - 20}" y2="100" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="140" x2="${width - 20}" y2="140" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="180" x2="${width - 20}" y2="180" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    <line x1="${chartPadding}" y1="220" x2="${width - 20}" y2="220" stroke="#4b5563" stroke-width="0.5" stroke-dasharray="2,2"/>
    
    <!-- Cash flow line -->
    <path d="${pathData}" stroke="#06b6d4" stroke-width="3" fill="none"/>
    
    <!-- Points -->
    ${points.map(
    (point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#06b6d4"/>`
  ).join("")}
    
    <!-- Month label -->
    <text x="${width / 2}" y="${height - 15}" text-anchor="middle" class="day-label">May</text>
  `;
}
function generateCategoryPieChart(categoryData, totalExpenses, width, height) {
  const centerX = 150;
  const centerY = 125;
  const radius = 80;
  let currentAngle = -Math.PI / 2;
  let slices = "";
  let legend = "";
  categoryData.forEach((category, index) => {
    const percentage = totalExpenses > 0 ? category.value / totalExpenses : 0;
    const sliceAngle = percentage * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const x1 = centerX + radius * Math.cos(currentAngle);
    const y1 = centerY + radius * Math.sin(currentAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    slices += `
      <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
            fill="${category.color}" stroke="#374151" stroke-width="2"/>
    `;
    if (category.percentage > 15) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + radius * 0.6 * Math.cos(labelAngle);
      const labelY = centerY + radius * 0.6 * Math.sin(labelAngle);
      slices += `<text x="${labelX}" y="${labelY}" class="percentage-label" text-anchor="middle">${category.name}: ${category.percentage}%</text>`;
    }
    currentAngle = endAngle;
  });
  categoryData.forEach((category, index) => {
    legend += `
      <circle cx="${30 + index * 100}" cy="${height - 25}" r="6" fill="${category.color}"/>
      <text x="${45 + index * 100}" y="${height - 20}" class="legend-text">${category.name}</text>
    `;
  });
  return `
    <!-- Card Background -->
    <rect width="${width}" height="${height}" fill="#374151" stroke="#4b5563" stroke-width="1" rx="8"/>
    
    <!-- Title -->
    <text x="20" y="30" class="card-title">Despesas por Categoria</text>
    
    <!-- Pie Chart -->
    ${slices}
    
    <!-- Legend -->
    ${legend}
  `;
}
function generateCategoryDetailPanel(categoryData, width, height) {
  const formatCurrency2 = (value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  let details = "";
  categoryData.forEach((category, index) => {
    details += `
      <g transform="translate(0, ${index * 40})">
        <circle cx="15" cy="15" r="6" fill="${category.color}"/>
        <text x="35" y="12" class="legend-text">${category.name}</text>
        <text x="${width - 30}" y="12" class="legend-value" text-anchor="end">${formatCurrency2(category.value)}</text>
        <text x="${width - 30}" y="28" class="legend-text" text-anchor="end">${category.percentage}%</text>
      </g>
    `;
  });
  return `
    <!-- Card Background -->
    <rect width="${width}" height="${height}" fill="#374151" stroke="#4b5563" stroke-width="1" rx="8"/>
    
    <!-- Title -->
    <text x="20" y="30" class="card-title">Detalhamento</text>
    
    <!-- Category Details -->
    <g transform="translate(20, 60)">
      ${details}
    </g>
  `;
}
function generateBottomSummary(totalIncome, totalExpenses, currentBalance, width, height) {
  const formatCurrency2 = (value) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  return `
    <!-- Summary Background -->
    <rect width="${width}" height="${height}" fill="#374151" stroke="#4b5563" stroke-width="1" rx="8"/>
    
    <!-- Title -->
    <text x="20" y="25" class="summary-title">Resumo Financeiro</text>
    
    <!-- Income -->
    <g transform="translate(40, 35)">
      <text x="0" y="0" class="summary-label">Total de Receitas</text>
      <text x="0" y="20" class="summary-value" fill="#10b981">${formatCurrency2(totalIncome)}</text>
    </g>
    
    <!-- Expenses -->
    <g transform="translate(${width / 3}, 35)">
      <text x="0" y="0" class="summary-label">Total de Despesas</text>
      <text x="0" y="20" class="summary-value" fill="#ef4444">${formatCurrency2(totalExpenses)}</text>
    </g>
    
    <!-- Current Balance -->
    <g transform="translate(${width / 3 * 2}, 35)">
      <text x="0" y="0" class="summary-label">Saldo Atual</text>
      <text x="0" y="20" class="summary-value" fill="#3b82f6">${formatCurrency2(currentBalance)}</text>
    </g>
  `;
}

// server/controllers/payment-method.controller.ts
init_storage();
init_schema();
import { z as z7 } from "zod";
async function getPaymentMethods(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const [globalMethods, userMethods] = await Promise.all([
      storage.getGlobalPaymentMethods(),
      storage.getPaymentMethodsByUserId(req.user.id)
    ]);
    const allMethods = [...globalMethods, ...userMethods].sort(
      (a, b) => a.nome.localeCompare(b.nome)
    );
    res.status(200).json(allMethods);
  } catch (error) {
    console.error("Error in getPaymentMethods:", error);
    res.status(500).json({ error: "Erro ao buscar formas de pagamento" });
  }
}
async function getGlobalPaymentMethods(req, res) {
  try {
    const globalMethods = await storage.getGlobalPaymentMethods();
    res.status(200).json(globalMethods);
  } catch (error) {
    console.error("Error in getGlobalPaymentMethods:", error);
    res.status(500).json({ error: "Erro ao buscar m\xE9todos de pagamento globais" });
  }
}
async function createPaymentMethod(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const paymentMethodData = insertPaymentMethodSchema.parse({
      ...req.body,
      usuario_id: req.user.id,
      global: false
    });
    const userMethods = await storage.getPaymentMethodsByUserId(req.user.id);
    const globalMethods = await storage.getGlobalPaymentMethods();
    const existingMethod = [...userMethods, ...globalMethods].find(
      (method) => method.nome.toLowerCase() === paymentMethodData.nome.toLowerCase()
    );
    if (existingMethod) {
      return res.status(400).json({
        message: "J\xE1 existe uma forma de pagamento com este nome"
      });
    }
    const newPaymentMethod = await storage.createPaymentMethod(paymentMethodData);
    res.status(201).json(newPaymentMethod);
  } catch (error) {
    if (error instanceof z7.ZodError) {
      return res.status(400).json({
        message: "Dados inv\xE1lidos",
        errors: error.errors
      });
    }
    console.error("Error in createPaymentMethod:", error);
    res.status(500).json({ error: "Erro ao criar forma de pagamento" });
  }
}
async function updatePaymentMethod(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const paymentMethodId = parseInt(req.params.id);
    if (isNaN(paymentMethodId)) {
      return res.status(400).json({ error: "ID de forma de pagamento inv\xE1lido" });
    }
    const existingMethod = await storage.getPaymentMethodById(paymentMethodId);
    if (!existingMethod) {
      return res.status(404).json({ message: "Forma de pagamento n\xE3o encontrada" });
    }
    if (existingMethod.global || existingMethod.usuario_id !== req.user.id) {
      return res.status(403).json({
        message: "Voc\xEA n\xE3o pode editar esta forma de pagamento"
      });
    }
    const updateData = insertPaymentMethodSchema.partial().parse(req.body);
    if (updateData.nome && updateData.nome !== existingMethod.nome) {
      const userMethods = await storage.getPaymentMethodsByUserId(req.user.id);
      const globalMethods = await storage.getGlobalPaymentMethods();
      const conflictingMethod = [...userMethods, ...globalMethods].find(
        (method) => method.id !== paymentMethodId && method.nome.toLowerCase() === updateData.nome.toLowerCase()
      );
      if (conflictingMethod) {
        return res.status(400).json({
          message: "J\xE1 existe uma forma de pagamento com este nome"
        });
      }
    }
    const updatedMethod = await storage.updatePaymentMethod(paymentMethodId, updateData);
    if (!updatedMethod) {
      return res.status(500).json({ error: "Erro ao atualizar forma de pagamento" });
    }
    res.status(200).json(updatedMethod);
  } catch (error) {
    if (error instanceof z7.ZodError) {
      return res.status(400).json({
        message: "Dados inv\xE1lidos",
        errors: error.errors
      });
    }
    console.error("Error in updatePaymentMethod:", error);
    res.status(500).json({ error: "Erro ao atualizar forma de pagamento" });
  }
}
async function deletePaymentMethod(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const paymentMethodId = parseInt(req.params.id);
    if (isNaN(paymentMethodId)) {
      return res.status(400).json({ error: "ID de forma de pagamento inv\xE1lido" });
    }
    const existingMethod = await storage.getPaymentMethodById(paymentMethodId);
    if (!existingMethod) {
      return res.status(404).json({ message: "Forma de pagamento n\xE3o encontrada" });
    }
    if (existingMethod.global || existingMethod.usuario_id !== req.user.id) {
      return res.status(403).json({
        message: "Voc\xEA n\xE3o pode deletar esta forma de pagamento"
      });
    }
    const deleted = await storage.deletePaymentMethod(paymentMethodId);
    if (!deleted) {
      return res.status(400).json({
        message: "N\xE3o \xE9 poss\xEDvel deletar forma de pagamento em uso"
      });
    }
    res.status(200).json({ message: "Forma de pagamento deletada com sucesso" });
  } catch (error) {
    console.error("Error in deletePaymentMethod:", error);
    res.status(500).json({ error: "Erro ao deletar forma de pagamento" });
  }
}
async function getPaymentMethodTotals(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "N\xE3o autenticado" });
    }
    const totals = await storage.getTransactionTotalsByPaymentMethod(req.user.id);
    res.status(200).json(totals);
  } catch (error) {
    console.error("Error in getPaymentMethodTotals:", error);
    res.status(500).json({ error: "Erro ao buscar totais das formas de pagamento" });
  }
}

// server/controllers/analytics.controller.ts
init_storage();
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
var AnalyticsController = class {
  static async getAnalyticsData(req, res) {
    try {
      console.log("=== ANALYTICS DATA - REQUEST ===");
      console.log(`Admin: ${req.user?.email} (${req.user?.tipo_usuario})`);
      console.log("============================");
      if (req.user?.tipo_usuario !== "super_admin") {
        return res.status(403).json({ error: "Acesso negado: requer privil\xE9gios de super administrador" });
      }
      const allUsers = await storage.getAllUsers();
      const allTransactions = await db.select({
        id: transactions.id,
        valor: transactions.valor,
        tipo: transactions.tipo,
        data_transacao: transactions.data_transacao,
        usuario_id: wallets.usuario_id
      }).from(transactions).innerJoin(wallets, eq2(transactions.carteira_id, wallets.id));
      const allWallets = await db.select({
        id: wallets.id,
        usuario_id: wallets.usuario_id,
        saldo_atual: wallets.saldo_atual
      }).from(wallets).innerJoin(users, eq2(wallets.usuario_id, users.id));
      const currentDate = /* @__PURE__ */ new Date();
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const userGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date2 = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = months[date2.getMonth()];
        const usersUntilDate = allUsers.filter((user) => {
          if (!user.data_cadastro) return false;
          const userDate = typeof user.data_cadastro === "string" ? new Date(user.data_cadastro) : user.data_cadastro;
          return userDate <= date2;
        }).length;
        const activeUsersUntilDate = allUsers.filter((user) => {
          if (!user.data_cadastro) return false;
          const userDate = typeof user.data_cadastro === "string" ? new Date(user.data_cadastro) : user.data_cadastro;
          return userDate <= date2 && user.ativo;
        }).length;
        userGrowth.push({
          month: monthName,
          users: usersUntilDate,
          activeUsers: activeUsersUntilDate
        });
      }
      const transactionVolume = [];
      for (let i = 5; i >= 0; i--) {
        const date2 = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        const monthName = months[date2.getMonth()];
        const monthTransactions = allTransactions.filter((t) => {
          const transactionDate = new Date(t.data_transacao);
          return transactionDate >= date2 && transactionDate < nextMonth;
        });
        const totalVolume = monthTransactions.reduce((sum2, t) => {
          return sum2 + parseFloat(t.valor);
        }, 0);
        transactionVolume.push({
          month: monthName,
          transactions: monthTransactions.length,
          volume: Math.round(totalVolume)
        });
      }
      const activeUsers = allUsers.filter((u) => u.ativo && !u.data_cancelamento).length;
      const canceledUsers = allUsers.filter((u) => u.data_cancelamento).length;
      const inactiveUsers = allUsers.filter((u) => !u.ativo && !u.data_cancelamento).length;
      const userStatusDistribution = [
        { name: "Usu\xE1rios Ativos", count: activeUsers, color: "#3B82F6" },
        { name: "Usu\xE1rios Cancelados", count: canceledUsers, color: "#EF4444" },
        { name: "Usu\xE1rios Inativos", count: inactiveUsers, color: "#8B5CF6" }
      ];
      const walletDistribution = [
        { range: "R$ 0 - 1.000", count: 0 },
        { range: "R$ 1.000 - 5.000", count: 0 },
        { range: "R$ 5.000+", count: 0 }
      ];
      allWallets.forEach((wallet) => {
        const saldo = parseFloat(wallet.saldo_atual || "0");
        if (saldo <= 1e3) {
          walletDistribution[0].count++;
        } else if (saldo <= 5e3) {
          walletDistribution[1].count++;
        } else {
          walletDistribution[2].count++;
        }
      });
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date2 = /* @__PURE__ */ new Date();
        date2.setDate(date2.getDate() - i);
        const dateStr = date2.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        const dayStart = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        const dayEnd = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() + 1);
        const dayTransactions = allTransactions.filter((t) => {
          const transactionDate = new Date(t.data_transacao);
          return transactionDate >= dayStart && transactionDate < dayEnd;
        }).length;
        const activeUsersInDay = new Set(
          allTransactions.filter((t) => {
            const transactionDate = new Date(t.data_transacao);
            return transactionDate >= dayStart && transactionDate < dayEnd;
          }).map((t) => t.usuario_id).filter((id) => id !== null)
        ).size;
        recentActivity.push({
          date: dateStr,
          users: activeUsersInDay,
          transactions: dayTransactions
        });
      }
      const monthlyTransactionTrends = [];
      for (let i = 5; i >= 0; i--) {
        const date2 = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
        const monthName = months[date2.getMonth()];
        const monthTransactions = allTransactions.filter((t) => {
          const transactionDate = new Date(t.data_transacao);
          return transactionDate >= date2 && transactionDate < nextMonth;
        });
        const income = monthTransactions.filter((t) => t.tipo === "Receita").reduce((sum2, t) => sum2 + parseFloat(t.valor), 0);
        const expenses = monthTransactions.filter((t) => t.tipo === "Despesa").reduce((sum2, t) => sum2 + parseFloat(t.valor), 0);
        monthlyTransactionTrends.push({
          month: monthName,
          income: Math.round(income),
          expenses: Math.round(expenses)
        });
      }
      const analyticsData = {
        userGrowth,
        transactionVolume,
        userStatusDistribution,
        walletDistribution,
        recentActivity,
        monthlyTransactionTrends
      };
      console.log("=== ANALYTICS DATA - RESPONSE ===");
      console.log("Dados anal\xEDticos calculados com base nos dados reais do banco");
      console.log("============================");
      res.json(analyticsData);
    } catch (error) {
      console.error("Erro ao buscar dados anal\xEDticos:", error);
      res.status(500).json({ error: "Erro interno do servidor ao buscar dados anal\xEDticos" });
    }
  }
};

// server/controllers/subscription.controller.ts
init_storage();
init_schema();
import { z as z8 } from "zod";
var cancelSubscriptionSchema = z8.object({
  motivo: z8.string().min(1, "Motivo \xE9 obrigat\xF3rio").max(500, "Motivo muito longo")
});
var SubscriptionController = class {
  static async cancelSubscription(req, res) {
    try {
      console.log("=== SUBSCRIPTION CANCEL - REQUEST ===");
      console.log(`Usu\xE1rio: ${req.user?.email} (${req.user?.id})`);
      console.log("=====================================");
      if (!req.user) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const validation = cancelSubscriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Dados inv\xE1lidos",
          details: validation.error.errors
        });
      }
      const { motivo } = validation.data;
      if (req.user.data_cancelamento) {
        return res.status(400).json({
          error: "Assinatura j\xE1 foi cancelada anteriormente"
        });
      }
      const expirationDate = /* @__PURE__ */ new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      const updatedUser = await storage.updateUser(req.user.id, {
        data_cancelamento: getSaoPauloTimestamp(),
        motivo_cancelamento: motivo,
        data_expiracao_assinatura: expirationDate,
        status_assinatura: "cancelada"
      });
      if (!updatedUser) {
        return res.status(500).json({
          error: "Erro ao processar cancelamento"
        });
      }
      console.log("=== SUBSCRIPTION CANCEL - SUCCESS ===");
      console.log(`Usu\xE1rio ${req.user.email} cancelou a assinatura`);
      console.log(`Motivo: ${motivo}`);
      console.log("====================================");
      res.json({
        message: "Assinatura cancelada com sucesso",
        user: {
          id: updatedUser.id,
          nome: updatedUser.nome,
          email: updatedUser.email,
          status_assinatura: updatedUser.status_assinatura,
          data_cancelamento: updatedUser.data_cancelamento
        }
      });
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      res.status(500).json({
        error: "Erro interno do servidor ao cancelar assinatura"
      });
    }
  }
  static async getSubscriptionStatus(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usu\xE1rio n\xE3o autenticado" });
      }
      const subscriptionStatus = {
        status: req.user.status_assinatura || "ativa",
        data_cancelamento: req.user.data_cancelamento,
        motivo_cancelamento: req.user.motivo_cancelamento,
        is_canceled: !!req.user.data_cancelamento
      };
      res.json(subscriptionStatus);
    } catch (error) {
      console.error("Erro ao buscar status da assinatura:", error);
      res.status(500).json({
        error: "Erro interno do servidor"
      });
    }
  }
};

// server/controllers/database.controller.ts
init_db();
init_schema();
import { sql as sql4 } from "drizzle-orm";
import postgres3 from "postgres";
async function getAllTables(req, res) {
  try {
    console.log("\u{1F50D} Listando todas as tabelas do banco de dados...");
    const tablesResult = await db.execute(sql4`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = tablesResult.map((row) => ({
      name: row.table_name,
      type: row.table_type
    }));
    res.json({
      success: true,
      tables,
      total: tables.length
    });
  } catch (error) {
    console.error("Erro ao listar tabelas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function generateDatabaseDDL(req, res) {
  try {
    console.log("\u{1F4CB} Gerando DDL completo do banco de dados...");
    const client2 = postgres3(process.env.DATABASE_URL || "", { prepare: false });
    try {
      const tablesResult = await client2`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      let ddl = `-- DDL Completo do Banco de Dados
`;
      ddl += `-- Gerado em: ${(/* @__PURE__ */ new Date()).toISOString()}

`;
      for (const tableRow of tablesResult) {
        const tableName = tableRow.table_name;
        const columnsResult = await client2`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `;
        const primaryKeysResult = await client2`
          SELECT 
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'PRIMARY KEY'
        `;
        const uniqueKeysResult = await client2`
          SELECT 
            tc.constraint_name,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'UNIQUE'
        `;
        const foreignKeysResult = await client2`
          SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName}
          AND tc.constraint_type = 'FOREIGN KEY'
        `;
        const indexesResult = await client2`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = ${tableName}
        `;
        ddl += `-- ========================================
`;
        ddl += `-- Tabela: ${tableName}
`;
        ddl += `-- ========================================

`;
        ddl += `CREATE TABLE IF NOT EXISTS "${tableName}" (
`;
        const columnDefs = columnsResult.map((col) => {
          let def = `  "${col.column_name}" ${col.data_type}`;
          if (col.character_maximum_length) {
            def += `(${col.character_maximum_length})`;
          } else if (col.numeric_precision && col.numeric_scale) {
            def += `(${col.numeric_precision},${col.numeric_scale})`;
          }
          if (col.is_nullable === "NO") {
            def += ` NOT NULL`;
          }
          if (col.column_default) {
            def += ` DEFAULT ${col.column_default}`;
          }
          return def;
        });
        ddl += columnDefs.join(",\n");
        ddl += `
);

`;
        if (primaryKeysResult.length > 0) {
          ddl += `-- Primary Key
`;
          ddl += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("${primaryKeysResult[0].column_name}");

`;
        }
        if (foreignKeysResult.length > 0) {
          ddl += `-- Foreign Keys
`;
          for (const fk of foreignKeysResult) {
            ddl += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}");
`;
          }
          ddl += `
`;
        }
        if (uniqueKeysResult.length > 0) {
          ddl += `-- Unique Constraints
`;
          for (const uk of uniqueKeysResult) {
            ddl += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${uk.constraint_name}" UNIQUE ("${uk.column_name}");
`;
          }
          ddl += `
`;
        }
        if (indexesResult.length > 0) {
          ddl += `-- \xCDndices
`;
          for (const idx of indexesResult) {
            if (!idx.indexname.includes("_pkey") && !idx.indexname.includes("_key")) {
              ddl += `${idx.indexdef};
`;
            }
          }
          ddl += `
`;
        }
        try {
          const countQuery = `SELECT COUNT(*) as count FROM "${tableName}"`;
          const countResult = await client2.unsafe(countQuery);
          const recordCount = countResult[0]?.count || 0;
          ddl += `-- Total de registros: ${recordCount}
`;
        } catch (countError) {
          ddl += `-- Total de registros: Erro ao contar (${countError instanceof Error ? countError.message : "Desconhecido"})
`;
        }
        ddl += `
`;
      }
      await client2.end();
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="database_ddl_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.sql"`);
      res.send(ddl);
    } catch (error) {
      await client2.end();
      throw error;
    }
  } catch (error) {
    console.error("Erro ao gerar DDL:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}

// server/controllers/setup.controller.ts
init_schema();
import { drizzle as drizzle2 } from "drizzle-orm/postgres-js";
import postgres4 from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import bcrypt5 from "bcryptjs";
async function getSetupStatus(req, res) {
  try {
    console.log("\u{1F50D} Setup Controller Debug:", {
      setupEnv: process.env.SETUP,
      isSetupMode: process.env.SETUP === "true"
    });
    const isSetupMode = process.env.SETUP === "true";
    if (!isSetupMode) {
      console.log("\u274C Setup mode desabilitado");
      return res.json({
        setupMode: false,
        message: "Setup mode is not enabled"
      });
    }
    let hasExistingData = false;
    try {
      const client2 = postgres4(process.env.DATABASE_URL || "");
      const result = await client2`SELECT COUNT(*) as count FROM usuarios`;
      hasExistingData = parseInt(result[0]?.count || "0") > 0;
      await client2.end();
    } catch (error) {
      hasExistingData = false;
    }
    res.json({
      setupMode: true,
      hasExistingData,
      databaseUrl: process.env.DATABASE_URL ? "configured" : "not_configured"
    });
  } catch (error) {
    console.error("Erro ao verificar status do setup:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function testDatabaseConnection(req, res) {
  try {
    const { databaseUrl } = req.body;
    if (!databaseUrl) {
      return res.status(400).json({
        success: false,
        message: "URL do banco de dados \xE9 obrigat\xF3ria"
      });
    }
    const client2 = postgres4(databaseUrl, { prepare: false });
    try {
      await client2`SELECT 1`;
      await client2.end();
      res.json({
        success: true,
        message: "Conex\xE3o com banco de dados estabelecida com sucesso!"
      });
    } catch (error) {
      await client2.end();
      throw error;
    }
  } catch (error) {
    console.error("Erro ao testar conex\xE3o:", error);
    res.status(500).json({
      success: false,
      message: "Falha na conex\xE3o com banco de dados",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function saveDbUrl(req, res) {
  try {
    const { databaseUrl } = req.body;
    if (!databaseUrl) {
      return res.status(400).json({
        success: false,
        message: "URL do banco de dados \xE9 obrigat\xF3ria"
      });
    }
    const client2 = postgres4(databaseUrl, { prepare: false });
    try {
      await client2`SELECT 1`;
      await client2.end();
      process.env.DATABASE_URL = databaseUrl;
      res.json({
        success: true,
        message: "Conex\xE3o testada e URL salva temporariamente com sucesso!"
      });
    } catch (error) {
      await client2.end();
      return res.status(500).json({
        success: false,
        message: "Falha ao conectar com o banco de dados",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  } catch (error) {
    console.error("Erro ao salvar URL do banco:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao salvar URL do banco",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function runSetup(req, res) {
  try {
    const { databaseUrl, adminEmail, adminPassword, adminName } = req.body;
    if (!databaseUrl || !adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos s\xE3o obrigat\xF3rios"
      });
    }
    console.log("\u{1F680} Iniciando setup do sistema...");
    const client2 = postgres4(databaseUrl, { prepare: false });
    const db2 = drizzle2(client2);
    process.env.DATABASE_URL = databaseUrl;
    try {
      console.log("\u{1F4CB} Executando migra\xE7\xF5es...");
      await migrate(db2, { migrationsFolder: "./drizzle" });
      console.log("\u{1F464} Criando usu\xE1rio superadmin...");
      const hashedPassword = await bcrypt5.hash(adminPassword, 10);
      const [adminUser] = await db2.insert(users).values({
        nome: adminName,
        email: adminEmail,
        senha: hashedPassword,
        tipo_usuario: "superadmin",
        ativo: true,
        remoteJid: ""
      }).returning();
      console.log("\u{1F4B0} Criando carteira padr\xE3o...");
      await db2.insert(wallets).values({
        usuario_id: adminUser.id,
        nome: "Carteira Principal",
        descricao: "Carteira padr\xE3o criada automaticamente",
        saldo_atual: "0.00"
      });
      console.log("\u{1F4C2} Criando categorias globais...");
      const defaultCategories = [
        // Despesas
        { nome: "Alimenta\xE7\xE3o", tipo: "Despesa", cor: "#FF6B6B", icone: "\u{1F37D}\uFE0F", descricao: "Gastos com alimenta\xE7\xE3o e refei\xE7\xF5es" },
        { nome: "Transporte", tipo: "Despesa", cor: "#4ECDC4", icone: "\u{1F697}", descricao: "Gastos com transporte e locomo\xE7\xE3o" },
        { nome: "Moradia", tipo: "Despesa", cor: "#45B7D1", icone: "\u{1F3E0}", descricao: "Gastos com moradia e aluguel" },
        { nome: "Sa\xFAde", tipo: "Despesa", cor: "#96CEB4", icone: "\u{1F3E5}", descricao: "Gastos com sa\xFAde e medicamentos" },
        { nome: "Educa\xE7\xE3o", tipo: "Despesa", cor: "#FFEAA7", icone: "\u{1F4DA}", descricao: "Gastos com educa\xE7\xE3o e cursos" },
        { nome: "Lazer", tipo: "Despesa", cor: "#DDA0DD", icone: "\u{1F3AE}", descricao: "Gastos com lazer e entretenimento" },
        { nome: "Vestu\xE1rio", tipo: "Despesa", cor: "#F8BBD9", icone: "\u{1F455}", descricao: "Gastos com roupas e acess\xF3rios" },
        { nome: "Servi\xE7os", tipo: "Despesa", cor: "#FFB74D", icone: "\u{1F527}", descricao: "Gastos com servi\xE7os diversos" },
        { nome: "Impostos", tipo: "Despesa", cor: "#A1887F", icone: "\u{1F4B0}", descricao: "Pagamento de impostos e taxas" },
        { nome: "Outros", tipo: "Despesa", cor: "#90A4AE", icone: "\u{1F4E6}", descricao: "Outros gastos diversos" },
        // Receitas
        { nome: "Sal\xE1rio", tipo: "Receita", cor: "#4CAF50", icone: "\u{1F4BC}", descricao: "Receita de sal\xE1rio e trabalho" },
        { nome: "Freelance", tipo: "Receita", cor: "#8BC34A", icone: "\u{1F4BB}", descricao: "Receita de trabalhos freelancer" },
        { nome: "Investimentos", tipo: "Receita", cor: "#FFC107", icone: "\u{1F4C8}", descricao: "Receita de investimentos" },
        { nome: "Presentes", tipo: "Receita", cor: "#E91E63", icone: "\u{1F381}", descricao: "Receita de presentes e doa\xE7\xF5es" },
        { nome: "Reembolso", tipo: "Receita", cor: "#9C27B0", icone: "\u{1F4B8}", descricao: "Reembolsos e devolu\xE7\xF5es" },
        { nome: "Outros", tipo: "Receita", cor: "#607D8B", icone: "\u{1F4E6}", descricao: "Outras receitas diversas" }
      ];
      for (const category of defaultCategories) {
        await db2.insert(categories).values({
          ...category,
          global: true,
          usuario_id: null
        });
      }
      console.log("\u{1F4B3} Criando formas de pagamento globais...");
      const defaultPaymentMethods = [
        { nome: "PIX", descricao: "Pagamento via PIX", icone: "\u{1F4F1}", cor: "#32CD32", global: true },
        { nome: "Cart\xE3o de Cr\xE9dito", descricao: "Pagamento com cart\xE3o de cr\xE9dito", icone: "\u{1F4B3}", cor: "#FF6B35", global: true },
        { nome: "Dinheiro", descricao: "Pagamento em dinheiro", icone: "\u{1F4B5}", cor: "#4CAF50", global: true },
        { nome: "Cart\xE3o de D\xE9bito", descricao: "Pagamento com cart\xE3o de d\xE9bito", icone: "\u{1F3E6}", cor: "#2196F3", global: true },
        { nome: "Transfer\xEAncia", descricao: "Transfer\xEAncia banc\xE1ria", icone: "\u{1F3DB}\uFE0F", cor: "#9C27B0", global: true },
        { nome: "Boleto", descricao: "Pagamento via boleto", icone: "\u{1F4C4}", cor: "#FF9800", global: true }
      ];
      for (const paymentMethod of defaultPaymentMethods) {
        await db2.insert(paymentMethods).values({
          ...paymentMethod,
          usuario_id: null,
          ativo: true
        });
      }
      console.log("\u{1F511} Criando token API...");
      const apiToken = generateApiToken();
      await db2.insert(apiTokens).values({
        usuario_id: adminUser.id,
        token: apiToken,
        nome: "Token Principal",
        descricao: "Token API principal criado automaticamente",
        ativo: true
      });
      await client2.end();
      console.log("\u2705 Setup conclu\xEDdo com sucesso!");
      res.json({
        success: true,
        message: "Setup conclu\xEDdo com sucesso!",
        data: {
          adminEmail,
          adminName,
          apiToken
        }
      });
    } catch (error) {
      await client2.end();
      throw error;
    }
  } catch (error) {
    console.error("Erro durante setup:", error);
    res.status(500).json({
      success: false,
      message: "Erro durante o setup",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function createAdmin(req, res) {
  try {
    const { adminName, adminEmail, adminPassword } = req.body;
    if (!adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: "Nome, email e senha do admin s\xE3o obrigat\xF3rios"
      });
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(400).json({
        success: false,
        message: "URL do banco de dados n\xE3o configurada. Salve a URL primeiro."
      });
    }
    const client2 = postgres4(databaseUrl, { prepare: false });
    try {
      const existing = await client2`SELECT * FROM usuarios WHERE email = ${adminEmail}`;
      if (existing.length > 0) {
        await client2.end();
        return res.status(400).json({
          success: false,
          message: "J\xE1 existe um usu\xE1rio com este email."
        });
      }
      const hashedPassword = await bcrypt5.hash(adminPassword, 10);
      const inserted = await client2`INSERT INTO usuarios (nome, email, senha, tipo_usuario, ativo, remoteJid) VALUES (${adminName}, ${adminEmail}, ${hashedPassword}, 'superadmin', true, '') RETURNING id`;
      await client2.end();
      res.json({
        success: true,
        message: "Usu\xE1rio admin criado com sucesso!",
        adminId: inserted[0]?.id
      });
    } catch (error) {
      await client2.end();
      throw error;
    }
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar usu\xE1rio admin",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
async function finishSetup(req, res) {
  try {
    const { adminEmail } = req.body;
    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Email do admin \xE9 obrigat\xF3rio"
      });
    }
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(400).json({
        success: false,
        message: "URL do banco de dados n\xE3o configurada."
      });
    }
    const client2 = postgres4(databaseUrl, { prepare: false });
    const db2 = drizzle2(client2);
    try {
      await migrate(db2, { migrationsFolder: "./drizzle" });
      const adminRows = await client2`SELECT * FROM usuarios WHERE email = ${adminEmail}`;
      const adminUser = adminRows[0];
      if (!adminUser) {
        await client2.end();
        return res.status(400).json({
          success: false,
          message: "Usu\xE1rio admin n\xE3o encontrado."
        });
      }
      await client2`INSERT INTO carteiras (usuario_id, nome, descricao, saldo_atual) VALUES (${adminUser.id}, 'Carteira Principal', 'Carteira padrão criada automaticamente', '0.00')`;
      const defaultCategories = [
        { nome: "Alimenta\xE7\xE3o", tipo: "Despesa", cor: "#FF6B6B", icone: "\u{1F37D}\uFE0F", descricao: "Gastos com alimenta\xE7\xE3o e refei\xE7\xF5es" },
        { nome: "Transporte", tipo: "Despesa", cor: "#4ECDC4", icone: "\u{1F697}", descricao: "Gastos com transporte e locomo\xE7\xE3o" },
        { nome: "Moradia", tipo: "Despesa", cor: "#45B7D1", icone: "\u{1F3E0}", descricao: "Gastos com moradia e aluguel" },
        { nome: "Sa\xFAde", tipo: "Despesa", cor: "#96CEB4", icone: "\u{1F3E5}", descricao: "Gastos com sa\xFAde e medicamentos" },
        { nome: "Educa\xE7\xE3o", tipo: "Despesa", cor: "#FFEAA7", icone: "\u{1F4DA}", descricao: "Gastos com educa\xE7\xE3o e cursos" },
        { nome: "Lazer", tipo: "Despesa", cor: "#DDA0DD", icone: "\u{1F3AE}", descricao: "Gastos com lazer e entretenimento" },
        { nome: "Vestu\xE1rio", tipo: "Despesa", cor: "#F8BBD9", icone: "\u{1F455}", descricao: "Gastos com roupas e acess\xF3rios" },
        { nome: "Servi\xE7os", tipo: "Despesa", cor: "#FFB74D", icone: "\u{1F527}", descricao: "Gastos com servi\xE7os diversos" },
        { nome: "Impostos", tipo: "Despesa", cor: "#A1887F", icone: "\u{1F4B0}", descricao: "Pagamento de impostos e taxas" },
        { nome: "Outros", tipo: "Despesa", cor: "#90A4AE", icone: "\u{1F4E6}", descricao: "Outros gastos diversos" },
        { nome: "Sal\xE1rio", tipo: "Receita", cor: "#4CAF50", icone: "\u{1F4BC}", descricao: "Receita de sal\xE1rio e trabalho" },
        { nome: "Freelance", tipo: "Receita", cor: "#8BC34A", icone: "\u{1F4BB}", descricao: "Receita de trabalhos freelancer" },
        { nome: "Investimentos", tipo: "Receita", cor: "#FFC107", icone: "\u{1F4C8}", descricao: "Receita de investimentos" },
        { nome: "Presentes", tipo: "Receita", cor: "#E91E63", icone: "\u{1F381}", descricao: "Receita de presentes e doa\xE7\xF5es" },
        { nome: "Reembolso", tipo: "Receita", cor: "#9C27B0", icone: "\u{1F4B8}", descricao: "Reembolsos e devolu\xE7\xF5es" },
        { nome: "Outros", tipo: "Receita", cor: "#607D8B", icone: "\u{1F4E6}", descricao: "Outras receitas diversas" }
      ];
      for (const category of defaultCategories) {
        await client2`INSERT INTO categorias (nome, tipo, cor, icone, descricao, global, usuario_id) VALUES (${category.nome}, ${category.tipo}, ${category.cor}, ${category.icone}, ${category.descricao}, true, NULL)`;
      }
      const defaultPaymentMethods = [
        { nome: "PIX", descricao: "Pagamento via PIX", icone: "\u{1F4F1}", cor: "#32CD32", global: true },
        { nome: "Cart\xE3o de Cr\xE9dito", descricao: "Pagamento com cart\xE3o de cr\xE9dito", icone: "\u{1F4B3}", cor: "#FF6B35", global: true },
        { nome: "Dinheiro", descricao: "Pagamento em dinheiro", icone: "\u{1F4B5}", cor: "#4CAF50", global: true },
        { nome: "Cart\xE3o de D\xE9bito", descricao: "Pagamento com cart\xE3o de d\xE9bito", icone: "\u{1F3E6}", cor: "#2196F3", global: true },
        { nome: "Transfer\xEAncia", descricao: "Transfer\xEAncia banc\xE1ria", icone: "\u{1F3DB}\uFE0F", cor: "#9C27B0", global: true },
        { nome: "Boleto", descricao: "Pagamento via boleto", icone: "\u{1F4C4}", cor: "#FF9800", global: true }
      ];
      for (const paymentMethod of defaultPaymentMethods) {
        await client2`INSERT INTO formas_pagamento (nome, descricao, icone, cor, global, usuario_id, ativo) VALUES (${paymentMethod.nome}, ${paymentMethod.descricao}, ${paymentMethod.icone}, ${paymentMethod.cor}, true, NULL, true)`;
      }
      const apiToken = generateApiToken();
      await client2`INSERT INTO tokens_api (usuario_id, token, nome, descricao, ativo) VALUES (${adminUser.id}, ${apiToken}, 'Token Principal', 'Token API principal criado automaticamente', true)`;
      await client2.end();
      res.json({
        success: true,
        message: "Setup finalizado com sucesso!",
        apiToken
      });
    } catch (error) {
      await client2.end();
      throw error;
    }
  } catch (error) {
    console.error("Erro ao finalizar setup:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao finalizar setup",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
function generateApiToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// server/controllers/welcome-messages.controller.ts
import postgres5 from "postgres";
var getClient2 = () => postgres5(process.env.DATABASE_URL || "", { prepare: false });
var getWelcomeMessages = async (req, res) => {
  const client2 = getClient2();
  try {
    const result = await client2`
      SELECT * FROM welcome_messages 
      ORDER BY type
    `;
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var getWelcomeMessageByType = async (req, res) => {
  const client2 = getClient2();
  try {
    const { type } = req.params;
    const result = await client2`
      SELECT * FROM welcome_messages 
      WHERE type = ${type}
    `;
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mensagem n\xE3o encontrada"
      });
    }
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao buscar mensagem:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var updateWelcomeMessage = async (req, res) => {
  const client2 = getClient2();
  try {
    const { type } = req.params;
    const {
      title,
      message,
      email_content,
      payment_link,
      send_email_welcome,
      send_email_activation,
      show_dashboard_message
    } = req.body;
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "T\xEDtulo e mensagem s\xE3o obrigat\xF3rios"
      });
    }
    const result = await client2`
      INSERT INTO welcome_messages (
        type, title, message, email_content, payment_link,
        send_email_welcome, send_email_activation, show_dashboard_message
      ) VALUES (
        ${type}, ${title}, ${message}, ${email_content || null}, 
        ${payment_link || null}, ${send_email_welcome || false}, 
        ${send_email_activation || false}, ${show_dashboard_message || false}
      )
      ON CONFLICT (type) DO UPDATE SET
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        email_content = EXCLUDED.email_content,
        payment_link = EXCLUDED.payment_link,
        send_email_welcome = EXCLUDED.send_email_welcome,
        send_email_activation = EXCLUDED.send_email_activation,
        show_dashboard_message = EXCLUDED.show_dashboard_message,
        updated_at = NOW()
      RETURNING *
    `;
    res.json({
      success: true,
      message: "Mensagem salva com sucesso",
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var createWelcomeMessage = async (req, res) => {
  const client2 = getClient2();
  try {
    const {
      type,
      title,
      message,
      email_content,
      payment_link,
      send_email_welcome,
      send_email_activation,
      show_dashboard_message
    } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Tipo, t\xEDtulo e mensagem s\xE3o obrigat\xF3rios"
      });
    }
    const result = await client2`
      INSERT INTO welcome_messages (
        type, title, message, email_content, payment_link,
        send_email_welcome, send_email_activation, show_dashboard_message
      ) VALUES (
        ${type}, ${title}, ${message}, ${email_content || null}, 
        ${payment_link || null}, ${send_email_welcome || false}, 
        ${send_email_activation || false}, ${show_dashboard_message || false}
      )
      RETURNING *
    `;
    res.status(201).json({
      success: true,
      message: "Mensagem criada com sucesso",
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return res.status(409).json({
        success: false,
        message: "J\xE1 existe uma mensagem com este tipo"
      });
    }
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};

// server/controllers/waha-config.controller.ts
import postgres6 from "postgres";
var getClient3 = () => postgres6(process.env.DATABASE_URL || "", { prepare: false });
var generateWebhookHash = async (sessionName) => {
  const crypto = await import("crypto");
  const data = `${sessionName}_${Date.now()}_${Math.random()}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  const base = hash.substring(0, 8);
  let result = "";
  for (let i = 0; i < 5; i++) {
    const char = base[i];
    if (i % 3 === 0) {
      result += char.toUpperCase();
    } else if (i % 3 === 1) {
      result += char.toLowerCase();
    } else {
      const num = parseInt(char, 16) % 10;
      result += num.toString();
    }
  }
  return result;
};
var generateWebhookUrl = (hash) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/api/waha/webhook/${hash}`;
};
var ensureWebhookHashColumn = async (client2) => {
  try {
    const columnExists = await client2`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'waha_config' 
      AND column_name = 'webhook_hash'
    `;
    if (columnExists.length === 0) {
      console.log("[WAHA Config] Adicionando coluna webhook_hash \xE0 tabela waha_config...");
      await client2`
        ALTER TABLE waha_config 
        ADD COLUMN IF NOT EXISTS webhook_hash VARCHAR(10) UNIQUE
      `;
      console.log("[WAHA Config] \u2705 Coluna webhook_hash adicionada com sucesso");
    }
  } catch (error) {
    console.error("[WAHA Config] Erro ao verificar/adicionar coluna webhook_hash:", error);
  }
};
var getWahaConfig = async (req, res) => {
  const client2 = getClient3();
  try {
    await ensureWebhookHashColumn(client2);
    const result = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (result.length === 0) {
      const defaultSessionName = "numero-principal";
      const webhookHash = await generateWebhookHash(defaultSessionName);
      const webhookUrl = generateWebhookUrl(webhookHash);
      return res.json({
        success: true,
        data: {
          waha_url: "https://whatsapp-waha-whatsapp.ie5w7f.easypanel.host",
          api_key: "",
          webhook_url: webhookUrl,
          webhook_hash: webhookHash,
          session_name: defaultSessionName,
          enabled: false
        }
      });
    }
    const config = result[0];
    if (!config.webhook_hash) {
      const webhookHash = await generateWebhookHash(config.session_name);
      const webhookUrl = generateWebhookUrl(webhookHash);
      await client2`
        UPDATE waha_config 
        SET webhook_hash = ${webhookHash}, webhook_url = ${webhookUrl}
        WHERE id = ${config.id}
      `;
      config.webhook_hash = webhookHash;
      config.webhook_url = webhookUrl;
    }
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Erro ao buscar configura\xE7\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var updateWahaConfig = async (req, res) => {
  const client2 = getClient3();
  try {
    await ensureWebhookHashColumn(client2);
    const {
      waha_url,
      api_key,
      webhook_url,
      session_name,
      enabled,
      regenerate_webhook_hash
    } = req.body;
    if (!waha_url) {
      return res.status(400).json({
        success: false,
        message: "URL do WAHA \xE9 obrigat\xF3ria"
      });
    }
    const existing = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    let webhookHash = existing[0]?.webhook_hash;
    let finalWebhookUrl = webhook_url;
    if (regenerate_webhook_hash || !webhookHash) {
      webhookHash = await generateWebhookHash(session_name || "numero-principal");
      finalWebhookUrl = generateWebhookUrl(webhookHash);
    }
    let result;
    if (existing.length > 0) {
      result = await client2`
        UPDATE waha_config 
        SET 
          waha_url = ${waha_url},
          api_key = ${api_key || null},
          webhook_url = ${finalWebhookUrl},
          webhook_hash = ${webhookHash},
          session_name = ${session_name || "numero-principal"},
          enabled = ${enabled || false},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      result = await client2`
        INSERT INTO waha_config (
          waha_url, api_key, webhook_url, webhook_hash, session_name, enabled
        ) VALUES (
          ${waha_url}, ${api_key || null}, ${finalWebhookUrl}, ${webhookHash},
          ${session_name || "numero-principal"}, ${enabled || false}
        )
        RETURNING *
      `;
    }
    res.json({
      success: true,
      message: "Configura\xE7\xE3o WAHA atualizada com sucesso",
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao atualizar configura\xE7\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
async function tryWahaEndpoint(baseUrl, path9, apiKey, sessionName) {
  const url = baseUrl.endsWith("/") ? `${baseUrl}${path9}` : `${baseUrl}/${path9}`;
  try {
    console.log(`Tentando: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: apiKey ? {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      } : {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, data, url };
    } else {
      console.log(`Falha: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`Erro na requisi\xE7\xE3o:`, error);
  }
  return { success: false };
}
var testWahaConnection = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const endpointsToTry = [
      `api/sessions/${wahaConfig.session_name}`,
      // Endpoint principal
      `api/sessions`,
      // Lista de sessões
      `api/health`,
      // Health check
      `health`
    ];
    console.log("Testando conex\xE3o WAHA com URL base:", wahaConfig.waha_url);
    console.log("Session name:", wahaConfig.session_name);
    console.log("API Key presente:", !!wahaConfig.api_key);
    for (const endpoint of endpointsToTry) {
      const result = await tryWahaEndpoint(
        wahaConfig.waha_url,
        endpoint,
        wahaConfig.api_key,
        wahaConfig.session_name
      );
      if (result.success) {
        console.log("Conex\xE3o bem-sucedida com endpoint:", result.url);
        return res.json({
          success: true,
          message: "Conex\xE3o com WAHA estabelecida com sucesso",
          data: {
            status: "connected",
            endpoint: result.url,
            response: result.data
          }
        });
      }
    }
    res.status(400).json({
      success: false,
      message: "N\xE3o foi poss\xEDvel conectar com WAHA. Verifique a URL, API Key e nome da sess\xE3o.",
      triedEndpoints: endpointsToTry.map((e) => `${wahaConfig.waha_url}/${e}`)
    });
  } catch (error) {
    console.error("Erro ao testar conex\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
async function tryCreateSession(url, apiKey, sessionName, webhooks = []) {
  const formats = [
    // Formato 1: Apenas nome
    { name: sessionName },
    // Formato 2: Nome com config vazia
    { name: sessionName, config: {} },
    // Formato 3: Com webhooks se fornecidos
    webhooks.length > 0 ? { name: sessionName, config: { webhooks } } : null,
    // Formato 4: Formato alternativo comum
    { sessionName },
    // Formato 5: Formato direto
    sessionName
  ].filter(Boolean);
  for (let i = 0; i < formats.length; i++) {
    const payload = formats[i];
    console.log(`Tentando formato ${i + 1}:`, JSON.stringify(payload, null, 2));
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey
        },
        body: typeof payload === "string" ? `"${payload}"` : JSON.stringify(payload)
      });
      console.log(`Formato ${i + 1} - Status:`, response.status);
      if (response.ok) {
        const data = await response.json();
        return { success: true, data, format: i + 1 };
      } else if (response.status !== 422) {
        const errorData = await response.text();
        return { success: false, status: response.status, error: errorData, format: i + 1 };
      }
    } catch (error) {
      console.log(`Formato ${i + 1} - Erro:`, error);
    }
  }
  return { success: false, message: "Todos os formatos falharam" };
}
var createWahaSession = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName, webhooks = [] } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
      });
    }
    const createUrl = `${wahaConfig.waha_url}/api/sessions`;
    console.log("Tentando criar sess\xE3o:", { sessionName, webhooks, createUrl });
    const result = await tryCreateSession(createUrl, wahaConfig.api_key, sessionName, webhooks);
    if (result.success) {
      res.json({
        success: true,
        message: `Sess\xE3o criada com sucesso usando formato ${result.format}`,
        data: result.data
      });
    } else if (result.status) {
      res.status(result.status).json({
        success: false,
        message: `Erro ao criar sess\xE3o: ${result.status}`,
        error: result.error,
        format: result.format,
        wahaResponse: {
          status: result.status,
          url: createUrl
        }
      });
    } else {
      res.status(422).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel criar a sess\xE3o com nenhum formato suportado",
        error: result.message,
        url: createUrl,
        sessionName
      });
    }
  } catch (error) {
    console.error("Erro ao criar sess\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var updateWahaSession = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const { webhooks } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
      });
    }
    const updateUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}`;
    try {
      const response = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": wahaConfig.api_key
        },
        body: JSON.stringify({
          config: {
            webhooks: webhooks || []
          }
        })
      });
      if (response.ok) {
        const sessionData = await response.json();
        res.json({
          success: true,
          message: "Sess\xE3o atualizada com sucesso",
          data: sessionData
        });
      } else {
        const errorData = await response.text();
        res.status(400).json({
          success: false,
          message: `Erro ao atualizar sess\xE3o: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel atualizar sess\xE3o no WAHA",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar sess\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var startWahaSession = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const startUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}/start`;
    try {
      const response = await fetch(startUrl, {
        method: "POST",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (response.ok) {
        const sessionData = await response.json();
        res.json({
          success: true,
          message: "Sess\xE3o iniciada com sucesso",
          data: sessionData
        });
      } else {
        const errorData = await response.text();
        res.status(400).json({
          success: false,
          message: `Erro ao iniciar sess\xE3o: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel iniciar sess\xE3o no WAHA",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao iniciar sess\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var stopWahaSession = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const stopUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}/stop`;
    try {
      const response = await fetch(stopUrl, {
        method: "POST",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (response.ok) {
        const sessionData = await response.json();
        res.json({
          success: true,
          message: "Sess\xE3o parada com sucesso",
          data: sessionData
        });
      } else {
        const errorData = await response.text();
        res.status(400).json({
          success: false,
          message: `Erro ao parar sess\xE3o: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel parar sess\xE3o no WAHA",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao parar sess\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var deleteWahaSession = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const deleteUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}`;
    try {
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (response.ok) {
        res.json({
          success: true,
          message: "Sess\xE3o deletada com sucesso"
        });
      } else {
        const errorData = await response.text();
        res.status(400).json({
          success: false,
          message: `Erro ao deletar sess\xE3o: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel deletar sess\xE3o no WAHA",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao deletar sess\xE3o WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
async function getWahaSessionsDirect(baseUrl, apiKey) {
  const endpoints = [
    "api/sessions?all=true",
    // PRINCIPAL - Retorna todas as sessões incluindo STOPPED
    "api/sessions",
    // Apenas ativas
    "api/sessions/all",
    "api/v1/sessions",
    "sessions?all=true",
    "sessions",
    "api/session",
    "session",
    "api/sessions/status",
    "api/whatsapp/sessions",
    "whatsapp/sessions"
  ];
  for (const endpoint of endpoints) {
    const url = `${baseUrl}/${endpoint}`;
    console.log(`Testando endpoint direto: ${url}`);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey
        }
      });
      console.log(`${endpoint} - Status: ${response.status}`);
      if (response.ok) {
        const text2 = await response.text();
        console.log(`${endpoint} - Resposta RAW: ${text2}`);
        try {
          const data = JSON.parse(text2);
          console.log(`${endpoint} - Dados JSON parseados:`, JSON.stringify(data, null, 2));
          if (Array.isArray(data)) {
            console.log(`\u{1F4CB} SESS\xD5ES ENCONTRADAS (${data.length}):`);
            data.forEach((session2, index) => {
              console.log(`  ${index + 1}. Nome: ${session2.name || session2.sessionName || "N/A"}`);
              console.log(`     Status: ${session2.status || "N/A"}`);
              console.log(`     Conectado: ${session2.me?.id || "N\xE3o conectado"}`);
              console.log(`     Engine: ${session2.engine || "N/A"}`);
              console.log("     ---");
            });
          } else if (data && typeof data === "object") {
            if (data.sessions && Array.isArray(data.sessions)) {
              console.log(`\u{1F4CB} SESS\xD5ES ENCONTRADAS EM data.sessions (${data.sessions.length}):`);
              data.sessions.forEach((session2, index) => {
                console.log(`  ${index + 1}. Nome: ${session2.name || session2.sessionName || "N/A"}`);
                console.log(`     Status: ${session2.status || "N/A"}`);
                console.log(`     Conectado: ${session2.me?.id || "N\xE3o conectado"}`);
                console.log(`     Engine: ${session2.engine || "N/A"}`);
                console.log("     ---");
              });
            } else {
              console.log(`\u{1F4CB} SESS\xC3O \xDANICA ENCONTRADA:`);
              console.log(`  Nome: ${data.name || data.sessionName || "N/A"}`);
              console.log(`  Status: ${data.status || "N/A"}`);
              console.log(`  Conectado: ${data.me?.id || "N\xE3o conectado"}`);
              console.log(`  Engine: ${data.engine || "N/A"}`);
            }
          }
          return {
            success: true,
            data,
            endpoint: url,
            rawResponse: text2
          };
        } catch (e) {
          console.log(`${endpoint} - Erro ao parsear JSON:`, e);
          console.log(`${endpoint} - Resposta n\xE3o \xE9 JSON v\xE1lido: ${text2}`);
        }
      }
    } catch (error) {
      console.log(`${endpoint} - Erro na requisi\xE7\xE3o:`, error);
    }
  }
  return { success: false };
}
var getWahaSessions = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    console.log("Buscando todas as sess\xF5es WAHA (incluindo STOPPED)...");
    const mainEndpoint = "api/sessions?all=true";
    console.log(`\u{1F3AF} Tentando endpoint principal: ${wahaConfig.waha_url}/${mainEndpoint}`);
    try {
      const response = await fetch(`${wahaConfig.waha_url}/${mainEndpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (response.ok) {
        const sessionsData = await response.json();
        console.log("\u2705 Sess\xF5es encontradas no endpoint principal!");
        console.log("Dados recebidos:", JSON.stringify(sessionsData, null, 2));
        let sessions = Array.isArray(sessionsData) ? sessionsData : [sessionsData];
        console.log(`\u{1F4CA} Total de sess\xF5es encontradas: ${sessions.length}`);
        sessions.forEach((session2, index) => {
          console.log(`  ${index + 1}. Nome: ${session2.name}`);
          console.log(`     Status: ${session2.status}`);
          console.log(`     Conectado: ${session2.me?.id || "N\xE3o conectado"}`);
          console.log(`     Engine: ${session2.engine?.engine || "N/A"}`);
          console.log("     ---");
        });
        return res.json({
          success: true,
          data: sessions,
          endpoint: `${wahaConfig.waha_url}/${mainEndpoint}`,
          total: sessions.length,
          debug: {
            method: "direct_endpoint",
            originalType: Array.isArray(sessionsData) ? "array" : typeof sessionsData,
            processedCount: sessions.length
          }
        });
      }
    } catch (error) {
      console.log("\u274C Endpoint principal falhou, tentando alternativas...");
    }
    const result = await getWahaSessionsDirect(wahaConfig.waha_url, wahaConfig.api_key);
    if (result.success) {
      console.log("\u2705 Sess\xF5es encontradas!");
      console.log("Endpoint usado:", result.endpoint);
      console.log("Dados brutos:", result.rawResponse);
      let sessions = result.data;
      if (!Array.isArray(sessions)) {
        if (sessions.sessions && Array.isArray(sessions.sessions)) {
          sessions = sessions.sessions;
        } else if (sessions.data && Array.isArray(sessions.data)) {
          sessions = sessions.data;
        } else if (sessions.results && Array.isArray(sessions.results)) {
          sessions = sessions.results;
        } else if (typeof sessions === "object") {
          sessions = [sessions];
        } else {
          sessions = [];
        }
      }
      return res.json({
        success: true,
        data: sessions,
        endpoint: result.endpoint,
        total: sessions.length,
        rawData: result.data,
        debug: {
          originalType: Array.isArray(result.data) ? "array" : typeof result.data,
          processedCount: sessions.length
        }
      });
    }
    console.log("\u274C Nenhum endpoint funcionou para buscar sess\xF5es");
    res.status(400).json({
      success: false,
      message: "N\xE3o foi poss\xEDvel buscar sess\xF5es do WAHA. Verifique se a API est\xE1 configurada corretamente.",
      config: {
        url: wahaConfig.waha_url,
        hasApiKey: !!wahaConfig.api_key,
        sessionName: wahaConfig.session_name
      }
    });
  } catch (error) {
    console.error("Erro ao buscar sess\xF5es WAHA:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var getSessionQRCode = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
      });
    }
    console.log("\u{1F50D} === TENTANDO OBTER QR CODE ===");
    console.log("Sess\xE3o:", sessionName);
    console.log("URL Base:", wahaConfig.waha_url);
    const qrUrl = `${wahaConfig.waha_url}/api/${sessionName}/auth/qr`;
    console.log(`\u{1F3AF} Usando endpoint correto: ${qrUrl}`);
    try {
      const response = await fetch(qrUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      console.log(`Status da resposta: ${response.status}`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        console.log(`Content-Type: ${contentType}`);
        if (contentType && contentType.includes("image")) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const dataUri = `data:${contentType};base64,${base64}`;
          console.log("\u2705 QR Code obtido como imagem!");
          return res.json({
            success: true,
            data: {
              qr: dataUri,
              type: "image",
              contentType
            },
            endpoint: `api/${sessionName}/auth/qr`,
            url: qrUrl
          });
        } else {
          const textData = await response.text();
          try {
            const jsonData = JSON.parse(textData);
            console.log("\u2705 QR Code obtido como JSON!");
            return res.json({
              success: true,
              data: jsonData,
              endpoint: `api/${sessionName}/auth/qr`,
              url: qrUrl
            });
          } catch (e) {
            console.log("Resposta n\xE3o \xE9 JSON nem imagem v\xE1lida");
            return res.json({
              success: true,
              data: {
                text: textData,
                type: "text"
              },
              endpoint: `api/${sessionName}/auth/qr`,
              url: qrUrl
            });
          }
        }
      } else {
        const errorData = await response.text();
        console.log(`\u274C Erro no endpoint principal: ${response.status} - ${errorData}`);
      }
    } catch (fetchError) {
      console.log(`\u{1F4A5} Erro na requisi\xE7\xE3o principal: ${fetchError}`);
    }
    console.log("Tentando endpoints alternativos...");
    const qrEndpoints = [
      `api/sessions/${sessionName}/auth/qr`,
      // Formato alternativo com sessions/
      `api/sessions/${sessionName}/qr`,
      // Sem auth/
      `api/${sessionName}/qr`,
      // Sem auth/ e sem sessions/
      `api/v1/${sessionName}/auth/qr`,
      // Com versão v1
      `api/v1/${sessionName}/qr`
      // Com versão v1 sem auth/
    ];
    for (const endpoint of qrEndpoints) {
      const qrUrl2 = `${wahaConfig.waha_url}/${endpoint}`;
      console.log(`
\u{1F50D} Testando endpoint: ${endpoint}`);
      console.log(`   URL completa: ${qrUrl2}`);
      try {
        const response = await fetch(qrUrl2, {
          method: "GET",
          headers: {
            "X-Api-Key": wahaConfig.api_key
          }
        });
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
          const qrData = await response.json();
          console.log(`   \u2705 Sucesso! QR Code obtido via ${endpoint}`);
          return res.json({
            success: true,
            data: qrData,
            endpoint,
            url: qrUrl2
          });
        } else {
          const errorData = await response.text();
          console.log(`   \u274C Falhou: ${response.status} - ${errorData.substring(0, 100)}`);
          if (response.status === 404) {
            continue;
          }
          return res.status(response.status).json({
            success: false,
            message: `Erro ao obter QR Code via ${endpoint}: ${response.status} ${response.statusText}`,
            error: errorData,
            endpoint,
            url: qrUrl2
          });
        }
      } catch (fetchError) {
        console.log(`   \u{1F4A5} Erro na requisi\xE7\xE3o: ${fetchError}`);
        continue;
      }
    }
    console.log("\u274C Nenhum endpoint de QR Code funcionou");
    try {
      const sessionUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}`;
      console.log(`
\u{1F50D} Tentando obter informa\xE7\xF5es da sess\xE3o para debug: ${sessionUrl}`);
      const sessionResponse = await fetch(sessionUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log("\u{1F4CA} Informa\xE7\xF5es da sess\xE3o:", JSON.stringify(sessionData, null, 2));
        return res.status(404).json({
          success: false,
          message: "QR Code n\xE3o dispon\xEDvel - nenhum endpoint funcionou",
          error: "Todos os endpoints de QR Code retornaram erro",
          sessionInfo: sessionData,
          testedEndpoints: qrEndpoints,
          suggestion: "Verifique se a sess\xE3o est\xE1 no estado correto para gerar QR Code"
        });
      }
    } catch (sessionError) {
      console.log("\u274C N\xE3o foi poss\xEDvel obter informa\xE7\xF5es da sess\xE3o para debug");
    }
    res.status(404).json({
      success: false,
      message: "QR Code n\xE3o dispon\xEDvel - nenhum endpoint funcionou",
      error: "Todos os endpoints de QR Code retornaram erro",
      testedEndpoints: qrEndpoints,
      suggestion: "Verifique se a sess\xE3o est\xE1 iniciada e no estado correto para gerar QR Code"
    });
  } catch (error) {
    console.error("Erro ao obter QR Code:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var sendPairingCode = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const { phoneNumber } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
      });
    }
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "N\xFAmero de telefone \xE9 obrigat\xF3rio"
      });
    }
    const pairingUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}/auth/request-code`;
    try {
      const response = await fetch(pairingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": wahaConfig.api_key
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, "")
          // Remove caracteres não numéricos
        })
      });
      if (response.ok) {
        const codeData = await response.json();
        res.json({
          success: true,
          message: "C\xF3digo de pareamento enviado",
          data: codeData
        });
      } else {
        const errorData = await response.text();
        res.status(response.status).json({
          success: false,
          message: `Erro ao enviar c\xF3digo: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel enviar c\xF3digo de pareamento",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao enviar c\xF3digo de pareamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var confirmPairingCode = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    const { sessionName } = req.params;
    const { code } = req.body;
    if (!sessionName) {
      return res.status(400).json({
        success: false,
        message: "Nome da sess\xE3o \xE9 obrigat\xF3rio"
      });
    }
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "C\xF3digo de pareamento \xE9 obrigat\xF3rio"
      });
    }
    const confirmUrl = `${wahaConfig.waha_url}/api/sessions/${sessionName}/auth/authorize-code`;
    try {
      const response = await fetch(confirmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": wahaConfig.api_key
        },
        body: JSON.stringify({
          code: code.replace(/\s/g, "")
          // Remove espaços
        })
      });
      if (response.ok) {
        const confirmData = await response.json();
        res.json({
          success: true,
          message: "Pareamento confirmado com sucesso",
          data: confirmData
        });
      } else {
        const errorData = await response.text();
        res.status(response.status).json({
          success: false,
          message: `Erro ao confirmar c\xF3digo: ${response.status} ${response.statusText}`,
          error: errorData
        });
      }
    } catch (fetchError) {
      res.status(500).json({
        success: false,
        message: "N\xE3o foi poss\xEDvel confirmar c\xF3digo de pareamento",
        error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o"
      });
    }
  } catch (error) {
    console.error("Erro ao confirmar c\xF3digo de pareamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var debugWahaEndpoints = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    console.log("\u{1F50D} === DEBUG WAHA ENDPOINTS ===");
    console.log("URL Base:", wahaConfig.waha_url);
    console.log("API Key presente:", !!wahaConfig.api_key);
    const allEndpoints = [
      "api/sessions?all=true",
      // PRINCIPAL - Inclui sessões STOPPED
      "api/sessions",
      // Apenas ativas
      "api/sessions/all",
      "api/sessions/list",
      "api/v1/sessions",
      "sessions?all=true",
      // Alternativo com parâmetro
      "sessions",
      "sessions/all",
      "api/session",
      "session",
      "api/sessions/status",
      "api/whatsapp/sessions",
      "whatsapp/sessions",
      "api/waha/sessions",
      "waha/sessions"
    ];
    const qrEndpoints = [
      "api/test-session/auth/qr",
      // Endpoint correto conforme documentação
      "api/sessions/test-session/auth/qr",
      // Formato alternativo
      "api/sessions/test-session/qr",
      // Sem auth/
      "api/test-session/qr",
      // Sem auth/ e sem sessions/
      "api/v1/test-session/auth/qr",
      // Com versão v1
      "api/sessions/test-session/status"
      // Status da sessão
    ];
    const results = [];
    for (const endpoint of allEndpoints) {
      const url = `${wahaConfig.waha_url}/${endpoint}`;
      console.log(`
\u{1F50D} Testando: ${endpoint}`);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": wahaConfig.api_key
          }
        });
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
          const text2 = await response.text();
          console.log(`   \u2705 Sucesso! Resposta: ${text2.substring(0, 200)}...`);
          try {
            const data = JSON.parse(text2);
            results.push({
              endpoint,
              url,
              status: response.status,
              success: true,
              data,
              type: Array.isArray(data) ? "array" : typeof data,
              count: Array.isArray(data) ? data.length : data && typeof data === "object" ? Object.keys(data).length : 1
            });
          } catch (e) {
            results.push({
              endpoint,
              url,
              status: response.status,
              success: true,
              rawText: text2,
              parseError: "N\xE3o \xE9 JSON v\xE1lido"
            });
          }
        } else {
          const errorText = await response.text();
          console.log(`   \u274C Falhou: ${response.status} - ${errorText.substring(0, 100)}`);
          results.push({
            endpoint,
            url,
            status: response.status,
            success: false,
            error: errorText
          });
        }
      } catch (fetchError) {
        console.log(`   \u{1F4A5} Erro na requisi\xE7\xE3o: ${fetchError}`);
        results.push({
          endpoint,
          url,
          success: false,
          error: fetchError instanceof Error ? fetchError.message : "Erro desconhecido"
        });
      }
    }
    console.log("\n\u{1F50D} === TESTANDO ENDPOINTS DE QR CODE ===");
    const qrResults = [];
    for (const endpoint of qrEndpoints) {
      const url = `${wahaConfig.waha_url}/${endpoint}`;
      console.log(`
\u{1F50D} Testando QR endpoint: ${endpoint}`);
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-Api-Key": wahaConfig.api_key
          }
        });
        console.log(`   Status: ${response.status}`);
        if (response.ok) {
          const text2 = await response.text();
          console.log(`   \u2705 Sucesso! Resposta: ${text2.substring(0, 200)}...`);
          try {
            const data = JSON.parse(text2);
            qrResults.push({
              endpoint,
              url,
              status: response.status,
              success: true,
              data,
              type: typeof data
            });
          } catch (e) {
            qrResults.push({
              endpoint,
              url,
              status: response.status,
              success: true,
              rawText: text2,
              parseError: "N\xE3o \xE9 JSON v\xE1lido"
            });
          }
        } else {
          const errorText = await response.text();
          console.log(`   \u274C Falhou: ${response.status} - ${errorText.substring(0, 100)}`);
          qrResults.push({
            endpoint,
            url,
            status: response.status,
            success: false,
            error: errorText
          });
        }
      } catch (fetchError) {
        console.log(`   \u{1F4A5} Erro na requisi\xE7\xE3o: ${fetchError}`);
        qrResults.push({
          endpoint,
          url,
          success: false,
          error: fetchError instanceof Error ? fetchError.message : "Erro desconhecido"
        });
      }
    }
    console.log("\n\u{1F4CA} === RESUMO DOS TESTES ===");
    const successful = results.filter((r) => r.success);
    const successfulQR = qrResults.filter((r) => r.success);
    console.log(`\u2705 Sess\xF5es - Sucessos: ${successful.length}/${results.length}`);
    console.log(`\u2705 QR Code - Sucessos: ${successfulQR.length}/${qrResults.length}`);
    successful.forEach((result) => {
      console.log(`   ${result.endpoint}: ${result.type} com ${result.count} item(s)`);
    });
    if (successfulQR.length > 0) {
      console.log("\n\u{1F3AF} Endpoints de QR Code funcionais:");
      successfulQR.forEach((result) => {
        console.log(`   ${result.endpoint}: ${result.type}`);
      });
    }
    res.json({
      success: true,
      message: `Testados ${allEndpoints.length} endpoints de sess\xF5es e ${qrEndpoints.length} endpoints de QR Code`,
      config: {
        url: wahaConfig.waha_url,
        hasApiKey: !!wahaConfig.api_key
      },
      results: {
        sessions: results,
        qrCode: qrResults
      },
      summary: {
        sessions: {
          total: results.length,
          successful: successful.length,
          failed: results.length - successful.length
        },
        qrCode: {
          total: qrResults.length,
          successful: successfulQR.length,
          failed: qrResults.length - successfulQR.length
        }
      }
    });
  } catch (error) {
    console.error("Erro no debug:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};
var testQRCodeEndpoints = async (req, res) => {
  const client2 = getClient3();
  try {
    const config = await client2`
      SELECT * FROM waha_config 
      ORDER BY id DESC 
      LIMIT 1
    `;
    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configura\xE7\xE3o WAHA n\xE3o encontrada"
      });
    }
    const wahaConfig = config[0];
    console.log("\u{1F50D} === TESTE ESPEC\xCDFICO DE QR CODE ===");
    console.log("URL Base:", wahaConfig.waha_url);
    const sessionsUrl = `${wahaConfig.waha_url}/api/sessions?all=true`;
    let existingSessions = [];
    try {
      const sessionsResponse = await fetch(sessionsUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": wahaConfig.api_key
        }
      });
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        existingSessions = Array.isArray(sessionsData) ? sessionsData : [sessionsData];
        console.log(`\u{1F4CA} Sess\xF5es encontradas: ${existingSessions.length}`);
        existingSessions.forEach((session2, index) => {
          console.log(`  ${index + 1}. ${session2.name} - Status: ${session2.status}`);
        });
      }
    } catch (error) {
      console.log("\u274C Erro ao buscar sess\xF5es:", error);
    }
    if (existingSessions.length === 0) {
      console.log("\u{1F4DD} Criando sess\xE3o de teste...");
      try {
        const createUrl = `${wahaConfig.waha_url}/api/sessions`;
        const createResponse = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": wahaConfig.api_key
          },
          body: JSON.stringify({
            name: "test-qr-session",
            webhooks: []
          })
        });
        if (createResponse.ok) {
          const createData = await createResponse.json();
          console.log("\u2705 Sess\xE3o de teste criada:", createData);
          existingSessions = [{ name: "test-qr-session", status: "STOPPED" }];
        }
      } catch (error) {
        console.log("\u274C Erro ao criar sess\xE3o de teste:", error);
      }
    }
    const qrTestResults = [];
    for (const session2 of existingSessions) {
      const sessionName = session2.name;
      console.log(`
\u{1F50D} Testando QR Code para sess\xE3o: ${sessionName}`);
      const qrEndpoints = [
        `api/${sessionName}/auth/qr`,
        // Endpoint correto conforme documentação
        `api/sessions/${sessionName}/auth/qr`,
        // Formato alternativo
        `api/sessions/${sessionName}/qr`,
        // Sem auth/
        `api/${sessionName}/qr`,
        // Sem auth/ e sem sessions/
        `api/v1/${sessionName}/auth/qr`,
        // Com versão v1
        `api/sessions/${sessionName}/status`
        // Status da sessão
      ];
      const sessionResults = [];
      for (const endpoint of qrEndpoints) {
        const qrUrl = `${wahaConfig.waha_url}/${endpoint}`;
        console.log(`   Testando: ${endpoint}`);
        try {
          const response = await fetch(qrUrl, {
            method: "GET",
            headers: {
              "X-Api-Key": wahaConfig.api_key
            }
          });
          const result = {
            endpoint,
            url: qrUrl,
            status: response.status,
            success: response.ok,
            sessionName
          };
          if (response.ok) {
            try {
              const data = await response.json();
              result.data = data;
              console.log(`     \u2705 Sucesso!`);
            } catch (e) {
              const text2 = await response.text();
              result.rawText = text2;
              console.log(`     \u2705 Sucesso (n\xE3o-JSON): ${text2.substring(0, 100)}`);
            }
          } else {
            const errorText = await response.text();
            result.error = errorText;
            console.log(`     \u274C Falhou: ${response.status}`);
          }
          sessionResults.push(result);
        } catch (fetchError) {
          const result = {
            endpoint,
            url: qrUrl,
            success: false,
            error: fetchError instanceof Error ? fetchError.message : "Erro de conex\xE3o",
            sessionName
          };
          sessionResults.push(result);
          console.log(`     \u{1F4A5} Erro: ${result.error}`);
        }
      }
      qrTestResults.push({
        sessionName,
        sessionStatus: session2.status,
        results: sessionResults
      });
    }
    res.json({
      success: true,
      message: `Testados endpoints de QR Code para ${existingSessions.length} sess\xE3o(\xF5es)`,
      config: {
        url: wahaConfig.waha_url,
        hasApiKey: !!wahaConfig.api_key
      },
      sessions: existingSessions,
      qrTestResults,
      summary: {
        totalSessions: existingSessions.length,
        totalEndpoints: 6,
        // Número fixo de endpoints testados
        successfulEndpoints: qrTestResults.reduce(
          (acc, session2) => acc + session2.results.filter((r) => r.success).length,
          0
        )
      }
    });
  } catch (error) {
    console.error("Erro no teste de QR Code:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    await client2.end();
  }
};

// server/controllers/notification.controller.ts
init_db();
init_schema();
import { z as z9 } from "zod";
import { eq as eq4 } from "drizzle-orm";
var notificationSchema = z9.object({
  type: z9.enum(["info", "warning", "error", "success"]),
  title: z9.string().min(1, "T\xEDtulo \xE9 obrigat\xF3rio"),
  message: z9.string().min(1, "Mensagem \xE9 obrigat\xF3ria"),
  targetUser: z9.string().optional(),
  // ID do usuário específico (opcional)
  targetRole: z9.enum(["super_admin", "admin", "user"]).optional(),
  // Role específica (opcional)
  autoClose: z9.number().optional(),
  // Tempo em ms para fechar automaticamente
  persistent: z9.boolean().optional().default(false)
  // Se deve persistir após refresh
});
var sendNotification = async (req, res) => {
  try {
    if (req.user?.tipo_usuario !== "super_admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas SuperAdmin pode enviar notifica\xE7\xF5es." });
    }
    const validatedData = notificationSchema.parse(req.body);
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      autoClose: validatedData.autoClose,
      persistent: validatedData.persistent,
      from: {
        id: req.user.id,
        name: req.user.nome,
        role: req.user.tipo_usuario
      }
    };
    let targetUsers = [];
    if (validatedData.targetUser) {
      const user = await db.select().from(users).where(eq4(users.id, validatedData.targetUser)).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      }
      targetUsers = [validatedData.targetUser];
    } else if (validatedData.targetRole) {
      const usersWithRole = await db.select({ id: users.id }).from(users).where(eq4(users.tipo_usuario, validatedData.targetRole));
      targetUsers = usersWithRole.map((u) => u.id);
    } else {
      const superAdmins = await db.select({ id: users.id }).from(users).where(eq4(users.tipo_usuario, "super_admin"));
      targetUsers = superAdmins.map((u) => u.id);
    }
    broadcastNotification(notification, targetUsers);
    console.log(`[NOTIFICATION] Enviada por ${req.user.nome} (${req.user.tipo_usuario}):`, {
      type: notification.type,
      title: notification.title,
      targets: targetUsers.length,
      targetRole: validatedData.targetRole,
      targetUser: validatedData.targetUser
    });
    res.json({
      success: true,
      message: "Notifica\xE7\xE3o enviada com sucesso",
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        timestamp: notification.timestamp,
        targetCount: targetUsers.length
      }
    });
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o:", error);
    if (error instanceof z9.ZodError) {
      return res.status(400).json({
        error: "Dados inv\xE1lidos",
        details: error.errors
      });
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
var broadcastNotificationToSuperAdmins = async (req, res) => {
  try {
    if (req.user?.tipo_usuario !== "super_admin") {
      return res.status(403).json({ error: "Acesso negado. Apenas SuperAdmin pode fazer broadcast." });
    }
    const { type, title, message, autoClose, persistent } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({ error: "Type, title e message s\xE3o obrigat\xF3rios" });
    }
    const superAdmins = await db.select({ id: users.id }).from(users).where(eq4(users.tipo_usuario, "super_admin"));
    const notification = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      autoClose,
      persistent: persistent || false,
      from: {
        id: req.user.id,
        name: req.user.nome,
        role: req.user.tipo_usuario
      },
      broadcast: true
    };
    broadcastNotification(notification, superAdmins.map((u) => u.id));
    console.log(`[BROADCAST] Enviado por ${req.user.nome} para ${superAdmins.length} SuperAdmins:`, {
      type: notification.type,
      title: notification.title
    });
    res.json({
      success: true,
      message: `Broadcast enviado para ${superAdmins.length} SuperAdmins`,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        timestamp: notification.timestamp,
        targetCount: superAdmins.length
      }
    });
  } catch (error) {
    console.error("Erro ao fazer broadcast:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
var sendTestNotification = async (req, res) => {
  try {
    if (req.user?.tipo_usuario !== "super_admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const testNotification = {
      id: `test_${Date.now()}`,
      type: "info",
      title: "Teste de Notifica\xE7\xE3o",
      message: `Notifica\xE7\xE3o de teste enviada \xE0s ${(/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      autoClose: 5e3,
      persistent: false,
      from: {
        id: req.user.id,
        name: req.user.nome,
        role: req.user.tipo_usuario
      },
      test: true
    };
    broadcastNotification(testNotification, [req.user.id]);
    res.json({
      success: true,
      message: "Notifica\xE7\xE3o de teste enviada",
      notification: testNotification
    });
  } catch (error) {
    console.error("Erro ao enviar notifica\xE7\xE3o de teste:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// server/routes/themes.ts
import express from "express";
init_db();
import { sql as sql5 } from "drizzle-orm";
var router = express.Router();
function validateThemeConfig(config) {
  const requiredFields = [
    "background",
    "foreground",
    "primary",
    "primaryForeground",
    "secondary",
    "secondaryForeground",
    "muted",
    "mutedForeground",
    "accent",
    "accentForeground",
    "border",
    "card",
    "cardForeground",
    "destructive",
    "destructiveForeground"
  ];
  for (const field of requiredFields) {
    const value = config[field];
    if (!value) {
      return false;
    }
    if (typeof value !== "string") {
      return false;
    }
    if (!isValidColor(value)) {
      return false;
    }
  }
  return true;
}
function isValidColor(color) {
  if (!color || typeof color !== "string") return false;
  const trimmed = color.trim();
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (hexPattern.test(trimmed)) {
    return true;
  }
  const hslPattern = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;
  return hslPattern.test(trimmed);
}
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    const result = await db.execute(sql5`
      SELECT 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        is_active_light as isActiveLight,
        is_active_dark as isActiveDark,
        user_id as userId,
        created_at as createdAt,
        updated_at as updatedAt
      FROM custom_themes 
      ORDER BY is_default DESC, created_at DESC
    `);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Erro ao buscar temas:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.get("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute(sql5`
      SELECT 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        user_id as userId,
        created_at as createdAt,
        updated_at as updatedAt
      FROM custom_themes 
      WHERE id = ${id}
    `);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao buscar tema:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.post("/", requireSuperAdmin, async (req, res) => {
  try {
    const { name, lightConfig, darkConfig, isDefault = false } = req.body;
    const userId = req.user?.id;
    if (!name || !lightConfig || !darkConfig) {
      return res.status(400).json({
        success: false,
        error: "Nome e configura\xE7\xF5es de tema s\xE3o obrigat\xF3rios"
      });
    }
    if (!validateThemeConfig(lightConfig) || !validateThemeConfig(darkConfig)) {
      return res.status(400).json({
        success: false,
        error: "Configura\xE7\xF5es de tema inv\xE1lidas"
      });
    }
    if (isDefault) {
      await db.execute(sql5`UPDATE custom_themes SET is_default = false`);
    }
    const result = await db.execute(sql5`
      INSERT INTO custom_themes (
        name, 
        light_config, 
        dark_config, 
        is_default, 
        user_id
      ) 
      VALUES (${name}, ${JSON.stringify(lightConfig)}, ${JSON.stringify(darkConfig)}, ${isDefault}, ${userId}) 
      RETURNING 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        user_id as userId,
        created_at as createdAt,
        updated_at as updatedAt
    `);
    res.status(201).json({
      success: true,
      data: result[0],
      message: "Tema criado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao criar tema:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.put("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lightConfig, darkConfig, isDefault } = req.body;
    const existingTheme = await db.execute(sql5`SELECT id FROM custom_themes WHERE id = ${id}`);
    if (existingTheme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    if (lightConfig && !validateThemeConfig(lightConfig)) {
      return res.status(400).json({
        success: false,
        error: "Configura\xE7\xE3o light inv\xE1lida"
      });
    }
    if (darkConfig && !validateThemeConfig(darkConfig)) {
      return res.status(400).json({
        success: false,
        error: "Configura\xE7\xE3o dark inv\xE1lida"
      });
    }
    if (isDefault) {
      await db.execute(sql5`UPDATE custom_themes SET is_default = false WHERE id != ${id}`);
    }
    const result = await db.execute(sql5`
      UPDATE custom_themes 
      SET 
        name = ${name || sql5`name`},
        light_config = ${lightConfig ? JSON.stringify(lightConfig) : sql5`light_config`},
        dark_config = ${darkConfig ? JSON.stringify(darkConfig) : sql5`dark_config`},
        is_default = ${typeof isDefault === "boolean" ? isDefault : sql5`is_default`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        user_id as userId,
        created_at as createdAt,
        updated_at as updatedAt
    `);
    res.json({
      success: true,
      data: result[0],
      message: "Tema atualizado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar tema:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await db.execute(sql5`SELECT is_default FROM custom_themes WHERE id = ${id}`);
    if (theme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    if (theme[0].is_default) {
      return res.status(400).json({
        success: false,
        error: "N\xE3o \xE9 poss\xEDvel deletar o tema padr\xE3o"
      });
    }
    await db.execute(sql5`DELETE FROM custom_themes WHERE id = ${id}`);
    res.json({
      success: true,
      message: "Tema deletado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao deletar tema:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.post("/:id/activate", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await db.execute(sql5`SELECT id FROM custom_themes WHERE id = ${id}`);
    if (theme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    await db.execute(sql5`UPDATE custom_themes SET is_default = false`);
    await db.execute(sql5`UPDATE custom_themes SET is_default = true WHERE id = ${id}`);
    res.json({
      success: true,
      message: "Tema ativado como padr\xE3o"
    });
  } catch (error) {
    console.error("Erro ao ativar tema:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.post("/:id/activate-light", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await db.execute(sql5`SELECT id FROM custom_themes WHERE id = ${id}`);
    if (theme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    await db.execute(sql5`UPDATE custom_themes SET is_active_light = false`);
    await db.execute(sql5`UPDATE custom_themes SET is_active_light = true WHERE id = ${id}`);
    res.json({
      success: true,
      message: "Tema ativado para light mode"
    });
  } catch (error) {
    console.error("Erro ao ativar tema para light mode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.post("/:id/activate-dark", requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const theme = await db.execute(sql5`SELECT id FROM custom_themes WHERE id = ${id}`);
    if (theme.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Tema n\xE3o encontrado"
      });
    }
    await db.execute(sql5`UPDATE custom_themes SET is_active_dark = false`);
    await db.execute(sql5`UPDATE custom_themes SET is_active_dark = true WHERE id = ${id}`);
    res.json({
      success: true,
      message: "Tema ativado para dark mode"
    });
  } catch (error) {
    console.error("Erro ao ativar tema para dark mode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.get("/active/light", async (req, res) => {
  try {
    const result = await db.execute(sql5`
      SELECT 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        is_active_light as isActiveLight,
        is_active_dark as isActiveDark,
        created_at as createdAt,
        updated_at as updatedAt
      FROM custom_themes 
      WHERE is_active_light = true
      LIMIT 1
    `);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Nenhum tema ativo para light mode"
      });
    }
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao buscar tema ativo para light mode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.get("/active/dark", async (req, res) => {
  try {
    const result = await db.execute(sql5`
      SELECT 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        is_active_light as isActiveLight,
        is_active_dark as isActiveDark,
        created_at as createdAt,
        updated_at as updatedAt
      FROM custom_themes 
      WHERE is_active_dark = true
      LIMIT 1
    `);
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Nenhum tema ativo para dark mode"
      });
    }
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao buscar tema ativo para dark mode:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
router.get("/active/current", async (req, res) => {
  try {
    const result = await db.execute(sql5`
      SELECT 
        id, 
        name, 
        light_config as lightConfig,
        dark_config as darkConfig,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM custom_themes 
      WHERE is_default = true
      LIMIT 1
    `);
    if (result.length === 0) {
      const defaultTheme = {
        name: "Padr\xE3o Dind\xE3o Finan\xE7as",
        lightConfig: {
          background: "0 0% 98%",
          foreground: "240 10% 3.9%",
          primary: "142 76% 36%",
          primaryForeground: "0 0% 98%",
          secondary: "45 93% 47%",
          secondaryForeground: "0 0% 9%",
          muted: "240 4.8% 95.9%",
          mutedForeground: "240 3.8% 46.1%",
          accent: "240 4.8% 95.9%",
          accentForeground: "240 5.9% 10%",
          border: "240 5.9% 90%",
          card: "0 0% 100%",
          cardForeground: "240 10% 3.9%",
          destructive: "0 84.2% 60.2%",
          destructiveForeground: "0 0% 98%"
        },
        darkConfig: {
          background: "240 10% 3.9%",
          foreground: "0 0% 98%",
          primary: "142 76% 36%",
          primaryForeground: "0 0% 98%",
          secondary: "45 93% 47%",
          secondaryForeground: "0 0% 9%",
          muted: "240 3.7% 15.9%",
          mutedForeground: "240 5% 64.9%",
          accent: "240 3.7% 15.9%",
          accentForeground: "0 0% 98%",
          border: "240 3.7% 15.9%",
          card: "240 10% 3.9%",
          cardForeground: "0 0% 98%",
          destructive: "0 62.8% 30.6%",
          destructiveForeground: "0 0% 98%"
        },
        isDefault: true
      };
      return res.json({
        success: true,
        data: defaultTheme
      });
    }
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error("Erro ao buscar tema ativo:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});
var themes_default = router;

// server/routes.ts
var publicDir = path6.resolve(process.cwd(), "public");
if (!fs6.existsSync(publicDir)) {
  fs6.mkdirSync(publicDir, { recursive: true });
}
var upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const isProduction = process.env.NODE_ENV === "production";
      const publicPath = isProduction ? "dist/public" : "public";
      const destination = path6.resolve(process.cwd(), publicPath);
      if (!fs6.existsSync(destination)) {
        fs6.mkdirSync(destination, { recursive: true, mode: 493 });
      }
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      if (file.fieldname === "logo_light") {
        cb(null, file.mimetype === "image/svg+xml" ? "logo-light.svg" : "logo-light.png");
      } else if (file.fieldname === "logo_dark") {
        cb(null, file.mimetype === "image/svg+xml" ? "logo-dark.svg" : "logo-dark.png");
      } else {
        cb(null, file.originalname);
      }
    }
  }),
  limits: { fileSize: 1024 * 1024 },
  // 1MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/svg+xml") {
      cb(null, true);
    } else {
      cb(new Error("Apenas PNG ou SVG s\xE3o permitidos"));
    }
  }
});
async function registerRoutes(app2) {
  setupSwagger(app2);
  app2.get("/api/charts/bar", combinedAuth, generateBarChartSVG);
  app2.get("/api/charts/pizza", combinedAuth, generatePieChartSVG);
  app2.get(
    "/api/charts/bar2",
    combinedAuth,
    generateBarChartImage
  );
  app2.get(
    "/api/charts/report",
    combinedAuth,
    generateWeeklyReportImage
  );
  app2.get("/api/charts/download/:filename", downloadChartFile);
  const pdfController = await Promise.resolve().then(() => (init_pdf_simple_controller(), pdf_simple_controller_exports));
  app2.get(
    "/api/reports/pdf",
    (req, res, next) => {
      console.log("=== ROTA PDF INTERCEPTADA ===");
      next();
    },
    combinedAuth,
    pdfController.generateSimpleReportPDF
  );
  app2.get("/api/reports/download/:filename", async (req, res) => {
    const { downloadReportPDF: downloadReportPDF2 } = await Promise.resolve().then(() => (init_pdf_controller(), pdf_controller_exports));
    downloadReportPDF2(req, res);
  });
  app2.post("/api/auth/register", register);
  app2.post("/api/auth/login", login);
  app2.post("/api/auth/logout", logout);
  app2.get("/api/auth/verify", auth, (req, res) => {
    try {
      if (req.user) {
        res.json({
          success: true,
          user: req.user,
          message: "Sess\xE3o v\xE1lida"
        });
      } else {
        res.status(401).json({
          success: false,
          error: "Usu\xE1rio n\xE3o autenticado"
        });
      }
    } catch (error) {
      console.error("Erro na verifica\xE7\xE3o de sess\xE3o:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor"
      });
    }
  });
  app2.get(
    "/api/auth/me",
    combinedAuth,
    checkImpersonation,
    getCurrentUser
  );
  app2.get("/api/users/profile", combinedAuth, checkImpersonation, getProfile);
  app2.put("/api/users/profile", auth, checkImpersonation, updateProfile);
  app2.put("/api/users/password", auth, checkImpersonation, updatePassword);
  app2.get(
    "/api/wallet/current",
    combinedAuth,
    checkImpersonation,
    getCurrentWallet
  );
  app2.put("/api/wallet/current", combinedAuth, checkImpersonation, updateWallet);
  app2.get(
    "/api/transactions",
    combinedAuth,
    checkImpersonation,
    getTransactions
  );
  app2.get(
    "/api/transactions/recent",
    combinedAuth,
    checkImpersonation,
    getRecentTransactions
  );
  app2.post(
    "/api/transactions",
    combinedAuth,
    checkImpersonation,
    createTransaction
  );
  app2.get(
    "/api/transactions/:id",
    combinedAuth,
    checkImpersonation,
    getTransaction
  );
  app2.put(
    "/api/transactions/:id",
    combinedAuth,
    checkImpersonation,
    updateTransaction
  );
  app2.patch(
    "/api/transactions/:id",
    combinedAuth,
    checkImpersonation,
    updateTransaction
  );
  app2.delete(
    "/api/transactions/:id",
    combinedAuth,
    checkImpersonation,
    deleteTransaction
  );
  app2.get("/api/categories", combinedAuth, checkImpersonation, getCategories);
  app2.post("/api/categories", combinedAuth, checkImpersonation, createCategory);
  app2.get("/api/categories/:id", combinedAuth, checkImpersonation, getCategory);
  app2.put(
    "/api/categories/:id",
    combinedAuth,
    checkImpersonation,
    updateCategory
  );
  app2.delete(
    "/api/categories/:id",
    combinedAuth,
    checkImpersonation,
    deleteCategory
  );
  app2.post(
    "/api/admin/categories/colorize-global",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    colorizeGlobalCategories
  );
  app2.get("/api/payment-methods", combinedAuth, checkImpersonation, getPaymentMethods);
  app2.get("/api/payment-methods/global", getGlobalPaymentMethods);
  app2.get("/api/payment-methods/totals", combinedAuth, checkImpersonation, getPaymentMethodTotals);
  app2.post("/api/payment-methods", combinedAuth, checkImpersonation, createPaymentMethod);
  app2.put(
    "/api/payment-methods/:id",
    combinedAuth,
    checkImpersonation,
    updatePaymentMethod
  );
  app2.delete(
    "/api/payment-methods/:id",
    combinedAuth,
    checkImpersonation,
    deletePaymentMethod
  );
  app2.get(
    "/api/dashboard/summary",
    combinedAuth,
    checkImpersonation,
    getDashboardSummary
  );
  app2.get("/api/tokens", auth, checkImpersonation, getApiTokens);
  app2.post("/api/tokens", auth, checkImpersonation, createApiToken);
  app2.get("/api/tokens/:id", auth, checkImpersonation, getApiToken);
  app2.put("/api/tokens/:id", auth, checkImpersonation, updateApiToken);
  app2.delete("/api/tokens/:id", auth, checkImpersonation, deleteApiToken);
  app2.post("/api/tokens/:id/rotate", auth, checkImpersonation, rotateApiToken);
  app2.get("/api/api-guide", getApiGuide);
  app2.get("/api/reminders", combinedAuth, checkImpersonation, getReminders);
  app2.post("/api/reminders", combinedAuth, checkImpersonation, createReminder);
  app2.get(
    "/api/reminders/calendar",
    combinedAuth,
    checkImpersonation,
    getRemindersByDateRange
  );
  app2.get("/api/reminders/:id", combinedAuth, checkImpersonation, getReminder);
  app2.put(
    "/api/reminders/:id",
    combinedAuth,
    checkImpersonation,
    updateReminder
  );
  app2.patch(
    "/api/reminders/:id",
    combinedAuth,
    checkImpersonation,
    updateReminder
  );
  app2.delete(
    "/api/reminders/:id",
    combinedAuth,
    checkImpersonation,
    deleteReminder
  );
  app2.post(
    "/api/subscription/cancel",
    combinedAuth,
    checkImpersonation,
    SubscriptionController.cancelSubscription
  );
  app2.get(
    "/api/subscription/status",
    combinedAuth,
    checkImpersonation,
    SubscriptionController.getSubscriptionStatus
  );
  app2.post(
    "/api/notifications/send",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    sendNotification
  );
  app2.post(
    "/api/notifications/broadcast",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    broadcastNotificationToSuperAdmins
  );
  app2.post(
    "/api/notifications/test",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    sendTestNotification
  );
  app2.post("/api/waha/webhook/:hash", WahaWebhookController.receiveWahaEvent);
  app2.post("/api/waha/webhook", WahaWebhookController.receiveWahaEvent);
  app2.get(
    "/api/waha/webhook/stats",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    WahaWebhookController.getWebhookStats
  );
  app2.get(
    "/api/admin/waha-sessions/:sessionName/webhook",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    WahaSessionWebhooksController.getSessionWebhook
  );
  app2.post(
    "/api/admin/waha-sessions/:sessionName/webhook/regenerate",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    WahaSessionWebhooksController.regenerateSessionWebhook
  );
  app2.patch(
    "/api/admin/waha-sessions/:sessionName/webhook/toggle",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    WahaSessionWebhooksController.toggleSessionWebhook
  );
  app2.get(
    "/api/admin/waha-session-webhooks",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    WahaSessionWebhooksController.listSessionWebhooks
  );
  app2.get(
    "/api/admin/stats",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    getAdminStats
  );
  app2.get(
    "/api/admin/recent-users",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    RecentUsersController.getRecentUsers
  );
  app2.get(
    "/api/admin/analytics",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    AnalyticsController.getAnalyticsData
  );
  app2.get(
    "/api/admin/users",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    getAdminUsers
  );
  app2.post(
    "/api/admin/users",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    createUser
  );
  app2.put(
    "/api/admin/users/:id",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    updateUser
  );
  app2.delete(
    "/api/admin/users/:id",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    deleteUser
  );
  app2.post(
    "/api/admin/impersonate",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    impersonateUser
  );
  app2.post(
    "/api/admin/stop-impersonation",
    combinedAuth,
    checkImpersonation,
    stopImpersonation
  );
  app2.get(
    "/api/admin/impersonation-status",
    combinedAuth,
    checkImpersonation,
    getImpersonationStatus
  );
  app2.patch(
    "/api/admin/users/:id/status",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    updateUserStatus
  );
  app2.post(
    "/api/admin/users/:id/reset",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    resetUserData
  );
  app2.post(
    "/api/admin/reset-globals",
    combinedAuth,
    requireSuperAdmin,
    resetGlobals
  );
  app2.get(
    "/api/admin/audit-log",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    getAuditLog
  );
  app2.get(
    "/api/admin/database/tables",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    getAllTables
  );
  app2.get(
    "/api/admin/database/ddl",
    combinedAuth,
    checkImpersonation,
    requireSuperAdmin,
    generateDatabaseDDL
  );
  app2.get("/api/setup/status", getSetupStatus);
  app2.post("/api/setup/test-connection", testDatabaseConnection);
  app2.post("/api/setup/save-db-url", saveDbUrl);
  app2.post("/api/setup/create-admin", createAdmin);
  app2.post("/api/setup/run", runSetup);
  app2.post("/api/setup/finish", finishSetup);
  app2.post("/api/admin/logo", combinedAuth, requireSuperAdmin, upload.fields([
    { name: "logo_light", maxCount: 1 },
    { name: "logo_dark", maxCount: 1 }
  ]), async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    res.json({ success: true });
  });
  app2.get("/api/logo", (req, res) => {
    const theme = req.query.theme === "dark" ? "dark" : "light";
    const isProduction = process.env.NODE_ENV === "production";
    const publicPath = isProduction ? "dist/public" : "public";
    const svgPath = path6.resolve(process.cwd(), `${publicPath}/logo-${theme}.svg`);
    const pngPath = path6.resolve(process.cwd(), `${publicPath}/logo-${theme}.png`);
    if (fs6.existsSync(svgPath)) {
      res.sendFile(svgPath);
    } else if (fs6.existsSync(pngPath)) {
      res.sendFile(pngPath);
    } else {
      res.status(404).json({ error: "Logo n\xE3o encontrado" });
    }
  });
  app2.delete("/api/admin/logo", combinedAuth, requireSuperAdmin, async (req, res) => {
    const theme = req.query.theme === "dark" ? "dark" : "light";
    const exts = ["png", "svg"];
    let removed = false;
    const isProduction = process.env.NODE_ENV === "production";
    const publicPath = isProduction ? "dist/public" : "public";
    for (const ext of exts) {
      const filePath = path6.resolve(process.cwd(), `${publicPath}/logo-${theme}.${ext}`);
      if (fs6.existsSync(filePath)) {
        try {
          fs6.unlinkSync(filePath);
          removed = true;
        } catch (err) {
          console.error("Erro ao remover arquivo do logo:", err);
        }
      }
    }
    res.json({ success: true, removed });
  });
  app2.get("/api/admin/welcome-messages", combinedAuth, requireSuperAdmin, getWelcomeMessages);
  app2.get("/api/admin/welcome-messages/:type", combinedAuth, requireSuperAdmin, getWelcomeMessageByType);
  app2.put("/api/admin/welcome-messages/:type", combinedAuth, requireSuperAdmin, updateWelcomeMessage);
  app2.post("/api/admin/welcome-messages", combinedAuth, requireSuperAdmin, createWelcomeMessage);
  app2.get("/api/admin/waha-config", combinedAuth, requireSuperAdmin, getWahaConfig);
  app2.put("/api/admin/waha-config", combinedAuth, requireSuperAdmin, updateWahaConfig);
  app2.post("/api/admin/waha-config/test", combinedAuth, requireSuperAdmin, testWahaConnection);
  app2.get("/api/admin/waha-sessions", combinedAuth, requireSuperAdmin, getWahaSessions);
  app2.post("/api/admin/waha-sessions", combinedAuth, requireSuperAdmin, createWahaSession);
  app2.put("/api/admin/waha-sessions/:sessionName", combinedAuth, requireSuperAdmin, updateWahaSession);
  app2.post("/api/admin/waha-sessions/:sessionName/start", combinedAuth, requireSuperAdmin, startWahaSession);
  app2.post("/api/admin/waha-sessions/:sessionName/stop", combinedAuth, requireSuperAdmin, stopWahaSession);
  app2.delete("/api/admin/waha-sessions/:sessionName", combinedAuth, requireSuperAdmin, deleteWahaSession);
  app2.get("/api/admin/waha-sessions/:sessionName/qr", combinedAuth, requireSuperAdmin, getSessionQRCode);
  app2.post("/api/admin/waha-sessions/:sessionName/pairing-code", combinedAuth, requireSuperAdmin, sendPairingCode);
  app2.post("/api/admin/waha-sessions/:sessionName/confirm-code", combinedAuth, requireSuperAdmin, confirmPairingCode);
  app2.get("/api/admin/waha-debug", combinedAuth, requireSuperAdmin, debugWahaEndpoints);
  app2.get("/api/admin/waha-test-qr", combinedAuth, requireSuperAdmin, testQRCodeEndpoints);
  app2.use("/api/themes", combinedAuth, themes_default);
  app2.get("/api/changelog", (req, res) => {
    try {
      import("fs").then((fs8) => {
        const changelogData = JSON.parse(fs8.readFileSync("CHANGELOG.json", "utf8"));
        res.json(changelogData);
      }).catch((error) => {
        console.error("Error reading changelog:", error);
        res.status(500).json({ error: "Failed to read changelog" });
      });
    } catch (error) {
      console.error("Error reading changelog:", error);
      res.status(500).json({ error: "Failed to read changelog" });
    }
  });
  const httpServer = createServer(app2);
  initializeWebSocketServer(httpServer);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs7 from "fs";
import path8 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path7 from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path7.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path7.resolve(__dirname, "client", "src"),
      "@shared": path7.resolve(__dirname, "shared"),
      "@assets": path7.resolve(__dirname, "attached_assets")
    }
  },
  root: path7.resolve(__dirname, "client"),
  build: {
    outDir: path7.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true,
        changeOrigin: true
      }
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ["ec992ccb623b.ngrok-free.app"]
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      return next();
    }
    if (url.includes(".") && !url.endsWith("/")) {
      return next();
    }
    try {
      const clientTemplate = path8.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs7.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path8.resolve(import.meta.dirname, "public");
  if (!fs7.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path8.resolve(distPath, "index.html"));
  });
}

// server/startup.ts
init_db();
init_schema();
import { sql as sql6 } from "drizzle-orm";
import bcrypt6 from "bcryptjs";
import postgres7 from "postgres";
async function validateAndInitializeDatabase() {
  console.log("\u{1F50D} Verificando estado do banco de dados...");
  try {
    await checkTablesExist();
    await runMigrationsIfNeeded();
    await ensureAdminUserExists();
    const dbUrl = process.env.DATABASE_URL || "";
    let dbHost = "";
    try {
      const match = dbUrl.match(/postgres(?:ql)?:\/\/(?:[^:@]+(?::[^@]*)?@)?([^:/?#]+)(?::\d+)?/);
      dbHost = match ? match[1] : "";
    } catch {
    }
    if (dbHost) {
      console.log(`\u2705 Banco de dados inicializado com sucesso!
\u{1F310} Acesso ao banco: ${dbHost}`);
    } else {
      console.log("\u2705 Banco de dados inicializado com sucesso!");
    }
  } catch (error) {
    console.error("\u274C Erro na inicializa\xE7\xE3o do banco:", error);
    throw error;
  }
}
async function checkTablesExist() {
  try {
    if (!db) {
      console.log("\u26A0\uFE0F Banco n\xE3o inicializado, pulando verifica\xE7\xE3o de tabelas");
      return;
    }
    await db.select({ count: sql6`count(*)` }).from(users);
    console.log("\u{1F4CB} Tabelas do banco de dados encontradas");
  } catch (error) {
    console.log("\u26A0\uFE0F Tabelas n\xE3o encontradas, pulando verifica\xE7\xE3o...");
  }
}
async function runMigrationsIfNeeded() {
  try {
    if (!db) {
      console.log("\u26A0\uFE0F Banco n\xE3o inicializado, pulando migrations");
      return;
    }
    const result = await db.select({ count: sql6`count(*)` }).from(users).limit(1);
    console.log("\u{1F4CA} Schema do banco est\xE1 atualizado");
  } catch (error) {
    console.log("\u{1F504} Executando migrations do banco de dados...");
    try {
      const { execSync } = await import("child_process");
      execSync("npx drizzle-kit push --config=drizzle.config.ts", {
        stdio: "inherit",
        cwd: process.cwd()
      });
      console.log("\u2705 Migrations executadas com sucesso");
    } catch (migrationError) {
      console.error("\u274C Erro ao executar migrations:", migrationError);
      console.log("\u26A0\uFE0F Continuando sem migrations...");
    }
  }
}
async function ensureAdminUserExists() {
  console.log("\u{1F464} Verificando usu\xE1rio admin...");
  const adminEmail = process.env.SYSTEM_USER_ADMIN || "teste@teste.com";
  const adminPassword = process.env.SYSTEM_USER_PASS || "admin123";
  console.log(`\u{1F464} Email admin: ${adminEmail}`);
  const dbUrl = process.env.DATABASE_URL || "";
  let client2;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      const hostname = url.hostname;
      const port = parseInt(url.port) || 5432;
      const database = url.pathname.replace("/", "");
      const username = url.username;
      const password = decodeURIComponent(url.password);
      client2 = postgres7({
        host: hostname,
        port,
        database,
        username,
        password,
        ssl: "require",
        prepare: false
      });
    } catch (error) {
      console.error("\u274C Erro ao parsear DATABASE_URL, usando URL direta:", error);
      client2 = postgres7(dbUrl, { prepare: false });
    }
  } else {
    console.error("\u274C DATABASE_URL n\xE3o configurado");
    return;
  }
  try {
    const existingAdmin = await client2`
      SELECT id FROM usuarios WHERE email = ${adminEmail} LIMIT 1
    `;
    let adminId;
    if (existingAdmin.length > 0) {
      console.log(`\u{1F464} Usu\xE1rio admin j\xE1 existe: ${adminEmail}`);
      adminId = existingAdmin[0].id;
    } else {
      console.log("\u{1F464} Criando usu\xE1rio admin padr\xE3o...");
      const hashedPassword = await bcrypt6.hash(adminPassword, 12);
      const result = await client2`
      INSERT INTO usuarios (email, senha, nome, telefone, ativo, tipo_usuario, status_assinatura, data_expiracao_assinatura)
      VALUES (${adminEmail}, ${hashedPassword}, 'Administrador', '(00) 00000-0000', true, 'super_admin', 'ativa', ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3)})
      RETURNING id
    `;
      adminId = result[0].id;
      await client2`
      INSERT INTO carteiras (nome, usuario_id, descricao)
      VALUES ('Carteira Principal', ${adminId}, 'Carteira principal do administrador')
    `;
      console.log("\u2705 Usu\xE1rio admin criado com sucesso!");
      console.log(`\u{1F4E7} Email: ${adminEmail}`);
      console.log(`\u{1F511} Senha: ${adminPassword}`);
    }
    const globalCategories = await client2`SELECT id FROM categorias WHERE global = true LIMIT 1`;
    if (globalCategories.length === 0) {
      console.log("\u{1F4C2} Nenhuma categoria global encontrada. Criando categorias globais padr\xE3o...");
      const defaultCategories = [
        { nome: "Alimenta\xE7\xE3o", tipo: "Despesa", cor: "#FF6B6B", icone: "\u{1F37D}\uFE0F", descricao: "Gastos com alimenta\xE7\xE3o e refei\xE7\xF5es" },
        { nome: "Transporte", tipo: "Despesa", cor: "#4ECDC4", icone: "\u{1F697}", descricao: "Gastos com transporte e locomo\xE7\xE3o" },
        { nome: "Moradia", tipo: "Despesa", cor: "#45B7D1", icone: "\u{1F3E0}", descricao: "Gastos com moradia e aluguel" },
        { nome: "Sa\xFAde", tipo: "Despesa", cor: "#96CEB4", icone: "\u{1F3E5}", descricao: "Gastos com sa\xFAde e medicamentos" },
        { nome: "Educa\xE7\xE3o", tipo: "Despesa", cor: "#FFEAA7", icone: "\u{1F4DA}", descricao: "Gastos com educa\xE7\xE3o e cursos" },
        { nome: "Lazer", tipo: "Despesa", cor: "#DDA0DD", icone: "\u{1F3AE}", descricao: "Gastos com lazer e entretenimento" },
        { nome: "Vestu\xE1rio", tipo: "Despesa", cor: "#F8BBD9", icone: "\u{1F455}", descricao: "Gastos com roupas e acess\xF3rios" },
        { nome: "Servi\xE7os", tipo: "Despesa", cor: "#FFB74D", icone: "\u{1F527}", descricao: "Gastos com servi\xE7os diversos" },
        { nome: "Impostos", tipo: "Despesa", cor: "#A1887F", icone: "\u{1F4B0}", descricao: "Pagamento de impostos e taxas" },
        { nome: "Outros", tipo: "Despesa", cor: "#90A4AE", icone: "\u{1F4E6}", descricao: "Outros gastos diversos" },
        { nome: "Sal\xE1rio", tipo: "Receita", cor: "#4CAF50", icone: "\u{1F4BC}", descricao: "Receita de sal\xE1rio e trabalho" },
        { nome: "Freelance", tipo: "Receita", cor: "#8BC34A", icone: "\u{1F4BB}", descricao: "Receita de trabalhos freelancer" },
        { nome: "Investimentos", tipo: "Receita", cor: "#FFC107", icone: "\u{1F4C8}", descricao: "Receita de investimentos" },
        { nome: "Presentes", tipo: "Receita", cor: "#E91E63", icone: "\u{1F381}", descricao: "Receita de presentes e doa\xE7\xF5es" },
        { nome: "Reembolso", tipo: "Receita", cor: "#9C27B0", icone: "\u{1F4B8}", descricao: "Reembolsos e devolu\xE7\xF5es" },
        { nome: "Outros", tipo: "Receita", cor: "#607D8B", icone: "\u{1F4E6}", descricao: "Outras receitas diversas" }
      ];
      for (const category of defaultCategories) {
        const existingCategory = await client2`
          SELECT id FROM categorias WHERE nome = ${category.nome} AND global = true LIMIT 1
        `;
        if (existingCategory.length === 0) {
          await client2`
            INSERT INTO categorias (nome, tipo, cor, icone, descricao, global, usuario_id)
            VALUES (${category.nome}, ${category.tipo}, ${category.cor}, ${category.icone}, ${category.descricao}, true, NULL)
          `;
        }
      }
      console.log("\u2705 Categorias globais padr\xE3o criadas!");
    } else {
      console.log("\u{1F4C2} Categorias globais j\xE1 est\xE3o populadas.");
    }
    const globalPaymentMethods = await client2`SELECT id FROM formas_pagamento WHERE global = true LIMIT 1`;
    if (globalPaymentMethods.length === 0) {
      console.log("\u{1F4B3} Nenhuma forma de pagamento global encontrada. Criando formas de pagamento globais padr\xE3o...");
      const defaultPaymentMethods = [
        { nome: "PIX", descricao: "Pagamento via PIX", icone: "\u{1F4F1}", cor: "#32CD32" },
        { nome: "Cart\xE3o de Cr\xE9dito", descricao: "Pagamento com cart\xE3o de cr\xE9dito", icone: "\u{1F4B3}", cor: "#FF6B35" },
        { nome: "Dinheiro", descricao: "Pagamento em dinheiro", icone: "\u{1F4B5}", cor: "#4CAF50" },
        { nome: "Cart\xE3o de D\xE9bito", descricao: "Pagamento com cart\xE3o de d\xE9bito", icone: "\u{1F3E6}", cor: "#2196F3" },
        { nome: "Transfer\xEAncia", descricao: "Transfer\xEAncia banc\xE1ria", icone: "\u{1F3DB}\uFE0F", cor: "#9C27B0" },
        { nome: "Boleto", descricao: "Pagamento via boleto", icone: "\u{1F4C4}", cor: "#FF9800" }
      ];
      for (const method of defaultPaymentMethods) {
        const existingMethod = await client2`
          SELECT id FROM formas_pagamento WHERE nome = ${method.nome} AND global = true LIMIT 1
        `;
        if (existingMethod.length === 0) {
          await client2`
            INSERT INTO formas_pagamento (nome, descricao, icone, cor, global, ativo, usuario_id)
            VALUES (${method.nome}, ${method.descricao}, ${method.icone}, ${method.cor}, true, true, NULL)
          `;
        }
      }
      console.log("\u2705 Formas de pagamento globais padr\xE3o criadas!");
    } else {
      console.log("\u{1F4B3} Formas de pagamento globais j\xE1 est\xE3o populadas.");
    }
  } catch (error) {
    console.error("\u274C Erro ao criar usu\xE1rio admin ou categorias globais:", error);
    throw error;
  } finally {
    await client2.end();
  }
}
async function waitForDatabase(maxAttempts = 15, delayMs = 1e3) {
  console.log("\u23F3 Aguardando conex\xE3o com banco de dados...");
  if (!process.env.DATABASE_URL) {
    console.log("\u26A0\uFE0F DATABASE_URL n\xE3o configurado, pulando verifica\xE7\xE3o de banco");
    return;
  }
  if (!db) {
    try {
      console.log("\u{1F504} Inicializando conex\xE3o com banco...");
      initializeDatabase(process.env.DATABASE_URL);
    } catch (error) {
      console.log("\u26A0\uFE0F N\xE3o foi poss\xEDvel inicializar banco, continuando...");
      return;
    }
  }
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!db) {
        throw new Error("Database not initialized");
      }
      await db.select({ now: sql6`NOW()` });
      console.log("\u2705 Conex\xE3o com banco estabelecida");
      return;
    } catch (error) {
      if (attempt <= 5) {
        console.log(`\u{1F504} Tentativa ${attempt}/${maxAttempts} - Aguardando banco ficar dispon\xEDvel...`);
      }
      if (attempt === maxAttempts) {
        console.error("\u274C N\xE3o foi poss\xEDvel conectar ao banco ap\xF3s todas as tentativas");
        console.error("\u26A0\uFE0F Error details:", error);
        console.log("\u26A0\uFE0F Continuando sem conex\xE3o com banco...");
        return;
      }
      await new Promise((resolve2) => setTimeout(resolve2, delayMs));
    }
  }
}

// server/middleware/setup.middleware.ts
async function setupRedirect(req, res, next) {
  console.log("\u{1F50D} Setup Middleware Debug:", {
    path: req.path,
    setupEnv: process.env.SETUP,
    isSetupMode: process.env.SETUP === "true"
  });
  if (req.path.startsWith("/api/") || req.path.startsWith("/setup") || req.path.includes(".") || req.path.startsWith("/src/") || req.path.startsWith("/@vite/")) {
    console.log("\u2705 Permitindo acesso direto para:", req.path);
    return next();
  }
  const isSetupMode = process.env.SETUP === "true";
  if (!isSetupMode) {
    console.log("\u2705 Setup mode desabilitado, continuando...");
    return next();
  }
  console.log("\u{1F504} Redirecionando para setup...");
  return res.redirect("/setup");
}

// server/index.ts
try {
  const envPath = join2(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf8");
  const envLines = envContent.split("\n");
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("#")) {
      const [key, ...valueParts] = trimmedLine.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=");
        process.env[key] = value;
      }
    }
  }
  console.log("\u2705 Vari\xE1veis de ambiente carregadas com sucesso");
  console.log("\u{1F50D} SETUP env value:", process.env.SETUP);
} catch (error) {
  console.warn("\u26A0\uFE0F Arquivo .env n\xE3o encontrado ou n\xE3o pode ser lido");
}
process.env.TZ = "America/Sao_Paulo";
function setupUploadDirectories() {
  console.log("\u{1F4C1} Configurando pastas de upload...");
  const isProduction = process.env.NODE_ENV === "production";
  const publicPath = isProduction ? "dist/public" : "public";
  const publicDir2 = resolve(process.cwd(), publicPath);
  const chartsDir = resolve(publicDir2, "charts");
  const reportsDir = resolve(publicDir2, "reports");
  console.log(`\u{1F4CD} Modo: ${isProduction ? "PRODU\xC7\xC3O" : "DESENVOLVIMENTO"}`);
  console.log(`\u{1F4C2} Diret\xF3rio p\xFAblico: ${publicDir2}`);
  [publicDir2, chartsDir, reportsDir].forEach((dir) => {
    try {
      if (!existsSync2(dir)) {
        mkdirSync2(dir, { recursive: true, mode: 493 });
        console.log(`\u2705 Pasta criada: ${dir}`);
      } else {
        chmodSync(dir, 493);
        console.log(`\u2705 Permiss\xF5es ajustadas: ${dir}`);
      }
    } catch (error) {
      console.error(`\u274C Erro ao configurar pasta ${dir}:`, error);
    }
  });
  console.log("\u2705 Pastas de upload configuradas!");
}
setupUploadDirectories();
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
var MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: "financehub-secret-key",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 864e5
    // limpa sessões expiradas a cada 24h
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 dias
    secure: false,
    // set to true if using HTTPS
    httpOnly: true
  }
}));
app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store"
  });
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path9 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path9.startsWith("/api")) {
      let logLine = `${req.method} ${path9} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    console.log("\u{1F680} Inicializando aplica\xE7\xE3o...");
    await waitForDatabase();
    await validateAndInitializeDatabase();
    console.log("\u2705 Aplica\xE7\xE3o inicializada com sucesso!");
  } catch (error) {
    console.error("\u274C Falha na inicializa\xE7\xE3o do banco:", error);
    console.log("\u26A0\uFE0F Continuando sem inicializa\xE7\xE3o autom\xE1tica...");
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  app.use(setupRedirect);
  const port = 5e3;
  log(`serving on port ${port}`);
  server.listen(port);
})();
