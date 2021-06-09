const contacts = require('../model/contacts');
const nodemailer = require("nodemailer");
var multer = require('multer');
const path = require('path');
const { log } = require('console');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'attachments')
    },
    filename: function (req, file, cb) {
        console.log(123, file);
        cb(null, 'f' + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage }).array('attachs');

exports.about = (req, res) => {
    contacts.find({}, (err, docs) => {
        if (err) {
            res.render('about', { testData: `There's a problem. Please try again.` });
        } else {
            res.render('about', { testData: docs });
        }
    });
}

exports.getContact = async (req, res) => {
    await upload(req, res, (err) => {
        if (err) {
            console.log(err);
        }
        console.log(req.body, req.files);
    });

    console.log(req.body, req.files);
    try {
        //let testAccount = await nodemailer.createTestAccount();
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'Gmail', // no need to set host or port etc.
            auth: {
                user: process.env.eName,
                pass: process.env.ePass
            }
        });
        // console.log({
        //     user: testAccount.user, // generated ethereal user
        //     pass: testAccount.pass, // generated ethereal password
        // });
        // send mail with defined transport object

        const attach = () => {
            if (req.files) {
                return req.files.map(file => { return { path: file.path } })
            } else {
                return []
            }
        }

        let info = await transporter.sendMail({
            from: '"Backendbetty" <backend@mywebsite.com>', // sender address
            to: "ire.ulysses@gmail.com", // list of receivers
            subject: "Ticket from: " + req.body.fullName, // Subject line
            text: req.body.message, // plain text body
            html: `<b>${req.body.message}</b>`, // html body
            attachments: attach()
        });
        console.log("Message sent: %s", info.messageId);
        res.json({ status: 'success', message: 'Congratulations!' });
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
        // Preview only available when sending through an Ethereal account
        //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.log(err)
        res.status(401).json({ status: 'failed', message: err });
    }
}