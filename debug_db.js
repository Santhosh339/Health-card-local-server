import mongoose from 'mongoose';
import connectToDatabase from './src/lib/mongodb.js';

async function test() {
    try {
        await connectToDatabase();
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
