import { MPG_TRGs } from "./const"
import { fetchProductsAndUpdatePrices } from "./raw"

export async function updatePricesPerProductPerMPG() {
    for (const trg of MPG_TRGs) {
      fetchProductsAndUpdatePrices(trg)
    }
  }
  
updatePricesPerProductPerMPG()