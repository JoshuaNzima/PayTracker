import { clients, payments, type Client, type InsertClient, type Payment, type InsertPayment } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, or as orFn } from "drizzle-orm";

export interface IStorage {
  getClients(search?: string): Promise<Client[]>;
  queryClients(options: {
    search?: string;
    month?: number;
    year?: number;
    paid?: "any" | "paid" | "unpaid";
    outstandingMin?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ clients: Client[]; total: number }>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;
  
  getPaymentsByClient(clientId: string): Promise<Payment[]>;
  getPayment(clientId: string, month: number, year: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, paid: boolean, notes?: string): Promise<Payment | undefined>;
  deletePaymentsByClient(clientId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getClients(search?: string): Promise<Client[]> {
    if (!search) {
      return await db.select().from(clients);
    }
    
    const { ilike, or } = await import("drizzle-orm");
    const searchPattern = `%${search}%`;
    
    return await db.select().from(clients).where(
      or(
        ilike(clients.name, searchPattern),
        ilike(clients.phone, searchPattern),
        ilike(clients.email, searchPattern)
      )
    );
  }

  async queryClients(options: {
    search?: string;
    month?: number;
    year?: number;
    paid?: "any" | "paid" | "unpaid";
    outstandingMin?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ clients: Client[]; total: number }> {
    const { search, month = new Date().getMonth(), year = new Date().getFullYear(), paid = "any", outstandingMin, page = 1, pageSize = 20 } = options || {};

    // 1) Build base client ids from search (or all clients)
    const baseIdRows = search
      ? await (async () => {
          const { ilike, or } = await import("drizzle-orm");
          const searchPattern = `%${search}%`;
          return await db.select({ id: clients.id }).from(clients).where(
            or(
              ilike(clients.name, searchPattern),
              ilike(clients.phone, searchPattern),
              ilike(clients.email, searchPattern)
            )
          );
        })()
      : await db.select({ id: clients.id }).from(clients);

    const baseIds = baseIdRows.map((r: any) => r.id);

    // If no base ids, return early
    if (baseIds.length === 0) {
      return { clients: [], total: 0 };
    }

    // 2) Compute sets for paid/unpaid & outstanding
    let candidateIds = new Set(baseIds);

    // Paid/unpaid filter for a specific month/year
    if (paid === "paid" || paid === "unpaid") {
      const paidRows = await db
        .select({ clientId: payments.clientId })
        .from(payments)
        .where(and(eq(payments.month, month), eq(payments.year, year), eq(payments.paid, true)));

      const paidSet = new Set(paidRows.map((r: any) => r.clientId));

      if (paid === "paid") {
        // intersect candidateIds with paidSet
        candidateIds = new Set(Array.from(candidateIds).filter((id) => paidSet.has(id)));
      } else {
        // unpaid: remove those in paidSet
        candidateIds = new Set(Array.from(candidateIds).filter((id) => !paidSet.has(id)));
      }
    }

    // Outstanding filter: clients where (12 - paidThisYear) * monthlyAmount >= outstandingMin
    if (outstandingMin !== undefined) {
      // compute paid counts per client for the year
      const paidCounts = await db
        .select({ clientId: payments.clientId, paidCount: sql`count(*)` })
        .from(payments)
        .where(and(eq(payments.year, year), eq(payments.paid, true)))
        .groupBy(payments.clientId);

      const paidCountMap = new Map<string, number>(paidCounts.map((r: any) => [r.clientId, Number(r.paidCount)]));

      // filter candidateIds by outstanding formula
      candidateIds = new Set(Array.from(candidateIds).filter((id) => {
        const paidThisYear = paidCountMap.get(id) || 0;
        // find monthlyAmount from DB result - we need to fetch monthlyAmount for id
        return true; // placeholder, will filter after fetching monthlyAmounts
      }));

      // To compute monthly amounts, query clients for the candidate ids
      const candidateIdArr = Array.from(candidateIds);
      if (candidateIdArr.length === 0) {
        return { clients: [], total: 0 };
      }

      // fetch clients rows for these ids
      let clientRows: any[] = [];
      if (candidateIdArr.length === 1) {
        clientRows = await db.select().from(clients).where(eq(clients.id, candidateIdArr[0]));
      } else {
        const { or } = await import("drizzle-orm");
        clientRows = await db.select().from(clients).where(or(...candidateIdArr.map((id) => eq(clients.id, id))));
      }

      const newCandidateIds: string[] = [];
      for (const c of clientRows) {
        const paidThisYear = paidCounts.find((p: any) => p.clientId === c.id)?.paidCount ?? 0;
        const outstandingAmount = (12 - Number(paidThisYear)) * c.monthlyAmount;
        if (outstandingAmount >= outstandingMin) newCandidateIds.push(c.id);
      }

      candidateIds = new Set(newCandidateIds);
    }

    const finalIds = Array.from(candidateIds);

    if (finalIds.length === 0) {
      return { clients: [], total: 0 };
    }

    // total before pagination
    const total = finalIds.length;

    // apply pagination: order by name
    const start = (page - 1) * pageSize;
    const pageIds = finalIds.slice(start, start + pageSize);

    const clientsRows = await (async () => {
      if (pageIds.length === 1) {
        return await db.select().from(clients).where(eq(clients.id, pageIds[0]));
      }
      const { or } = await import("drizzle-orm");
      return await db.select().from(clients).where(or(...pageIds.map((id) => eq(clients.id, id))));
    })();

    return { clients: clientsRows, total };
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

  async updatePayment(id: string, paid: boolean, notes?: string): Promise<Payment | undefined> {
    const updateData: any = { paid };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async deletePaymentsByClient(clientId: string): Promise<void> {
    await db.delete(payments).where(eq(payments.clientId, clientId));
  }
}

export const storage = new DatabaseStorage();
