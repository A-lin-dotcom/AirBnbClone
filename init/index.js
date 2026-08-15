const mongoose = require('mongoose');
const initData=require('./data.js');
const Listing=require('../models/listing.js');
const data = require('./data.js');
main().then(()=>console.log('Connected to MongoDB'))
.catch(err=>console.log(err));
async function main(){
    await mongoose.connect(process.env.ATLASDB_URL);
}

const initDb=async()=>{
    await Listing.deleteMany({});
    console.log('Existing listings removed');
    initData.data=initData.data.map((obj)=>({
        ...obj,
        owner: obj.owner || null
    }));
    await Listing.insertMany(initData.data);
    console.log('Database initialized with sample listings');

};
initDb();