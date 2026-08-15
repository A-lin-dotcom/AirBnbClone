const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

async function main() {
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log('Connected to MongoDB');

    await Listing.deleteMany({});
    console.log('Existing listings removed');

    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: obj.owner || null
    }));

    await Listing.insertMany(initData.data);
    console.log('Database initialized with sample listings');
}

main()
    .catch(err => {
        console.log('Database initialization error:', err);
    });