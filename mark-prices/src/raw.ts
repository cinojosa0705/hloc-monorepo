import web3 = require("@solana/web3.js");
import dexterityTs = require("@hxronetwork/dexterity-ts");
const dexterity = dexterityTs.default;
import { addOrUpdateCandleByTick, deleteAllTables, deleteTables, initializeTables } from "./pg";
import { aggregateAll } from "./agg";
import { config } from 'dotenv';
config();
import { MPG_TRGs, UNINITIALIZED, rpc, wallet } from "./const";
import { PriceRaw, TRG_MPG } from "./types";

export async function fetchProductsAndUpdatePrices(trgObject: TRG_MPG) {
  const manifest = await dexterity.getManifest(rpc, false, wallet);
  const trader = new dexterity.Trader(manifest, trgObject.trg, true);
  await trader.update();
  await trader.updateMarkPrices();
  const mpg = trader.mpg;

  const { products } = await getProductsData(mpg);

  if (!products || products.length == 0 ) {
    return console.log(`NO PRODUCTS FOR ${trader.marketProductGroup.toBase58()} MPG`)
  }

  const ProductNames = products.map((p) => p.productName)

  await initializeTables(trgObject.mpg, ProductNames)
  aggregateAll(trgObject.mpg, ProductNames)

  // Initialize product tick arrays
  const productTickData: { [productName: string]: PriceRaw[] } = {};
  for (const product of products) {
    productTickData[product.productName] = [];

    // Update ticks every 500ms
    setInterval(async () => {
      try {
        await trader.updateMarkPrices();
        let mark: number
        switch (product.productType) {
          case 'combo':{
            mark = Number(
              dexterity.Manifest.GetMidpointPrice(trader.mpg, product.productKey)
            )
            break
          }
          case 'outright':{
            mark = Number(
              dexterity.Manifest.FromFastInt(trader.markPrices.array.filter((p) => p.productKey.toBase58() == product.productKey.toBase58())[0].markPrice.value)
            );
            break
          }
        }
        updateTicks(trgObject.mpg, mark!, product.productName, productTickData[product.productName]);
      } catch (error) {
        console.error(error);
      }
    }, 500); // Every 500ms

    // Clear the tick data every 60 seconds
    const clearTickData = () => {
      productTickData[product.productName] = [];
      console.log(`Array cleared for product: ${product.productName}`);
    };

    // Align the clearing interval with the start of the next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
      setInterval(clearTickData, 60000); // Clear every 60 seconds
    }, msUntilNextMinute);
  }
}

// Fetch for all the active products in an MPG
async function getProductsData(
  mpg: dexterityTs.MarketProductGroup
) {
  const products: { productName: string, productKey: web3.PublicKey, productType: string }[] = []
  for (const [productName, obj] of dexterity.Manifest.GetProductsOfMPG(mpg)) {
    const { product } = obj;
    const meta = dexterity.productToMeta(product);

    if (meta.productKey.equals(UNINITIALIZED)) {
      continue;
    }

    console.log(productName.trim())

    products.push({ productName: productName.trim(), productKey: meta.productKey, productType: product.combo?.combo ? 'combo' : 'outright' })
  }
  return { products };
}

// Update tick list and update/create minute candle
async function updateTicks(mpg: string, price: number, selectedProduct: string, PRODUCT_TICKS_ARRAY: PriceRaw[]) {
  const time = new Date();
  PRODUCT_TICKS_ARRAY.push({ price, timestamp: time });
  addOrUpdateCandleByTick(mpg, selectedProduct, PRODUCT_TICKS_ARRAY, "1_m");
  console.log({
    mpg,
    selectedProduct,
    ticks: PRODUCT_TICKS_ARRAY.length,
    tick: "1_m",
    price
  });
  return;
}
