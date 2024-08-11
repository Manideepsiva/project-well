var express = require('express');
const passport = require('passport');
var localstrategy = require('passport-local').Strategy;
var googlestrategy = require('passport-google-oauth20').Strategy;
var clientroute  = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb'); 
var hosp = require("../schema/hospitalschema.js");
var user = require("../schema/schema.js");
const { toNamespacedPath } = require('path');
const {hello} =  require("../Mongodbconnection/mongodDriver.js");
const diatest = require("../paths/arraylist.js");
let hospcollec,appointmentcollec;


async function setupCollections() {
    try {
        let  { hospcoll, appointmentcoll } = await hello();
        hospcollec = hospcoll;
        appointmentcollec = appointmentcoll;
        console.log('Collections initialized');
        
    } catch (error) {
        console.error('Error occurred:', error);
    }
}

setupCollections();



var count = 0;





function checkauth(req,res,next){
    if(req.isAuthenticated())
    next();
else{

    res.redirect("/signin");
}

}

clientroute.use(function(req,res,next){
    res.locals.errors = req.flash('error');
    res.locals.infos = req.flash("info");
    next();

});

async function alreadysign(req,res,next){
    if(req.isAuthenticated())
    {      console.log("hello there");
        var id = req.session.passport.user.id;
        console.log(id);
         var hos = await hospcollec.findOne({_id:new ObjectId(id)});
         var userclin = await user.findOne({_id:id});
         console.log(hos,userclin);
         if(hos){
            res.redirect("/hosdashboard")
         }
         else if(userclin){
            res.redirect("/dashboard")
         }
            }
    
else{
    next();
}
}

function checkprof(req,res,next){
    console.log("starting check prof");
    
  
    console.log("after check prod ");

    var bool = user.findOne({_id:req.user.id});

    console.log("hey i amn bool",bool.profileset);
    if(!bool.profileset)
    next();
else
res.redirect("/dashboard");
}


passport.serializeUser((serailse,done)=>{
    console.log(serailse);
    var { person,strategy } = serailse;
   
    if (strategy === 'signin' || strategy === 'signup' || strategy === 'googlein' || strategy === 'googleup'){
        console.log("in serialse");
    done(null,{strategy: 'local',id:person.id});  }
else if(strategy == ('hossignin') )
{   console.log("in here",person._id) 
      done(null,{strategy:'hospital',id:person._id});}
});

passport.deserializeUser(async (serializedUser,done)=>{
    var { strategy, id } = serializedUser;
    if(strategy == 'local'){
    try{  
      
        if(strategy == 'local')
          console.log('insider des');
          console.log(id);
        var person = await user.findOne({_id:id});
        console.log(person,"hello there is des ere");
        
        if(!person) throw new Error('user is not found');
        done(null,person);

    }catch(err)
    {
        done(err);
    }
}
else if(strategy == 'hospital'){

    try{  
      
        
          
        var filter = {
            _id: new ObjectId(id)
        
        }
        console.log(filter,"in filter");
            var person = await hospcollec.findOne(filter); 
          
       
        
        if(!person) throw new Error('user is not found');
        done(null,person);

    }catch(err)
    {
        done(err);
    }

}
});


passport.use("signup",new localstrategy({usernameField :"usermail",passwordField :"password"},async(usermail,password,done) =>{
    try{
        const person =await  user.findOne({'usermail':usermail});
         if(!person){
           
            const newperson = new user({usermail:usermail, password:password,profileset : false});
         
            await newperson.save();
           
            done(null,{'person':newperson,strategy:'signin'});
        }
            else{
             return done(null,false,{message : " user is already exists with given mail id "});
                
            }
    
         }
    catch(err)
    {done(err);
    }
    }
    ));

    passport.use("signin",new localstrategy({usernameField :"usermail",passwordField :"password"},async(usermail,password,done) =>{
        try{
            const person =await  user.findOne({'usermail':usermail});
             if(!person){
               
                return done(null,false,  {message : "no user is found "});
            }
                else{
                    if(person.password === password){
                        return done(null,{'person':person,strategy:'signin'});
                    }
                    else{
                        return done(null,false,  {message : "invalid credentilas"});
                    }
                    
                }
        
             }
        catch(err)
        { console.log("in catch error");
           return  done(err,false);
        }
        }
        ));



        passport.use('googlein',new googlestrategy({
            clientID:"65964826879-oq7686qnb5k73ebfiagq0sl5htmn2hao.apps.googleusercontent.com",
            clientSecret:"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",
            callbackURL:"http://localhost:3000/auth/googlein"
        },async function(accessToken,refreshToken,profile,done){
            try{
                var mailid = profile.emails[0].value;
                const person = await user.findOne({usermail : mailid});
                if(!person){
                    return done(null,false,{message : "no user is found on given google account"});

                }
                else{
                    console.log("im in here please ");
                   return done(null,{person:person,strategy:"googlein"});
                }

            }catch(err)
            {
            done(err,false);
            }
            
        }));

        passport.use('googleup',new googlestrategy({
            clientID:"65964826879-0jfms96np2lq1lpb719qong500419nlp.apps.googleusercontent.com",
            clientSecret:"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",
            callbackURL:"http://localhost:3000/auth/googleup"

        },async function(accessToken,refreshToken,profile,done){
            try{
                var mailid = profile.emails[0].value;
                const person = await user.findOne({usermail : mailid});
               if(!person){
                console.log("already recahed fucking here ",mailid);
                var newperson = new user({usermail : mailid,profileset : "false"});
                await newperson.save();
                var dee = await user.findOne({_id:newperson.id});
               
                done(null,newperson);
              

               }else{
                return done(null,false,{message: " user already exist with given mail account "});
               }
            }catch(err){
                return done(err);
            }
        }));

        passport.use("hossignin",new localstrategy({usernameField :"usermail",passwordField :"password"},async(usermail,password,done) =>{
            try{

                var filter = {
                    _id: new ObjectId(usermail)
                
                }
                console.log(filter);
                    var person = await hospcollec.findOne(filter);
                    console.log(person);
                 if(!person){
                   
                    return done(null,false,  {message : "no user is found "});
                }
                    else{
                        if(person.password === password){
                            return done(null,{'person':person,strategy:'hossignin'});
                        }
                        else{
                            return done(null,false,  {message : "invalid credentilas"});
                        }
                        
                    }
            
                 }
            catch(err)
            { console.log("in catch error");
               return  done(err,false);
            }
            }
            ));




clientroute.get("/",alreadysign,function(req,res,next){

    console.log("inside this hit");
    res.render('index');
});

clientroute.get("/signin",alreadysign,function(req,res)
{res.render('signin');

});

clientroute.get('/edit-profile', async (req, res) => {
    var id = req.session.passport.user.id;
    var person = await user.findOne({_id:id})

    res.render('edit-profile', {
       
        user: person 
    });
});

clientroute.post('/edit-profile', async (req, res, next) => {
    try {
        const { firstName, lastName, email ,phone} = req.body;
        var id = req.session.passport.user.id;
        const updateData = {
          firstname:firstName,
          lastname :lastName,
          usermail:email,
          phoneno:phone

          };
        await user.findByIdAndUpdate(id,updateData);
       

        
        res.redirect('/dashboard');
    } catch (error) {
    
        req.flash('error', 'An error occurred while updating your profile');
res.redirect('/edit-profile');
}
    }
);

let eror = "";

clientroute.get('/reset-password', (req, res) => {
    res.render('reset-password',{eror});
});

clientroute.post('/reset-password',async function(req,res){
    var id = req.session.passport.user.id;;
    var userre = await user.findOne({_id:id});
    if(userre.password != req.body.currentPassword ){
        eror = "incorrect password try again"
        res.redirect("/reset-password");

    }


    else if(userre.password == req.body.currentPassword){

        const updateData = {
          password:req.body.newPassword
  
            };
        await user.findByIdAndUpdate(id,updateData);
        res.redirect('/dashboard');

    }
})


clientroute.get("/hello",function(req,res)
{res.render('blog');

});

clientroute.get("/showates",function(req,res)
{res.render('showates');

});


clientroute.get("/createprof",function(req,res)
{res.render('createprofile2');

});

clientroute.get("/hossignin",function(req,res){
    res.render("hossignin");
})



clientroute.post("/signin",(req,res,next)=>{console.log("it was reached"); next();},passport.authenticate("signin",{
    successRedirect:'/dashboard',
    failureRedirect:'/signin',
    failureFlash : true


}));


clientroute.post("/hossignin",(req,res,next)=>{console.log("imoms"); next();},passport.authenticate("hossignin",{
    successRedirect:'/hosdashboard',
    failureRedirect:'/hossignin',
    failureFlash : true


}));



clientroute.get("/signup",alreadysign,function(req,res,)
{
    res.render('signup');
});

clientroute.post("/signup",(req,res,next)=>{console.log("it was reached"); next();},passport.authenticate("signup",{
    successRedirect:'/createprofile2',
    failureRedirect:"/signup",
    failureFlash : true


}));
clientroute.get('/googlein',passport.authenticate('googlein',{
    scope:
      [ 'email', 'profile' ]
}));

clientroute.get('/auth/googlein',passport.authenticate('googlein',{
    successRedirect : '/dashboard',
    failureRedirect : '/signup',
    failureFlash : true
}));

clientroute.get('/googleup',passport.authenticate('googleup',{
    scope:
      [ 'email', 'profile' ]
}));

//signup google
clientroute.get('/auth/googleup',passport.authenticate('googleup',{
    successRedirect : '/createprofile',
    failureRedirect : '/signup',
    failureFlash : true
}));




clientroute.post('/createprofile',checkauth,async (req,res)=>{
    var first = req.body.firstusername;
    var last = req.body.lastusername;
    var password = req.body.password;
   

    var person = await user.updateOne({_id : req.user.id},{password:password,firstname:first,lastname:last,profileset:"true"});
    
    res.redirect('/dashboard');});



    clientroute.post('/createprofile2',checkauth,async (req,res)=>{
        var first = req.body.firstusername;
        var last = req.body.lastusername;
      
       
    
        var person = await user.updateOne({_id : req.user.id},{firstname:first,lastname:last,profileset:"true"});
     
        res.redirect('/dashboard');});


//sign up google
clientroute.get('/createprofile',checkauth,checkprof,function(req,res){
    res.render("createprofile");

});
clientroute.get('/createprofile2',checkauth,checkprof,function(req,res){
    res.render("createprofile2");

});

clientroute.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});
0
const statekeywords = ['andhra pradesh','tamil nadu','karanataka','kerala']; 
const andhrakeywords = ['alluri sitharama raju','anakapalli','ananthapuramu','annamayya','bapatla','chittoor','dr.b.r.ambedkar konaseema','east godavari','eluru','guntur','kakinada','krishna','kurnool','nandhyala','ntr','palnadu','parvathipuram manyam','prakasam','sri pottisriramulu nellore','sri sathaya sai','srikakulam','tirupati','vishakapatanam','vizianagaram','west godavari','ysr kadapa'];
const karanatakakeywords = ['bengaluru rural','bengaluru urban','chitradurga','tumakuru'];
const tamilkeywords = ['chennai','kanchipuram','thiruvallur'];
const telanganakeywords = ['hyderabad','bhadradri kothagudem','medchal malkajgiri','ranga reddy'];


clientroute.get("/dashboard",checkauth,function(req,res){
    res.render('ind');
});
clientroute.get("/services",checkauth,function(req,res){
    res.render('services');
});
clientroute.get("/doctor",checkauth,function(req,res){
    res.render('doctor');
});

clientroute.get("/blog",checkauth,function(req,res){
    res.render('blog');
});

clientroute.get("/contact",checkauth,function(req,res){
    res.render('contact');
});

clientroute.get("/testing",checkauth,function(req,res){
    console.log("request reecived",req.query);
   
var letter = req.query.action
console.log("error");
if(letter == 'state'){
    var keyletter = req.query.word;
    var resultkey = [];
    resultkey = statekeywords.filter((state)=>{
        if(state.includes(keyletter)){
            return state;
        }
    });
    var jdata = { state : resultkey};

    res.json(jdata);
}

else if(letter == 'district'){
    var keyletter = req.query.word;
    var statekey = req.query.state;
    var resultkey = [];
    if(statekey.toLowerCase() === 'andhra pradesh')
    {  console.log('insider andhra');
    resultkey = andhrakeywords.filter((state)=>{
        if(state.toLowerCase().includes(keyletter.toLowerCase())){
            return state;
        }
    });
    var jdata = { state : resultkey};

    res.json(jdata);
    }

    else if(statekey.toLowerCase()== 'karanataka'){
        resultkey = karanatakakeywords.filter((state)=>{
            if(state.toLowerCase().includes(keyletter.toLowerCase())){
                return state;
            }
        });
        var jdata = { state : resultkey};
    
        res.json(jdata);

    }

    else if(statekey.toLowerCase() == 'tamil nadu'){
        resultkey = tamilkeywords.filter((state)=>{
            if(state.toLowerCase().includes(keyletter.toLowerCase())){
                return state;
            }
        });
        var jdata = { state : resultkey};
    
        res.json(jdata);

    }
    else if(statekey.toLowerCase() == 'telangana'){
        resultkey = telanganakeywords.filter((state)=>{
            if(state.toLowerCase().includes(keyletter.toLowerCase())){
                return state;
            }
        });
        var jdata = { state : resultkey};
    
        res.json(jdata);
    }

}
});
clientroute.get('/search',checkauth,function(req,res){
    console.log('2nd staet');
var statekey = req.query.state;

var districtkey = req.query.district;

if(statekeywords.includes(statekey.toLowerCase())){
if(statekey === 'andhra pradesh'){
    if(andhrakeywords.includes(districtkey.toLowerCase())){
        res.json({data :[1,1]});
    }
    else res.json({data:[1,0]});
}

else if(statekey === 'telangana'){
    if(telanganakeywords.includes(districtkey.toLowerCase())){

        res.json({data :[1,1]});
    }
    else res.json({data:[1,0]});
}
else if(statekey === 'karanataka'){
    if(karanatakakeywords.includes(districtkey.toLowerCase())){

        res.json({data :[1,1]});
    }
    else res.json({data:[1,0]});
}
else if(statekey === 'tamil nadu'){
    if(tamilkeywords.includes(districtkey.toLowerCase())){

        res.json({data :[1,1]});
    }
    else res.json({data:[1,0]});
}
    
}
else res.json({data :[0,0]});
});



clientroute.get('/testnames',checkauth, function(req, res) {
    var testkey = req.query.testname;

    var resultkey = [];
    var count = 0;
    console.log(diatest,"hello there");

    diatest.some((state) => {
        if (state.includes(testkey)) {
            resultkey.push(state);
            count++;
            if (count >= 5) {
                var jdata = { state: resultkey };
                res.json(jdata);
                return true; 
            }
        }
    });

    if (count < 5) {
        var jdata = { state: resultkey };
        res.json(jdata);
    }
});

clientroute.get('/dashboard/getrates',checkauth,async function(req,res){
    var state = req.query.State;
    var district = req.query.District;
    var treate = req.query.treate;
    var filter = {
    State :state,
    District:district,
    [treate]:{$exists:true} 
    };
   
    const selectfiels = ['Name of Hospital','Address','Mitra Contact No'];
    console.log("hello there");
  
   

    var data = await hospcollec.find(filter,{ projection: { 
        "_id":1,
        'Name of Hospital': 1,
        'Address': 1,
        'Mitra Contact No': 1,
          [treate]:1 }
    }).toArray();


    
  

    res.send(data);

    
 
});

clientroute.get("/dashboard/appointment",checkauth,function(req,res){
    console.log("helo there");
    res.render('appointment');

})

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}




function getdate(){
    var month = new Date().getMonth()+1;
    if(month>9){
        return (new Date().getFullYear())+"-"+(month)+"-"+(new Date().getDate());
    
    }
    else if(month <=9){
        return (new Date().getFullYear())+"-0"+(month)+"-"+(new Date().getDate());
    
    }
    
    }

clientroute.post("/dashboard/appointment",checkauth,async function(req,res){
console.log("hello mamama");
    var patientname = req.body.name;
    var pmailid = req.body.email;
    var phone = req.body.phone;
    var area = req.body.area;
    var city = req.body.city;
    var state = req.body.state;
    var postalCode = req.body.postalCode;
    var date = req.body.date;
    var time = req.body.time;
    var message = req.body.message;
    var hosid = req.query.hosid;
    var userid = req.session.passport.user.id;
   
    var appointmentdone = 0;
    var appointmentcancel = 0;
    var treattype=req.query.treat;
   
    var bookeddate = getdate();
    var number = getRandomInt(0,6);
var filter = {
    _id: new ObjectId(hosid)

}
    var hosdoc = await hospcollec.findOne(filter);
    var assigndoctor = hosdoc["doctordetails"][number]["doctorname"];

    await appointmentcollec.insertOne({hosid,userid,patientname:patientname,assigndoctor,pmailid,treattype,phone,area,city,state,postalCode,date,time,message,appointmentdone,appointmentcancel,bookeddate});
res.redirect("/dashboard/upcomingapplist");
   


})


clientroute.get("/dashboard/upcomingapplist",function (req,res){
    res.render("appointmentlist");
})

clientroute.get("/dashboard/completedapplist",function(req,res){
    res.render("completeapplist");
})

clientroute.get("/upcomingapp",async function(req,res){
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
        appointmentdone:{$ne:1},
        appointmentcancel:{$ne:1}
    };
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);



})

clientroute.get("/hosptodayapplist",async function(req,res){
    var user = req.session.passport.user.id;
    var todaydate = getdate();
    var filter ={
        hosid:user,
        date:todaydate,
        appointmentcancel:{$ne:1}

    };
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);



})

clientroute.get("/completedlist",async function(req,res){
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
       appointmentdone:1
    };
   
    var lisdata = await appointmentcollec.find(filter).toArray();
    res.send(lisdata);


})
function isDateAhead(inputDateStr) {
    
    const [day, month, year] = inputDateStr.split('/').map(Number);
    
    
    const inputDate = new Date(year, month - 1, day); 
    const currentDate = new Date();
    
  
    if (inputDate > currentDate) {
        return 1;
    } else {
        return 0; 
    }
}

function getCurrentTime() {
    
    const now = new Date();

    
    const hours = now.getHours();
    const minutes = now.getMinutes();

   
    const formattedHours = (hours < 10 ? '0' : '') + hours;
    const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

    
    const currentTime = `${formattedHours}:${formattedMinutes}`;

    return currentTime;
}

clientroute.get("/cancelapp",async function(req,res){
    console.log("in cancell app");
    var id = req.query.id;
    var reason = req.query.reason;
    console.log(id);
    var cancelledtime = getCurrentTime();
    var filter = {
        _id: new ObjectId(id)
    };
    var cancelleddate = getdate();
    const update = { $set: { appointmentcancel: 1 ,reason:reason,cancelleddate:cancelleddate,cancelledby:'user',cancelledtime:cancelledtime} };
    await appointmentcollec.updateOne(filter,update)
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
        appointmentcancel:{ $ne: 1 }
    };
   
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);

   

})

clientroute.get('/dashboard/cancelledappointments',function(req,res){
    res.render("cancelledappointment");
})
clientroute.get("/cancelledapplist",async function(req,res){
    console.log("hello there in call page");    
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
        appointmentcancel:{ $in: [1, 2] } 
    };
   
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);


})

module.exports = clientroute;