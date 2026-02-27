import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Used by Prisma CLI (migrations, db push, etc.). Use direct connection for Supabase when using pooler.
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
