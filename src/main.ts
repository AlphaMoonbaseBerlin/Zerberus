import { TCPServer} from "@modules/network/tcp_server.ts";


const tcp_server = new TCPServer({});

tcp_server.on("message", (client, message) => {
  console.log(client, message);
})

tcp_server.on("connect", (client) => {
  console.log( "Connection", client);
})
tcp_server.on("disconnect", (client) => {
  console.log( "Disconnect", client);
})