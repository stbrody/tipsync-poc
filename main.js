'use strict'

const IpfsClient = require('ipfs-http-client')
const { StreamID } = require('@ceramicnetwork/streamid')
const PeerID = require('peer-id')
const multihashes = require('multihashes')
const CID = require('cids')
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
    const streamidMultihash = multihashes.encode(STREAM_ID.bytes, 'sha2-256')

    // TODO make this work
    // const initialProviders = await findProviders(ipfs, streamidMultihash)
    // console.log(`Initial providers: `)
    // console.log(initialProviders)

    const closestPeers = await findClosestPeers(ipfs, streamidMultihash)

    console.log(`Closest peers: `)
    console.log(closestPeers)

    for (const peerid of closestPeers) {
        console.log(`attempting to emplace our peerid (${libp2p.peerId.toString()}) as a stream provider on peer ${peerid}`)
        await provideToPeer(libp2p, peerid)
    }
}

async function findClosestPeers(ipfs, streamidMultihash) {
    const streamAsPeerID = new PeerID(streamidMultihash)
    console.log(`StreamID as PeerID: ${streamAsPeerID.toString()}`)

    const closestPeers = await ipfs.dht.query(streamAsPeerID)
    const peers = []
    for await (const peer of closestPeers) {
        //console.log(JSON.stringify(peer, null, 2))
        // if (peer.type != EventTypes.PEER_RESPONSE && peer.type != EventTypes.FINAL_PEER) {// todo broken import
        if (peer.type != 2) {
            continue
        }
        peers.push(peer.peer.id)
    }
    peers.sort()
    return peers
}

async function provideToPeer(libp2p, peerid) {

}


async function findProviders(ipfs, streamidMultihash) {
    const streamAsCID = new CID(streamidMultihash)
    console.log(`StreamID as CID: ${streamAsCID.toString()}`)

    const providers = []

    const providersGenerator = await ipfs.dht.findProvs(streamAsCID)

    for await (const provider of providersGenerator) {
        providers.push(provider)
    }
    providers.sort()
    return providers
}

main()
