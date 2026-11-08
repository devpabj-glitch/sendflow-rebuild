// Abstração mínima sobre o pool/cliente pg — o app e o runner de migrações
// dependem destas interfaces, não do driver: o MESMO código roda contra
// PostgreSQL real (produção) e pg-mem (testes offline).

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount?: number;
}

export interface QueryExecutor {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
}

export interface DbClient extends QueryExecutor {
  release(): void;
}

export interface DbPool extends QueryExecutor {
  connect(): Promise<DbClient>;
  end(): Promise<void>;
}
