import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
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
      });

      const { clientId, month, year, paid } = toggleSchema.parse(req.body);
      
      const existingPayment = await storage.getPayment(clientId, month, year);
      
      if (existingPayment) {
        const updated = await storage.updatePayment(existingPayment.id, paid);
        res.json(updated);
      } else {
        const payment = await storage.createPayment({
          clientId,
          month,
          year,
          paid,
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
      const clients = await storage.getClients();
      const currentYear = new Date().getFullYear();
      
      let totalExpected = 0;
      let totalPaid = 0;
      
      for (const client of clients) {
        totalExpected += client.monthlyAmount * 12;
        
        const payments = await storage.getPaymentsByClient(client.id);
        const paidThisYear = payments.filter(p => p.paid && p.year === currentYear).length;
        totalPaid += paidThisYear * client.monthlyAmount;
      }
      
      res.json({
        totalClients: clients.length,
        totalExpected,
        totalPaid,
        outstanding: totalExpected - totalPaid,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
