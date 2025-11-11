import { Loader2 } from "lucide-react";

export default function Loading({message}: {message?: string}) {
  return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">{message}...</p>
      </div>
    );
}
