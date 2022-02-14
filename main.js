'use strict'

const IpfsClient = require('ipfs-http-client')
const { StreamID } = require('@ceramicnetwork/streamid')
const PeerID = require('peer-id')
const multihashes = require('multihashes')
const CID = require('cids')
const { multiaddr } = require('multiaddr')
// const { EventTypes } = require('ipfs-core-types')  // TODO: why does this fail?
//const KadDht = require('libp2p-kad-dht')
const Message = require('libp2p-kad-dht/src/message')
const {pipe} = require('it-pipe')
const drain = require('it-drain')
const lb = require('it-length-prefixed')

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
    console.log(closestPeers.map((peerid) => peerid.toB58String()))

    for (const peerid of closestPeers) {
        await findMultiaddrAndAddToPeerStore(ipfs, libp2p, peerid)
    }

    for (const peerid of closestPeers) {
        await provideToPeer(libp2p, streamidAsCid, peerid)
    }
}

async function findMultiaddrAndAddToPeerStore(ipfs, libp2p, peerid) {
    console.log(`looking up multiaddr for peerid ${peerid}`)
    const events = await ipfs.dht.findPeer(peerid)
    for await (const event of events) {
        //console.log(JSON.stringify(event, null, 2))
        if (event.type != 2) {
            continue
        }
        console.log(`Adding multiaddrs for peer ${event.peer.id} to peer store.  Multiaddrs: ${JSON.stringify(event.peer.multiaddrs, null, 2)}`)
//        console.log(JSON.stringify(event.peer, null, 2))



        await libp2p.peerStore.addressBook.add(peerid, event.peer.multiaddrs)


    }

    return null
}

async function findClosestPeers(ipfs, streamidMultihash) {
    const streamAsPeerID = new PeerID(streamidMultihash)
    console.log(`StreamID as PeerID: ${streamAsPeerID.toB58String()}`)

    const closestPeers = await ipfs.dht.query(streamAsPeerID)
    const peers = []
    for await (const peer of closestPeers) {
        //console.log(JSON.stringify(peer, null, 2))
        // if (peer.type != EventTypes.PEER_RESPONSE && peer.type != EventTypes.FINAL_PEER) {// todo broken import
        if (peer.type != 2) {
            continue
        }
        console.log(JSON.stringify(peer, null, 2))
        peers.push(PeerID.createFromB58String(peer.peer.id))
    }
    peers.sort()
    return peers
}

async function provideToPeer(libp2p, keyCID, peerid) {
    console.log(`attempting to emplace our peerid (${libp2p.peerId.toB58String()}) as a stream provider on peer ${peerid.toB58String()}`)

    const msg = new Message(Message.TYPES.ADD_PROVIDER, keyCID.bytes, 0)
    msg.providerPeers = [{id: libp2p.peerId, multiaddrs: libp2p.multiaddrs}]

    const { stream } = await libp2p.dialProtocol(peerid, '/ipfs/kad/1.0.0')

    await pipe([msg], lp.encode(), stream, drain)
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
