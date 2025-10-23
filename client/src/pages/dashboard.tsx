import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientCard } from "@/components/client-card";
import { AddClientDialog } from "@/components/add-client-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatsSummary } from "@/components/stats-summary";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@shared/schema";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Dashboard() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [monthFilter, setMonthFilter] = useState<number | "any">(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [paidFilter, setPaidFilter] = useState<"any" | "paid" | "unpaid">("any");
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (monthFilter !== "any") queryParams.set("month", String(monthFilter));
  if (yearFilter) queryParams.set("year", String(yearFilter));
  if (paidFilter && paidFilter !== "any") queryParams.set("paid", paidFilter);
  if (outstandingOnly) queryParams.set("outstandingMin", String(500000));
  if (page && page > 1) queryParams.set("page", String(page));
  if (pageSize) queryParams.set("pageSize", String(pageSize));

  const clientsUrl = "/api/clients" + (Array.from(queryParams).length ? `?${queryParams.toString()}` : "");

  const { data, isLoading } = useQuery<{ clients: Client[]; total: number; page: number; pageSize: number }>({
    queryKey: [clientsUrl],
  });

  const clients = data?.clients;
  const total = data?.total ?? 0;

  const handleExport = () => {
    window.location.href = "/api/export";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-app-title">
                Payment Tracker
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage client payments and track monthly status
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setShowAddDialog(true)}
                size="default"
                data-testid="button-add-client"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : !clients || clients.length === 0 ? (
          <EmptyState onAddClient={() => setShowAddDialog(true)} />
        ) : (
          <div className="space-y-8">
            <StatsSummary />
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search clients by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value === 'any' ? 'any' : parseInt(e.target.value, 10)); setPage(1); }}
                  className="border px-2 py-1 rounded"
                >
                  <option value="any">Any month</option>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
                <input type="number" value={yearFilter} onChange={(e) => { setYearFilter(parseInt(e.target.value || '0', 10)); setPage(1); }} className="border px-2 py-1 rounded w-20" />
                <select value={paidFilter} onChange={(e) => { setPaidFilter(e.target.value as any); setPage(1); }} className="border px-2 py-1 rounded">
                  <option value="any">Any</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={outstandingOnly} onChange={(e) => { setOutstandingOnly(e.target.checked); setPage(1); }} />
                  <span className="text-sm">Outstanding ≥ MK500,000</span>
                </label>
              </div>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="space-y-6">
              {clients?.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">{total} clients</div>
              <div className="flex items-center gap-2">
                <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <div>Page {page}</div>
                <Button disabled={page * pageSize >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AddClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
