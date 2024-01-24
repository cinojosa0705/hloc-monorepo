import {
  addOrUpdateCandleByTick,
  fetchPricesBy,
  subtables,
} from "./pg";
import { PriceRaw } from "./types";

export async function aggregateAll(mpg: string, products: string[]) {
  const promises = products.flatMap(async(product) => {
    return subtables.map(async (t) => {
      if (t === "1_m") return;

      const candles = await fetchPricesBy(mpg, product, t);

      if (candles && candles.length > 0) {

        const prices: PriceRaw[] = candles.flatMap((candle) => [
          { price: candle.h, timestamp: candle.timestamp },
          { price: candle.o, timestamp: candle.timestamp },
          { price: candle.l, timestamp: candle.timestamp },
          { price: candle.c, timestamp: candle.timestamp },
        ]);
  
        console.log(`Asset: ${product} | Time: ${t} | Timestamp: ${prices[0].timestamp} | Candles: ${candles.length} | Ticks: ${prices.length}`)
        return addOrUpdateCandleByTick(mpg, product, prices, t);
      }

      return
    });
  });

  await Promise.all(promises);

  setTimeout(() => {aggregateAll(mpg, products)}, 500)
}
