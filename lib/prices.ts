export interface PriceData {
  symbol: string;
  price: number;
}

export async function getXAUUSDPrice(): Promise<number> {
  const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
  const data = await res.json();
  return data.price;
}

export async function getCryptoPrices(): Promise<{ btc: number; eth: number }> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
    { cache: "no-store" }
  );
  const data = await res.json();
  return {
    btc: data.bitcoin.usd,
    eth: data.ethereum.usd,
  };
}

export async function getAllPrices(): Promise<Record<string, number>> {
  const [xau, crypto] = await Promise.all([getXAUUSDPrice(), getCryptoPrices()]);

  return {
    XAUUSD: xau,
    BTCUSD: crypto.btc,
    ETHUSD: crypto.eth,
  };
}