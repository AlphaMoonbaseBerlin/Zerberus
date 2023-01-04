import { TCPServer} from "@utils/tcp_server.ts";

import {Logger} from "https://deno.land/std/log/mod.ts";



const tcp_server = new TCPServer({});
console.log("Startup");
tcp_server.on("message", (client, message) => {
  console.log(client, message);
})

tcp_server.on("connect", (client) => {
  console.log( "Connection", client);
})
tcp_server.on("disconnect", (client) => {
  console.log( "Disconnect", client);
})