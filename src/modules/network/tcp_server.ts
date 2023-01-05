import {EventEmitter} from "https://deno.land/x/event@2.0.1/mod.ts";
import {Logger, LogLevels} from "@modules/logging/logger.ts"

export {LogLevels}


interface ClientData{
    server : TCPServer
    connection : Deno.Conn
}

export class TCP_Client implements ClientData{
    server!     : TCPServer
    connection! : Deno.Conn;
    readonly name: string

    constructor( data:ClientData) {
        this.name = `${data.connection.localAddr.hostname}:${data.connection.localAddr.port}`;
        Object.assign( this, data);
    }
    sendString( data:string) {
        this.sendBytes(this.server.encoder.encode( data) );
    }
    sendBytes(data:Uint8Array) {
        this.connection.write( data );
        this.connection.write( this.server.carriageReturn )
    }
    close() {
        this.connection.close()
    }

}

type Events = {
    connect     : [TCP_Client],
    disconnect  : [TCP_Client],
    message     : [string, TCP_Client]
}

interface ServerOptions  {
    buffer_length?       : number
    message_length?      : number
    port?                : number
    carriage_return?     : number
    decoding?            : string
    name?                : string
}

class _ServerOptions implements ServerOptions {
    buffer_length       = 4
    message_length      = 1024 * 1024
    port                = 8567
    carriage_return     = 0
    decoding            = "utf-8"
    name                 = "TCP_Server"
}


export class TCPServer extends EventEmitter<Events> {
    options : _ServerOptions

    clients : Map<string, TCP_Client> 
    server : Deno.Listener
    
    carriageReturn : Uint8Array
    decoder : TextDecoder
    encoder : TextEncoder
    logger : Logger

    constructor(options:ServerOptions) {
        super()
        this.options = Object.assign(new _ServerOptions(),  options);
        this.decoder = new TextDecoder( this.options.decoding );
        this.encoder = new TextEncoder();

        this.carriageReturn = new Uint8Array([this.options.carriage_return])

        this.clients = new Map<string, TCP_Client> ;

        this.logger = new Logger({
            name : this.options.name,
            level: LogLevels.DEBUG
        })
        
        this.logger.INFO(`Starting Server. Listening on port ${this.options.port}` )

        this.server = Deno.listen( { port: this.options.port} )
        this.listen_for_connections()
    }

    async listen_for_connections() {
        for await (const new_connection of this.server) {
            const new_client:TCP_Client = new TCP_Client({
                server : this, connection : new_connection 
            });

            this.logger.INFO(`New Client : ${new_client.name}`)

            this.clients.set(   new_client.name,  
                                    new_client);
            this.emit("connect", new_client )
            this.listen_for_messages( new_client )
        }
    }

    async listen_for_messages(client:TCP_Client) {
        const buffer                = new Uint8Array(this.options.buffer_length)
        
        const message: number[] = [];
        while (true) {
            const count = await client.connection.read( buffer );
            this.logger.TRACE(`Incomgin Raw Data: ${buffer}`);

            if (!count) { this.handle_disconnect(client); return; }

            for (const element of buffer) {
                if ( element == this.options.carriage_return ) {
                    message.length && this.handle_message( client, new Uint8Array(message));
                    message.length = 0;
                    continue
                }
                message.push( element );
            }
        buffer.fill(0);
        }
    }
    handle_disconnect( client:TCP_Client) {
        this.logger.INFO(`Client Disconnect : ${client.name}`);
        this.clients.delete( client.name );
        this.emit("disconnect", client);
    }
    handle_message(client:TCP_Client, message:Uint8Array) {
        const decoded_message = this.decoder.decode(message);
        this.logger.DEBUG(`Incoming Message from ${client.name} :\n ${decoded_message}`);
        this.emit("message", decoded_message, client);
    }

}

