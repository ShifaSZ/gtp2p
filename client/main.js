import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React from 'react';
import { render } from 'react-dom';

import { App } from './app.jsx';

import './main.html';

Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
});

Session.set("P2P_ID","No ID yet");

Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
  this.p2p_id = Session.get("P2P_ID");
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
  p2p_id() {
    return Session.get("P2P_ID");
  }
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});
