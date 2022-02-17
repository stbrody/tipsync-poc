'use strict'

const TCP = require('libp2p-tcp')
const mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const defaultsDeep = require('@nodeutils/defaults-deep')
const libp2p = require('libp2p')
const KadDHT = require('libp2p-kad-dht')

async function createLibp2p(_options) {
    const defaults = {
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        },
        modules: {
            transport: [TCP],
            streamMuxer: [mplex],
            connEncryption: [NOISE],
            dht: KadDHT, // todo: undo?
        },
        config: {
            dht: {
                enabled: true,
            }
        }
    }

    return libp2p.create(defaultsDeep(_options, defaults))
}

module.exports = createLibp2p
