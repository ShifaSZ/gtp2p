import React from 'react'
import { Meteor } from 'meteor/meteor';

export class App extends React.Component {
  constructor() {
    super();
    this.state = {
      enter_msg:"",
      my_id:"",
      peer_id:"",
      dial_status:"no connection",
      messages:"",
      reminder:""};

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleGetId = this.handleGetId.bind(this);
    this.handleEnterPeer = this.handleEnterPeer.bind(this);
    this.handleEnterMsg = this.handleEnterMsg.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleDial = this.handleDial.bind(this);
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
    //Meteor.call("DialPeer",this.state.peer_id,(err,result) => {
    Meteor.call("FindPeer",this.state.peer_id,(err,result) => {
    //Meteor.call("TestP2P",this.state.peer_id,(err,result) => {
      if (err){
        const err_msg = "Error found:"+err
        this.setState({dial_status:err_msg})
        console.log(err_msg)
      }
      else {
        this.setState({dial_status:"Dial results: "+result})
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

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.enter_msg === "") {
      this.setState({reminder:"You enter nothing for sending"})
      return
    }
    const msg = this.state.messages + "me:" + this.state.enter_msg+"\n";
    this.setState({messages:msg,enter_msg:"",reminder:""});
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
