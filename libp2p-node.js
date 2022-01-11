'use strict'

const TCP = require('libp2p-tcp')
const mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const defaultsDeep = require('@nodeutils/defaults-deep')
const libp2p = require('../../..')

async function createLibp2p(_options) {
    const defaults = {
        modules: {
            transport: [TCP],
            streamMuxer: [mplex],
            connEncryption: [NOISE],
        },
    }

    return libp2p.create(defaultsDeep(_options, defaults))
}

module.exports = createLibp2p
