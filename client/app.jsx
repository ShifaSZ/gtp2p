import React from 'react'
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'
import { Messages } from '/imports/startup/both/collections.js'

//const msgHandle = Meteor.subscribe('message.private');
let myHandle = Meteor.subscribe('messages');
let ready_cb=null
Tracker.autorun(() => {
  const isReady = myHandle.ready();
  if (isReady && ready_cb !== null)
    ready_cb()
  console.log(`Handle is ${isReady ? 'ready' : 'not ready'}`);  
});

function set_ready_cb(cb) {
  ready_cb = cb;
}

function sendGetMsg(enter_msg){
    if (enter_msg !== null)
      Messages.insert({ text:enter_msg });
    // Return an array of my messages.
    if (!myHandle.ready())
      console.log("Subscribption is not ready.")
    const myMessages = Messages.find().fetch();
    let showMsg=""
    myMessages.map((msg)=> showMsg = showMsg+msg.text+'\n')
    return showMsg
  }

export class App extends React.Component {
  constructor() {
    super();
    this.state = {
      enter_msg:"",
      my_id:"",
      peer_id:"",
      dial_status:"no connection",
      messages:"",
      serverMsg:"",
      reminder:""};

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleGetId = this.handleGetId.bind(this);
    this.handleEnterPeer = this.handleEnterPeer.bind(this);
    this.handleEnterMsg = this.handleEnterMsg.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleDial = this.handleDial.bind(this);
    this.handleEnterSvrMsg = this.handleEnterSvrMsg.bind(this);
    this.handleSendSvrMsg = this.handleSendSvrMsg.bind(this);
  }

  updateMessage=()=>{
    const msg = sendGetMsg(null)
    this.setState({messages:msg})
  }

  componentDidMount(){
    set_ready_cb(this.updateMessage)
  }

  handleGetId(event) {
    Meteor.call("InitP2P", (err, result) => {
      if (err)
        console.log("Error found:"+err)
      else {
        console.log("Results:"+result)
        this.setState({my_id:result});
      }
    });
  }

  handleEnterPeer(event) {
    const peer_id = event.target.value;
    this.setState({peer_id:peer_id});
  }

  handleDial(event) {
    Meteor.call("DialPeer",this.state.peer_id,(err,result) => {
    //Meteor.call("FindPeer",this.state.peer_id,(err,result) => {
    //Meteor.call("TestP2P",this.state.peer_id,(err,result) => {
      if (err){
        const err_msg = "Error found:"+err
        this.setState({dial_status:err_msg})
        console.log(err_msg)
      }
      else {
        this.setState({dial_status:result})
      }
    });
  }

  handleMessageChange(event) {
    const msg = this.state.messages;
    this.setState({messages:msg});
  }

  handleEnterMsg(event) {
    const msg = event.target.value;
    this.setState({enter_msg:msg});
  }

  handleEnterSvrMsg(event) {
    const msg = event.target.value;
    this.setState({serverMsg:msg});
  }

  handleSendSvrMsg(event) {
    //Meteor.call("DialPeer",this.state.peer_id,(err,result) => {
    //Meteor.call("FindPeer",this.state.peer_id,(err,result) => {
    //Meteor.call("TestP2P",this.state.peer_id,(err,result) => {
    Meteor.call("SendMessage",this.state.serverMsg,(err,result) => {
      if (err){
        const err_msg = "Error found:"+err
        console.log(err_msg)
      }
      else {
        console.log("Call SendMessage Success.")
      }
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.enter_msg === "") {
      this.setState({reminder:"You enter nothing for sending"})
      return
    }
    //const showMsg = sendGetMsg(this.state.enter_msg)
    Meteor.call("SendMessage",this.state.enter_msg,(err,result) => {
      if (err){
        const err_msg = "Error found:"+err
        console.log(err_msg)
      }
    });
    this.setState({
      //messages:showMsg,
      enter_msg:"",
      reminder:""});
  }

  render() {
    return (
      <div>
        <button onClick={this.handleGetId}>
          Get My Id
        </button>
        <label>My ID:{" "+this.state.my_id}</label>
        <br />
        <label>Peer Id to chat with:</label>
        <input type="text" value={this.state.peer_id}
           onChange={this.handleEnterPeer} />
        <button onClick={this.handleDial}> Dial </button>
        <label>{this.state.dial_status}</label>
        <form onSubmit={this.handleSubmit}>
          <textarea rows="20" cols="50" value={this.state.messages} 
             onChange={this.handleMessageChange} />
          <br />
          <input type="text" value={this.state.enter_msg}
             onChange={this.handleEnterMsg} />
          <input type="submit" value="send" />
          <label>{this.state.reminder}</label>
        </form>
      </div>
    )
  }
}
/*
        <br />
        <label>Message from server:</label>
        <input type="text" value={this.serverMsg}
           onChange={this.handleEnterSvrMsg} />
        <button onClick={this.handleSendSvrMsg}> Send Svr </button>
*/
