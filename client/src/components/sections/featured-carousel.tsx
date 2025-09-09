import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function FeaturedCarousel() {
  // Fallback featured collections for design consistency
  const featuredCollections = [
    {
      id: "summer",
      title: "Summer Sustainability",
      description: "Light, breathable, and earth-friendly pieces for the warmer months.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    },
    {
      id: "vintage",
      title: "Vintage Denim",
      description: "Timeless denim pieces with character and history.",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
    }
  ];

  return (
    <section className="mb-8">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold" data-testid="text-featured-collections-title">Featured Collections</h2>
      </div>
      <div className="flex space-x-4 px-4 overflow-x-auto scroll-container" data-testid="container-featured-carousel">
        {featuredCollections.map((collection) => (
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
