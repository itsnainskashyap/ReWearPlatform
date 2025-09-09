import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function RecentlyViewed() {
  const [, navigate] = useLocation();
  
  const { data: recentlyViewed, isLoading } = useQuery({
    queryKey: ["/api/user/recently-viewed"],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 skeleton rounded-full"></div>
          <div className="h-8 w-20 skeleton rounded-full"></div>
        </div>
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-32 space-y-2">
              <div className="w-full h-32 skeleton rounded-xl"></div>
              <div className="h-4 w-24 skeleton rounded-full"></div>
              <div className="h-3 w-16 skeleton rounded-full"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!recentlyViewed || !Array.isArray(recentlyViewed) || recentlyViewed.length === 0) {
    return null; // Don't show section if no recently viewed items
  }

  return (
    <section className="px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" data-testid="text-recently-viewed-title">Recently Viewed</h2>
        <Button 
          variant="ghost"
          className="text-primary font-semibold hover-elevate"
          data-testid="button-clear-recently-viewed"
        >
          Clear All
        </Button>
      </div>
      <div className="flex space-x-4 overflow-x-auto scroll-container" data-testid="container-recently-viewed">
        {recentlyViewed.map((item: any) => (
          <div 
            key={item.id}
            onClick={() => navigate(`/product/${item.id}`)}
            className="flex-shrink-0 w-32 hover-elevate cursor-pointer"
            data-testid={`recently-viewed-${item.id}`}
          >
            <img 
              src={item.images?.[0] || '/api/placeholder/128/128'}
              alt={item.name}
              className="w-full h-32 object-cover rounded-xl mb-2"
              data-testid={`img-recently-viewed-${item.id}`}
            />
            <p className="text-sm font-medium truncate" data-testid={`text-recently-viewed-name-${item.id}`}>
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`text-recently-viewed-price-${item.id}`}>
              ₹{item.price}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
