'use strict'

const IpfsClient = require('ipfs-http-client')
const { StreamID } = require('@ceramicnetwork/streamid')
const PeerID = require('peer-id')
const multihashes = require('multihashes')
const CID = require('cids')
// const { EventTypes } = require('ipfs-core-types')  // TODO: why does this fail?
//const KadDht = require('libp2p-kad-dht')

const createLibp2p = require('./libp2p-node')


const IPFS_ENDPOINT = 'http://localhost:5001'
const STREAM_ID = StreamID.fromString('kjzl6cwe1jw148j1183ue1j9l5fbt3fbfru08e54387qo91t4tusnsecp5db2ws')

async function main() {
    const ipfs = await IpfsClient.create({ url: IPFS_ENDPOINT })

    console.log(`connected to go-ipfs node with PeerID: ${(await ipfs.id()).id}`)

    const libp2p = await createLibp2p()

    console.log(`libp2p node running with PeerID: ${libp2p.peerId.toString()}`)

    // Encode StreamID
    console.log(`streamid: ${STREAM_ID.toString()}`)
    const streamidMultihash = multihashes.encode(STREAM_ID.bytes, 'sha2-256')
    console.log(`streamid sha256 multihash: ${streamidMultihash}`)
    const streamidAsCid = new CID(streamidMultihash)
    console.log(`streamid sha256 as CID ${streamidAsCid.toString()}`)

    // TODO make this work
    // const initialProviders = await findProviders(ipfs, streamidMultihash)
    // console.log(`Initial providers: `)
    // console.log(initialProviders)

    const closestPeers = await findClosestPeers(ipfs, streamidMultihash)

    console.log(`Closest peers: `)
    console.log(closestPeers)

    const multiaddrs = await peeridsToMultiaddrs(ipfs, closestPeers)

    console.log(`Closest peers with multiaddrs: `)
    console.log(multiaddrs)

    for (const multiaddr of multiaddrs) {
        await provideToPeer(libp2p, multiaddr)
    }
}

async function peeridsToMultiaddrs(ipfs, peerids) {
    const multiaddrs = []
    for (const peerid of peerids) {
        const multiaddr = await findMultiaddr(ipfs, peerid)
        multiaddrs.push(multiaddr)
    }
    return multiaddrs
}

async function findMultiaddr(ipfs, peerid) {
    console.log(`looking up multiaddr for peerid ${peerid}`)
    const events = await ipfs.dht.findPeer(peerid)
    for await (const event of events) {
        console.log(JSON.stringify(event, null, 2))
        if (event.type != 2) {
            continue
        }
        //console.log(JSON.stringify(event.peer, null, 2))
        return event.peer
    }

    return null
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
        //console.log(JSON.stringify(peer, null, 2))
        peers.push(peer.peer.id)
    }
    peers.sort()
    return peers
}

async function provideToPeer(libp2p, multiaddr) {
    console.log(`attempting to emplace our peerid (${libp2p.peerId.toString()}) as a stream provider on peer ${multiaddr.id}`)
    // //const network = new Network({dialer: libp2p, protocol: '/ipfs/lan/kad/1.0.0'}) // todo drop lan?
    // const dht = KadDht.create({libp2p})
    // await dht.start()
    // const network = dht._wan._network
    // await dht.stop()

}


async function findProviders(ipfs, streamidMultihash) {
    const streamAsCID = new CID(streamidMultihash)
    console.log(`StreamID as CID: ${streamAsCID.toString()}`)

    const providers = []

    const providersGenerator = await ipfs.dht.findProvs(streamAsCID.toString())

    for await (const provider of providersGenerator) {
        providers.push(provider)
    }
    providers.sort()
    return providers
}

main()
