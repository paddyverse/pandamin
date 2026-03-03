const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) acc[key.trim()] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    return acc;
}, {});

const TOKEN = env.GHL_PRIVATE_TOKEN || env.API_KEY;
const COMPANY_ID = env.GHL_COMPANY_ID;

async function testApi() {
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
    };

    try {
        console.log('Using Token:', TOKEN ? '***' + TOKEN.slice(-4) : 'MISSING');
        console.log('Using Company ID:', COMPANY_ID);

        console.log('\n--- Testing /locations/search ---');
        const locs = await fetch(`https://services.leadconnectorhq.com/locations/search?companyId=${COMPANY_ID}&limit=2`, { headers });
        console.log(locs.status, await locs.text());

        console.log('\n--- Testing /saas/saas-locations ---');
        const saasLocs = await fetch(`https://services.leadconnectorhq.com/saas/saas-locations/${COMPANY_ID}?limit=2`, { headers });
        console.log(saasLocs.status, await saasLocs.text());
    } catch (e) {
        console.error(e);
    }
}

testApi();
