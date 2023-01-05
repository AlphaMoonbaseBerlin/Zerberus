import {EventEmitter} from "https://deno.land/x/event@2.0.1/mod.ts";
import { TCPServer } from "./tcp_server.ts";
import { JSONObject, JSONArray } from "@modules/utils/json_types.ts";

type events = {

}

export interface Options {
    port? : number
    name? : string
}

class _Options implements Options {
    port = 8056
    name = "JSON_RCP"
}

export interface Request {
    jsonrcp : string,
    method : string,
    params : JSONObject | JSONArray
    id? : number
}

export interface Response {
    jsonrxp : string
    result : JSONObject | JSONArray
}

export class Server extends EventEmitter<events> {
    options : Options
    tcpserver : TCPServer
    constructor( options:Options ) {
        super()
        this.options = Object.assign( new _Options, options)

        this.tcpserver = new TCPServer({
            port: this.options.port,
            name : this.options.name
        })
    }
}