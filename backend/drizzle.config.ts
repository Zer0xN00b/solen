import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  // Points at the barrel (schema.ts), which re-exports authSchema.ts and
  // productSchema.ts. The two are kept in separate files so the Better
  // Auth generator cannot overwrite product schema.
  schema: './src/database/schema.ts',
  out: './drizzle',
});
