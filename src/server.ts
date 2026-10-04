import { createServer } from "node:http";
import { VERITY_INTENTS } from "./intents/catalogue.js";

const port = Number(process.env.PORT ?? 3000);

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      status: "ok",
      service: "telegraph-verity-intelligence"
    }));
    return;
  }

  if (request.method === "GET" && request.url === "/intents") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      count: VERITY_INTENTS.length,
      intents: VERITY_INTENTS
    }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Verity listening on port ${port}`);
});
