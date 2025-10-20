import { Handler } from "@netlify/functions";
import { storage } from "../../server/storage";
import { db } from "../../server/db";
import { payments } from "../../shared/schema";

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const clients = await storage.getClients();
    const allPayments = await Promise.all(
      clients.map((client) => storage.getPaymentsByClient(client.id))
    ).then((results) => results.flat());

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const paymentsByClient = new Map<string, typeof allPayments>();
    for (const payment of allPayments) {
      if (!paymentsByClient.has(payment.clientId)) {
        paymentsByClient.set(payment.clientId, []);
      }
      paymentsByClient.get(payment.clientId)!.push(payment);
    }

    let totalExpected = 0;
    let totalPaid = 0;
    let overdueCount = 0;

    for (const client of clients) {
      totalExpected += client.monthlyAmount * 12;

      const clientPayments = paymentsByClient.get(client.id) || [];
      const paidThisYear = clientPayments.filter(
        (p) => p.paid && p.year === currentYear
      ).length;
      totalPaid += paidThisYear * client.monthlyAmount;

      for (let month = 0; month <= currentMonth; month++) {
        const payment = clientPayments.find(
          (p) => p.month === month && p.year === currentYear
        );
        if (!payment || !payment.paid) {
          overdueCount++;
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalClients: clients.length,
        totalExpected,
        totalPaid,
        outstanding: totalExpected - totalPaid,
        overdueCount,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch statistics" }),
    };
  }
};
