import { RcpServer } from "./modules/network/jsonrcp.ts"


const server = new RcpServer({}) 
server.on("request", (handler) => handler.respond(
    ["Pong!", handler.request.params]
))
