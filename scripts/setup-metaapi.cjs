require('dotenv').config({ path: '.env.local' });
const MetaApi = require('metaapi.cloud-sdk').default;

const token = process.env.METAAPI_TOKEN;
const api = new MetaApi(token);

async function main() {
  try {
    const profile = await api.provisioningProfileApi.createProvisioningProfile({
      name: 'PipX IC Markets',
      version: 5,
    });

    console.log('✅ Provisioning profile created!');
    console.log('Profile ID:', profile.id);
  } catch (error) {
    console.error('❌ Error creating profile:', error.message);
  }
}

main();