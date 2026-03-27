/**
 * Database client scaffold.
 * Replace with a real client (PostgreSQL, MongoDB, etc.) when persistence is added.
 */
export const createDatabaseClient = () => ({
  connected: false,
  query: async () => {
    throw new Error('Database client not configured.');
  },
});
