import { createServer } from "node:http";
import { createIntentRouter, readJsonBody, requestToIntentRequest, sendJson } from "./api.js";
import { VERITY_INTENTS } from "./intents/catalogue.js";

const port = Number(process.env.PORT ?? 3000);

const router = createIntentRouter({});

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "telegraph-verity-intelligence"
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/intents") {
    sendJson(response, 200, {
      count: VERITY_INTENTS.length,
      intents: VERITY_INTENTS
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/v1/intent") {
    try {
      const body = await readJsonBody(request);
      const intentRequest = requestToIntentRequest(body);

      if (!intentRequest) {
        sendJson(response, 400, {
          error: "invalid_request",
          message: "Request must contain an intent string."
        });
        return;
      }

      if (!(VERITY_INTENTS as readonly string[]).includes(intentRequest.intent)) {
        sendJson(response, 404, {
          error: "unsupported_intent",
          message: "The requested Intent is not supported by Verity."
        });
        return;
      }

      const result = await router.dispatch(intentRequest);

      if (!result) {
        sendJson(response, 501, {
          error: "intent_not_implemented",
          intent: intentRequest.intent,
          message: "The Intent is in the Verity scope but has no production handler yet."
        });
        return;
      }

      sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, {
          error: "invalid_json",
          message: "Request body must contain valid JSON."
        });
        return;
      }

      if (error instanceof Error && error.message === "request_body_too_large") {
        sendJson(response, 413, {
          error: "request_body_too_large",
          message: "Request body exceeds the configured limit."
        });
        return;
      }

      sendJson(response, 500, {
        error: "internal_error",
        message: "The request could not be processed."
      });
    }
    return;
  }

  sendJson(response, 404, { error: "not_found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Verity listening on port ${port}`);
});
