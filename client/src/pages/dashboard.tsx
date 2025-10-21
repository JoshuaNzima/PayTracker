import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientCard } from "@/components/client-card";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ImportClientsDialog } from "@/components/import-clients-dialog";
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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const clientsUrl = debouncedSearch 
    ? `/api/clients?search=${encodeURIComponent(debouncedSearch)}`
    : "/api/clients";

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: [clientsUrl],
  });

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
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="space-y-6">
              {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        )}
      </main>

      <AddClientDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <ImportClientsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  );
}
