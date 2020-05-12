import * as mongoose from 'mongoose';
import { UserInfoSchema } from '../models/UserInfoModel';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { Singleton } from '../utils/singleton';

const SALT_WORK_FACTOR = 10;
mongoose.pluralize(null);

const UserInfo = mongoose.model('UserInfo', UserInfoSchema);
const singleton = Singleton.getInstance();

export class UserInfoController
{
    public addNewUser (req: Request, res: Response) {                
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err) res.send(err);
    
            bcrypt.hash(req.body['password'], salt, function(err, hash) {
                if (err) res.send(err);
                req.body['password'] = hash;

                let newUser = new UserInfo(req.body);
    
                newUser.save((err, user) => {
                if(err){
                    res.send(err);
                }    
                res.json(user);
                });
            });
        });
    }

    public getUserInfo (req: Request, res: Response) {           
        UserInfo.find({}, (err, user) => {
            if(err){
                res.send(err);
            }
            res.json(user); 
        });
    }

    public authUser (req: Request, res: Response)
    {
        UserInfo.findOne({'email':req.params["email"]},
        (err, user) => {
            if(err || user == null)
            {
                return res.send(err);
            }

            bcrypt.compare(req.params["password"], user["password"], (err, isMatch) => {
                if (err || !isMatch) return res.send(err);
                res.json({_id: user['_id']});
            });
        });
    }

    public getUserData (req: Request, res: Response) 
    {
        let challenger = singleton.challengers[req.params['_id']];
        if(challenger === undefined)
        {
            challenger = {time: Date.now(), challenged: [], accepted: []};
            singleton.challengers[req.params['_id']] = challenger;
        }
        else
            challenger.time = Date.now();

        let inactiveKeys = []
        Object.keys(singleton.challengers).forEach((key) => {
            if (Date.now() - singleton.challengers[key].time > 20000) inactiveKeys.push(key);
        });
        inactiveKeys.forEach(key => {
            delete singleton.challengers[key]
            Object.keys(singleton.challengers).forEach((key) => {
                singleton.challengers[key].challenged
                    .splice(singleton.challengers[key].challenged.indexOf(key), 1)
            })
        });

        UserInfo.find().where('_id').in(Object.keys(singleton.challengers)).exec((err, users) => {
            if(err)
            {
                return res.send(err);
            }
            
            let challengerData = [];

            users.forEach(user => {
                challengerData.push({_id: user['_id'], name: user['name'],
                        wins: user['wins'], losses: user['losses'],
                        challenged: singleton.challengers[user['_id']].challenged.includes(req.params['_id']),
                        accepted: singleton.challengers[user['_id']].accepted
                });
            });
            res.json(challengerData);
        });
    }

    public updateChallenges (req: Request, res: Response) 
    {
        if(req.body['_accepted'])
        {
            if(!singleton.challengers[req.body['_id']].accepted.includes(req.params['_id']))
            singleton.challengers[req.body['_id']].accepted.push(req.params['_id']);
            res.send('Challenge accepted sent');
        }
        else 
        {
            if(!singleton.challengers[req.params['_id']].challenged.includes(req.body['_id']))
                singleton.challengers[req.params['_id']].challenged.push(req.body['_id']);
                res.send('Challenge sent');
        }
    }
/*
    public getContactWithID (req: Request, res: Response) {           
        ExerciseToken.findById(req.params.contactId, (err, contact) => {
            if(err){
                res.send(err);
            }
            res.json(contact);
        });
    }

    public updateContact (req: Request, res: Response) {           
        ExerciseToken.findOneAndUpdate({ _id: req.params.contactId }, req.body, { new: true }, (err, contact) => {
            if(err){
                res.send(err);
            }
            res.json(contact); 
        });
    }

    public deleteContact (req: Request, res: Response) {           
        ExerciseToken.remove({ _id: req.params.contactId }, (err, contact) => {
            if(err){
                res.send(err);
            }
            res.json({ message: 'Successfully deleted contact!'});
        });
    }
*/    
}