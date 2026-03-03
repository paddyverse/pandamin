async function testApi() {
    const TOKEN = process.env.TOKEN;
    const COMPANY_ID = process.env.COMPANY_ID;

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
    };

    try {
        console.log('\n--- Testing /locations/search (skip: 0 limit: 2) ---');
        let res = await fetch(`https://services.leadconnectorhq.com/locations/search?companyId=${COMPANY_ID}&skip=0&limit=2`, { headers });
        let data = await res.json();
        console.log('Returned:', data.locations ? data.locations.length : 'N/A', 'Meta:', data.meta);

        console.log('\n--- Testing /locations/search (skip: 2 limit: 2) ---');
        res = await fetch(`https://services.leadconnectorhq.com/locations/search?companyId=${COMPANY_ID}&skip=2&limit=2`, { headers });
        data = await res.json();
        console.log('Returned:', data.locations ? data.locations.length : 'N/A', 'Meta:', data.meta);

    } catch (e) {
        console.error(e);
    }
}

testApi();
