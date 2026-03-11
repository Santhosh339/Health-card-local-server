import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
const MONGODB_URI = "mongodb://clashofclans986432678_db_user:rgXknSUwDPqbVWm6@ac-0cljb97-shard-00-00.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-01.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-02.guclz2d.mongodb.net:27017/?ssl=true&replicaSet=atlas-vwbbsu-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        const HealthCard = mongoose.models.HealthCard || mongoose.model('HealthCard', new mongoose.Schema({}), 'healthcards');
        const count = await HealthCard.countDocuments({ school: /Anns/i });
        console.log(`Found ${count} cards for St. Anns School`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
