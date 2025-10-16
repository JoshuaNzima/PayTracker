import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EditClientDialog } from "./edit-client-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import type { Client, Payment } from "@shared/schema";

interface ClientCardProps {
  client: Client;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentYear = new Date().getFullYear();

export function ClientCard({ client }: ClientCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments", client.id],
  });

  const togglePaymentMutation = useMutation({
    mutationFn: async ({ month, paid }: { month: number; paid: boolean }) => {
      return apiRequest("POST", "/api/payments/toggle", {
        clientId: client.id,
        month,
        year: currentYear,
        paid,
      });
    },
    onMutate: async ({ month, paid }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/payments", client.id] });
      const previousPayments = queryClient.getQueryData<Payment[]>(["/api/payments", client.id]);

      queryClient.setQueryData<Payment[]>(["/api/payments", client.id], (old = []) => {
        const existing = old.find(p => p.month === month && p.year === currentYear);
        if (existing) {
          return old.map(p => 
            p.id === existing.id ? { ...p, paid } : p
          );
        } else {
          return [...old, {
            id: `temp-${Date.now()}`,
            clientId: client.id,
            month,
            year: currentYear,
            paid,
          } as Payment];
        }
      });

      return { previousPayments };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["/api/payments", client.id], context?.previousPayments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", client.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const getPaymentStatus = (month: number): boolean => {
    const payment = payments.find(p => p.month === month && p.year === currentYear);
    return payment?.paid || false;
  };

  const paidMonthsCount = payments.filter(p => p.paid && p.year === currentYear).length;
  const totalExpected = client.monthlyAmount * 12;
  const totalPaid = paidMonthsCount * client.monthlyAmount;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate" data-testid={`text-client-name-${client.id}`}>
              {client.name}
            </h3>
            <div className="flex items-baseline gap-3 mt-1">
              <p className="text-base font-semibold tabular-nums text-foreground" data-testid={`text-monthly-amount-${client.id}`}>
                ${client.monthlyAmount.toLocaleString()}/mo
              </p>
              <p className="text-sm text-muted-foreground">
                {paidMonthsCount} of 12 months paid
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              data-testid={`button-edit-${client.id}`}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit client</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              data-testid={`button-delete-${client.id}`}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete client</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pb-6">
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2">
              {MONTHS.map((month, index) => (
                <div key={month} className="flex flex-col items-center gap-2">
                  <label 
                    htmlFor={`payment-${client.id}-${index}`}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                  >
                    {month}
                  </label>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      id={`payment-${client.id}-${index}`}
                      checked={getPaymentStatus(index)}
                      onCheckedChange={(checked) => {
                        togglePaymentMutation.mutate({
                          month: index,
                          paid: checked as boolean,
                        });
                      }}
                      className="h-9 w-9 rounded-md data-[state=checked]:bg-chart-2 data-[state=checked]:border-chart-2"
                      data-testid={`checkbox-payment-${client.id}-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">Total Paid:</span>
                <span className="text-lg font-semibold tabular-nums text-chart-2" data-testid={`text-total-paid-${client.id}`}>
                  ${totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-muted-foreground">Expected:</span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">
                  ${totalExpected.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditClientDialog
        client={client}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DeleteConfirmationDialog
        client={client}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
