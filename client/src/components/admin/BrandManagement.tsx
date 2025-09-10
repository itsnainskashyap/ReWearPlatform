import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Star, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function BrandManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logoUrl: "",
    isActive: true,
    isFeatured: false,
    sortOrder: 0
  });

  // Fetch brands
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["/api/brands"]
  });

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/brands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand created successfully" });
      setShowDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Failed to create brand", 
        variant: "destructive" 
      });
    }
  });

  // Update brand mutation
  const updateBrandMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => 
      apiRequest("PUT", `/api/admin/brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand updated successfully" });
      setShowDialog(false);
      setEditingBrand(null);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Failed to update brand", 
        variant: "destructive" 
      });
    }
  });

  // Delete brand mutation
  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete brand", 
        variant: "destructive" 
      });
    }
  });

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => 
      apiRequest("PATCH", `/api/admin/brands/${id}/featured`, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({ title: "Brand featured status updated" });
    },
    onError: () => {
      toast({ 
        title: "Failed to update featured status", 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      isActive: true,
      isFeatured: false,
      sortOrder: 0
    });
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      isActive: brand.isActive,
      isFeatured: brand.isFeatured,
      sortOrder: brand.sortOrder
    });
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate slug if empty
    const finalData = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')
    };
    
    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, ...finalData });
    } else {
      createBrandMutation.mutate(finalData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Brand Management
            </CardTitle>
            <CardDescription>
              Manage brands and featured brand logos
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingBrand(null); resetForm(); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingBrand ? "Edit Brand" : "Add Brand"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Brand Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Nike, Adidas, Zara"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description about the brand..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button type="button" variant="outline">
                      <Image className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {formData.logoUrl && (
                    <div className="mt-2 p-4 border rounded-lg">
                      <img
                        src={formData.logoUrl}
                        alt="Brand logo preview"
                        className="h-20 object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBrand ? "Update" : "Create"} Brand
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading brands...</div>
        ) : brands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No brands added yet. Add your first brand to get started.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand: Brand) => (
                <div key={brand.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="h-12 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={brand.isFeatured ? "default" : "outline"}
                        onClick={() => toggleFeaturedMutation.mutate({ 
                          id: brand.id, 
                          isFeatured: !brand.isFeatured 
                        })}
                      >
                        <Star className={`w-4 h-4 ${brand.isFeatured ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(brand)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this brand?")) {
                            deleteBrandMutation.mutate(brand.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">/{brand.slug}</p>
                  </div>
                  
                  {brand.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      brand.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                    {brand.isFeatured && (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}