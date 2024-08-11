var express = require('express');
var mongoose = require('mongoose');
const fs = require('fs')
var path = require('path');
var bodyParser  = require('body-parser');
var user = require("./schema/schema.js");
var  session = require('express-session');
var flash = require('connect-flash');
var routes = require('./routes/routes.js');
var clientroute = require('./routes/clientRoutes.js');
var HospitalRoute = require('./routes/hospitaRoutes.js');
const cookieParser = require('cookie-parser');
var passsport = require('passport');
const passport = require('passport');
var MongoStore = require('connect-mongo');



var app = express();
mongoose.connect('mongodb://localhost:27017/project').then(()=> console.log("connected to database"));
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.set("port", process.env.PORT || 6060);
//app.use(bodyParser.urlencoded({extended : false}));
app.use(express.urlencoded({ extended: true}));

app.use(express.static(path.join(__dirname,"css_files")));
app.use(express.static(path.join(__dirname,"pictures")));
app.use(express.static(path.join(__dirname,"js")));
app.use(express.static(path.join(__dirname,"assets")));
app.use(express.static(path.join(__dirname,"images")));
app.use(express.static(path.join(__dirname,"plugins")));
app.use(express.static(path.join(__dirname,"css")));

console.log(path.join(__dirname,"css_files"));
app.use(cookieParser());
//app.use(bodyParser.json());
app.use(express.json());
//app.use(express.urlencoded({ extended: true}));

app.use(
 session({
    secret : "you are my love , i wont leave you for ever and ever ",
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/project', 
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'native' ,
        collection: 'mySessions'
    })}
));




app.use(passport.initialize());
app.use(passport.session());



app.use(flash());
app.use(clientroute);
app.use(HospitalRoute);








app.listen(3000, function() {
    console.log("     Server started on port " + app.get("port"));
   });