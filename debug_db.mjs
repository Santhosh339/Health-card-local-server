import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
const MONGODB_URI = "mongodb://clashofclans986432678_db_user:rgXknSUwDPqbVWm6@ac-0cljb97-shard-00-00.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-01.guclz2d.mongodb.net:27017,ac-0cljb97-shard-00-02.guclz2d.mongodb.net:27017/?ssl=true&replicaSet=atlas-vwbbsu-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function test() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const Campus = mongoose.models.Campus || mongoose.model('Campus', new mongoose.Schema({}), 'campus');
        const HealthCard = mongoose.models.HealthCard || mongoose.model('HealthCard', new mongoose.Schema({}), 'healthcards');

        const campusData = await Campus.find().limit(5);
        console.log('--- Campuses ---');
        campusData.forEach(c => console.log(`- ${c.get('schoolName')} | ${c.get('state')} | ${c.get('district')}`));

        const cardData = await HealthCard.find().limit(5);
        console.log('--- Health Cards ---');
        cardData.forEach(c => console.log(`- Student: ${c.get('name')} | School: ${c.get('school')}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
