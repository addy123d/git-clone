/* Express - Helps to build your server !
Express-session - Creates cookie while registering and login (Authentication Usage) !
Mongoose - Used to communicate with Mongo DB  
Node-fetch - Used to send GET & POST requests to Github API
EJS - HTML templates with if-else and for loops ! 
*/

const express = require("express");
const session = require("express-session");
const mongo = require("mongoose");
const fetch = require("node-fetch");
const ejs = require("ejs");

// Import database url from config file !
const url = require("./setup/config").url;

// Import Check OTP function
const {
    check,
    random
} = require("./utility/OTP");

// Import Logs Function !
const createLogs = require("./utility/logs");

// Import sendMail function to send Emails 📧
const sendMail = require("./utility/mail");

// Bring User table for storing users !
const User = require("./tables/User");


// Bring Repository Table !
const Repository = require("./tables/Repository");

// Star Table !
const Star = require("./tables/starredRepo");

const host = "127.0.0.1";
const port = 5000;


let app = express();

// Session Configuration
const sess = {
    name: "User",
    resave: true,
    saveUninitialized: true,
    secret: "mySecret",
    cookie: {}
}


if (app.get('env') === "production") {
    sess.cookie.secure = false;
    sess.cookie.maxAge = 60 * 60;
    sess.cookie.sameSite = false;
};

app.use(session(sess));

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));

// Middlewares 

function redirectLogin(request, response, next) {
    if (!request.session.Username) {
        response.redirect("/login");
    } else {
        next();
    }
}

function redirectMain(request, response, next) {
    if (request.session.Username) {
        response.redirect("/explore");
    } else {
        next();
    }
}

function checkToken(request, response, next) {
    if (request.session.Access_token) {
        next();
    } else {
        response.redirect("/auth");
    }
}

// Function

function updateLog(username, id, message) {
    // Update Log !
    const log = createLogs(message, new Date().toString());
    console.log(log);

    User.updateOne({
            _id: id
        }, {
            $push: {
                logs: log
            }
        }, {
            $new: true
        })
        .then(function () {
            console.log("Log Updated successfully !");
        })
        .catch(function (error) {
            console.log(`Something went wrong ${error}`)
        });

}

// Database Connection
mongo.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(function () {
        console.log("Database Connected Successfully !");
    })
    .catch(function (error) {
        console.log(`Something went wrong : ${error}`);
    });

const users = [];

// GET - /
// app.get('/',function(request,response){
//     response.send(`Hello !
//                     <a href="https://github.com/login/oauth/authorize?client_id=9ce20c0654e294c15470&scope=repo"><button>Authorize</button></a>`);
// });

// app.get("/codeaccess",function(request,response){
//     const {code} = request.query;
//     console.log("Code : ",code);
//     const options = {
//         method : "POST",
//         headers : {'Accept' : 'application/json'}
//     }

//     fetch(`https://github.com/login/oauth/access_token?client_id=9ce20c0654e294c15470&client_secret=a946022c1f00e194394fd8ec8fa3b83cf211e350&code=${code}`,options)
//         .then(res=>res.json())
//         .then((result)=>console.log("Result : ",result))
//         .catch(err=>console.log(err))
// })


// Routes or Paths !

app.get("/", function (request, response) {
    response.redirect("/login");
})



// GET - /register
app.get("/register", redirectMain, function (request, response) {
    response.render("register");
})

// POST - /registerDetails
// @desc - to collect registration details !

app.post("/registerDetails", function (request, response) {
    console.log(request.body);

    // Using DB :-
    User.findOne({
            email: request.body.email
        })
        .then(function (user) {

            // Check if user exists in db or not !

            if (user) {
                response.json({
                    result: "fail : user"
                })
            } else {
                // Store User object into the DB

                // Create user object !
                const user = {
                    name: request.body.name,
                    username: request.body.username,
                    email: request.body.email,
                    password: request.body.password,
                    contact: request.body.contact,
                    timeStamp: new Date().toLocaleString(),
                    logs: [{
                        message: `Account Created`,
                        timeStamp: new Date().toString()
                    }]
                }


                new User(user).save()
                    .then(function (user) {
                        console.log("User registered Successfully !");

                        // Store Cookies
                        request.session.ID = user._id;
                        request.session.Email = user.email;
                        request.session.Username = user.username;

                        console.log("Session : ", request.session);


                        // Repository Doc Creation !
                        Repository.findOne({
                                username: request.body.Username
                            })
                            .then(function (repositoryData) {
                                if (repositoryData) {
                                    // Send error response to user !
                                    response.json({
                                        "err": "RepositoryData of person exists !❌"
                                    })
                                } else {
                                    // Store repository data into DB !
                                    const repoData = {
                                        username: request.session.Username,
                                        repoDetails: []
                                    }

                                    new Repository(repoData).save()
                                        .then(function () {
                                            console.log("Repository DOCUMENT CREATED !");
                                        })
                                        .catch(function (err) {
                                            console.log(err);
                                        });
                                }
                            })
                            .catch(err => {
                                console.log(`Something went wrong ! ${err}`)
                            })

                        // response.redirect("https://github.com/login/oauth/authorize?client_id=c234ef1c02b11d13bb0e&login=${request.session.Username}&scope=repo,delete_repo");

                        // For Star Table
                        const starData = {
                            username: request.session.Username,
                            repoName: []
                        }

                        new Star(starData).save()
                            .then(function () {
                                // Finally after all document creation !
                                console.log("Star table created !");

                                console.log("Session :", request.session);
                                // Response after all table creation !

                                response.json({
                                    result: "success",
                                    redirect_url: `https://github.com/login/oauth/authorize?client_id=c234ef1c02b11d13bb0e&login=${request.session.Username}&scope=repo,delete_repo`
                                });
                            })
                            .catch(function (error) {
                                console.log(`Something went wrong : ${error}`);
                            });

                    })
                    .catch(function (error) {
                        console.log(`Error occured : ${error}`);
                    });
            }
        })
        .catch(function (error) {
            console.log(`Error occured : ${error}`);
        });

});

app.use(express.static(__dirname + "/client"));


// GET - /login
app.get("/login", redirectMain, function (request, response) {
    response.render("login");
});

// POST - /loginDetails
// @desc - to collect login details

app.post("/loginDetails", function (request, response) {
    // console.log(request.body);

    // USING ARRAYS :-
    // // Check whether user exists or not !
    // let flag = 0,index;
    // for(let i = 0; i < users.length; i++){
    //     if(users[i].email === request.body.email){
    //         flag = -1
    //         index = i;
    //         break;
    //     }
    // }

    // console.log("Flag : ",flag);

    // if(flag === -1){
    //     // Match user's password !
    //     console.log("Index of user : ",index)

    //     if(users[index].password === request.body.password){
    //         response.json({
    //             "success" : "Logged In successfully !"
    //         })
    //     }else{
    //         response.json({
    //             "passworderr" : "Password not matched !"
    //         })
    //     }

    // }else{
    //     response.json({
    //         "emailerr" : "User not registered yet !"
    //     });
    // }

    // USING DB :-
    User.findOne({
            username: request.body.username
        })
        .then(function (user) {
            if (user) {
                // Match password of user

                if (user.password === request.body.password) {
                    // user.password - Password stored in database
                    // request.body.password - Password through login form !

                    // Store Cookies
                    request.session.ID = user._id;
                    request.session.Username = user.username;
                    request.session.Email = user.email;

                    console.log("Session : ", request.session);

                    // Update Log !
                    updateLog(user.username, user._id, `${user.username} has logged IN`);

                    // response.redirect("/auth");
                    response.json({
                        result: "success",
                        redirect_url: `https://github.com/login/oauth/authorize?client_id=c234ef1c02b11d13bb0e&login=${request.session.Username}&scope=repo,delete_repo`
                    })

                    // response.redirect(`https://github.com/login/oauth/authorize?client_id=c234ef1c02b11d13bb0e&login=${request.session.Username}&scope=repo,delete_repo`);
                } else {
                    response.json({
                        result: "fail : password"
                    })
                }
            } else {
                response.json({
                    result: "fail : user"
                })
            }
        })
        .catch(function (error) {
            console.log(`Error occured : ${error}`);
        })

});

// Logout Path
app.get("/logout", redirectLogin, function (request, response) {
    request.session.destroy(function (err) {
        if (err) {
            response.redirect("/explore");
        } else {
            response.redirect("/login");
        }
    })
})

// Explore path
// Url - https://api.github.com/users
app.get("/explore", redirectLogin, function (request, response) {

    console.log(request.session);

    fetch('https://api.github.com/repositories') //📌 Fetch will act as a browser inside the code which will send requests to github server !
        .then(res => res.json()) //📌 Data will be converted into JSON format (object form)
        .then((json) => { //📌 Data will be collected here ⏪
            // console.log("explore :", json);

            if (request.query.repository === undefined) {
                response.render("explore", {
                    repos: json
                });
            } else {
                let i;
                let searchRepoArray = [];

                // console.log("Repository from search Bar :", request.query.repository);


                for (i = 0; i < json.length; i++) {
                    if (json[i].name.includes(request.query.repository)) {
                        console.log("Repositories from search :", json[i]);
                        searchRepoArray.push(json[i]);
                    }
                }
                console.log("Search Array : ", searchRepoArray);

                response.render("explore", {
                    repos: searchRepoArray
                });
            }

        }) //Data will be collected here ⏪
        .catch(err => console.log(err));

})

// Profile path
app.get("/profile", redirectLogin, function (request, response) {

    // const userID = request.session.Username;
    let userID, status;
    if (request.query.username === undefined || request.query.username === request.session.Username) {
        userID = request.session.Username; // For account holder !
        status = false;
    } else {
        userID = request.query.username; // Any random profile !
        status = true;
    }




    fetch(`https://api.github.com/users/${userID}`) //📌 Fetch will act as a browser inside the code which will send requests to github server !
        .then(res => res.json()) //📌 Data will be converted into JSON format (object form)
        .then((json) => { //📌 Data will be collected here ⏪
            console.log(json);

            // Check for log checking !

            User.findOne({
                    username: request.session.Username
                })
                .then((user) => {

                    response.render("profile", {
                        profileData: json,
                        status: status,
                        id: user._id
                    });
                })
                .catch(function (error) {
                    console.log(`Something went wrong : ${error}`);
                });

        }) //Data will be collected here ⏪
        .catch(err => console.log(err));

});


// List of repositories !
app.get("/repositories", redirectLogin, function (request, response) {

    let user;

    if (request.query.username === undefined) {
        user = request.session.Username;
    } else {
        user = request.query.username;
    }

    fetch(`https://api.github.com/users/${user}/repos`)
        .then(res => res.json())
        .then((result) => {

            response.render("repos", {
                repos: result,
                user: user,
            });
        })
        .catch(err => console.log(err));
})

// Change
app.get("/change", redirectLogin, function (request, response) {
    const email = request.session.Email;
    const link = `http://127.0.0.1:5000/changeDetails/${request.session.Username}`;

    const OTP = random();

    console.log(email);

    // Mail sending code !
    sendMail(email, link, OTP, function (err) {
        if (err) {
            response.json({
                "emailerr": "Mail Not sent !"
            })
        } else {
            console.log("Mail sent !");
        }
    });

    // response.send("<h1>Please check your email...we have send you a reset link !</h1>");
    response.json({
        "message": "emailsent"
    });
})


// Change Password

app.get("/changeDetails/:user", function (request, response) {
    // console.log(request.session);

    response.render("changePass", {
        email: request.params.user
    });
})

app.post("/changedInfo", function (request, response) {

    const result = check(parseInt(request.body.otp));
    if (result === true) {
        console.log("OTP Matched !")
        // Check whether user exists or not !
        User.findOne({
                username: request.body.username
            })
            .then(function (user) {

                if (user) {
                    if (user.password === request.body.password) {
                        // Update password !
                        User.updateOne({
                                email: user.email
                            }, {
                                password: request.body.newpassword
                            }, {
                                $set: true
                            })
                            .then(function () {
                                console.log("Password updated successfully !");

                                // Update Log !
                                updateLog(user.username, user._id, `Password Updated`);

                                // response.json({
                                //     "success": "Password Updated !"
                                // })

                                response.redirect("/");
                            })
                            .catch(function (error) {
                                console.log(`Something went wrong : ${error}`);
                            });
                    } else {
                        // Hacker attack prevent !
                        response.json({
                            "passworderr": "Access denied !"
                        })
                    }
                } else {
                    response.json({
                        "emailerr": "User doesn't exists !"
                    })
                }

            })
            .catch(function (error) {
                console.log(`Something went wrong : ${error}`);
            })

    } else {
        response.json({
            "otterr": "Access denied !"
        })
    }


})

// Authorise !
app.get("/auth", redirectLogin, function (request, response) {
    response.send(`<a href="https://github.com/login/oauth/authorize?client_id=c234ef1c02b11d13bb0e&login=${request.session.Username}&scope=repo,delete_repo"><button>Authorise Me</button></a>`)
})

app.get("/codeaccess", function (request, response) {
    console.log("Code: ", request.query.code);

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    }

    fetch(`https://github.com/login/oauth/access_token?client_id=c234ef1c02b11d13bb0e&client_secret=db5971074c82907b2d78c06627b77bbd25924a9b&code=${request.query.code}`, options)
        .then(response => response.json())
        .then(function (result) {
            console.log(result);

            request.session.Access_token = result.access_token;

            let profile_url = `/profile`;

            response.redirect(profile_url);
        })
        .catch(function (err) {
            console.log(err);
        });
})


app.get("/createRepo", checkToken, redirectLogin, function (request, response) {
    console.log(request.session.Access_token);

    if (request.session.Access_token === undefined && request.session.ID === undefined) {
        response.redirect("/login");
    } else {
        if (request.session.Access_token === undefined) {
            response.redirect("/auth");
        } else {
            response.render("createRepo");
        }

    }
})

app.post("/repoDetails", function (request, response) {
    console.log(request.body);


    Repository.updateOne({
            username: request.session.Username
        }, {
            $push: {
                repoDetails: {
                    reponame: request.body.name,
                    repoDesc: request.body.desc,
                    createdAt: new Date().toLocaleTimeString()
                }
            }
        }, {
            $new: true
        })
        .then(function () {

            // Update Log !
            updateLog(request.session.Username, request.session.ID, `${request.session.Username} has created repository named ${request.body.name}`);


            // Create Repository

            const options = {
                method: "POST",
                body: JSON.stringify({
                    name: request.body.name,
                    description: request.body.desc
                }),
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${request.session.Access_token}`
                }
            }

            fetch('https://api.github.com/user/repos', options)
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
                    // response.redirect(`/profile/${request.session.Username}`)

                    response.redirect(`/fileupload`);
                })
                .catch(err => console.log(err));

        })
        .catch(function (error) {
            console.log(`Something went wrong ! ${error}`);
        });


})

// http PUT https://api.github.com/repos/lee-dohm/test-repo/contents/hello.txt \
//   "Authorization: token REDACTED-TOKEN" \
//   message="my commit message" \
//   committer:="{ \"name\": \"Lee Dohm\", \"email\": \"1038121+lee-dohm@users.noreply.github.com\" }" \
//   content="bXkgbmV3IGZpbGUgY29udGVudHM="
app.get("/fileupload", redirectLogin, checkToken, function (request, response) {
    const reponames = [];

    fetch(`https://api.github.com/users/${request.session.Username}/repos`)
        .then(res => res.json())
        .then((result) => {
            console.log(result);

            for (var i = 0; i < result.length; i++) {
                console.log(result[i].name);
                reponames.push(result[i].name);
            }


            response.render("upload", {
                names: reponames,
                user: request.session.Username
            });
        })
        .catch(err => console.log(err));
});

app.post("/filedetails", function (request, response) {

    // Upload File
    //     // The original utf8 string 
    // let originalString = "Hello this is my first content"; 

    // Create buffer object, specifying utf8 as encoding 
    let bufferObj = Buffer.from(request.body.filecontent, "utf8");

    // Encode the Buffer as a base64 string 
    let base64String = bufferObj.toString("base64");

    const options = {
        method: "PUT",
        body: JSON.stringify({
            message: "my first commit",
            content: base64String
        }),
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${request.session.Access_token}`
        }
    }

    fetch(`https://api.github.com/repos/${request.session.Username}/${request.body.reponame}/contents/${request.body.filename}`, options)
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            console.log("After Code upload : ", result);

            // Update Log !
            updateLog(request.session.Username, request.session.ID, `Last Commit`);

            response.send("File upload successfully !");

            // response.redirect(`/profile/${request.session.Username}`)

            // response.redirect(`/fileupload?token=${request.query.code}&repo_name=${result.name}`);
        })
        .catch(err => console.log(err));
});

app.get("/editcontent", checkToken, redirectLogin, function (request, response) {
    console.log("URL : ", request.query.url);

    const repository_name = request.query.url.split("/")[5];

    fetch(request.query.url)
        .then(response => response.json())
        .then(function (result) {
            console.log(result);

            let base64encodedContent = result.content;

            let utf8encodedContent = (new Buffer(base64encodedContent, 'base64')).toString('utf8');

            // console.log("File Content : ", utf8encodedContent);

            request.session.SHA_key = result.sha;

            // response.send(`<h2>Update File Content</h2>
            // <form action="/updatecontent" method="POST">
            // <input type="text" name="reponame" value="${repository_name}" readonly autocomplete="off"/>
            // <textarea name="update">${utf8encodedContent}</textarea>
            // <input type="text" name="commitmsg" value="update ${request.query.filename}" autocomplete="off"/>
            // <button>Submit</button>
            // </form>`);

            response.render("updateFile", {
                name: repository_name,
                desc: utf8encodedContent,
                filename: request.query.filename
            });
        })
        .catch(function (error) {
            console.log(`Something went wrong ! ${error}`);
        });

});

app.post("/updatecontent", checkToken, function (request, response) {
    console.log("Body :", request.body);
    let bufferObj = Buffer.from(request.body.update, "utf8");

    // Encode the Buffer as a base64 string 
    let base64String = bufferObj.toString("base64");


    const options = {
        method: "PUT",
        body: JSON.stringify({
            message: request.body.commitmsg,
            content: base64String,
            sha: request.session.SHA_key
        }),
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${request.session.Access_token}`
        }
    }



    fetch(`https://api.github.com/repos/${request.session.Username}/${request.body.reponame}/contents/${request.body.commitmsg.replace("update ","")}`, options)
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            console.log(result);
            // Update Log
            updateLog(request.session.Username, request.session.ID, `File of repository named ${request.body.reponame} updated`);

            response.redirect(`/repositories`);
        })
        .catch(err => console.log(err));
})

app.get("/repocontent", redirectLogin, function (request, response) {
    console.log("Username : ", request.query.username);
    console.log("Repo name : ", request.query.reponame);
    console.log("Repo Description :", request.query.description);

    let sameUser;

    if (request.query.username === request.session.Username) {
        console.log("Hit !");
        sameUser = true;
    } else {
        sameUser = false;
    }

    // https://api.github.com/repos/<%=user%>/<%=repos[i].name%>/contents

    fetch(`https://api.github.com/repos/${request.query.username}/${request.query.reponame}/contents`)
        .then(res => res.json())
        .then(function (result) {
            // console.log(result);

            // Send response !

            const data = {
                files: result,
                reponame: request.query.reponame,
                user: request.query.username,
                desc: request.query.description,
                status: sameUser
            }

            Star.findOne({
                    username: request.session.Username
                })
                .then(function (user) {
                    // console.log(user);
                    let starStatus = false;
                    for (let i = 0; i < user.repoName.length; i++) {
                        if (user.repoName[i] === request.query.reponame) {
                            starStatus = true;
                            break;
                        }
                    }

                    data.starStatus = starStatus;

                    console.log("Data : ", data);

                    response.render("repocontent", data);
                })
                .catch(function (error) {
                    console.log(`Something went wrong : ${error}`);
                });
        })
        .catch(err => console.log(err));



});


// Settings !

app.get("/repo/settings", redirectLogin, function (request, response) {
    console.log(request.query.reponame);

    if (request.query.reponame === undefined) {
        response.redirect("/repositories");
    } else {
        response.render("settings", {
            name: request.query.reponame,
            desc: request.query.desc
        });
    }
})

app.post("/settingDetails", checkToken, function (request, response) {

    console.log(request.session.Access_token);
    if (request.body.visible === "Choose Visibility" || request.body.visible === "Public") {
        request.body.visible = false;
    } else {
        request.body.visible = true;
    }

    console.log("After Change : ", request.body);

    Repository.updateOne({
            username: request.session.Username,
            'repoDetails.reponame': request.body.reponame
        }, {
            $set: {
                'repoDetails.$.reponame': request.body.rename,
                'repoDetails.$.repoDesc': request.body.redesc,
                'repoDetails.$.createdAt': new Date().toString()
            }
        }, {
            $new: true
        })
        .then(function () {
            console.log("Repository Details updated successfully !");

            const options = {
                method: "PATCH",
                body: JSON.stringify({
                    name: request.body.rename,
                    description: request.body.redesc,
                    private: request.body.visible
                }),
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${request.session.Access_token}`
                }
            }

            fetch(`https://api.github.com/repos/${request.session.Username}/${request.body.reponame}`, options)
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
                    // Update Log
                    updateLog(request.session.Username, request.session.ID, `Details of repository named ${request.body.rename} updated`);

                    response.redirect(`/explore`);
                })
                .catch(err => console.log(err));
        })
        .catch(function (err) {
            console.log(`Something went wrong ! ${err}`)
        });




});


app.get("/deleterepo", redirectLogin, checkToken, function (request, response) {


    Repository.updateOne({
            username: request.session.Username
        }, {
            $pull: {
                repoDetails: {
                    reponame: request.query.reponame
                }
            }
        }, {
            $new: true
        })
        .then(function () {


            console.log("Repository Deleted Successfully !");

            const options = {
                method: "DELETE",
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${request.session.Access_token}`
                }
            }

            fetch(`https://api.github.com/repos/${request.session.Username}/${request.query.reponame}`, options)
                .then(function () {
                    console.log("Repository Deleted Successfully !");

                    // Update Log !
                    updateLog(request.session.Username, request.session.ID, `${request.query.reponame} has been deleted`);

                    response.redirect("/explore");
                })
                .catch(function (err) {
                    console.log(`Fetch Error : ${err}`)
                });

        })
        .catch(function (error) {
            console.log(`Something went wrong ! ${error}`);
        });



});

// Get a star !

app.get("/star/:reponame", redirectLogin, function (request, response) {
    const {
        reponame
    } = request.params;

    console.log(reponame);

    Star.updateOne({
            username: request.session.Username
        }, {
            $push: {
                repoName: reponame
            }
        }, {
            $new: true
        })
        .then(function () {
            console.log("Starred !");

            updateLog(request.session.Username, request.session.ID, `You have Starred repository named ${reponame}`);

            response.json({
                "result": "starred"
            });
        })
        .catch(function (error) {
            console.log(`Something went wrong : ${error}`);
            response.json({
                "result": "failed"
            });
        });

});

// Remove a star !

app.get("/removestar/:reponame", redirectLogin, function (request, response) {
    const {
        reponame
    } = request.params;

    console.log(reponame);

    Star.updateOne({
            username: request.session.Username
        }, {
            $pull: {
                repoName: reponame
            }
        }, {
            $new: true
        })
        .then(function () {
            console.log("Starred !");

            updateLog(request.session.Username, request.session.ID, `You have removed Star from repository named ${reponame}`);

            response.json({
                "result": "starred"
            });
        })
        .catch(function (error) {
            console.log(`Something went wrong : ${error}`);
            response.json({
                "result": "failed"
            });
        });

});

// Get Logs

app.get("/logs/:id", redirectLogin, function (request, response) {
    const {
        id
    } = request.params;

    User.findOne({
            _id: id
        })
        .then(function (user) {
            response.render("logs", {
                logs: user.logs
            });
        })
        .catch(function (error) {
            console.log(`Something went wrong : ${error}`)
        });
});


// Switch On the server !
app.listen(port, host, function () {
    console.log("Server is running successfully !");
});
