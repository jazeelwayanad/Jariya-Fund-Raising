
async function verify() {
    const baseUrl = 'http://localhost:3000';

    console.log("Verifying Transactions API...");
    try {
        const txRes = await fetch(`${baseUrl}/api/transactions?limit=5`);
        const txData = await txRes.json();
        const hiddenTx = txData.find((tx: any) => tx.name === "Well Wisher");
        if (hiddenTx) {
            console.log("✅ Found 'Well Wisher' in transactions:", hiddenTx);
        } else {
            console.log("❌ 'Well Wisher' NOT found in recent transactions.");
            console.log("Recent names:", txData.map((t: any) => t.name));
        }
    } catch (e) {
        console.error("Error fetching transactions:", e);
    }

    console.log("\nVerifying Leaderboard API...");
    try {
        const lbRes = await fetch(`${baseUrl}/api/stats/leaderboard?type=individuals&limit=50`);
        const lbData = await lbRes.json();
        const hiddenLb = lbData.find((item: any) => item.name === "Well Wisher");
        if (hiddenLb) {
            console.log("✅ Found 'Well Wisher' in leaderboard:", hiddenLb);
        } else {
            console.log("❌ 'Well Wisher' NOT found in leaderboard.");
            // console.log("Leaderboard names:", lbData.map((t:any) => t.name));
        }
    } catch (e) {
        console.error("Error fetching leaderboard:", e);
    }
}

verify();
