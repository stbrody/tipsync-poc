'use strict'

const IpfsClient = require('ipfs-http-client')
const { StreamID } = require('@ceramicnetwork/streamid')
const PeerID = require('peer-id')
const multihashes = require('multihashes')
// const { EventTypes } = require('ipfs-core-types')  // TODO: why does this fail?

const createLibp2p = require('./libp2p-node')


const IPFS_ENDPOINT = 'http://localhost:5001'
const STREAM_ID = StreamID.fromString('kjzl6cwe1jw148j1183ue1j9l5fbt3fbfru08e54387qo91t4tusnsecp5db2ws')

async function main() {
    const ipfs = await IpfsClient.create({ url: IPFS_ENDPOINT })

    console.log(`connected to go-ipfs node with PeerID: ${(await ipfs.id()).id}`)

    const libp2p = await createLibp2p()

    console.log(`libp2p node running with PeerID: ${libp2p.peerId.toString()}`)

    console.log(`streamid: ${STREAM_ID.toString()}`)

    // Encode StreamID as PeerID
    const peerid = new PeerID(multihashes.encode(STREAM_ID.bytes, 'sha2-256'))
    console.log(`StreamID as PeerID: ${peerid.toString()}`)

    const closestPeers = await ipfs.dht.query(peerid)
    const peers = []
    for await (const peer of closestPeers) {
        // if (peer.type != EventTypes.PEER_RESPONSE && peer.type != EventTypes.FINAL_PEER) {// todo broken import
        if (peer.type != 2) {
            continue
        }
        peers.push(peer.peer.id)
    }
    peers.sort()
    console.log(`Closest peers: `)
    console.log(peers)
}

main()
