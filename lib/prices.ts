export interface PriceData {
  symbol: string;
  price: number;
}

export async function getXAUUSDPrice(): Promise<number> {
  const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
  const data = await res.json();
  return data.price;
}

export async function getCryptoPrice(symbol: "BTCUSDT" | "ETHUSDT"): Promise<number> {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return parseFloat(data.price);
}

export async function getAllPrices(): Promise<Record<string, number>> {
  const [xau, btc, eth] = await Promise.all([
    getXAUUSDPrice(),
    getCryptoPrice("BTCUSDT"),
    getCryptoPrice("ETHUSDT"),
  ]);

  return {
    XAUUSD: xau,
    BTCUSD: btc,
    ETHUSD: eth,
  };
}