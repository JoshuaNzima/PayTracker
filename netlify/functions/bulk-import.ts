import { Handler } from "@netlify/functions";
import { storage } from "../../server/storage";
import * as XLSX from "xlsx";
import { z } from "zod";

const clientRowSchema = z.object({
  Name: z.string().min(1, "Name is required"),
  "Monthly Amount": z.number().int().positive().min(1, "Monthly amount must be at least 1"),
  Phone: z.string().optional(),
  Email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No file data provided" }),
      };
    }

    const base64Data = event.body.replace(/^data:.*base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No data found in Excel file" }),
      };
    }

    const results = {
      success: [] as string[],
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        const validatedRow = clientRowSchema.parse(row);
        
        await storage.createClient({
          name: validatedRow.Name,
          monthlyAmount: validatedRow["Monthly Amount"],
          phone: validatedRow.Phone || null,
          email: validatedRow.Email || null,
        });

        results.success.push(validatedRow.Name);
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.errors.push({
            row: rowNumber,
            error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
          });
        } else {
          results.errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `Imported ${results.success.length} clients successfully`,
        results,
      }),
    };
  } catch (error) {
    console.error("Bulk import error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to process bulk import",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
