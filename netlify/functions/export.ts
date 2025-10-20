import { Handler } from "@netlify/functions";
import { storage } from "../../server/storage";

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
    const exportData: Array<{
      clientName: string;
      phone: string;
      email: string;
      monthlyAmount: number;
      month: string;
      year: number;
      paid: string;
      notes: string;
    }> = [];

    for (const client of clients) {
      const payments = await storage.getPaymentsByClient(client.id);

      for (const payment of payments) {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        exportData.push({
          clientName: client.name,
          phone: client.phone || "",
          email: client.email || "",
          monthlyAmount: client.monthlyAmount,
          month: monthNames[payment.month],
          year: payment.year,
          paid: payment.paid ? "Yes" : "No",
          notes: payment.notes || "",
        });
      }
    }

    const csvHeaders = [
      "Client Name",
      "Phone",
      "Email",
      "Monthly Amount (MWK)",
      "Month",
      "Year",
      "Paid",
      "Notes",
    ];
    const csvRows = [
      csvHeaders.join(","),
      ...exportData.map((row) =>
        [
          `"${row.clientName}"`,
          `"${row.phone}"`,
          `"${row.email}"`,
          row.monthlyAmount,
          `"${row.month}"`,
          row.year,
          row.paid,
          `"${row.notes}"`,
        ].join(",")
      ),
    ];

    const csv = csvRows.join("\n");

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=client-payments.csv",
      },
      body: csv,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to export data" }),
    };
  }
};
