import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<"thrift" | "originals">("thrift");
  const [, navigate] = useLocation();

  return (
    <section className="relative px-4 py-8">
      {/* Hero with background */}
      <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10 rounded-2xl p-8 mb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800"
            alt="Sustainable fashion background"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-primary leading-tight" data-testid="text-hero-title">
            Sustainable Fashion,<br />
            <span className="text-accent">Redefined</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto" data-testid="text-hero-subtitle">
            Discover pre-loved treasures and original eco-friendly designs that make a difference.
          </p>
          <Button 
            onClick={() => navigate("/shop")}
            className="bg-accent text-accent-foreground px-8 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            data-testid="button-start-shopping"
          >
            Start Shopping
          </Button>
        </div>
      </div>

      {/* Category Toggle */}
      <div className="flex bg-card rounded-xl p-1 mb-6 shadow-sm">
        <Button
          variant={activeTab === "thrift" ? "default" : "ghost"}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === "thrift" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("thrift")}
          data-testid="button-tab-thrift"
        >
          Thrift Store
        </Button>
        <Button
          variant={activeTab === "originals" ? "default" : "ghost"}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === "originals" 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("originals")}
          data-testid="button-tab-originals"
        >
          ReWeara Originals
        </Button>
      </div>
    </section>
  );
}
