import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

dns.setDefaultResultOrder('ipv4first');

const uri = "mongodb://clashofclans986432678_db_user:rgXknSUwDPqbVWm6@ac-0cljb97-shard-00-00.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-01.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-02.guclz2d.mongodb.net:27017/?ssl=true&replicaSet=atlas-vwbbsu-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function clearDB() {
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            family: 4
        });
        console.log('✅ Successfully connected to MongoDB for database wipe.');
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        for (let collection of collections) {
            await db.collection(collection.name).drop();
            console.log(`🗑️ Dropped collection: ${collection.name}`);
        }
        console.log('✨ All collections wiped. Database is completely clear.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during wipe operation:', err.message);
        process.exit(1);
    }
}

clearDB();
