import { defineConfig } from "drizzle-kit";

export default defineConfig({
  
  schema: "./src/schema/index.ts", 
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Memperbaiki potongan baris DATABASE_URL yang typo kemarin
    url: process.env.DATABASE_URL!, 
  },
});