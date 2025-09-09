import { Button } from "@/components/ui/button";

export default function RecentlyViewed() {
  // Placeholder recently viewed items for design consistency
  const recentlyViewed = [
    {
      id: "sweater",
      name: "Wool Sweater",
      price: "₹1,499",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=300"
    },
    {
      id: "sneakers",
      name: "Eco Sneakers",
      price: "₹2,299",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=300"
    },
    {
      id: "jacket",
      name: "Leather Jacket",
      price: "₹3,999",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=300&h=300"
    }
  ];

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
        {recentlyViewed.map((item) => (
          <div 
            key={item.id}
            className="flex-shrink-0 w-32 hover-elevate cursor-pointer"
            data-testid={`recently-viewed-${item.id}`}
          >
            <img 
              src={item.image}
              alt={item.name}
              className="w-full h-32 object-cover rounded-xl mb-2"
              data-testid={`img-recently-viewed-${item.id}`}
            />
            <p className="text-sm font-medium truncate" data-testid={`text-recently-viewed-name-${item.id}`}>
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`text-recently-viewed-price-${item.id}`}>
              {item.price}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
