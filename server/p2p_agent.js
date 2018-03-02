'use strict'
/* eslint-disable no-console */
import { Meteor } from 'meteor/meteor';

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./libp2p-bundle.js')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const waterfall = require('async/waterfall')
const p = Pushable()

let p2p_status = []
//let listenerInfo = {}
//let nodes = {}
//let send_msg = {}
//let dial_peer = {}

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
    if (p2p_status[userId].send_msg === undefined)
      throw new Meteor.Error("need-dial-peer", "The p2p hasn't dialed the peer."); 
    p2p_status[userId].send_msg(msg)
  },

  FindPeer(peer_id){
    let userId = this.userId;
    const user = Meteor.user()
    if (user === null)
      throw new Meteor.Error("logged-out", "The user must be logged in to initialize the p2p messaging."); 
    if (p2p_status[userId] === undefined)
      p2p_status[userId]={}
    if (p2p_status[userId].node === undefined)
      throw new Meteor.Error("p2p-not-inited", "Please get the P2P ID first."); 
    //var syncCreateId = Meteor.wrapAsync(PeerId.createFromB58String)
    //const peerId = syncCreateId(peer_id)
    //const peerId = new PeerId(Buffer.from(peer_id))
    const peerId = PeerId.createFromB58String(peer_id)
    var syncFindPeer = Meteor.wrapAsync(p2p_status[userId].node.peerRouting.findPeer)
    const peer = syncFindPeer(peerId)
    let ma_str=""
    //p2p_status[userId].node.peerRouting.findPeer(peerId,(err,peer)=>{
    //  if (err)
    //    console.log(err)
    //  else {
        peer.multiaddrs.forEach((ma) => ma_str += ma.toString() + " ")
        console.log(ma_str)
    //  }
    //})
    return ma_str
  },

  DialPeer(listener_id){
    const user = Meteor.user()
    if (user === null)
      throw new Meteor.Error("logged-out", "The user must be logged in to initialize the p2p messaging."); 
    let userId = this.userId;
    if (p2p_status[userId] === undefined)
      p2p_status[userId]={}
    if (p2p_status[userId].node === undefined)
      throw new Meteor.Error("p2p-not-inited", "Please get the P2P ID first."); 
    if (p2p_status[userId].dial_peer === listener_id){
      if (p2p_status[userId].send_msg!==undefined)
        return "connected"
    }
    const peerId = PeerId.createFromB58String(listener_id) 
    var syncFindPeer = Meteor.wrapAsync(p2p_status[userId].node.peerRouting.findPeer)
    const peerInfo = syncFindPeer(peerId)
    //p2p_status[userId].node.dialProtocol(listener_peerId, 
    p2p_status[userId].node.dialProtocol(peerInfo, 
          '/chat/1.0.0', (err,conn) => {
      if (err) {
        console.log(err)
        throw err
      }
      console.log('nodeA dialed to nodeB on protocol: /chat/1.0.0')
      console.log('Type a message and see what happens')
      // Write operation. Data sent as a buffer
      pull(
        p,
        conn
      )
      // Sink, data converted from buffer to utf8 string
      pull(
        conn,
        pull.map((data) => {
          return data.toString('utf8').replace('\n', '')
        }),
        pull.drain(console.log)
      )

      p2p_status[userId].send_msg=(msg)=>{
        p.push(msg)
      }
      p2p_status[userId].dial_peer=listener_id
    })
    return "connecting"
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
/*
    //(user.peerIdJson, (err, peerId) => {
    //  if (err) {
    //    throw err
    //  }
      const peerListener = new PeerInfo(peerId)
      peerListener.multiaddrs.add('/ip4/0.0.0.0/tcp/0')

      const nodeListener = new Node(peerListener,
        null, //peerBook
        {dht:true,bootstrap:bootstrapers})

      p2p_status[userId].node = nodeListener
      nodeListener.start((err) => {
        if (err) {
          throw err
        }

        //nodeListener.swarm.on('peer-mux-established', (peerInfo) => {
        //  console.log(peerInfo.id.toB58String())
        //})

        nodeListener.handle('/chat/1.0.0', (protocol, conn) => {
          pull(
            p,
            conn
          )

          pull(
            conn,
            pull.map((data) => {
              const s = data.toString('utf8').replace('\n', '')
              console.log('received:'+s)
              return 'echo:'+s
            }),
            //pull.drain(console.log)
            conn
          )
        })

        console.log('Listener ready, listening on:')
        peerListener.multiaddrs.forEach((ma) => {
          console.log(ma.toString() + '/ipfs/' + peerId.toB58String())
        })
        p2p_status[userId].listenerInfo = peerListener;
      })
    //}))
    return user.peerIdJson.id
*/
    createNode(peerId, (err, node) => {
       p2p_status[userId].node = node;
    })
    return "Please try again"
  } //InitP2P
 
})

function createNode(peerId, callback){
let node
waterfall([
  (cb) => PeerInfo.create(peerId,cb),
  (peerInfo, cb) => {
    peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
    node = new Node(peerInfo,
      null, //peerBook
      {dht:true,bootstrap:bootstrapers})
    node.start(cb)
  }
], (err) => {
  if (err) { throw err }

  node.on('peer:discovery', (peer) => {
    //console.log('Discovered:', peer.id.toB58String())
    node.dial(peer, () => {})
  })

  node.on('peer:connect', (peer) => {
    console.log('Connection established to:', peer.id.toB58String())
  })
  callback(null,node)
})
}
