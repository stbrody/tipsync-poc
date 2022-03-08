'use strict'

const TCP = require('libp2p-tcp')
const mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const defaultsDeep = require('@nodeutils/defaults-deep')
const libp2p = require('libp2p')
const KadDHT = require('libp2p-kad-dht')
const Bootstrap = require('libp2p-bootstrap')
const Websockets = require('libp2p-websockets')
const filters = require('libp2p-websockets/src/filters')
const WebrtcStar = require('libp2p-webrtc-star')

const transportKey = Websockets.prototype[Symbol.toStringTag]

async function createLibp2p(_options) {
    const defaults = {
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        modules: {
            transport: [TCP, Websockets, WebrtcStar],
            streamMuxer: [mplex],
            connEncryption: [NOISE],
            dht: KadDHT, // todo: undo?
            peerDiscovery: [Bootstrap],
        },
        config: {
            dht: {
                enabled: true,
                randomWalk: {
                    enabled: true
                }
            },
            peerDiscovery: {
                bootstrap: {
                    list: ['/ip4/127.0.0.1/tcp/63786/ws/p2p/QmWjz6xb8v9K4KnYEwP5Yk75k5mMBCehzWFLCvvQpYxF3d']
                }
            },
            transport: {
                [transportKey]: {
                    // by default websockets do not allow localhost dials
                    // let's enable it for testing purposes in this example
                    filter: filters.all
                }
            }
        }
    }

    return libp2p.create(defaultsDeep(_options, defaults))
}

module.exports = createLibp2p
