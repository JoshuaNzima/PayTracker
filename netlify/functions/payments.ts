import { Handler } from "@netlify/functions";
import { storage } from "../../server/storage";
import { z } from "zod";

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const apiPath = event.path.replace(/^\/.netlify\/functions\/[^/]+/, '');
  const pathParts = apiPath.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  
  if (lastSegment === 'toggle' && event.httpMethod === "POST") {
    try {
      const toggleSchema = z.object({
        clientId: z.string(),
        month: z.number().int().min(0).max(11),
        year: z.number().int(),
        paid: z.boolean(),
        notes: z.string().optional(),
      });

      const { clientId, month, year, paid, notes } = toggleSchema.parse(
        JSON.parse(event.body || "{}")
      );

      const existingPayment = await storage.getPayment(clientId, month, year);

      if (existingPayment) {
        const updated = await storage.updatePayment(existingPayment.id, paid, notes);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updated),
        };
      } else {
        const payment = await storage.createPayment({
          clientId,
          month,
          year,
          paid,
          notes,
        });
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(payment),
        };
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
        body: JSON.stringify({ error: "Failed to toggle payment" }),
      };
    }
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const clientId = pathParts.length > 0 ? pathParts[0] : null;
  
  try {
    if (clientId) {
      const payments = await storage.getPaymentsByClient(clientId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(payments),
      };
    } else {
      const clients = await storage.getClients();
      const allPayments = await Promise.all(
        clients.map((client) => storage.getPaymentsByClient(client.id))
      ).then((results) => results.flat());
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(allPayments),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch payments" }),
    };
  }
};
