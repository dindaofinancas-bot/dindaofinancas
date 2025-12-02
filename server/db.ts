import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create SQL connection only if DATABASE_URL is available
let client: any = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  try {
    // Parse DATABASE_URL e criar conexão com parâmetros individuais
    const url = new URL(dbUrl);
    const hostname = url.hostname;
    const port = parseInt(url.port) || 5432;
    const database = url.pathname.replace('/', '');
    const username = url.username;
    const password = decodeURIComponent(url.password);

    client = postgres({
      host: hostname,
      port: port,
      database: database,
      username: username,
      password: password,
      ssl: 'require'
    });
    db = drizzle(client);
  } catch (error) {
    console.error('❌ Erro ao parsear DATABASE_URL, usando URL direta:', error);
    client = postgres(dbUrl);
    db = drizzle(client);
  }
}

// Initialize Drizzle ORM
export { db };

// Export a function to initialize the database connection
export function initializeDatabase(databaseUrl: string) {
  if (client) {
    client.end();
  }
  client = postgres(databaseUrl);
  db = drizzle(client);
  return db;
}
