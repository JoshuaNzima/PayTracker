import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClient: () => void;
}

export function EmptyState({ onAddClient }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-foreground" data-testid="text-empty-title">
        No clients yet
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground" data-testid="text-empty-description">
        Get started by adding your first client. You'll be able to track their monthly payments with an easy-to-use calendar view.
      </p>
      <Button
        onClick={onAddClient}
        className="mt-6"
        data-testid="button-add-first-client"
      >
        <Users className="h-4 w-4 mr-2" />
        Add Your First Client
      </Button>
    </div>
  );
}
