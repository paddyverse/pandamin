const https = require('https');

async function checkRemote() {
    try {
        const res = await fetch('https://ghl-agency-dashboard-35hho.ondigitalocean.app/api/locations?search=snapshot');
        const data = await res.json();

        console.log('Status:', res.status);
        console.log('Total keys in response:', Object.keys(data));
        console.log('Array length:', data.locations ? data.locations.length : 'N/A');
        console.log('Total property:', data.total);
        console.log('Meta:', data.meta || 'N/A');
    } catch (e) {
        console.error(e);
    }
}

checkRemote();
