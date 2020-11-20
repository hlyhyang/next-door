const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const db = require('./db');

module.exports = function(){
    passport.use(new LocalStrategy(
    async function (username, password, done) {
        results = await db.login(username);
        if (!results.length){
            //0 represents invalid username
            return done(null, false, { message: 0 });
        }
        bcrypt.compare(password, results[0].upassword, function(err, res) {
            
             res == true;
             console.log(res);
             if( res == true){
                return done(null, results);
             }
             else{
                 //1 represents invalid password
                return done(null, false, { message: 1 });
             }
        });
      
        //result = results[0].username;
    }
    ));
}