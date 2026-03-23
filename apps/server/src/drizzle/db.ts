import "dotenv"
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/neon-serverless';

export const db = drizzle({ 
  connection: { 
    connectionString: process.env.DATABASE_URL!,
    ssl: true
  },
  schema
});