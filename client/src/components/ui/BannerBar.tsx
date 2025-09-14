import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import type { Banner } from "@shared/schema";

interface BannerBarProps {
  className?: string;
}

export function BannerBar({ className = "" }: BannerBarProps) {
  const [location] = useLocation();
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  // Load dismissed banners from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dismissedBanners");
    if (saved) {
      try {
        setDismissedBanners(JSON.parse(saved));
      } catch {
        setDismissedBanners([]);
      }
    }
  }, []);

  // Fetch active banners
  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter and sort banners
  const activeBanner = (() => {
    const now = new Date();
    const currentPath = location;

    const eligibleBanners = banners.filter((banner) => {
      // Must be active
      if (!banner.isActive) return false;

      // Must not be dismissed
      if (dismissedBanners.includes(banner.id)) return false;

      // Check schedule
      if (banner.startDate && new Date(banner.startDate) > now) return false;
      if (banner.endDate && new Date(banner.endDate) < now) return false;

      // For banners, show on all pages by default since they don't have targeting
      // This is different from promotional popups which have targetPages

      return true;
    });

    // Sort by priority (highest first) and return the top banner
    return eligibleBanners
      .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0))
      .shift() || null;
  })();

  const handleDismiss = (bannerId: string) => {
    const updated = [...dismissedBanners, bannerId];
    setDismissedBanners(updated);
    localStorage.setItem("dismissedBanners", JSON.stringify(updated));
  };

  // If no banner to show, render nothing
  if (!activeBanner) return null;

  const handleBannerClick = () => {
    if (activeBanner.linkUrl) {
      if (activeBanner.linkUrl.startsWith("http")) {
        window.open(activeBanner.linkUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = activeBanner.linkUrl;
      }
    }
  };

  return (
    <div 
      className={`relative w-full border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}
      data-testid={`banner-display-${activeBanner.id}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {activeBanner.title}
                  </h3>
                  {activeBanner.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">
                      {activeBanner.subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              {activeBanner.buttonText && activeBanner.linkUrl && (
                <Button
                  size="sm"
                  onClick={handleBannerClick}
                  className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  data-testid={`button-banner-action-${activeBanner.id}`}
                >
                  {activeBanner.buttonText}
                </Button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(activeBanner.id)}
            className="shrink-0 h-6 w-6 p-0 hover:bg-background/50"
            data-testid={`button-dismiss-banner-${activeBanner.id}`}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss banner</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BannerBar;