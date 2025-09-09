import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import Drawer from "@/components/layout/drawer";
import FloatingCartButton from "@/components/ui/floating-cart-button";
import CartModal from "@/components/ui/cart-modal";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {!isLoading && (
        <>
          <Drawer />
          <Header />
          <main className={isAuthenticated ? "pb-20" : ""}>
            <Router />
          </main>
          {isAuthenticated && (
            <>
              <FloatingCartButton />
              <BottomNavigation />
              <CartModal />
            </>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
