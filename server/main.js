import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Messages } from '/imports/startup/both/collections.js'

//const PeerInfo = require('peer-info')
const PeerId = require('peer-id')

Meteor.startup(() => {
  // code to run on server at startup
  Meteor.users.allow({ update: () => true });
  var acc = Accounts.findUserByEmail('gtt@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'gtt@genetank.ai',
    password: 'gtai1234',
    });
  //if (Meteor.users.find().count() === 0) {
  var acc = Accounts.findUserByEmail('shifa@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'shifa@genetank.ai',
    password: 'gtai1234',
    });
  var acc = Accounts.findUserByEmail('lauren@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'lauren@genetank.ai',
    password: 'gtai1234',
    });
  var acc = Accounts.findUserByEmail('anne@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'anne@genetank.ai',
    password: 'gtai1234',
    });
  var acc = Accounts.findUserByEmail('sandeep@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'sandeep@genetank.ai',
    password: 'gtai1234',
    });
  var acc = Accounts.findUserByEmail('dianbo@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'dianbo@genetank.ai',
    password: 'gtai1234',
    });
  var acc = Accounts.findUserByEmail('larry@genetank.ai')
  if (acc === undefined)
    Accounts.createUser({
    email: 'larry@genetank.ai',
    password: 'gtai1234',
    });
});

Meteor.methods({
  GetId() {
    const userId = this.userId;
    const acc = Accounts.findUserByEmail('gtt@genetank.ai')
    console.log(acc);
    const user = Meteor.user()
    console.log(user);
    if (user.peerId === undefined) {
      PeerId.create(Meteor.bindEnvironment((err,id)=>{
        if (err)
          console.log(err)
        else {
          const idJson = id.toJSON()
          Meteor.users.update(userId, {
            $set: {
              peerId: idJson
            }
          });
          console.log(id)
        }
      }))
    }
    return user.peerId
  }
})

