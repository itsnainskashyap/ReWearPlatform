import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function FeaturedCarousel() {
  const { data: featuredCollections, isLoading } = useQuery({
    queryKey: ["/api/collections/featured"],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-4">
          <div className="h-6 w-48 skeleton rounded-full"></div>
        </div>
        <div className="flex space-x-4 px-4 overflow-x-auto">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-72 h-64 skeleton rounded-2xl"></div>
          ))}
        </div>
      </section>
    );
  }

  if (!featuredCollections || !Array.isArray(featuredCollections) || featuredCollections.length === 0) {
    return null; // Don't show section if no collections
  }

  return (
    <section className="mb-8">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold" data-testid="text-featured-collections-title">Featured Collections</h2>
      </div>
      <div className="flex space-x-4 px-4 overflow-x-auto scroll-container" data-testid="container-featured-carousel">
        {featuredCollections.map((collection: any) => (
          <div 
            key={collection.id}
            className="flex-shrink-0 w-72 bg-card rounded-2xl shadow-md overflow-hidden hover-elevate cursor-pointer"
            data-testid={`collection-card-${collection.id}`}
          >
            <img 
              src={collection.image}
              alt={collection.title}
              className="w-full h-40 object-cover"
              data-testid={`img-collection-${collection.id}`}
            />
            <div className="p-4">
              <h3 className="font-bold mb-2" data-testid={`text-collection-title-${collection.id}`}>
                {collection.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3" data-testid={`text-collection-description-${collection.id}`}>
                {collection.description}
              </p>
              <Button 
                variant="ghost"
                className="text-primary font-semibold text-sm p-0 h-auto hover-elevate"
                data-testid={`button-shop-collection-${collection.id}`}
              >
                Shop Collection
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
