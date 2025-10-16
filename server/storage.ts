import { clients, payments, type Client, type InsertClient, type Payment, type InsertPayment } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;
  
  getPaymentsByClient(clientId: string): Promise<Payment[]>;
  getPayment(clientId: string, month: number, year: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, paid: boolean): Promise<Payment | undefined>;
  deletePaymentsByClient(clientId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, insertClient: InsertClient): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(insertClient)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.clientId, clientId));
  }

  async getPayment(clientId: string, month: number, year: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.clientId, clientId),
          eq(payments.month, month),
          eq(payments.year, year)
        )
      );
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(id: string, paid: boolean): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ paid })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async deletePaymentsByClient(clientId: string): Promise<void> {
    await db.delete(payments).where(eq(payments.clientId, clientId));
  }
}

export const storage = new DatabaseStorage();
