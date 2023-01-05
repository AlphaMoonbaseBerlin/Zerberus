
import { JSONObject, JSONArray } from "@modules/utils/json_types.ts";
import { z } from "https://deno.land/x/zod/mod.ts";
import { JsonSchema } from "./utils/zod_schema.ts";
import { Logger } from "../logging/logger.ts";
import {EventEmitter} from "https://deno.land/x/event@2.0.1/mod.ts";
import { TCPServer, TCP_Client } from "./tcp_server.ts";


const Zod = z;


const RequestParser = Zod.object({
    jsonrcp : Zod.string().default("2.0"),
    method  : Zod.string(),
    params  : JsonSchema.default([]),
    id      : Zod.union([Zod.number(), Zod.string()]).optional() 
})
type RCP_Request =  z.infer<typeof RequestParser>

const ResponseParser = Zod.object({
    jsonrcp : Zod.string().default("2.0"),
    result  : JsonSchema.default([]),
    id      : Zod.union([Zod.number(), Zod.string()])
})
type RCP_Response =  z.infer<typeof ResponseParser>

const ErrorParser = Zod.object({
    jsonrcp : Zod.string().default("2.0"),
    error   : JsonSchema.default([]),
    id      : Zod.union([Zod.number(), Zod.string()])
})
type RCP_Error =  z.infer<typeof ErrorParser>

type RCP_Message = RCP_Error|RCP_Request|RCP_Response


class RCP_Client {
    tcp_client : TCP_Client
    constructor( tcp_client:TCP_Client ) {
        this.tcp_client = tcp_client;
    }
    sendRequest( data:RCP_Request) {
        const request_object = RequestParser.parse( data );
        this.send( request_object );
    }

    send( data:RCP_Message) {
        this.tcp_client.sendString( 
            JSON.stringify( data )
    )}

}

class RequestHandler {
    request : RCP_Request
    private client : RCP_Client
    private constructor( data:RCP_Request, rcp_client:RCP_Client) {
        this.client = rcp_client
        this.request = RequestParser.parse( data );
    }

    static From_Object( data:RCP_Request, client:RCP_Client) {
        return new RequestHandler( data, client );
    }
    static From_Json( data:string, client:RCP_Client) {
        return RequestHandler.From_Object( JSON.parse( data ), client )
    }
    private send( data: RCP_Message) {
        this.client.send( data! );
    }
    respond( data:JSONObject|JSONArray) {
        if (!this.request.id) { throw "Not a RCP Request" }
        this.send( {   jsonrcp : this.request.jsonrcp,
            result : data,
            id : this.request.id } )
    }
    error( reason:JSONObject|JSONArray) {
        if (!this.request.id) { throw "Not a RCP Request" }
        this.send( {   jsonrcp : this.request.jsonrcp,
            error : reason,
            id : this.request.id } )
    }
}






type events = {
    request : [RequestHandler],
    connect : [RCP_Client],
    disconnect : [RCP_Client]
}

export interface Options {
    port? : number
    name? : string
}

class _Options implements Options {
    port = 8056
    name = "JSON_RCP"
}



export class RcpServer extends EventEmitter<events> {
    options : Options
    tcpserver : TCPServer
    logger : Logger
    clients : Map<string, RCP_Client>
    constructor( options:Options ) {
        super()
        this.options = Object.assign( new _Options, options)
        this.logger = new Logger({
            name : this.options.name
        })
        this.clients = new Map<string, RCP_Client>;

        this.tcpserver = new TCPServer({
            port: this.options.port,
            name : `TCP ${this.options.name}`
        })
        
        this.tcpserver.on("message", (message, client) => { this.handle_request(message, client); } );
        this.tcpserver.on("connect", (client) => this.handle_connect( client ))
        this.tcpserver.on("disconnect", (client) => this.handle_disconnect( client ))
        
    }
    handle_connect( tcp_client:TCP_Client) {
        const new_rcp_client = new RCP_Client( tcp_client );
        this.clients.set( tcp_client.name, new_rcp_client)
        this.emit("connect", new_rcp_client)
    }

    handle_disconnect( tcp_client:TCP_Client) {
        this.emit("connect", this.clients.get(tcp_client.name)!)
        this.clients.delete( tcp_client.name );        
    }

    handle_request( message:string, client:TCP_Client) {
        try{
            const rcp_client = this.clients.get(client.name);
            const handler = RequestHandler.From_Json( message, rcp_client! );
            this.logger.DEBUG( "Received Request", String(handler.request));
            this.emit("request", handler)
        } catch (error:unknown) {
            this.logger.ERROR( "Invalid RCP_Request.", String(error));
            if (error instanceof SyntaxError) { return; }
            //Otherwise lets try to get at least some information out of this!
        }
        

    }
}