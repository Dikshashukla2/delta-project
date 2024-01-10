if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}


const express=require("express");
const app=express();
const mongoose=require("mongoose");
//const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride= require("method-override");
const ejsMate=require("ejs-mate");
//const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
//const {listingSchema,reviewSchema} = require("./schema.js");
//const Review = require("./models/review.js");
const flash=require("connect-flash");
const passport=require("passport");
const localStrategy=require("passport-local");
const User=require("./models/user.js");


 //routers
const listingsRouter=require("./routes/listing.js");
const reviewsRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");
const session=require("express-session");

const MongoStore = require('connect-mongo');



const dbUrl=process.env.ATLASDB_URL;

main()
.then(()=>{
    console.log(" connected to DB ");
})
.catch(err => {
    console.log(err)
});

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
})

//SESSION STARTED
const sessionOptions ={
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized :true,
    cookie:{
        expires:Date.now() *7 *24  *60 *60 *1000 },
        maxAge: 7 *24 *60 *60 *1000,
        httpOnly: true, 
};

//HOME ROUTE
/*app.get("/",(req,res)=>{
    res.send("hii, i am root");
})*/


app.use(session(sessionOptions));
app.use(flash());

//passport initalize,session()
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
//serializeUser() Generates a function that is used by Passport to store data of user as they login
//deserializeUser() Generates a function that is used by Passport to remove the data from web
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
res.locals.success=req.flash("success");
res.locals.error=req.flash("error");
res.locals.currUser=req.user;
//console.log(res.locals.success);
next();
})
/*app.get("/demoUser", async(req,res)=>{
    let fakeUser=new User({
        email:"fakeUser@getMaxListeners.com",
        username:"delta student",

    });
    let registerUser=await User.register(fakeUser,"helloworld");
    res.send(registerUser);
})*/

 //routers
app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found"));
});

app.use((err,req,res,next)=>{
   let{statusCode=500,message="something went wrong"}=err;
    res.status(statusCode).render("listings/error.ejs",{message});
   /* res.status(statusCode).send(message);*/
});


app.listen(8080,()=>{
 console.log("app is listening to port 8080");
})