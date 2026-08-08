import { ChildProcess } from 'node:child_process';
import { Socket as DgramSocket } from 'node:dgram';
import { ClientRequest, IncomingMessage, OutgoingMessage, ServerResponse } from 'node:http';
import { BlockList, Server, Socket, SocketAddress } from 'node:net';

// Optional server/IO subtypes group for http, net, dgram, and child_process
// Note: Capability flags (async, each, etc) derive from their stream/emitter prototypes
export const io = [
    {
        // child_process: extends EventEmitter
        n: 'ChildProcess',
        c: ChildProcess,
        x: [1, 0, 2]
    },
    {
        // net: extends Duplex
        // Note: Also base class for IPC sockets, TLSSocket, stdin/stdout
        n: 'Socket',
        c: Socket,
        x: [1, 1, 2]
    },
    {
        // dgram: UDP socket, extends EventEmitter
        // Note: Class name is 'Socket' (same as net), registered as UDPSocket
        // Note: No-arg construction throws (requires a type), so create=0
        n: 'UDPSocket',
        c: DgramSocket,
        x: [1, 0, 0]
    },
    {
        // net: extends EventEmitter (base for http.Server)
        // Note: http.Server extends net.Server (this resolves both)
        n: 'Server',
        c: Server,
        x: [1, 1, 2]
    },
    {
        // http: extends Readable
        n: 'IncomingMessage',
        c: IncomingMessage,
        x: [1, 0, 2]
    },
    {
        // http: extends Stream (base for ServerResponse and ClientRequest)
        n: 'OutgoingMessage',
        c: OutgoingMessage,
        x: [1, 0, 2]
    },
    {
        // http: extends OutgoingMessage
        // Note: No-arg construction throws (requires a request), so create=0
        n: 'ServerResponse',
        c: ServerResponse,
        x: [1, 0, 0]
    },
    {
        // http: extends OutgoingMessage
        // Note: Constructing initiates a request, so create=0 to keep of() safe
        n: 'ClientRequest',
        c: ClientRequest,
        x: [1, 0, 0]
    },
    {
        // net: IP/port endpoint value type
        n: 'SocketAddress',
        c: SocketAddress,
        x: [1, 0, 2]
    },
    {
        // net: IP address rule container
        n: 'BlockList',
        c: BlockList,
        x: [1, 0, 2]
    }
];

export default io;
