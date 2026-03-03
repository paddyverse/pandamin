async function testLoop() {
    let allLocations = [];
    let skip = 0;
    const limit = 20;

    // mock 32 accounts returned from API
    const MOCK_API = Array.from({ length: 32 }, (_, i) => ({ id: i }));

    const mockSearchLocations = async ({ skip, limit }) => {
        return { locations: MOCK_API.slice(skip, skip + limit) };
    }

    const maxPages = 50;
    for (let i = 0; i < maxPages; i++) {
        console.log(`Page ${i + 1}, skip: ${skip}, limit: ${limit}`);
        const data = await mockSearchLocations({ skip, limit });
        const locations = data.locations ?? [];

        console.log(`- API returned: ${locations.length} items`);
        if (locations.length === 0) break;

        allLocations = allLocations.concat(locations);

        if (locations.length < 20) break;
        skip += limit;
    }

    console.log(`\nFinal loop count: ${allLocations.length}`);
}

testLoop();
