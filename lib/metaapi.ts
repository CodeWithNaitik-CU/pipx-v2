const token = process.env.METAAPI_TOKEN as string;
const profileId = process.env.METAAPI_PROFILE_ID as string;

export async function createMT5AccountForUser(uid: string, email: string) {
  const { default: MetaApi } = await import("metaapi.cloud-sdk/esm-node");
  const api = new (MetaApi as any)(token);

  const demoAccount = await api.metatraderDemoAccountApi.createMT5DemoAccount(
    profileId,
    {
      balance: 1000,
      email: email,
      leverage: 100,
      serverName: "ICMarketsSC-Demo",
    }
  );

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

  await account.deploy();

  return {
    login: demoAccount.login,
    investorPassword: demoAccount.investorPassword,
    server: "ICMarketsSC-Demo",
    metaApiAccountId: account.id,
  };
}