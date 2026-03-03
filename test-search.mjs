import fs from 'fs';
import path from 'path';

function loadEnv() {
    const envFile = fs.readFileSync(path.resolve('.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2];
        }
    });
}
loadEnv();

async function testLimits() {
    const token = process.env.GHL_PRIVATE_TOKEN;
    const companyId = process.env.GHL_COMPANY_ID;

    const qs2 = new URLSearchParams({
        companyId,
        limit: '100',
        skip: '0'
    });
    
    const url2 = `https://services.leadconnectorhq.com/locations/search?${qs2.toString()}`;
    const res2 = await fetch(url2, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
        }
    });

    const data2 = await res2.json();
    console.log(`No query. Keys:`, Object.keys(data2));
    if (data2.meta) console.log('Meta:', data2.meta);
    console.log('Total:', data2.total);
}

testLimits().catch(console.error);
