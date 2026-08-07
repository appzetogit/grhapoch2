import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://grhapoch_db_user:cgoxdBiIThjVS9ca@grhapoch.tbq66wh.mongodb.net/Grhapoch";

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully!");

        const db = mongoose.connection.db;

        // List all collections in DB to find the exact coupon/offer collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log("Available collections in database:", collectionNames);

        // We want to delete from any collection containing 'offer' or 'coupon'
        const targetCollections = collectionNames.filter(name => 
            name.toLowerCase().includes('offer') || 
            name.toLowerCase().includes('coupon')
        );

        console.log("Found matching offer/coupon collections:", targetCollections);

        for (const colName of targetCollections) {
            const countBefore = await db.collection(colName).countDocuments();
            console.log(`Collection: '${colName}' has ${countBefore} documents.`);
            
            if (countBefore > 0) {
                console.log(`Deleting all documents from '${colName}'...`);
                const result = await db.collection(colName).deleteMany({});
                console.log(`Deleted ${result.deletedCount} documents from '${colName}'.`);
            } else {
                console.log(`Collection '${colName}' is already empty.`);
            }
        }

        console.log("\nCleanup completed successfully!");
    } catch (err) {
        console.error("Error cleaning up coupons:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

run();
