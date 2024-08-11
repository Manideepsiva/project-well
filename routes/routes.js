var express = require('express');
const passport = require('passport');
var localstrategy = require('passport-local').Strategy;
var googlestrategy = require('passport-google-oauth20').Strategy;
var router  = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb'); 
var hosp = require("../schema/hospitalschema.js");


const uri = 'mongodb://localhost:27017';


const dbName = 'project';
var count = 0;

const collectionName = 'hospital';
let hospcollec,appointmentcollec;


MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async client => {
    console.log('Connected to MongoDB');

    const db = client.db(dbName); 
    hospcollec = db.collection(collectionName);
    appointmentcollec = db.collection('appointment');

  });

var user = require("../schema/schema.js");
const { toNamespacedPath } = require('path');
function checkauth(req,res,next){
    if(req.isAuthenticated())
    next();
else{

    res.redirect("/signin");
}

}

router.use(function(req,res,next){
    res.locals.errors = req.flash('error');
    res.locals.infos = req.flash("info");
    next();

});

function alreadysign(req,res,next){
    if(req.isAuthenticated())
    res.redirect('/dashboard');
else{
    next();
}
}

function checkprof(req,res,next){
    console.log("starting check prof");
    
  
    console.log("after check prod ");

    var bool = user.findOne({_id:req.user.id});

    console.log("hey i amn bool",bool.profileset
    );
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



router.get("/",alreadysign,function(req,res,next){

    console.log("inside this hit");
    res.render('index');
});

router.get("/signin",alreadysign,function(req,res)
{res.render('signin');

});

router.get("/hello",function(req,res)
{res.render('blog');

});

router.get("/showates",function(req,res)
{res.render('showates');

});


router.get("/createprof",function(req,res)
{res.render('createprofile2');

});

router.get("/hossignin",function(req,res){
    res.render("hossignin");
})
router.get("/institute",(req,res)=>{
    res.render('institute')
});


router.post("/signin",(req,res,next)=>{console.log("it was reached"); next();},passport.authenticate("signin",{
    successRedirect:'/dashboard',
    failureRedirect:'/signin',
    failureFlash : true


}));


router.post("/hossignin",(req,res,next)=>{console.log("imoms"); next();},passport.authenticate("hossignin",{
    successRedirect:'/hosdashboard',
    failureRedirect:'/hossignin',
    failureFlash : true


}));



router.get("/signup",alreadysign,function(req,res,)
{
    res.render('signup');
});

router.post("/signup",(req,res,next)=>{console.log("it was reached"); next();},passport.authenticate("signup",{
    successRedirect:'/createprofile2',
    failureRedirect:"/signup",
    failureFlash : true


}));
router.get('/googlein',passport.authenticate('googlein',{
    scope:
      [ 'email', 'profile' ]
}));

router.get('/auth/googlein',passport.authenticate('googlein',{
    successRedirect : '/dashboard',
    failureRedirect : '/signup',
    failureFlash : true
}));

router.get('/googleup',passport.authenticate('googleup',{
    scope:
      [ 'email', 'profile' ]
}));

//signup google
router.get('/auth/googleup',passport.authenticate('googleup',{
    successRedirect : '/createprofile',
    failureRedirect : '/signup',
    failureFlash : true
}));




router.post('/createprofile',checkauth,async (req,res)=>{
    var first = req.body.firstusername;
    var last = req.body.lastusername;
    var password = req.body.password;
   

    var person = await user.updateOne({_id : req.user.id},{password:password,firstname:first,lastname:last,profileset:"true"});
    
    res.redirect('/dashboard');});



    router.post('/createprofile2',checkauth,async (req,res)=>{
        var first = req.body.firstusername;
        var last = req.body.lastusername;
      
       
    
        var person = await user.updateOne({_id : req.user.id},{firstname:first,lastname:last,profileset:"true"});
     
        res.redirect('/dashboard');});


//sign up google
router.get('/createprofile',checkauth,checkprof,function(req,res){
    res.render("createprofile");

});
router.get('/createprofile2',checkauth,checkprof,function(req,res){
    res.render("createprofile2");

});

router.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});
0
const statekeywords = ['tamil nadu','karanataka','kerala']; 
const andhrakeywords = ['alluri sitharama raju','anakapalli','ananthapuramu','annamayya','bapatla','chittoor','dr.b.r.ambedkar konaseema','east godavari','eluru','guntur','kakinada','krishna','kurnool','nandhyala','ntr','palnadu','parvathipuram manyam','prakasam','sri pottisriramulu nellore','sri sathaya sai','srikakulam','tirupati','vishakapatanam','vizianagaram','west godavari','ysr kadapa'];
const karanatakakeywords = ['bengaluru rural','bengaluru urban','chitradurga','tumakuru'];
const tamilkeywords = ['chennai','kanchipuram','thiruvallur'];
const telanganakeywords = ['hyderabad','bhadradri kothagudem','medchal malkajgiri','ranga reddy'];


router.get("/dashboard",checkauth,function(req,res){
    res.render('ind');
});
router.get("/services",checkauth,function(req,res){
    res.render('services');
});
router.get("/doctor",checkauth,function(req,res){
    res.render('doctor');
});

router.get("/blog",checkauth,function(req,res){
    res.render('blog');
});

router.get("/contact",checkauth,function(req,res){
    res.render('contact');
});

router.get("/testing",checkauth,function(req,res){
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
router.get('/search',checkauth,function(req,res){
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

const diatest = [
    
        "chlamydia pneumoniae igg antibodies",
        "chlamydia pneumoniae iga antibodies",
        "chikungunya igm rapid test",
        "ceruloplasmin test",
        "troponin t quantitative test",
        "troponin i quantitative test",
        "triglycerides body fluid test",
        "triglycerides test",
        "ck mb ck ratio",
        "ck mb test",
        "cholesterol total serum",
        "cholesterol ldl (direct)",
        "cholesterol hdl (direct)",
        "cholesterol fluid test",
        "cho/hdl ratio",
        "lipoprotein electrophoresis",
        "lipoprotein a (lp a)",
        "biochemical analysis pericardial fluid test",
        "micm by pcr (maternally inherited cardiomyopathy) blood test",
        "obesity capsule 2 diagnostic t test",
        "obesity capsule 1 test",
        "nt probnp diagnostic test",
        "brucella antibodies agglutination test",
        "protein total pericardial fluid",
        "protein total ascitic fluid",
        "c1 esterase inhibitor quantification",
        "c1 esterase inhibitor functional",
        "brucella igm antibodies",
        "brucella igm amp igg panel",
        "brucella igg antibodies",
        "routine examination with cytology pericardial fluid",
        "apolipoprotein evaluation panel",
        "apolipoprotein b",
        "apolipoprotein a1 test",
        "apolipoprotein e genotyping",
        "apolipoprotein - e",
        "fungus culture test",
        "hypertrophic obstructive cardiomyopathy",
        "hypertension profile",
        "hs crp",
        "hbe mutation analysis",
        "hbdh alpha hydroxy butyrate dehydrogenase (ldh 1)",
        "gamma glutamyl transferase",
        "vldl (very low density lipoprotein) test",
        "prolactin",
        "dmd related dilated cardiomyopathy test",
        "disopyramide test",
        "digoxin (lanoxin) test",
        "coxiella burnetii q fever (igm antibody) test",
        'karyotyping for hematological malignancies test',
  'karyotyping and fish for four markers test',
  'fertility capsule 8 test',
  'fertility capsule 7 test',
  'fertility capsule 6 test',
  'fertility capsule 5 test',
  'fertility capsule 4 test',
  'fertility capsule 3 test',
  'fertility capsule 2 test',
  'fertility capsule 1 test',
  'chlamydia trachomatis pcr',
  'chlamydia trachomatis igm antibodies',
  'chlamydia trachomatis igg antibodies',
  'chlamydia trachomatis iga antibodies',
  'chlamydia speciation',
  'luteinizing hormone test',
  'estrone test',
  'estriol unconjugated (ue3)',
  'estradiol (e2)',
  'cmv igm antibodies',
  'cmv igg avidity',
  'cmv igg antibodies serum',
  'cmv pcr quantitative',
  'cmv pcr qualitative, urine',
  'cmv pcr qualitative, plasma',
  'cmv pcr qualitative, fluid',
  'cmv pcr qualitative, csf',
  'cmv pcr qualitative',
  'chromosomal array products of conception',
  'high density 750k chromosomal array',
  'chromosomal array peripheral blood',
  'chromosomal array amniotic fluid',
  'menopause screen1',
  'beta hcg quantitative serum pregnancy test',
  'beta hcg quantitative tumor marker',
  'biopsy small specimen test',
  'amniotic fluid karyotyping for twins test',
  'anti mullerian hormone',
  'amh anti mullerian hormone',
  'alpha feto protein (afp) amniotic fluid test',
  'pregnancy test (qualitative)',
  'nk cells index analysis endometrium test',
  'nipt test for fetal trisomy 13, 18, 21',
  'bone marrow aspirate morphological assessment',
  'boh profile basic',
  'bad obstetric history panel comprehensive',
  'bad obstetric history panel',
  'blood grouping and typing tube agglutination method',
  'blood grouping and typing gel card method',
  'blood group antibody screening with reflex antibody identification',
  'neonatal screening panel 52+10 test',
  'neonatal screening panel 52 test',
  'neonatal screening (tsh) test',
  'neonatal screening (total galactose) test',
  'neonatal screening for phenylalanine test',
  'neonatal screening (maple syrup urine disorders)',
  'neonatal screening (biotinidase) test',
  'neonatal screening (17 alpha hydroxyprogesterone)',
  'neonatal screening 7 conditions test',
  'neonatal screening 4 conditions test',
  'neonatal screening 111 conditions test',
  'neonatal screening (11 conditions) test',
  'galactosemia neonatal screening',
  'chimerism study post bone marrow transplant test 1',
  'chimerism study post bone marrow transplant test 2',
  'leishmania species culture blood/bone marrow',
  'biopsy bone (core biopsy <2 cm) test',
  'biochemical analysis synovial fluid test',
  'beta 2 crosslaps test',
  'porphobilinogen quantitative urine 24 hours test',
  'porphobilinogen qualitative urine random test',
  'ntxn tellopeptide urine 24h test',
  'pyridinium crosslinks',
  'biopsy limb amputation large bone specimen',
  'hypercalcemia panel',
  'hydroxyproline plasma',
  'hla b7',
  'fungus culture synovial fluid',
  'dpd deoxypyridinoline',
  'cytochemistry stains test | price',
  'anti cyclic citrullinated peptide (anti ccp) test',
  'phosphatidyl serine igm antibody',
  'phosphatidyl serine igg antibody',
  'phosphorous inorganic spot urine',
  'phosphorous inorganic 24 hours urine',
  'phosphorous inorganic',
  'p1np serum test',
  'osteoscreen panel',
  'osteoporosis profile',
  'culture & sensitivity aerobic synovial fluid',
  'culture and sensitivity aerobic bone marrow',
  'calreticulin mutation',
  'calcium body fluid',
  'calcium ionized',
  'calcium spot urine (with ca:creatinine ratio)',
  'calcium spot urine',
  'calcium serum',
  'calcium corrected',
  'calcium 24 hours urine test',
    'torch igm panel 5 test',
    'torch igm panel 4 test',
    'torch igg panel 5 test',
    'torch igg panel 4 test',
    'torch igg and igm 8 parameter test',
    'torch igg and igm 10 parameter test',
    'torch by pcr other samples test',
    'torch by pcr blood test',
    'thrombo check panel basic test',
    'thrombo check / thrombophilia panel 2 test',
    'thrombo check thrombophilia panel 1 test',
    'thrombin time test test',
    'threonine quantitative plasma test',
    'theophylline test',
    'thallium blood test',
    'thalassemia studies test',
    'tetanus toxoid antibodies test',
    'leishmania donovani (ld) bodies detection test',
    'legionella spp. culture test',
    'legionella pneumophila igm test',
    'legionella pneumophila iggtest',
    'legionella antigen detection urine test',
    'lead, urine spot test',
    'lead, 24 hours urine test',
    'lead blood test',
    'ldh isoenzymes test',
    'ldh body fluids test',
    'ldh serum test',
    'ldh pleural fluid test',
    'lamotrigine level test',
    'lambda light chain quantitative, urine random test',
    'lambda light chain quantitative, 24 hours urine test',
    'lambda light chain free serum test',
    'thrombo check thrombophilia panel 3 test',
    'fibromax: a comprehensive liver assessment tool',
    'fibrinogen testing using the clotting method of clauss',
    'fibrinogen tissue (immunofluorescence)',
    'fibrin degradation products (fdp) test',
    'febrile agglutination test',
    'factor 13 activity (qualitative) urea clot lysis test',
    'factor 12 (hageman) activity test',
    'factor 11 (rosenthal) functional activity test',
    "ferritin test",
    "ferric chloride test for phenylketonuria",
    "leishmania species culture liver/splenic aspirate",
    "chromium, urine spot",
    "chromium, blood test",
    "chromium, 24 hours urine",
    "lung cancer panel 3",
    "liver function tests lft",
    "liver function tests extended",
    "liver fibrosis panel",
    "liver cytosolic antigen type 1 lc 1 antibody",
    "liver cancer marker profile test",
    "bilirubin unconjugated indirect test",
    "bilirubin total body fluid test",
    "bilirubin total test"

      
      
]

router.get('/testnames',checkauth, function(req, res) {
    var testkey = req.query.testname;

    var resultkey = [];
    var count = 0;

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

router.get('/dashboard/getrates',checkauth,async function(req,res){
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

router.get("/dashboard/appointment",checkauth,function(req,res){
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

router.post("/dashboard/appointment",checkauth,async function(req,res){
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


router.get("/dashboard/upcomingapplist",function (req,res){
    res.render("appointmentlist");
})

router.get("/upcomingapp",async function(req,res){
    var user = req.session.passport.user.id;
    var filter ={
        userid:user
    };
    var lisdata = await appointmentcollec.find(filter,{ projection: { 
        
        'patientname': 1,
        'bookeddate': 1,
        'date': 1,
        'time':1,
          'treattype':1 ,
          'assigndoctor':1,
          "_id":1}
    }).toArray();

    res.send(lisdata);



})

router.get("/hosptodayapplist",async function(req,res){
    var user = req.session.passport.user.id;
    var todaydate = getdate();
    var filter ={
        hosid:user,
        date:todaydate
    };
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);



})

router.get("/completedlist",async function(req,res){
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
       appointmentdone:1
    };
   
    var lisdata = await appointmentcollec.find(filter,{ projection: { 
        
        'patientname': 1,
        'bookeddate': 1,
        'date': 1,
        'time':1,
          'treattype':1,
          'assigndoctor':1}
    }).toArray();


})
function isDateAhead(inputDateStr) {
    // Parse the input date string (assuming format 'DD/MM/YYYY')
    const [day, month, year] = inputDateStr.split('/').map(Number);
    
    // Create Date objects for the input date and current date
    const inputDate = new Date(year, month - 1, day); // month - 1 because months in Date object are zero-indexed
    const currentDate = new Date();
    
    // Compare inputDate with currentDate
    if (inputDate > currentDate) {
        return 1; // Input date is ahead of current date
    } else {
        return 0; // Input date is not ahead of current date
    }
}

function getCurrentTime() {
    // Get current date/time
    const now = new Date();

    // Extract hours and minutes
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Format hours and minutes with leading zeros if necessary
    const formattedHours = (hours < 10 ? '0' : '') + hours;
    const formattedMinutes = (minutes < 10 ? '0' : '') + minutes;

    // Combine hours and minutes into "hr:min" format
    const currentTime = `${formattedHours}:${formattedMinutes}`;

    return currentTime;
}

router.get("/cancelapp",async function(req,res){
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
   
    var lisdata = await appointmentcollec.find(filter,{ projection: { 
        
        'patientname': 1,
        'bookeddate': 1,
        'date': 1,
        'time':1,
          'treattype':1 ,
          'assigndoctor':1,
          "_id":1}
    }).toArray();

    res.send(lisdata);

   

})

router.get('/dashboard/cancelledappointments',function(req,res){
    res.render("cancelledappointment");
})
router.get("/cancelledapplist",async function(req,res){
    console.log("hello there in call page");    
    var user = req.session.passport.user.id;
    var filter ={
        userid:user,
        appointmentcancel:{ $in: [1, 2] } 
    };
   
    var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);


})


router.get("/hosdashboard",function(req,res){
    res.render("hosdashboard.ejs")
})

router.get("/specialists",function(req,res){
    res.render("specialists.ejs")
})


router.get("/hosappointment",function(req,res){
    res.render("hosappointment.ejs")
})

router.get("/notifications",function(req,res){
    res.render("notifications.ejs")
})

router.get("/settings",function(req,res){
    res.render("settings.ejs")
})

router.get("/hostodayapp",function(req,res){
    res.render("hostodayapp.ejs")
})

function isDateAhead(inputDateStr) {
    // Parse the input date string (assuming format 'DD/MM/YYYY')
    const [day, month, year] = inputDateStr.split('/').map(Number);
    
    // Create Date objects for the input date and current date
    const inputDate = new Date(year, month - 1, day); // month - 1 because months in Date object are zero-indexed
    const currentDate = new Date();
    
    // Compare inputDate with currentDate
    if (inputDate > currentDate) {
        return 1; // Input date is ahead of current date
    } else {
        return 0; // Input date is not ahead of current date
    }
}

router.get("/hoscancelapplist",async function(req,res){
    var id = req.query.id;
    var reason = req.query.reason;
    var cancelledtime = getCurrentTime();
    var filter = {
        _id: new ObjectId(id)
    };
    var cancelleddate = getdate();
    const update = { $set: { appointmentcancel: 1 ,reason:reason,cancelleddate:cancelleddate,cancelledby:'hospital',cancelledtime:cancelledtime} };
    await appointmentcollec.updateOne(filter,update)
    res.status(200).send('Success!');

})


router.get("/hosmarkasdone",async function(req,res){
    var id = req.query.id;
    var completedtime = getCurrentTime();
    var filter = {
        _id: new ObjectId(id)
    };
    var completeddate = getdate();
    const update = { $set: { appointmentdone: 1 ,completeddate:completeddate,completedtime:completedtime} };
    await appointmentcollec.updateOne(filter,update)
    res.status(200).send('Success!');


})

router.post("/adddoctorhos",async function(req,res){
    console.log(req.body,"hey there hello man ");
    var name = req.body.name;
    var gender = req.body.sex;
    var mail = req.body.mail;
    var number = req.body.phone;
    var spec = req.body.country;
    var city = req.body.city;
    var id = req.session.passport.user.id;
 var filter = {
    _id: new ObjectId(id)

}
var update =   { doctorname:name ,gender:gender,email:mail,spec:spec,phone:number,city:city} ;
await hospcollec.updateOne(filter,{ $push: { doctordetails: update } });
    
    res.status(200).send('Success!');

})

router.get("/hosupcomingapp",async function(req,res){
    var id = req.session.passport.user.id;
 var filter = {
    hosid:id
        

}
var lisdata = await appointmentcollec.find(filter).toArray();

    res.send(lisdata);




})

router.get("/hospdata2",async function(req,res){
    var id = req.session.passport.user.id;
    var filter = {
        hosid: new ObjectId(id)
    
    }
    var list =  await appointmentcollec.find(filter).toArray();
    res.send(list);


})

router.get("/hospdata",async function(req,res){
    console.log(req.session.passport,"this is hospdata rember");
 var id = req.session.passport.user.id;
 var filter = {
    _id: new ObjectId(id)

}
console.log(filter);
    var person = await hospcollec.find(filter).toArray();

    res.send(person);
})







module.exports = router;

