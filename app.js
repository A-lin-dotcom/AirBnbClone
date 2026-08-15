if (process.env.NODE_ENV !== 'production') {
require('dotenv').config();
}
const express=require('express');
const Listing=require('./models/listing.js');
const app=express();
const mongoose=require('mongoose'); 
const path=require('path');
const methodOverride=require('method-override');
const ejsMate=require('ejs-mate');
const { listingSchema,reviewSchema } = require('./schema.js');
const Review=require('./models/review.js');
const listingRouter=require('./routes/listing.js');
const reviewRouter=require('./routes/review.js');
const userRouter=require('./routes/user.js');
const session=require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const flash=require('connect-flash');
const passport=require('passport');
const localStrategy=require('passport-local');
const User=require('./models/user.js');


const port= process.env.PORT || 8080;
main().then(()=>console.log('Connected to MongoDB'))
.catch(err=>console.log(err));
async function main(){
    await mongoose.connect(process.env.ATLASDB_URL);
}
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
app.engine('ejs',ejsMate);
//app.get('/',(req,res)=>{
 //   res.send('I am Root Route');
//});
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.ATLASDB_URL,
        crypto: {
            secret: process.env.SECRET
        },
        touchafter: 24 * 60 * 60
    }),
    cookie:{
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7,
        httpOnly: true
    }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    res.locals.currentUser=req.user;
    res.locals.redirectUrl=req.session.redirectUrl;
    
    next();
});
app.get('/demouser',async(req,res)=>{
    let fakeUser=new User({
        email:'demouser@example.com',
        username:'delta-student'
    });
   let  registeredUser= await User.register(fakeUser,'demopassword');
    res.send(registeredUser);
});


app.use('/listings',listingRouter);
app.use('/listings/:id/reviews',reviewRouter);
app.use('/',userRouter);

app.use((err,req,res,next)=>{
    res.render('./listings/error.ejs', {err});
});
app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})