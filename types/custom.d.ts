declare module "dotenv" {
  type DotenvConfigOutput = { parsed?: Record<string, string> };
  function config(): DotenvConfigOutput;
  export default { config };
}

declare module "drizzle-orm/node-postgres" {
  import type { Pool } from "pg";
  export function drizzle(pool: Pool, options?: any): any;
}

declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query(queryText: string, values?: any[]): Promise<any>;
    connect(): Promise<any>;
    end(): Promise<void>;
  }

  const pg: { Pool: typeof Pool };
  export default pg;
}

declare module "vite/client" {
  interface ImportMetaEnv {
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    [key: string]: string | boolean | undefined;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    [key: string]: string | undefined;
  }

  interface Process {
    env: ProcessEnv;
  }
}

declare var process: NodeJS.Process;
