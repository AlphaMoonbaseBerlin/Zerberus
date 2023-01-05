
import { JSONObject, JSONArray } from "@modules/utils/json_types.ts";
import { z } from "https://deno.land/x/zod/mod.ts";
import { JsonSchema } from "./utils/zod_schema.ts";
import { Logger } from "../logging/logger.ts";
import {EventEmitter} from "https://deno.land/x/event@2.0.1/mod.ts";
import { TCPServer, Client } from "./tcp_server.ts";


const Zod = z;


const RequestParser = Zod.object({
    jsonrcp : Zod.string().default("2.0"),
    method  : Zod.string(),
    params  : JsonSchema.default([]),
    id      : Zod.union([Zod.number(), Zod.string()]).optional() 
})
type Request =  z.infer<typeof RequestParser>

class RequestHandler {
    request : Request
    private client : Client
    private constructor( data:Request, tcp_client:Client) {
        this.client = tcp_client
        this.request = RequestParser.parse( data );
    }

    static From_Object( data:Request, tcp_client:Client) {
        return new RequestHandler( data, tcp_client );
    }
    static From_Json( data:string, tcp_client:Client) {
        return RequestHandler.From_Object( JSON.parse( data ), tcp_client )
    }

    respond( data:JSONObject|JSONArray) {
        if (!this.request.id) { throw "Not a RCP Request" }
        this.client.sendString( JSON.stringify({
            jsonrcp : this.request.jsonrcp,
            result : data,
            id : this.request.id
        }))
    }
    error( reason:JSONObject|JSONArray) {
        if (!this.request.id) { throw "Not a RCP Request" }
        this.client.sendString( JSON.stringify({
            jsonrcp : this.request.jsonrcp,
            error : reason,
            id : this.request.id
        }))
    }
}





type events = {
    request : [RequestHandler]
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
    constructor( options:Options ) {
        super()
        this.options = Object.assign( new _Options, options)
        this.logger = new Logger({
            name : this.options.name
        })

        this.tcpserver = new TCPServer({
            port: this.options.port,
            name : `TCP ${this.options.name}`
        })

        this.tcpserver.on("message", (message, client) => {
            this.handle_request(message, client);
        } );
    }
    handle_request( message:string, client:Client) {
        try{
            const handler = RequestHandler.From_Json( message, client );
            this.logger.DEBUG( "Received Request", String(handler.request));
            this.emit("request", handler)
        } catch (error:unknown) {
            this.logger.ERROR( "Invalid RCP_Request.", String(error));
            if (error instanceof SyntaxError) { return; }
            //Otherwise lets try to get at least some information out of this!
        }
        

    }
}