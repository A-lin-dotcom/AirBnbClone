
const mongoose = require('mongoose');
const Review=require('./review.js');
const schema = mongoose.Schema;
const listingSchema=new schema({
    title:{
        type:String,
        required:true
    },
    description:String,
    image:{
        url:String,
        filename:String
    },
    price:Number,
    location:String,
    country:String,
    category:{
        type:String,
        default:'trending'
    },
    latitude:Number,
    longitude:Number,
    reviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review"
        }
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
});

listingSchema.post('findOneAndDelete',async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{ $in: listing.reviews }});
    }
});

module.exports=mongoose.model('Listing',listingSchema);