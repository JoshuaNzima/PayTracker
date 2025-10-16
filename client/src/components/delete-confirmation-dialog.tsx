import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmationDialog({
  client,
  open,
  onOpenChange,
}: DeleteConfirmationDialogProps) {
  const { toast } = useToast();

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/clients/${client.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Client deleted",
        description: "The client and all payment records have been removed.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Client
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{client.name}</strong>? This will permanently remove all payment records associated with this client. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`button-cancel-delete-${client.id}`}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteClientMutation.mutate()}
            disabled={deleteClientMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid={`button-confirm-delete-${client.id}`}
          >
            {deleteClientMutation.isPending ? "Deleting..." : "Delete Client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
