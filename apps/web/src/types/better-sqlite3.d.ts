declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: unknown);
    close(): void;
  }

  export default Database;
}
