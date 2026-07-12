export async function getXAUUSDPrice(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
    if (!res.ok) throw new Error(`Gold API returned ${res.status}`);
    const data = await res.json();
    return data.price;
  } catch (error) {
    console.error("XAUUSD price fetch failed:", error);
    return null;
  }
}

export async function getCryptoPrices(): Promise<{ btc: number | null; eth: number | null }> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
    const data = await res.json();
    return {
      btc: data.bitcoin?.usd ?? null,
      eth: data.ethereum?.usd ?? null,
    };
  } catch (error) {
    console.error("Crypto price fetch failed:", error);
    return { btc: null, eth: null };
  }
}

export async function getAllPrices(): Promise<Record<string, number | null>> {
  const [xau, crypto] = await Promise.all([getXAUUSDPrice(), getCryptoPrices()]);
  return {
    XAUUSD: xau,
    BTCUSD: crypto.btc,
    ETHUSD: crypto.eth,
  };
}