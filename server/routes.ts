import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { payments } from "@shared/schema";
import { insertClientSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/clients", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const clients = await storage.getClients(search);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertClientSchema.parse(req.body);
      const client = await storage.updateClient(id, data);
      
      if (!client) {
        res.status(404).json({ error: "Client not found" });
        return;
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update client" });
      }
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  app.get("/api/payments/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const payments = await storage.getPaymentsByClient(clientId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments/toggle", async (req, res) => {
    try {
      const toggleSchema = z.object({
        clientId: z.string(),
        month: z.number().int().min(0).max(11),
        year: z.number().int(),
        paid: z.boolean(),
        notes: z.string().optional(),
      });

      const { clientId, month, year, paid, notes } = toggleSchema.parse(req.body);
      
      const existingPayment = await storage.getPayment(clientId, month, year);
      
      if (existingPayment) {
        const updated = await storage.updatePayment(existingPayment.id, paid, notes);
        res.json(updated);
      } else {
        const payment = await storage.createPayment({
          clientId,
          month,
          year,
          paid,
          notes,
        });
        res.status(201).json(payment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to toggle payment" });
      }
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const [clients, allPayments] = await Promise.all([
        storage.getClients(),
        db.select().from(payments)
      ]);
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Index payments by client ID for O(1) lookup
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
        const paidThisYear = clientPayments.filter(p => p.paid && p.year === currentYear).length;
        totalPaid += paidThisYear * client.monthlyAmount;
        
        // Count overdue payments (current month and before, unpaid)
        for (let month = 0; month <= currentMonth; month++) {
          const payment = clientPayments.find(p => p.month === month && p.year === currentYear);
          if (!payment || !payment.paid) {
            overdueCount++;
          }
        }
      }
      
      res.json({
        totalClients: clients.length,
        totalExpected,
        totalPaid,
        outstanding: totalExpected - totalPaid,
        overdueCount,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/export", async (req, res) => {
    try {
      const clients = await storage.getClients();
      const exportData = [];
      
      for (const client of clients) {
        const payments = await storage.getPaymentsByClient(client.id);
        
        for (const payment of payments) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
          
          exportData.push({
            clientName: client.name,
            phone: client.phone || '',
            email: client.email || '',
            monthlyAmount: client.monthlyAmount,
            month: monthNames[payment.month],
            year: payment.year,
            paid: payment.paid ? 'Yes' : 'No',
            notes: payment.notes || '',
          });
        }
      }
      
      // Create CSV
      const headers = ['Client Name', 'Phone', 'Email', 'Monthly Amount (MWK)', 'Month', 'Year', 'Paid', 'Notes'];
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => [
          `"${row.clientName}"`,
          `"${row.phone}"`,
          `"${row.email}"`,
          row.monthlyAmount,
          `"${row.month}"`,
          row.year,
          row.paid,
          `"${row.notes}"`,
        ].join(','))
      ];
      
      const csv = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=client-payments.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
