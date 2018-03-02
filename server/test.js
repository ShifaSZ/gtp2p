'use strict'
import { Meteor } from 'meteor/meteor';


const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const KadDHT = require('libp2p-kad-dht')

const waterfall = require('async/waterfall')
const parallel = require('async/parallel')

class MyBundle extends libp2p {
  constructor (peerInfo) {
    const modules = {
      transport: [new TCP()],
      connection: {
        muxer: [Mplex],
        crypto: [SECIO]
      },
      // we add the DHT module that will enable Peer and Content Routing
      DHT: KadDHT
    }
    super(modules, peerInfo)
  }
}

function createNode (callback) {
  let node

  waterfall([
    (cb) => PeerInfo.create(cb),
    (peerInfo, cb) => {
      peerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/0')
      node = new MyBundle(peerInfo)
      node.start(cb)
    }
  ], (err) => callback(err, node))
}

Meteor.methods({
TestP2P(peer_id){
parallel([
  (cb) => createNode(cb),
  (cb) => createNode(cb),
  (cb) => createNode(cb),
  (cb) => createNode(cb)
], (err, nodes) => {
  if (err) { throw err }

  const node1 = nodes[0]
  const node2 = nodes[1]
  const node3 = nodes[2]
  const node4 = nodes[3]

  parallel([
    (cb) => node1.dial(node2.peerInfo, cb),
    //(cb) => node2.dial(node3.peerInfo, cb),
    (cb) => node3.dial(node4.peerInfo, cb),
    // Set up of the cons might take time
    (cb) => setTimeout(cb, 300)
  ], (err) => {
    if (err) { throw err }

    node1.peerRouting.findPeer(node4.peerInfo.id, (err, peer) => {
      if (err) { 
        //throw err
        console.log(err)
      } else {

        console.log('Found it, multiaddrs are:')
        peer.multiaddrs.forEach((ma) => console.log(ma.toString()))
      }
    })
  })
})
}})

