import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { PromotionalPopup } from "@shared/schema";

interface PromotionalPopupComponentProps {
  currentPath: string;
}

export function PromotionalPopupComponent({ currentPath }: PromotionalPopupComponentProps) {
  const [shownPopups, setShownPopups] = useState<string[]>([]);
  const [currentPopup, setCurrentPopup] = useState<PromotionalPopup | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { data: popups = [] } = useQuery<PromotionalPopup[]>({
    queryKey: ["/api/promotional-popups", "active"],
    retry: false,
  });

  useEffect(() => {
    const checkForPopups = () => {
      if (!popups.length) return;

      const now = new Date();
      const validPopups = popups.filter(popup => {
        // Check if popup is active
        if (!popup.isActive) return false;

        // Check date range
        if (popup.startDate && new Date(popup.startDate) > now) return false;
        if (popup.endDate && new Date(popup.endDate) < now) return false;

        // Check target pages
        if (popup.targetPages && popup.targetPages.length > 0) {
          if (!popup.targetPages.includes(currentPath) && !popup.targetPages.includes("*")) {
            return false;
          }
        }

        // Check if already shown based on frequency
        const popupKey = `popup_${popup.id}`;
        const lastShown = localStorage.getItem(popupKey);
        
        if (popup.showFrequency === "once" && lastShown) return false;
        
        if (popup.showFrequency === "daily" && lastShown) {
          const daysSinceShown = (now.getTime() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceShown < 1) return false;
        }
        
        if (popup.showFrequency === "weekly" && lastShown) {
          const daysSinceShown = (now.getTime() - new Date(lastShown).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceShown < 7) return false;
        }

        return true;
      });

      if (validPopups.length === 0) return;

      // Sort by priority (higher priority first)
      validPopups.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      const popup = validPopups[0];
      
      // Handle different triggers
      if (popup.trigger === "page_load") {
        showPopup(popup);
      } else if (popup.trigger === "time_delay") {
        setTimeout(() => showPopup(popup), (popup.triggerValue || 0) * 1000);
      } else if (popup.trigger === "exit_intent") {
        // Add exit intent listener
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            showPopup(popup);
            document.removeEventListener("mouseleave", handleMouseLeave);
          }
        };
        document.addEventListener("mouseleave", handleMouseLeave);
        return () => document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    checkForPopups();
  }, [popups, currentPath]);

  const showPopup = (popup: PromotionalPopup) => {
    if (shownPopups.includes(popup.id)) return;
    
    setCurrentPopup(popup);
    setIsVisible(true);
    setShownPopups(prev => [...prev, popup.id]);
    
    // Update localStorage
    const popupKey = `popup_${popup.id}`;
    localStorage.setItem(popupKey, new Date().toISOString());
  };

  const handleClose = () => {
    setIsVisible(false);
    setCurrentPopup(null);
  };

  const handleButtonClick = () => {
    if (currentPopup?.buttonUrl) {
      if (currentPopup.buttonUrl.startsWith("http")) {
        window.open(currentPopup.buttonUrl, "_blank");
      } else {
        window.location.href = currentPopup.buttonUrl;
      }
    }
    handleClose();
  };

  if (!currentPopup || !isVisible) return null;

  const getPositionClass = () => {
    switch (currentPopup.position) {
      case "top":
        return "items-start pt-20";
      case "bottom":
        return "items-end pb-20";
      default:
        return "items-center";
    }
  };

  const getSizeClass = () => {
    switch (currentPopup.size) {
      case "small":
        return "max-w-sm";
      case "large":
        return "max-w-2xl";
      default:
        return "max-w-md";
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={setIsVisible}>
      <DialogContent
        className={cn(
          "bg-background/95 backdrop-blur-md border-2",
          getSizeClass()
        )}
        data-testid="promotional-popup"
        style={{
          backgroundColor: currentPopup.backgroundColor || undefined,
          color: currentPopup.textColor || undefined,
          borderColor: currentPopup.buttonColor || undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle 
            style={{ color: currentPopup.textColor || undefined }}
            data-testid="popup-title"
          >
            {currentPopup.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={handleClose}
            data-testid="button-close-popup"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentPopup.imageUrl && (
            <div className="flex justify-center">
              <img
                src={currentPopup.imageUrl}
                alt={currentPopup.title}
                className="max-w-full h-auto rounded-lg"
                data-testid="popup-image"
              />
            </div>
          )}
          
          {currentPopup.description && (
            <p 
              className="text-sm leading-relaxed"
              style={{ color: currentPopup.textColor || undefined }}
              data-testid="popup-description"
            >
              {currentPopup.description}
            </p>
          )}
          
          {currentPopup.buttonText && (
            <div className="flex justify-center">
              <Button
                onClick={handleButtonClick}
                className="px-6 py-2 font-medium transition-colors"
                style={{
                  backgroundColor: currentPopup.buttonColor || undefined,
                  color: "#ffffff",
                }}
                data-testid="button-popup-action"
              >
                {currentPopup.buttonText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}