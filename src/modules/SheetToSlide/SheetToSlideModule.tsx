import { Toaster } from "@/modules/SheetToSlide/components/ui/toaster";
import { Toaster as Sonner } from "@/modules/SheetToSlide/components/ui/sonner";
import { TooltipProvider } from "@/modules/SheetToSlide/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const SheetToSlideModule = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Index />
    </TooltipProvider>
  </QueryClientProvider>
);

export default SheetToSlideModule;

