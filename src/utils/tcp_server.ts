import {EventEmitter} from "https://deno.land/x/event@2.0.1/mod.ts";
import { new_logger } from "./logger.ts";


type Client = string;

type Events = {
    connect     : [Client],
    disconnect  : [Client],
    message     : [Client, string]
}

type ServerOptions = {
    buffer_length?       : number
    message_length?      : number
    port?                : number
    carriage_return?     : number
    decoding?            : string
    log_level?           : LevelName
    name?                : string
}

class _ServerOptions {
    buffer_length       = 4
    message_length      = 1024 * 1024
    port                = 8567
    carriage_return     = 0
    decoding            = "utf-8"
    log_level:LevelName          = "INFO"
    name                 = "TCP_Server"
}


export class TCPServer extends EventEmitter<Events> {
    clients : Map<Client, Deno.Conn> 
    server : Deno.Listener
    options : _ServerOptions
    decoder : TextDecoder
    logger : Logger
    constructor(options:ServerOptions) {
        super()
        this.options = Object.assign(new _ServerOptions(),  options);
        this.decoder = new TextDecoder( this.options.decoding );
        this.clients = new Map<Client, Deno.Conn> ;

        this.logger = new_logger(this.options.log_level, this.options.name);
        
        this.logger.info(`Starting Server. Listening on port ${this.options.port}` )

        this.server = Deno.listen( { port: this.options.port} )
        this.listen_for_connections()
    }

    async listen_for_connections() {
        for await (const new_connection of this.server) {
            const new_client:Client = `${new_connection.localAddr.hostname}:${new_connection.localAddr.port}`;

            this.logger.info(`New Client : ${new_client}`)

            this.clients.set(   new_client,  
                                    new_connection);
            this.emit("connect", new_client )
            this.listen_for_messages( new_client )
        }
    }

    async listen_for_messages(client:Client) {
        const buffer                = new Uint8Array(this.options.buffer_length)
        const client_object   = this.clients.get( client )!;
        const message: number[] = [];
        while (true) {
            const count = await client_object.read( buffer );
            this.logger.debug(`Incomgin Raw Data: ${buffer}`);

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
    handle_disconnect( client:Client) {
        this.logger.info(`Client Disconnect : ${client}`);
        this.clients.delete( client );
        this.emit("disconnect", client);
    }
    handle_message(client:Client, message:Uint8Array) {
       
        const decoded_message = this.decoder.decode(message);
        this.logger.debug(`Incoming Message from ${client} :\n ${message}`);
        this.emit("message", decoded_message, client);
    }

}

