import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Plus, Edit, Trash2, Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TaxRate {
  id: string;
  name: string;
  rate: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function TaxManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    country: "",
    state: "",
    city: "",
    zipCode: "",
    isActive: true,
    priority: 0
  });

  // Fetch tax rates
  const { data: taxRates = [], isLoading } = useQuery<TaxRate[]>({
    queryKey: ["/api/admin/tax-rates"]
  });

  // Global tax settings
  const [globalTaxEnabled, setGlobalTaxEnabled] = useState(false);
  
  // Update global tax setting
  const updateGlobalTaxMutation = useMutation({
    mutationFn: (enabled: boolean) => 
      apiRequest("PUT", "/api/admin/settings/tax", { enabled }),
    onSuccess: () => {
      toast({ title: `Tax system ${globalTaxEnabled ? 'enabled' : 'disabled'} successfully` });
    },
    onError: () => {
      toast({ 
        title: "Failed to update tax settings", 
        variant: "destructive" 
      });
    }
  });

  // Create tax mutation
  const createTaxMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/tax-rates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tax-rates"] });
      toast({ title: "Tax rate created successfully" });
      setShowDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Failed to create tax rate", 
        variant: "destructive" 
      });
    }
  });

  // Update tax mutation
  const updateTaxMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => 
      apiRequest("PUT", `/api/admin/tax-rates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tax-rates"] });
      toast({ title: "Tax rate updated successfully" });
      setShowDialog(false);
      setEditingTax(null);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Failed to update tax rate", 
        variant: "destructive" 
      });
    }
  });

  // Delete tax mutation
  const deleteTaxMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/admin/tax-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tax-rates"] });
      toast({ title: "Tax rate deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete tax rate", 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      rate: "",
      country: "",
      state: "",
      city: "",
      zipCode: "",
      isActive: true,
      priority: 0
    });
  };

  const handleEdit = (tax: TaxRate) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate,
      country: tax.country || "",
      state: tax.state || "",
      city: tax.city || "",
      zipCode: tax.zipCode || "",
      isActive: tax.isActive,
      priority: tax.priority
    });
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTax) {
      updateTaxMutation.mutate({ id: editingTax.id, ...formData });
    } else {
      createTaxMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Tax Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global Tax Settings
          </CardTitle>
          <CardDescription>
            Enable or disable tax calculations site-wide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="global-tax">Tax System</Label>
              <p className="text-sm text-muted-foreground">
                {globalTaxEnabled ? "Tax calculations are active" : "Tax calculations are disabled"}
              </p>
            </div>
            <Switch
              id="global-tax"
              checked={globalTaxEnabled}
              onCheckedChange={(checked) => {
                setGlobalTaxEnabled(checked);
                updateGlobalTaxMutation.mutate(checked);
              }}
              data-testid="switch-global-tax"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax Rates Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Tax Rates
              </CardTitle>
              <CardDescription>
                Configure tax rates for different regions
              </CardDescription>
            </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTax(null); resetForm(); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tax Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTax ? "Edit Tax Rate" : "Add Tax Rate"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tax Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., GST, VAT, Sales Tax"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Tax Rate (%) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      placeholder="18.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="India"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTax ? "Update" : "Create"} Tax Rate
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading tax rates...</div>
        ) : taxRates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tax rates configured. Add your first tax rate to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate (%)</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>ZIP Code</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRates.map((tax: TaxRate) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.rate}%</TableCell>
                  <TableCell>{tax.country || "-"}</TableCell>
                  <TableCell>{tax.state || "-"}</TableCell>
                  <TableCell>{tax.city || "-"}</TableCell>
                  <TableCell>{tax.zipCode || "-"}</TableCell>
                  <TableCell>{tax.priority}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tax.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {tax.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tax)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this tax rate?")) {
                            deleteTaxMutation.mutate(tax.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </div>
  );
}