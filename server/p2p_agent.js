'use strict'
/* eslint-disable no-console */
import { Meteor } from 'meteor/meteor';
import { Messages } from '/imports/startup/both/collections.js'

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./libp2p-bundle.js')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const waterfall = require('async/waterfall')
var abortCb = require('pull-stream/util/abort-cb')

let p2p_status = []
//let listenerInfo = {}
//let nodes = {}
//let send_msg = {}
//let dial_peer = {}

const pub = Meteor.publish('message.private', function() {
  if (!this.userId) {
    return this.ready();
  }

  return Lists.find({
    userId: this.userId
  }, {
    fields: Lists.publicFields
  });
});

// Find this list at: https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/config-nodejs.json
const bootstrapers = [
  '/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
  '/ip4/104.236.176.52/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z',
  '/ip4/104.236.179.241/tcp/4001/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM',
  '/ip4/162.243.248.213/tcp/4001/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm',
  '/ip4/128.199.219.111/tcp/4001/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu',
  '/ip4/104.236.76.40/tcp/4001/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64',
  '/ip4/178.62.158.247/tcp/4001/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd',
  '/ip4/178.62.61.185/tcp/4001/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3',
  '/ip4/104.236.151.122/tcp/4001/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx'
]

Meteor.methods({
  SendMessage(msg){
    let userId = this.userId;
    const user = Meteor.user()
    if (user === null)
      throw new Meteor.Error("logged-out", "The user must be logged in to initialize the p2p messaging."); 
    if (p2p_status[userId] === undefined)
      p2p_status[userId]={}
    if (!(p2p_status[userId].send_msg))
      throw new Meteor.Error("need-dial-peer", "The p2p hasn't dialed the peer."); 
    p2p_status[userId].send_msg(msg)
    //Messages.insert({text:msg})
  },

  DialPeer(peer_id){
    let userId = this.userId;

    const user = Meteor.user()
    if (user === null)
      throw new Meteor.Error("logged-out", "The user must be logged in to initialize the p2p messaging."); 

    if (p2p_status[userId] === undefined)
      p2p_status[userId]={}

    const p = Pushable(Meteor.bindEnvironment((err) => {
      p2p_status[userId].send_msg=null
      console.log('stream closed!')
    }))

    if (p2p_status[userId].node === undefined)
      throw new Meteor.Error("p2p-not-inited", "Please get the P2P ID first."); 

    const peerId = PeerId.createFromB58String(peer_id)
    var syncFindPeer = Meteor.wrapAsync(p2p_status[userId].node.peerRouting.findPeer)
    //const peerInfo = syncFindPeer(peerId)
    const peerInfo = p2p_status["YjrvEXNmseDwhQxZd"].node.peerInfo

    p2p_status[userId].node.dialProtocol(peerInfo,
        '/gtchat/1.0.0', Meteor.bindEnvironment((err, conn) => {
      if (err) { throw err }

      console.log('nodeA dialed to nodeB on protocol: /gtchat/1.0.0')

      pull(
        p,
        pull.map((data)=>{
          //console.log(data.toString())
          return data
        }),
        conn,
        pull.map(Meteor.bindEnvironment((data)=>{
          //console.log(data.toString())
          Messages.insert({text:data.toString()})
          return data
        })),
        pull.drain((data) => {
          if (data)
            console.log('received echo:', data.toString())
          else
            console.log('received echo:', data)
        })
      )
      p2p_status[userId].send_msg=(msg)=>{
        p.push(Buffer.from(msg))
        //p.end()
      }
    }))
    return "Connected"
  },

  InitP2P(){
    let userId = this.userId;
    const user = Meteor.user()
    if (user === null)
      throw new Meteor.Error("logged-out", "The user must be logged in to initialize the p2p messaging."); 
    if (user.peerIdJson === undefined) {
      PeerId.create(Meteor.bindEnvironment((err,id)=>{
        if (err)
          console.log(err)
        else {
          const idJson = id.toJSON()
          Meteor.users.update(userId, {
            $set: {
              peerIdJson: idJson
            }
          });
          console.log(id)
        }
      }))
      throw new Meteor.Error("no-p2p-account","There is no p2p account exist, a new account created, please try again.");
    }
    if (p2p_status[userId] === undefined)
      p2p_status[userId]={}
    if (p2p_status[userId].node !== undefined)
      return p2p_status[userId].node.peerInfo.id.toB58String()

    var syncCreateFromJson = Meteor.wrapAsync(PeerId.createFromJSON)
    const peerId = syncCreateFromJson(user.peerIdJson)
    createNode(peerId, (err, node) => {
       p2p_status[userId].node = node;
    })
    return "Please try again"
  } //InitP2P
 
})

function createNode(peerId, callback){
  let node
  const p = Pushable(function (err) {
    console.log('stream closed!')
  })
 waterfall([
  (cb) => PeerInfo.create(peerId,cb),
  (peerInfo, cb) => {
    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
    node = new Node(peerInfo,
      null, //peerBook
      {dht:true,bootstrap:bootstrapers})
    node.switch.on('peer-mux-established', (peerInfo) => {
      console.log('received dial to me from:', peerInfo.id.toB58String())
    })

    node.handle('/gtchat/1.0.0', (protocol, conn) => {
      pull(
        p,
        pull.map((data)=>{
          //console.log("Listener receive:",data.toString())
          return data
        }),
        conn,
        pull.map((data)=>{
          //console.log("Listener receive:",data.toString())
          p.push(data) //echo
          return data
        }),
        pull.drain((data) => {
          if (data)
            console.log('Listener received:', data.toString())
          else
            console.log('Listener received:',data)
        })
      )
    })
    node.start(cb)
  }
 ], (err) => {
  if (err) { throw err }

  node.on('peer:discovery', (peer) => {
    //console.log('Discovered:', peer.id.toB58String())
    node.dial(peer, () => {})
  })

  node.on('peer:connect', (peer) => {
    console.log('Connection established to:', 
      node.peerInfo.id.toB58String(), '->', peer.id.toB58String())
  })
  callback(null,node)
 })
}
