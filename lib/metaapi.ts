const token = process.env.METAAPI_TOKEN as string;
const profileId = process.env.METAAPI_PROFILE_ID as string;

export async function createMT5AccountForUser(uid: string, email: string) {
  const { default: MetaApi } = await import("metaapi.cloud-sdk/esm-node");
  const api = new (MetaApi as any)(token);

  // Step 1: Create a real MT5 demo account with IC Markets
  const demoAccount = await api.metatraderAccountGeneratorApi.createMT5DemoAccount(
    profileId,
    {
      accountType: "type",
      balance: 1000,
      email: email,
      leverage: 100,
      serverName: "ICMarketsSC-Demo",
      name: `PipX Trader ${uid.slice(0, 6)}`,
      phone: "+10000000000",
    }
  );

  // Step 2: Register this account with MetaApi for monitoring
  const account = await api.metatraderAccountApi.createAccount({
    name: `PipX-${uid}`,
    type: "cloud-g2",
    login: demoAccount.login,
    password: demoAccount.investorPassword,
    server: "ICMarketsSC-Demo",
    provisioningProfileId: profileId,
    application: "MetaApi",
    magic: 0,
  });

  // Step 3: Deploy the account so MetaApi starts syncing with the broker
  await account.deploy();

  return {
    login: demoAccount.login,
    investorPassword: demoAccount.investorPassword,
    server: "ICMarketsSC-Demo",
    metaApiAccountId: account.id,
  };
}