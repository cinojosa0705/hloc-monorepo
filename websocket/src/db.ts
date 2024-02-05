import { pg } from "./const"
import { Candle } from "./types";

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
