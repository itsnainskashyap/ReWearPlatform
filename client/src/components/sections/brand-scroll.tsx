import { useQuery } from "@tanstack/react-query";

export default function BrandScroll() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["/api/brands/featured"],
  });

  // Fallback brand letters for design consistency
  const fallbackBrands = ["L", "Z", "H", "N", "A"];

  return (
    <section className="mb-8">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold" data-testid="text-featured-brands-title">Featured Brands</h2>
      </div>
      <div className="flex space-x-4 px-4 overflow-x-auto scroll-container" data-testid="container-brand-scroll">
        {isLoading || !brands || !Array.isArray(brands) || brands.length === 0 ? (
          fallbackBrands.map((letter, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-20 h-20 bg-card rounded-xl shadow-sm flex items-center justify-center"
              data-testid={`brand-placeholder-${index}`}
            >
              <span className="text-2xl font-bold text-muted-foreground">{letter}</span>
            </div>
          ))
        ) : (
          Array.isArray(brands) && brands.map((brand: any) => (
            <div 
              key={brand.id}
              className="flex-shrink-0 w-20 h-20 bg-card rounded-xl shadow-sm flex items-center justify-center hover-elevate cursor-pointer"
              data-testid={`brand-${brand.id}`}
            >
              {brand.logoUrl ? (
                <img 
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {brand.name.charAt(0)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
