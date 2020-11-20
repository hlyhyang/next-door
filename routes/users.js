const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

////////////////////////////////////////GET/////////////////////////////////////////

//register page
router.get('/register', (req,res) => {
    res.render('register')
});

//login page
router.get('/login', (req,res) => {
    res.render('login')
});

//logout page
router.get('/logout', async(req,res) => {
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    //get and update logout time
    var LogoutTime = new Date();
    let results = await db.updateLogoutTime(req.user[0].uid,LogoutTime);
    res.render('logout',{user:req.user[0].uid})
});

//main page
router.get('/mainPage', async(req,res) => {
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    //user's info
    let userInfo = await db.userprofile(req.user[0].uid);
    //user'neighborlist
    let neighbors =await db.neighborList(req.user[0].uid);
    //handle the case when user has no neighbor
    if(!neighbors.length){
        neighbors = [{ uid2: 'Add some neighbors!' }];
    }
    res.render('mainPage', {
        user: req.user[0].uid
    })
});

//profile page
router.get('/profile', async(req,res) => {
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }

    //get user current info from db
    let results = await db.userprofile(req.user[0].uid);
    res.render('profile', {
        user: req.user[0].uid,
        address: results[0].uaddress,
        postcode: results[0].upostcode,
        introduction: results[0].uintro,
        photo: results[0].uimg
    })
});

//posting message page
router.get('/postMsg', (req,res) => {
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }

    res.render('postMsg', {
        user: req.user[0].uid
    })
});

router.get('/blockApply',(req,res)=>{
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    res.render('blockApply',{
        user:req.user[0].uid
    })
});

//page for requests
router.get('/requests',async(req,res)=>{
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }

    let blockReqs = await db.blockApplyList(req.user[0].uid);
    let friendReqs = await db.friendReqList(req.user[0].uid);
    res.render('requests',{
        blockReqs:blockReqs,
        friendReqs:friendReqs
    })
    
});
//page for send friends request
router.get('/addConnection',async(req,res)=>{
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    let nReqs = await db.NeighborSuggestion(req.user[0].uid);
    let fReqs = await db.friendSuggestion(req.user[0].uid);
    res.render('addConnection',{
        nReqs:nReqs,
        fReqs:fReqs
    })
});

router.get('/messages',async(req,res)=>{
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    let allMsg= await db.displayAllMessage(req.user[0].uid);
    //console.log(allMsg);
    res.render('messages',{
        messages:allMsg
    })

});
router.get('/seePost',async(req,res)=>{
    let errors=[];
    if(!req.user){
        errors.push({ msg: 'Please login First' });
        res.render('login',{errors})
    }
    let targetMsg = req.query.mid;
    console.log(targetMsg);
    let msgContent= await db.getMessage(targetMsg);
    console.log(msgContent);
    let msgStatus = await db.updateMessageStatus(targetMsg);
    console.log('update status');
    /*res.render('seePost',{
        messages:msgContent
    })*/
    res.render('seePost',{
        messages:msgContent
    })

})
router.get('/map',async(req,res)=>{
    let userInfo = await db.userprofile(req.user[0].uid);
    let address= userInfo[0].uaddress;
    res.render('map',{
        user:req.user[0].uid,
        address:address
    })
})

//////////////////////////////////////POST///////////////////////////////////////

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {

        if (err) {return next(err); }
        if (!user) {
            let errors = [];
            if(info.message==0){
                errors.push({ msg: ' invalid username!' });
            }
            else{
                errors.push({ msg: ' invalid password!' });
            }
            if (errors.length > 0) {
                res.render('login', {
                    errors
                });
            }
        }
        req.logIn(user, function (err) {
            if (err) { return next(err); }
            console.log("user:", user);
            return res.redirect('/users/mainPage?uid=' + user[0].uid);
        });
    })(req, res, next);
});

//register handle
router.post('/register', async (req,res)=>{
    const {name,email,password,password2,address,postcode} = req.body;
    let errors=[];
    let passwordcrypt = 0;
    //check user input
    if(!name || !email || !password || !password2 || !address || !postcode){
        console.log(!name);
        console.log(!email);
        console.log(!password);
        console.log(!password2);
        console.log(!address);
        console.log(!postcode);
        errors.push({msg : 'Please fill in all fields'});
    }
    if(password != password2) {
        errors.push({ msg: 'Password does not match' });
    }
    if(password.length < 4 ) {
        errors.push({ msg: 'Password must be at least 4 characters' });
    }
    if (errors.length > 0) {
        res.render('register', {
        errors,
        name,
        email,
        password,
        password2,
        address,
        postcode
    });
    }
    else{ 
        try {
        bcrypt.genSalt(10, (err,salt) => 
            bcrypt.hash(password, salt, async(err, hash)=>{
                if(err) throw err;
                else{
                    var registstamp = new Date();
                    let passwordcrypt = hash; 
                    let results = await db.register(name, passwordcrypt, email,address,postcode);
                    let registTime = await db.insertRegisterTime(name,registstamp);
                    res.redirect('login'); 
                }
        }))
    } catch(e){
        console.log(e);
        res.sendStatus(500);

    }
  }

});





router.post('/updateProfile',async(req,res) =>{
    const newUserInfo ={uid:req.user[0].uid,uaddress:req.body.address,upostcode:req.body.postcode,
                        uintro:req.body.introduction,uimg:req.body.photo};
    let errors=[];
    let notification=[];
    if(!newUserInfo.uaddress||!newUserInfo.upostcode){
        errors.push({msg:'Please fill in your address'});
    }
    if (errors.length > 0) {
        res.render('profile', {
            errors,
            user:req.user[0].uid,
            address:req.body.address,
            postcode:req.body.postcode,
            introduction:req.body.introduction,
            photo:req.body.photo
        });
    }
    else{
        try {
            let results = await db.updateProfile(newUserInfo.uid, newUserInfo.uaddress, newUserInfo.upostcode,
                                        newUserInfo.uintro, newUserInfo.uimg);
            notification.push({msg:'update success!!!'});
            res.render('profile', {
                notification,
                user:req.user[0].uid,
                address:req.body.address,
                postcode:req.body.postcode,
                introduction:req.body.introduction,
                photo:req.body.photo
            });
        }catch(e){
            res.sendStatus(500);
        }
    }

});

router.post('/sendPost',async(req,res) =>{
    var newPost;
    //gettimestamp
    var poststamp = new Date();
    //store error msg
    let errors=[];
    //store notification msg
    let notification=[];
    //check if user fill in all the field
    if(!req.body.title ||!req.body.visibility || !req.body.content){
        console.log(!req.body.title);
        console.log(!req.body.visibility);
        console.log(!req.body.content);
        errors.push({msg:'Please fill in all the field'});
    }
    //construct post
    if(req.body.visibility =='block'){
        var scope=0;
        newPost= {title: req.body.title, uid: req.user[0].uid, timestamp:poststamp, content: req.body.content, type: scope};
    }
    else if(req.body.visibility =='neighbors'){
        newPost = {title: req.body.title, uid: req.user[0].uid, timestamp:poststamp, content: req.body.content, type: 1};
    }
    else if(req.body.visibility =='friends'){
        newPost = {title: req.body.title, uid: req.user[0].uid, timestamp:poststamp, content: req.body.content, type: 2};
        //console.log(newPost);
    }
    else{
        errors.push({msg:'Error Please Try again'});
    }
    //check if we have get user's uid and post's timestamp successfully
    if(!newPost.timestamp || !newPost.uid){
        errors.push({msg:'Error Please Try again'});
    }
    //if there is an error post error msg and back to postmsg page
    if(errors.length>0){
        res.render('postMsg',{
            errors,
            user: req.user[0].uid
        });
    }
    else{
        //try to insert post into database
        try{
            //insert into message table
            let msginfo= await db.postMessage(newPost.title, newPost.uid, newPost.timestamp, newPost.content, newPost.type);
            if(req.body.visibility=='friends'){
                console.log('ready for friends msg');
                let friendMsg = await db.initializeFriendMsg(newPost.uid, newPost.timestamp, newPost.type);
            }
            if(req.body.visibility=='neighbors'){
                //console.log('ready for neighbor msg');
                let neighborMsg = db.initializeNeighborMsg(newPost.uid, newPost.timestamp, newPost.type);
            }
            if(req.body.visibility=='block'){
                let blockMsg = await db.initializeBlockMsg(newPost.uid, newPost.timestamp, newPost.type);
            }
            //push notification suggest user successfully post msg
            notification.push({msg:'Posted!!!'});
            res.render('postMsg', {
                notification,
                user: req.user[0].uid,
            });
        }catch(e){
            res.sendStatus(500);
        }
    }
});






router.post('/blkStatus',async(req,res) =>{
    let errors=[];
    let notification=[];
    try{
        let status= await db.blockStatus(req.user[0].uid);
        //not duplicate insert
        if(!status.length){
            //insert into block application table
            try{
                let newapplier = await db.blockApplication(req.user[0].uid);
                notification.push({msg:'your application has been submitted'});
                
                res.render('blockApply',{
                    notification,
                    user:req.user[0].uid
                })
            }catch(e){
                res.sendStatus(500);
            }
        }
        else{
            errors.push({msg:'you have already submit your block application'});
            res.render('blockApply',{
                    errors,
                    user:req.user[0].uid
            });

        }
    }catch(e){
        res.sendStatus(500);
    }

});

router.post('/acceptBlkReq',async(req,res)=>{
    console.log(req.body);
    console.log(req.body.blockReqs);
    let errors=[];
    try{
        let addApprover=await db.increaseApprover(req.body.blockReqs);

        let currApproverNum= await db.blkApproveNum(req.body.blockReqs);
        console.log(currApproverNum[0].approver);
        if(currApproverNum[0].approver > 2){
            console.log("inter success");
            let joinBlk = await db.blockApplyApproved(req.body.blockReqs);
            console.log("add success");
        }
        let blockReqs = await db.blockApplyList(req.user[0].uid);
        let friendReqs = await db.friendReqList(req.user[0].uid);
        res.render('requests',{
            blockReqs:blockReqs,
            friendReqs:friendReqs
    
        })

    }catch(e){
        res.sendStatus(500);
    }
});

router.post('/acceptFReq',async(req,res)=>{
    let requestSender=req.body.friendReqs;
    console.log(requestSender);
    let errors=[];
    let notification =[];
    try{
        console.log(req.user[0].uid);
        let confirmFriendReq=await db.acceptFriend(req.user[0].uid,requestSender);
        console.log('finish confirming');
        let blockReqs = await db.blockApplyList(req.user[0].uid);
        let friendReqs = await db.friendReqList(req.user[0].uid);
        notification.push({msg:'Add Friend successfully'}); 
        res.render('requests',{
            notification,
            blockReqs:blockReqs,
            friendReqs:friendReqs
    
        })

    }catch(e){
        res.sendStatus(500);
    }
});

router.post('/sendNReq',async(req,res)=>{
    console.log('in n request');
    let neighborWantToAdd = req.body.nReqs;
    console.log(neighborWantToAdd);
    let errors =[];
    let notification =[];
    try{
        let addN = await db.addNeighbor(req.user[0].uid,neighborWantToAdd);
        let newNReqs = await db.NeighborSuggestion(req.user[0].uid);
        let newFReqs = await db.friendSuggestion(req.user[0].uid);  
        notification.push({msg:'Add Neighbor Successfully'});
        res.render('addConnection',{
            notification,
            nReqs:newNReqs,
            fReqs:newFReqs
        })
    }catch(e){
        res.sendStatus(500);
    }

});
router.post('/sendFReq',async(req,res)=>{
    let friendWantToAdd = req.body.fReqs;
    let errors =[];
    let notification =[];
    try{
        let addF = await db.addFApplyRecords(req.user[0].uid,friendWantToAdd);
        let newNReqs = await db.NeighborSuggestion(req.user[0].uid);
        let newFReqs = await db.friendSuggestion(req.user[0].uid);  
        notification.push({msg:'Send Friends Request'});
       res.render('addConnection',{
           notification,
           nReqs:newNReqs,
           fReqs:newFReqs
       })

    }catch(e){
        res.sendStatus(500);
    }

});

//search post
router.post('/searchMsg',async(req,res) =>{
    errors=[];
    var scope;
    var status;
    var searchKey;
    //construct post
    if(req.body.visibility =='block'){
        scope =0;
    }
    else if(req.body.visibility =='neighbors'){
        scope =1;
    }
    else if(req.body.visibility =='friends'){
        scope =2;
    }
    else{
        errors.push({msg:'Error Please Try again'});
    }
    if(req.body.readability =='unread'){
        status =0;
    }
    else{
        status =1;
    }
    searchKey = req.body.key;
    if(!searchKey.length){
    try{
        let msgToDisplay= await db.displayMessageWithoutTopic(req.user[0].uid,scope,status);
        res.render('messages',{
            messages:msgToDisplay
        })
    }catch(e){
           res.sendStatus(500);
    }
    }
    else{
        try{
            msgToDisplay=await db.displayMessageWithTopic(req.user[0].uid,scope,status,searchKey);
            res.render('messages',{
                messages:msgToDisplay
            })
    
        }catch(e){
            res.sendStatus(500);
        }
    }

});




module.exports = router;