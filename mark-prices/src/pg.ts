import pgPromise = require("pg-promise");
import { aggregationMapping, subtables } from "./const";
import { AggregationParams, Candle, PriceRaw } from "./types";

export async function clearAllData(mpg: string, products: string[]) {
  for (const product of products) {
    const sanitizedProductName = `${mpg.toLocaleLowerCase()}_${product.replace("-", "_").toLowerCase()}`

    for (const subtable of subtables) {
      const fullTableName = `${sanitizedProductName}_${subtable}`;
      try {
        await db.none(`DELETE FROM ${fullTableName}`);
        console.log(`Data cleared from ${fullTableName}`);
      } catch (error) {
        console.error(`Error clearing data from ${fullTableName}:`, error);
      }
    }
  }
}

export async function initializeTables(mpg: string, products: string[]) {
  for (const product of products) {
    // Replace characters to ensure a safe table name (there might be better ways of sanitizing)
    const sanitizedProductName = `${mpg.toLocaleLowerCase()}_${product.replace("-", "_").toLowerCase()}`

    try {
      const timeframes = ["1_m", "5_m", "15_m", "1_h", "4_h", "1_d"];
      for (const timeframe of timeframes) {
        await db.none(`
                  CREATE TABLE IF NOT EXISTS ${sanitizedProductName}_${timeframe} (
                      id SERIAL PRIMARY KEY,
                      h DECIMAL NOT NULL,
                      l DECIMAL NOT NULL,
                      o DECIMAL NOT NULL,
                      c DECIMAL NOT NULL,
                      timestamp TIMESTAMP NOT NULL UNIQUE
                  );
              `);
      }
      console.log("Created Tables for: ", sanitizedProductName);
    } catch (error) {
      console.error(`Error initializing table for product ${product}:`, error);
    }
  }
}

export async function deleteAllTables() {
  try {
    // Start a transaction
    await db.tx(async t => {
      // Retrieve the list of all table names in the database
      const tables = await t.manyOrNone("SELECT tablename FROM pg_tables WHERE schemaname = 'public';");

      // Generate and execute a query to drop each table
      for (const table of tables) {
        await t.none(`DROP TABLE IF EXISTS ${table.tablename} CASCADE;`);
      }
    });

    console.log("All tables deleted successfully.");
  } catch (error) {
    console.error("Error deleting tables:", error);
  }
}


export async function deleteTables(mpg: string, products: string[]) {
  for (const product of products) {
    // Replace characters to ensure a safe table name
    const sanitizedProductName = `${mpg.toLocaleLowerCase()}_${product.replace("-", "_").toLowerCase()}`

    try {

      // Drop sub-tables for other time granularities
      const timeframes = ["1_m", "5_m", "15_m", "1_h", "4_h", "1_d"];
      for (const timeframe of timeframes) {
        await db.none(
          `DROP TABLE IF EXISTS ${sanitizedProductName}_${timeframe};`
        );
      }

      console.log(`Deleted tables for product: ${product}`);
    } catch (error) {
      console.error(`Error deleting table for product ${product}:`, error);
    }
  }
}

export async function fetchPricesBy(mpg: string, product: string, targetTick: string) {
  const params = aggregationMapping[targetTick];
  if (!params) {
    throw new Error(`Unsupported target tick: ${targetTick}`);
  }

  const sanitizedProductName = `${mpg.toLocaleLowerCase()}_${product.replace("-", "_").toLowerCase()}`
  const aggregatedTableName = `${sanitizedProductName}_${params.sourceTick}`;

  // Compute the closest valid timestamp
  const latestTimestamp = getNearestValidTimestamp(params);

  const fetchQuery = `
  SELECT h, l, o, c, timestamp 
  FROM ${aggregatedTableName} 
  WHERE timestamp >= $1
  ORDER BY timestamp ASC
  `;

  const candles: Candle[] = await db.query(fetchQuery, [latestTimestamp]);
  console.log("Fetched candles:", candles.length, product, targetTick, latestTimestamp); // Logging the length of fetched data

  return candles;
}

function getNearestValidTimestamp(params: AggregationParams): Date {
  const now = new Date();

  switch (params.type) {
    case 'm': {
      const minutes = now.getMinutes();
      let chosenMinute = params.validTimes[0];

      for (const validMinute of params.validTimes) {
        if (minutes >= validMinute) {
          chosenMinute = validMinute;
        } else {
          break;
        }
      }

      now.setMinutes(chosenMinute, 0, 0);
      break;
    }
    case 'h':{
      const hours = now.getUTCHours();
      let chosenHour = params.validTimes[0];

      for (const validHour of params.validTimes) {
        if (hours >= validHour) {
          chosenHour = validHour;
        } else {
          break;
        }
      }

      console.log({chosenHour})

      now.setUTCHours(chosenHour, 0, 0, 0);      
      break;
    }
    case 'd':{
      now.setHours(0, 0, 0, 0);
      break;
    }
  }
  return now;
}


export async function addOrUpdateCandleByTick(
  mpg: string,
  product: string,
  prices: PriceRaw[],
  tick: string
) {
  const sanitizedProductName = `${product.replace("-", "_").toLowerCase()}`
  const aggregatedTableName = `${mpg}_${sanitizedProductName}_${tick}`;

  if (prices.length === 0) {
    console.log(`No prices available for ${product}`);
    return;
  }

  const priceList = prices.map(p => p.price);
  const h = Math.max(...priceList);
  const l = Math.min(...priceList);
  const o = priceList[0];
  const c = priceList[priceList.length - 1];
  const timestamp = prices[0].timestamp;

  try {
    await db.none(
      `INSERT INTO ${aggregatedTableName}(h, l, o, c, timestamp) VALUES($1, $2, $3, $4, $5)
       ON CONFLICT (timestamp) DO UPDATE SET h = EXCLUDED.h, l = EXCLUDED.l, o = EXCLUDED.o, c = EXCLUDED.c`,
      [h, l, o, c, timestamp]
    );
    console.log(`Upserted candle for ${aggregatedTableName}`);
  } catch (error: any) {
    console.error(`Error in upserting candle for ${product}: `, error);
  }
}


async function deleteAllBefore(mpg: string, product: string, cutoffDate: Date) {
  const sanitizedProductName = `${mpg.toLocaleLowerCase()}_${product.replace("-", "_").toLowerCase()}`
  const rawTableName = `${sanitizedProductName}_raw_price`;

  try {
    await db.none(`DELETE FROM ${rawTableName} WHERE timestamp < $1`, [
      cutoffDate,
    ]);
    console.log(
      `Data before ${cutoffDate.toISOString()} cleared from ${rawTableName}`
    );
  } catch (error) {
    console.error(
      `Error deleting data before ${cutoffDate.toISOString()} from ${rawTableName}:`,
      error
    );
  }
}
export { subtables };

