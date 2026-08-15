const Listing = require('../models/listing');
const { listingSchema } = require('../schema.js');
const cloudinary = require('cloudinary').v2;

const filters = [
    { label: 'All', value: 'all', icon: 'fa-solid fa-house' },
    { label: 'Trending', value: 'trending', icon: 'fa-solid fa-fire' },
    { label: 'Rooms', value: 'rooms', icon: 'fa-solid fa-bed' },
    { label: 'Iconic Cities', value: 'iconic-cities', icon: 'fa-solid fa-mountain-city' },
    { label: 'Mountains', value: 'mountains', icon: 'fa-solid fa-mountain' },
    { label: 'Castles', value: 'castles', icon: 'fa-brands fa-fort-awesome' },
    { label: 'Pool', value: 'pool', icon: 'fa-solid fa-person-swimming' },
    { label: 'Camping', value: 'camping', icon: 'fa-solid fa-campground' },
    { label: 'Farms', value: 'farms', icon: 'fa-solid fa-cow' },
    { label: 'Arctic', value: 'arctic', icon: 'fa-solid fa-snowflake' }
];

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET
});

const ensureLoggedIn=(req,res)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        console.log('Setting redirectUrl to:', req.originalUrl);
        req.session.save((err)=>{
            if(err){
                console.log('Session save error:', err);
            }
            req.flash('error','You must be logged in to create a listing!');
            res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
        });
        return false;
    }
    return true;
};

module.exports.index=async(req,res,next)=>{
    try{
        const activeCategory = req.query.category || 'all';
        const searchTerm = (req.query.search || '').trim();
        const categoryFilter = activeCategory !== 'all' ? { category: activeCategory } : {};

        const searchFilter = searchTerm
            ? {
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { location: { $regex: searchTerm, $options: 'i' } },
                    { country: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            }
            : {};

        const allListings = await Listing.find({ ...categoryFilter, ...searchFilter });

        if (searchTerm && allListings.length === 1) {
            return res.redirect(`/listings/${allListings[0]._id}`);
        }

        res.render('./listings/index.ejs', { allListings, filters, activeCategory, searchTerm });
    }
    catch(err){
        next(err);
    }
}

module.exports.searchSuggestions=async(req,res,next)=>{
    try{
        const searchTerm = (req.query.search || req.query.q || req.query.term || '').trim();
        const limitValue = Number(req.query.limit || 6);
        const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 8) : 6;

        if (!searchTerm) {
            return res.json({ suggestions: [] });
        }

        const searchFilter = {
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { location: { $regex: searchTerm, $options: 'i' } },
                { country: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const suggestions = await Listing.find(searchFilter)
            .select('_id title location country image')
            .limit(limit)
            .lean();

        const payload = suggestions.map((listing) => ({
            _id: listing._id,
            title: listing.title,
            location: listing.location,
            country: listing.country,
            image: listing.image && listing.image.url ? listing.image.url : ''
        }));

        res.json({ suggestions: payload, count: payload.length });
    }
    catch(err){
        next(err);
    }
}

module.exports.renderNewForm=(req,res)=>{
    if(!ensureLoggedIn(req,res)){
        return;
    }
    res.render('./listings/new.ejs');
}

async function uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'listings' }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
        stream.end(buffer);
    });
}

module.exports.createListing=async(req,res,next)=>{
    if(!ensureLoggedIn(req,res)){
        return;
    }

    try{
        const listingData = req.body.listing || {};
        if (typeof listingData.latitude === 'string') {
            listingData.latitude = listingData.latitude.trim();
        }
        if (listingData.latitude !== undefined && listingData.latitude !== '') {
            listingData.latitude = parseFloat(listingData.latitude);
        } else {
            delete listingData.latitude;
        }
        if (typeof listingData.longitude === 'string') {
            listingData.longitude = listingData.longitude.trim();
        }
        if (listingData.longitude !== undefined && listingData.longitude !== '') {
            listingData.longitude = parseFloat(listingData.longitude);
        } else {
            delete listingData.longitude;
        }
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            listingData.image = {
                filename: uploadResult.public_id,
                url: uploadResult.secure_url
            };
        }

        const result = listingSchema.validate({ listing: listingData });
        if (result.error) {
            console.log('Validation error:', result.error.details);
            req.flash('error', result.error.message);
            return res.redirect('/listings/new');
        }

        const newListing = new Listing(listingData);
        newListing.owner = req.user._id;

        await newListing.save();
        req.flash('success','Successfully made a new listing!');
        res.redirect('/listings');
    }
    catch(err){
        next(err);
    }
}

module.exports.renderEditForm=async(req,res,next)=>{
    if(!ensureLoggedIn(req,res)){
        return;
    }

    try{
        const {id}=req.params;
        const listing=await Listing.findById(id);

        if(!listing.owner || !listing.owner.equals(req.user._id)){
           req.flash('error','You do not have permission to edit this listing!');
            return res.redirect(`/listings/${id}`);
        }
        let originalImageUrl=listing.image.url;
        originalImageUrl=originalImageUrl.replace(/\/upload\//, '/upload/c_fill,w_250,h_300/');
        res.render('./listings/edit.ejs',{listing, originalImageUrl});
    }
    catch(err){
        next(err);
    }
}

module.exports.updateListing=async(req,res,next)=>{
    if(!ensureLoggedIn(req,res)){
        return;
    }

    try{
        const {id}=req.params;
        const listing=await Listing.findById(id);

        if(!listing.owner || !listing.owner.equals(req.user._id)){
            req.flash('error','You do not have permission to edit this listing!');
            return res.redirect(`/listings/${id}`);
        }

        const listingData = req.body.listing || {};
        if (typeof listingData.latitude === 'string') {
            listingData.latitude = listingData.latitude.trim();
        }
        if (listingData.latitude !== undefined && listingData.latitude !== '') {
            listingData.latitude = parseFloat(listingData.latitude);
        } else {
            delete listingData.latitude;
        }
        if (typeof listingData.longitude === 'string') {
            listingData.longitude = listingData.longitude.trim();
        }
        if (listingData.longitude !== undefined && listingData.longitude !== '') {
            listingData.longitude = parseFloat(listingData.longitude);
        } else {
            delete listingData.longitude;
        }
        if (!listingData.image && listing.image) {
            listingData.image = listing.image;
        }
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer);
            listingData.image = {
                filename: uploadResult.public_id,
                url: uploadResult.secure_url
            };
        }

        const result = listingSchema.validate({ listing: listingData });
        if (result.error) {
            console.log('Validation error:', result.error.details);
            req.flash('error', result.error.message);
            return res.redirect(`/listings/${id}/edit`);
        }

        await Listing.findByIdAndUpdate(id, listingData, {new:true});
        req.flash('success','Successfully updated the listing!');
        res.redirect(`/listings/${id}`);
    }
    catch(err){
        next(err);
    }
}

module.exports.deleteListing=async(req,res,next)=>{
    if(!ensureLoggedIn(req,res)){
        return;
    }

    try{
        const {id}=req.params;
        const listing=await Listing.findById(id);

        if(!listing.owner || !listing.owner.equals(req.user._id)){
            req.flash('error','You do not have permission to delete this listing!');
            return res.redirect(`/listings/${id}`);
        }

        await Listing.findByIdAndDelete(id);
        req.flash('success','Successfully deleted the listing!');
        res.redirect('/listings');
    }
    catch(err){
        next(err);
    }
}

module.exports.showListing=async(req,res,next)=>{
    try{
        const {id}=req.params;
        const listing=await Listing.findById(id).populate({path:'reviews', populate:{path:'author'}}).populate('owner');

        if(!listing){
            req.flash('error','the listing you are looking for does not exist');
            return res.redirect('/listings');
        }

        console.log(listing);
        res.render('./listings/show.ejs',{listing});
    }
    catch(err){
        next(err);
    }
}
//hello