const contacts = require('../model/contacts');
const logs = require('../model/logs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

///... multer settings goes here

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/avatars')
    },
    filename: function (req, file, cb) {
        cb(null, 'a' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage }).single('file');

exports.newContact = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log('err', err);
        }
        console.log('multer', req.body, req.file);

        console.log('controller', req.body);
        console.log(req.logId);

        const { fullName, email, phone, address } = req.body;


        const newContact = new contacts({ fullName, email, phone, address, userId: req.userId });
        if (req.file) {
            newContact.avatar = req.file.filename;
        }

        await newContact.save((err, docs) => {
            console.log(err);
            if (err) {
                res.send(err.errors);
            } else {
                console.log(docs)
                res.send(docs);
                //const updatedLog = new logs({postData: docs});
                logs.findByIdAndUpdate(req.logId, { postData: JSON.stringify(docs) }, (err, doc) => console.log({ err, doc }));
            }
        });

    });


    /*  newContact.save().then((result,err) => {
        if (err) {
            res.send({status:'failed', message: err});
        }else {
            res.send(`${req.body.fullName} is registered on your contact list`);
        }
    }); */

    //res.send('success!');
}

exports.getAll = (req, res) => {
    contacts.find({ userId: req.userId }, (err, docs) => {
        if (err) {
            res.status(500).send(({ status: 'failed', message: err }));
        } else {
            res.send(({ status: 'success', message: 'All data fetched successfully', data: docs }));
        }
    });
}

exports.deleteContact = (req, res) => {
    const id = req.params.contactId;
    //contacts.deleteOne(req.params.id, (err,docs) => {    
    contacts.findByIdAndDelete(id, (err, doc) => {
        if (err) {
            console.log(err);
            res.send({ status: 'failed', message: err });
        } else if (doc === null) {
            res.send({ status: 'failed', message: 'There was no contact' });
        } else {
            console.log(doc);
            logs.findByIdAndUpdate(req.logId, { preData: JSON.stringify(doc) }, (err, doc) => { });

            try {
                fs.unlinkSync('public/avatars/' + doc.avatar);
                console.log('successfully deleted public/avatars/' + doc.avatar);
            } catch (err) {
                // handle the error
            }


            res.send({
                status: 'success',
                message: `${doc.fullName} is deleted from your contact list.`,
                data: doc._id
            });
        }
    })

    //res.send({status:'test', message: req.params.id});
}

exports.updateContact = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log('err', err);
        }

        console.log(req.body);
        const contact = { ...req.body }
        if (req.file) {
            contact.avatar = req.file.filename;
        }



        contacts.findByIdAndUpdate(contact._id, contact, { upsert: true, runValidators: true }, (err, doc) => {
            if (err) {
                console.log(err);
                res.send({ status: 'failed', message: err });
            } else {
                if (contact.avatar) {
                    try {
                        fs.unlinkSync('public/avatars/' + doc.avatar);
                        console.log('successfully deleted public/avatars/' + doc.avatar);
                    } catch (err) {
                        // handle the error
                    }
                }
                console.log(doc);
                logs.findByIdAndUpdate(req.logId, { preData: JSON.stringify(doc), postData: JSON.stringify(contact) }, (err) => { });
                res.send(({ status: 'success', message: 'Contact updated successfully', data: contact }));
            }
        });
    });
    /* 
        const updatedContact = await contacts.findById(contact._id);
        
        //new contacts(contact);
        Object.keys(contact).forEach(key => updatedContact[key] = contact[key]);
        //updatedContact.fullName = contact.fullName;
        // updatedContact.email = contact.email;
        // updatedContact.phone = contact.phone;
        // updatedContact.address = contact.address;
        updatedContact.save((err,doc)=>{
            if (err) {
                console.log(err);
                res.send({status:'failed', message: err});
            } else {
                console.log(doc);
                res.send(({status:'success', message: 'Contact updated successfully'}));
            }
        }); */
}