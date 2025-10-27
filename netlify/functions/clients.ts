import { Handler } from "@netlify/functions";
import { insertClientSchema } from "../../shared/schema";
import { z } from "zod";

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Lazy import storage so that missing environment variables (eg. DATABASE_URL)
  // don't throw at module import time. This lets us return a friendly error
  // message from the handler and is easier to debug on serverless platforms.
  let storage: any;
  try {
    const mod = await import("../../server/storage");
    storage = mod.storage;
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server misconfiguration: database not available. Ensure DATABASE_URL is set." }),
    };
  }

  const apiPath = event.path.replace(/^\/.netlify\/functions\/[^/]+/, '');
  const pathParts = apiPath.split('/').filter(Boolean);
  const clientId = pathParts.length > 0 ? pathParts[0] : null;

  try {
    if (clientId) {
      switch (event.httpMethod) {
        case "PATCH": {
          const data = insertClientSchema.parse(JSON.parse(event.body || "{}"));
          const client = await storage.updateClient(clientId, data);
          
          if (!client) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: "Client not found" }),
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(client),
          };
        }

        case "DELETE": {
          await storage.deleteClient(clientId);
          return {
            statusCode: 204,
            headers,
            body: "",
          };
        }

        default:
          return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "Method not allowed" }),
          };
      }
    } else {
      switch (event.httpMethod) {
        case "GET": {
          const search = event.queryStringParameters?.search;
          const clients = await storage.getClients(search);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(clients),
          };
        }

        case "POST": {
          const data = insertClientSchema.parse(JSON.parse(event.body || "{}"));
          const client = await storage.createClient(data);
          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(client),
          };
        }

        default:
          return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "Method not allowed" }),
          };
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.errors }),
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};
