import { adminDb } from "@/lib/firebaseAdmin";

const token = process.env.METAAPI_TOKEN as string;

export async function getTournamentLeaderboard(tournamentId: string) {
  const { default: MetaApi } = await import("metaapi.cloud-sdk/esm-node");
  const api = new (MetaApi as any)(token);

  const snapshot = await adminDb.ref(`tournaments/${tournamentId}/participants`).once("value");
  const participants = snapshot.val() || {};

  const results = await Promise.all(
    Object.entries(participants).map(async ([uid, data]: [string, any]) => {
      let currentEquity = data.startingBalance;

      try {
        if (data.mt5Login) {
          const accounts = await api.metatraderAccountApi.getAccounts({
            query: data.mt5Login,
          });

          if (accounts.length > 0) {
            const account = accounts[0];
            const connection = account.getRPCConnection();
            await connection.connect();
            await connection.waitSynchronized();

            const accountInfo = await connection.getAccountInformation();
            currentEquity = accountInfo.equity;

            await connection.close();
          }
        }
      } catch (error) {
        console.error(`Failed to fetch equity for ${uid}:`, error);
      }

      const pnlPercent = ((currentEquity - data.startingBalance) / data.startingBalance) * 100;

      return {
        uid,
        mt5Login: data.mt5Login,
        startingBalance: data.startingBalance,
        currentEquity,
        pnlPercent,
      };
    })
  );

  results.sort((a, b) => b.pnlPercent - a.pnlPercent);

  return results.map((r, index) => ({ ...r, rank: index + 1 }));
}