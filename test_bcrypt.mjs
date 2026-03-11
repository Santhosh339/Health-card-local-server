import bcrypt from 'bcryptjs';

const hash = '$2a$12$0qqlKdAojR1ttHv6FHrK0Oxybga2jJOHde3.q/uaYA/nRgnxCrLjq';
const testPasswords = ['Test@123', 'Test@1234', 'Test4@123', 'Hemanth@123'];

async function run() {
    for (const p of testPasswords) {
        if (await bcrypt.compare(p, hash)) {
            console.log('Match found:', p);
            return;
        }
    }
    console.log('No match found');
}
run();
