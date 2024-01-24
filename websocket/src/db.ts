import pgPromise from "pg-promise";
import { Candle } from "./types";

const pgp = pgPromise();
const db = pgp({
  host: "containers-us-west-155.your-host.com",
  port: 7917,
  database: "your-database",
  user: "postgres",
  password: "your-password",
});

export async function fetchPricesBy(
  mpg: string,
  product: string,
  targetTick: string
) {
  const aggregatedTableName = `${mpg}_${product}_${targetTick}`;

  // Use parameterized query
  const fetchQuery = `
  SELECT h, l, o, c, timestamp 
  FROM $1:name 
  ORDER BY timestamp DESC
  LIMIT 256
  `;

  const candles: Candle[] = await db.query(fetchQuery, [aggregatedTableName]);
  const orderedCandles = candles.reverse();

  return orderedCandles;
}

export async function fetchAllTables() {
  try {
    const query = "SELECT tablename FROM pg_tables WHERE schemaname='public';";
    const tables = await db.manyOrNone(query);

    const tableNames = tables.map((table) => table.tablename);

    return tableNames;
  } catch (error) {
    console.error("Error fetching table names:", error);
    throw error;
  }
}
