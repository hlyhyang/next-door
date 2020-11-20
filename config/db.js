//connect to db
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : 'chun72610cs,',
    database : 'myNextDoor',
    port:'3306'
});
let nextdoor = {};

/*BASIC INFO*/
//register
nextdoor.register = (username, password, email,address,upostcode) => {
    return new Promise((resolve, reject) => {
        //console.log("xxx");
        connection.query('INSERT into userInfo(uid,upassword,uemail,uaddress,upostcode) VALUES(?, ?, ?, ?, ?)',
            [username, password, email, address, upostcode], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);

            });

    });

};
//login
nextdoor.login = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT uid, upassword FROM userInfo WHERE uid = ? ', [username], (err,results) => {
            if (err){
                return reject(err);
            }
            return resolve(results);
        });
    });
};

//get curr user's information
nextdoor.userprofile = (uid) => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM userInfo WHERE uid = ? ', [uid], (err,results) => {
            if (err){
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
};
//update user's profile with user's new data input
nextdoor.updateProfile = (username, address, postcode,intro, photo) => {
    return new Promise((resolve, reject) => {
        connection.query(' UPDATE userinfo SET uaddress=?, upostcode=?, uintro=?, uimg=? WHERE uid=?;'
            , [address, postcode, intro, photo,username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });

    });

};




/*MESSAGE*/
//store message info into message table
nextdoor.postMessage = (title, username, timestamp, text, type) => {
    return new Promise((resolve, reject) => {
        //console.log("xxx");
        connection.query('INSERT into messages(mtitle,mauthor,mtimestamp,mtext,type) VALUES(?, ?, ?, ?, ?)',
            [title, username, timestamp, text, type], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);

            });

    });
};
//store permission list for friend msg into messagePermisssion table
nextdoor.initializeFriendMsg = (username, timestamp, type) => {
    return new Promise((resolve, reject) => {
        console.log("initialize fr msg");
        connection.query('INSERT into messagePermission(mauthor, mtimestamp, rid, type) select ?, ?, uid, ? from userInfo WHERE uid in (select friend1 from friends where status = 1 and friend2 = ?) or uid in (select friend2 from friends where status = 1 and friend1 = ?) or uid = ?;',
            [username, timestamp, type, username, username, username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);

            });
    });
};
//store permission list for neighbor message into messagePermission table
nextdoor.initializeNeighborMsg = (username, timestamp, type) => {
    return new Promise((resolve, reject) => {
        console.log("initialize nei msg");
        connection.query('INSERT into messagePermission(mauthor, mtimestamp, rid, type) select ?, ?, uid, ? from userInfo WHERE uid in (select neighbor2 from neighbors where neighbor1 = ?) or uid = ?;',
            [username, timestamp, type, username, username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);

            });
    });
}
//store permission list for block message into messagePermission table
nextdoor.initializeBlockMsg = (username, timestamp, type) => {
    return new Promise((resolve, reject) => {
        console.log("initialize blk msg");
        connection.query('INSERT into messagePermission(mauthor, mtimestamp, rid, type) select ?, ?, uid, ? from userInfo a WHERE a.ublock = (select ublock from userInfo where uid = ?)',
            [username, timestamp, type, username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);

            });
    });
};






//get user's block member list
nextdoor.blkMemberList = (uid) => {
    return new Promise((resolve, reject) => {
        connection.query(' select a.uid from userInfo a, userInfo b where b.uid=? and a.uid<>b.uid and a.uaddress=b.uaddress;'
            , [uid], (err,results) => {
                if (err){
                    console.log(err);
                    return reject(err);
                }

                return resolve(results);

            });

    });

};
//get user's neighbor list
nextdoor.neighborList = (uid) => {
    return new Promise((resolve, reject) => {
        connection.query('Select neighbor2 from neighbors where neighbor1=?;'
            , [uid], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });

};



/*USER LOG INFO*/
nextdoor.insertRegisterTime = (username, timestamp) => {
    return new Promise((resolve, reject) => {
        connection.query('insert into userLogStatus(uid, loginTime, logoutTime) values (?,?,?);'
            , [username, timestamp, timestamp], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}
nextdoor.updateLogoutTime = (username, timestamp) => {
    return new Promise((resolve, reject) => {
        connection.query('update userLogStatus set logoutTime = ? where uid = ?;'
            , [timestamp, username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}


/*DISPLAY MESSAGE*/
nextdoor.displayAllMessage = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select mid, mtitle, mauthor, mtimestamp, mtext from messages where (mauthor, mtimestamp) in (SELECT mauthor, mtimestamp from messagePermission where rid = ?);'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}






/*BLOCK APPLICATION*/
nextdoor.blockStatus = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select bid from block b where exists (select * from userInfo where uid = ? and ublock = 4 and ublock = b.bid) or exists (select * from blockApplication where uid = ? and bid = 4 and bid = b.bid);'
            , [username, username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};
nextdoor.blockApplication = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('insert into blockApplication(uid, bid) values (?,4);'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};


/*GET AND RESOND TO REQUESTS*/
nextdoor.blockApplyList = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select a.uid from blockApplication a where not exists (select * from userInfo where uid = a.uid and ublock = a.bid) and a.bid = (select ublock from userInfo where uid = ?);'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};



//increase approver number to blockApplication
nextdoor.increaseApprover = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('update blockApplication set approver = approver+1 where uid = ?;'
            , [username], (err,results) => {
                if (err){
                    console.log('err');
                    return reject(err);
                }
                console.log("success");
                return resolve(results);
            });
    });
};

//check number of current approvers
nextdoor.blkApproveNum = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select approver from blockApplication where uid = ?;'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};

//update ublock in userInfo
nextdoor.blockApplyApproved = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('update userInfo set ublock = 4, uhood = 3 where uid = ?;'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};


nextdoor.NeighborSuggestion = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select a.uid from userInfo a, userInfo b where b.uid = ? and b.ublock = a.ublock and a.uid <> b.uid and (b.uid, a.uid) not in (select neighbor1, neighbor2 from neighbors);'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};
nextdoor.friendSuggestion = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select a.uid from userInfo a, userInfo b where b.uid = ? and b.ublock = a.ublock and a.uid <> b.uid and ((b.uid, a.uid) not in (select friend1, friend2 from friends)) and ((a.uid, b.uid) not in (select friend1, friend2 from friends));'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};

//add neighbor record after apply, no need to further accept
nextdoor.addNeighbor = (username1, username2) => {
    return new Promise((resolve, reject) => {
        connection.query('insert into neighbors(neighbor1, neighbor2) values (?,?);'
            , [username1, username2], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

//add friend record after apply, status = 0, still not friend
nextdoor.addFApplyRecords = (username1, username2) => {
    return new Promise((resolve, reject) => {
        connection.query('insert into friends(friend1, friend2) values (?,?);'
            , [username1, username2], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

//show list of who applied to be friend and is pending 
nextdoor.friendReqList = (username) => {
    return new Promise((resolve, reject) => {
        connection.query('select friend1 from friends where friend2 = ? and status = 0;'
            , [username], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

nextdoor.acceptFriend = (username1, username2) => {
    return new Promise((resolve, reject) => {
        connection.query('update friends set status = 1 where friend1 = ? and friend2 = ?;'
            , [username2,username1], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

nextdoor.updateMessageStatus = (mid) => {
    return new Promise((resolve, reject) => {
        connection.query('update messagePermission set readStatus = 1 where (mauthor, mtimestamp) = (select mauthor, mtimestamp from messages where mid = ?);'
            , [mid], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

nextdoor.getMessage = (mid) => {
    return new Promise((resolve, reject) => {
        connection.query('select mid, mtitle, mauthor, mtimestamp, mtext, type from messages where mid = ?;'
            , [mid], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}

//massage without topic selection
nextdoor.displayMessageWithoutTopic = (username, type, status) => {
    return new Promise((resolve, reject) => {
        connection.query('select mid, mtitle, mauthor, mtimestamp, mtext from messages where (mauthor, mtimestamp) in (SELECT mauthor, mtimestamp from messagePermission where rid = ? and type = ? and readStatus <= ?);'
            , [username, type, status], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
}
//message with topic selection
nextdoor.displayMessageWithTopic = (username, type, status, topic) => {
    return new Promise((resolve, reject) => {
        connection.query('select mid, mtitle, mauthor, mtimestamp, mtext from messages where (mauthor, mtimestamp) in (SELECT mauthor, mtimestamp from messagePermission where rid = ? and type = ? and readStatus <= ?) and (find_in_set(?, mtext) or find_in_set(?, mtitle));'
            , [username, type, status, topic, topic], (err,results) => {
                if (err){
                    return reject(err);
                }
                return resolve(results);
            });
    });
};

module.exports = nextdoor;