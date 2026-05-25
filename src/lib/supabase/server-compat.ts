// Wrapper de compatibilidade durante migração
// Fornece a mesma interface do createClient() do Supabase mas usando Better Auth + pg direto
import { getServerSession } from '@/lib/get-session';
import { getPool } from '@/lib/db';

interface CompatClient {
  auth: {
    getSession(): Promise<{ data: { session: { user: { id: string; email: string } } | null } }>;
    getUser(): Promise<{ data: { user: { id: string; email: string } | null } }>;
  };
  from(table: string): CompatQueryBuilder;
  rpc(name: string, params?: Record<string, unknown>): CompatRpc;
}

interface CompatQueryBuilder {
  select(columns?: string): CompatQueryBuilder;
  insert(data: Record<string, unknown> | Record<string, unknown>[]): CompatQueryBuilder;
  update(data: Record<string, unknown>): CompatQueryBuilder;
  delete(): CompatQueryBuilder;
  upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): CompatQueryBuilder;
  eq(column: string, value: unknown): CompatQueryBuilder;
  neq(column: string, value: unknown): CompatQueryBuilder;
  is(column: string, value: unknown): CompatQueryBuilder;
  in(column: string, values: unknown[]): CompatQueryBuilder;
  gte(column: string, value: unknown): CompatQueryBuilder;
  order(column: string, options?: { ascending?: boolean }): CompatQueryBuilder;
  limit(n: number): CompatQueryBuilder;
  single(): Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
  then(resolve: (result: { data: unknown[]; error: Error | null }) => void): void;
}

interface CompatRpc {
  then(resolve: (result: { data: unknown; error: Error | null }) => void): void;
}

// NOTA: Este é um wrapper simplificado para operações comuns.
// Para queries complexas, migrar diretamente para `query()` do /lib/db.ts

class QueryBuilder implements CompatQueryBuilder {
  private tableName: string;
  private operation: string = 'select';
  private columns: string = '*';
  private conditions: string[] = [];
  private params: unknown[] = [];
  private orderBy: string = '';
  private limitVal: number | null = null;
  private insertData: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateData: Record<string, unknown> | null = null;
  private upsertData: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private upsertConflict: string = '';
  private selectOptions: { count?: string; head?: boolean } = {};

  constructor(table: string) {
    this.tableName = table;
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.columns = columns;
    this.operation = 'select';
    if (options) this.selectOptions = options;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }) {
    this.operation = 'upsert';
    this.upsertData = data;
    this.upsertConflict = options?.onConflict || 'id';
    return this;
  }

  eq(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" = $${this.params.length}`);
    return this;
  }

  neq(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" != $${this.params.length}`);
    return this;
  }

  is(column: string, value: unknown) {
    if (value === null) {
      this.conditions.push(`"${column}" IS NULL`);
    } else {
      this.params.push(value);
      this.conditions.push(`"${column}" IS $${this.params.length}`);
    }
    return this;
  }

  in(column: string, values: unknown[]) {
    const placeholders = values.map((_, i) => `$${this.params.length + i + 1}`).join(', ');
    this.params.push(...values);
    this.conditions.push(`"${column}" IN (${placeholders})`);
    return this;
  }

  gte(column: string, value: unknown) {
    this.params.push(value);
    this.conditions.push(`"${column}" >= $${this.params.length}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'DESC' : 'ASC';
    this.orderBy = `ORDER BY "${column}" ${dir}`;
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  private buildWhere() {
    return this.conditions.length > 0 ? `WHERE ${this.conditions.join(' AND ')}` : '';
  }

  private async execute(): Promise<{ data: unknown; error: Error | null; count?: number | null }> {
    const pool = getPool();
    try {
      if (this.operation === 'select') {
        // Handle count queries (Supabase { count: 'exact', head: true })
        if (this.selectOptions.count === 'exact') {
          const sql = `SELECT COUNT(*) FROM "${this.tableName}" ${this.buildWhere()}`.trim();
          const result = await pool.query(sql, this.params);
          const count = parseInt(result.rows[0]?.count ?? '0', 10);
          return { data: this.selectOptions.head ? null : [], error: null, count };
        }
        const sql = `SELECT ${this.columns} FROM "${this.tableName}" ${this.buildWhere()} ${this.orderBy} ${this.limitVal ? `LIMIT ${this.limitVal}` : ''}`.trim();
        const result = await pool.query(sql, this.params);
        return { data: result.rows, error: null };
      }

      if (this.operation === 'delete') {
        const sql = `DELETE FROM "${this.tableName}" ${this.buildWhere()} RETURNING *`.trim();
        const result = await pool.query(sql, this.params);
        return { data: result.rows, error: null };
      }

      if (this.operation === 'insert' && this.insertData) {
        const rows = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        const cols = Object.keys(rows[0]);
        const allParams: unknown[] = [];
        const valuePlaceholders = rows.map(row => {
          const start = allParams.length;
          cols.forEach(col => allParams.push(row[col]));
          return `(${cols.map((_, i) => `$${start + i + 1}`).join(', ')})`;
        }).join(', ');
        const sql = `INSERT INTO "${this.tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${valuePlaceholders} RETURNING *`;
        const result = await pool.query(sql, allParams);
        return { data: result.rows, error: null };
      }

      if (this.operation === 'update' && this.updateData) {
        const cols = Object.keys(this.updateData);
        const setClauses = cols.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        const updateParams = [...cols.map(c => this.updateData![c])];
        const whereParams = this.params.map((_, i) => `$${cols.length + i + 1}`);
        const whereClauses = this.conditions.map((c, i) => c.replace(/\$\d+/g, whereParams[i]));
        const sql = `UPDATE "${this.tableName}" SET ${setClauses}${whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : ''} RETURNING *`;
        const result = await pool.query(sql, [...updateParams, ...this.params]);
        return { data: result.rows, error: null };
      }

      return { data: [], error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  then(resolve: (result: { data: unknown[]; error: Error | null; count?: number | null }) => void) {
    return this.execute().then(r => resolve(r as { data: unknown[]; error: Error | null; count?: number | null }));
  }

  async single() {
    const result = await this.execute();
    const rows = (result.data as unknown[]) || [];
    return { data: (rows[0] as Record<string, unknown>) ?? null, error: result.error };
  }

  async maybeSingle() {
    return this.single();
  }
}

export async function createCompatClient(): Promise<CompatClient> {
  return {
    auth: {
      async getSession() {
        const { user } = await getServerSession();
        return {
          data: {
            session: user ? { user: { id: user.id, email: user.email } } : null,
          },
        };
      },
      async getUser() {
        const { user } = await getServerSession();
        return { data: { user: user ? { id: user.id, email: user.email } : null } };
      },
    },
    from(table: string) {
      return new QueryBuilder(table);
    },
    rpc(name: string, params?: Record<string, unknown>) {
      const pool = getPool();
      const rpcObj = {
        then(resolve: (result: { data: unknown; error: Error | null }) => void) {
          const paramKeys = Object.keys(params || {});
          const paramValues = Object.values(params || {});
          const paramStr = paramKeys.map((k, i) => `${k} => $${i + 1}`).join(', ');
          const sql = `SELECT * FROM ${name}(${paramStr})`;
          pool.query(sql, paramValues)
            .then(r => resolve({ data: r.rows.length === 1 ? r.rows[0] : r.rows, error: null }))
            .catch(err => resolve({ data: null, error: err }));
          return rpcObj;
        },
      };
      return rpcObj;
    },
  };
}
