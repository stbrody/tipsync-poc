'use strict'

const IpfsClient = require('ipfs-http-client')



const IPFS_ENDPOINT = 'http://localhost:5001'
const IPFS_GET_TIMEOUT = 30000

async function main() {
    const ipfs = await IpfsClient.create({ url: IPFS_ENDPOINT, timeout: IPFS_GET_TIMEOUT })

    const cid = await ipfs.dag.put({'hello': 'world'})

    console.log(`cid: ${cid.toString()}`)

    const obj = (await ipfs.dag.get(cid)).value

    console.log(`hello: ${obj['hello']}`)
}

main()
