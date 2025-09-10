import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, AlertCircle, Eye, CreditCard, XCircle, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Order {
  id: string;
  userId?: string;
  guestEmail?: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  paymentMethod?: string;
  paymentStatus: string;
  paymentProof?: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
}

interface OrderTracking {
  id: string;
  orderId: string;
  status: string;
  message?: string;
  location?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending Payment", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "payment_verified", label: "Payment Verified", icon: CreditCard, color: "bg-green-100 text-green-800" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-100 text-blue-800" },
  { value: "shipped", label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", icon: Package, color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", icon: AlertCircle, color: "bg-red-100 text-red-800" },
  { value: "payment_failed", label: "Payment Failed", icon: XCircle, color: "bg-red-100 text-red-800" }
];

export default function OrderWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<OrderTracking[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusForm, setStatusForm] = useState({
    status: "",
    trackingNumber: "",
    carrier: "",
    estimatedDelivery: "",
    message: ""
  });

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/admin/orders", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const response = await fetch(`/api/admin/orders${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    }
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => 
      apiRequest("PUT", `/api/admin/orders/${id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated successfully" });
      setShowStatusDialog(false);
      setSelectedOrder(null);
      resetStatusForm();
    },
    onError: () => {
      toast({ 
        title: "Failed to update order status", 
        variant: "destructive" 
      });
    }
  });

  // Payment verification mutations
  const verifyPaymentMutation = useMutation({
    mutationFn: (orderId: string) => 
      apiRequest("PUT", `/api/admin/orders/${orderId}/verify-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Payment verified successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to verify payment", 
        variant: "destructive" 
      });
    }
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (orderId: string) => 
      apiRequest("PUT", `/api/admin/orders/${orderId}/reject-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Payment rejected" });
    },
    onError: () => {
      toast({ 
        title: "Failed to reject payment", 
        variant: "destructive" 
      });
    }
  });

  // Fetch order tracking history
  const fetchTrackingHistory = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to fetch tracking");
      const data = await response.json();
      setTrackingHistory(data);
      setShowTrackingDialog(true);
    } catch (error) {
      toast({ 
        title: "Failed to fetch tracking history", 
        variant: "destructive" 
      });
    }
  };

  const resetStatusForm = () => {
    setStatusForm({
      status: "",
      trackingNumber: "",
      carrier: "",
      estimatedDelivery: "",
      message: ""
    });
  };

  const handleStatusUpdate = (order: Order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.status,
      trackingNumber: order.trackingNumber || "",
      carrier: "",
      estimatedDelivery: order.estimatedDelivery || "",
      message: ""
    });
    setShowStatusDialog(true);
  };

  const handleSubmitStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      updateStatusMutation.mutate({ 
        id: selectedOrder.id, 
        ...statusForm 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;
    
    const Icon = statusConfig.icon;
    return (
      <Badge className={`${statusConfig.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(num);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Management
              </CardTitle>
              <CardDescription>
                Track and manage order workflow from pending to delivery
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {order.userId ? `User: ${order.userId.slice(0, 8)}` : order.guestEmail}
                    </TableCell>
                    <TableCell>
                      {order.items?.length || 0} items
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{order.paymentMethod || "N/A"}</div>
                        <Badge variant="outline" className="text-xs">
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {order.status === "pending" && order.paymentStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => verifyPaymentMutation.mutate(order.id)}
                              disabled={verifyPaymentMutation.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectPaymentMutation.mutate(order.id)}
                              disabled={rejectPaymentMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order)}
                        >
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchTrackingHistory(order.id)}
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitStatus} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Order Status *</Label>
                <Select 
                  value={statusForm.status}
                  onValueChange={(value) => setStatusForm({ ...statusForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={statusForm.trackingNumber}
                  onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                  placeholder="ABC123456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Input
                  id="carrier"
                  value={statusForm.carrier}
                  onChange={(e) => setStatusForm({ ...statusForm, carrier: e.target.value })}
                  placeholder="FedEx, UPS, DHL, etc."
                />
              </div>
              <div>
                <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                <Input
                  id="estimatedDelivery"
                  type="datetime-local"
                  value={statusForm.estimatedDelivery}
                  onChange={(e) => setStatusForm({ ...statusForm, estimatedDelivery: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Status Message</Label>
              <Textarea
                id="message"
                value={statusForm.message}
                onChange={(e) => setStatusForm({ ...statusForm, message: e.target.value })}
                placeholder="Optional message about the status update..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowStatusDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Status
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tracking History Dialog */}
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Tracking History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {trackingHistory.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No tracking history available
              </div>
            ) : (
              trackingHistory.map((tracking: OrderTracking) => (
                <div key={tracking.id} className="border-l-2 border-primary pl-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(tracking.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(tracking.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {tracking.message && (
                        <p className="text-sm">{tracking.message}</p>
                      )}
                      {tracking.trackingNumber && (
                        <p className="text-sm">
                          Tracking: <span className="font-mono">{tracking.trackingNumber}</span>
                        </p>
                      )}
                      {tracking.carrier && (
                        <p className="text-sm">Carrier: {tracking.carrier}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}