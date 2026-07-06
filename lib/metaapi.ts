import MetaApi from "metaapi.cloud-sdk";

const token = process.env.METAAPI_TOKEN as string;
const profileId = process.env.METAAPI_PROFILE_ID as string;

const api = new MetaApi(token);

export async function createMT5AccountForUser(uid: string, email: string) {
  // Step 1: Create a real MT5 demo account with IC Markets
  const demoAccount = await api.metatraderDemoAccountApi.createMT5DemoAccount(
    profileId,
    {
      balance: 1000,
      email: email,
      leverage: 100,
      serverName: "ICMarketsSC-Demo",
    }
  );

  // Step 2: Register this account with MetaApi for monitoring
  // (using the investor password so we only get read-only access)
  const account = await api.metatraderAccountApi.createAccount({
    name: `PipX-${uid}`,
    type: "cloud",
    login: demoAccount.login,
    password: demoAccount.investorPassword, // read-only monitoring
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