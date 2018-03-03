import { Mongo } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'

// Common code on client and server declares a DDP-managed Mongo collection.
export const Chatrooms = new Mongo.Collection('chatrooms');
export const Messages = new Mongo.Collection('messages');
if (Meteor.isServer)
  Meteor.publish('messages', function() {
    return Messages.find()
  })

