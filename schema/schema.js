var mongoose = require('mongoose');


var userschema = new mongoose.Schema({
    usermail : { type : String, required : true,unique : true},
    password :{type: String, requied : false,default : ""},
    firstname :{type : String, requied :false,default :''},
    lastname : {type : String , required : false,default : ""},
    profileset :{type:Boolean, required : false,default : ""},
    phoneno:{type:String,require:false,default:"-"}
});
var user = mongoose.model("nexus_users",userschema);
module.exports = user;
