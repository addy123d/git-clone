const nodemailer = require("nodemailer");
const env = require("dotenv").config();
// console.log(env);
console.log("Email from mail.js : ",process.env.EMAIL);

// Initialisation !
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Mail Body
const sendMail = (email,link,OTP,cb) => {
    const mailOptions = {
        to: email, // This is to be allowed by GMAIL
        from: "Github Clone",
        subject: "Response from Github-Clone",
        text: `Your OTP is ${OTP}
                URL - ${link}`
    };


// Send Mail
transporter.sendMail(mailOptions, (err, data) => {
    console.log("Sending....");
    if (err) {
        console.log("Error from nodemailer or gmail might be !", err)
        cb(err, null);
    } else {
        console.log("Success ! Mail has been sent successfully from nodemailer !");
        cb(null, data);
    }
});
}


module.exports = sendMail;