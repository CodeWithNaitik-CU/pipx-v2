require('dotenv').config({ path: '.env.local' });
const MetaApi = require('metaapi.cloud-sdk').default;

const token = process.env.METAAPI_TOKEN;
const profileId = process.env.METAAPI_PROFILE_ID;
const api = new MetaApi(token);

async function main() {
  try {
    console.log("Does metatraderAccountGeneratorApi exist?", !!api.metatraderAccountGeneratorApi);

    const demoAccount = await api.metatraderAccountGeneratorApi.createMT5DemoAccount(
      profileId,
      {
        accountType: 'type',
        balance: 1000,
        email: 'test-script@pipx.trader',
        leverage: 100,
        serverName: 'ICMarketsSC-Demo',
        name: 'Test Script User',
        phone: '+10000000000',
      }
    );

    console.log('✅ Demo account created!');
    console.log('Login:', demoAccount.login);
    console.log('Investor Password:', demoAccount.investorPassword);
  } catch (error) {
    console.error('❌ Full error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
  }
}

main();