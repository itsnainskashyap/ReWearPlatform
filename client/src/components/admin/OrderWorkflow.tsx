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
import { Package, Truck, CheckCircle, Clock, AlertCircle, Eye, CreditCard, XCircle, Check, X, Edit, FileText, Download, Printer, Receipt, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<OrderTracking[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusForm, setStatusForm] = useState({
    status: "",
    trackingNumber: "",
    carrier: "",
    estimatedDelivery: "",
    message: ""
  });
  const [editForm, setEditForm] = useState({
    status: "",
    paymentStatus: "",
    trackingNumber: "",
    estimatedDelivery: "",
    subtotal: "",
    taxAmount: "",
    shippingAmount: "",
    discountAmount: "",
    totalAmount: "",
    shippingAddress: "",
    notes: ""
  });

  // Fetch orders
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: [statusFilter !== "all" ? `/api/admin/orders?status=${statusFilter}` : "/api/admin/orders"],
  });

  const orders = (ordersResponse as any)?.orders || [];

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

  // Comprehensive order editing mutation (uses new PATCH endpoint)
  const editOrderMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => 
      apiRequest("PATCH", `/api/admin/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order updated successfully" });
      setShowEditDialog(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update order", 
        description: error.message || "There was an error updating the order",
        variant: "destructive" 
      });
    }
  });

  // Invoice functions
  const handleDownloadInvoice = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/pdf`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${order.id.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({ title: "Invoice downloaded successfully" });
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (error) {
      toast({
        title: "Error downloading invoice",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePrintInvoice = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/slip`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        throw new Error('Failed to generate invoice for printing');
      }
    } catch (error) {
      toast({
        title: "Error printing invoice",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceDialog(true);
  };

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

  // Fetch audit logs for an order
  const fetchAuditLogs = async (orderId: string) => {
    try {
      const response = await apiRequest("GET", `/api/admin/orders/${orderId}/audit-logs`);
      setAuditLogs((response as any).logs || []);
      setShowAuditDialog(true);
    } catch (error) {
      toast({ 
        title: "Failed to fetch audit logs", 
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

  const handleOrderEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber || "",
      estimatedDelivery: order.estimatedDelivery || "",
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount || "0",
      totalAmount: order.totalAmount,
      shippingAddress: JSON.stringify((order as any).shippingAddress || {}, null, 2),
      notes: ""
    });
    setShowEditDialog(true);
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

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      // Parse the shipping address JSON
      let parsedShippingAddress;
      if (editForm.shippingAddress.trim()) {
        parsedShippingAddress = JSON.parse(editForm.shippingAddress);
      }

      const editData = {
        status: editForm.status,
        paymentStatus: editForm.paymentStatus,
        trackingNumber: editForm.trackingNumber || null,
        estimatedDelivery: editForm.estimatedDelivery || null,
        subtotal: editForm.subtotal,
        taxAmount: editForm.taxAmount,
        shippingAmount: editForm.shippingAmount,
        discountAmount: editForm.discountAmount,
        totalAmount: editForm.totalAmount,
        shippingAddress: parsedShippingAddress,
        adminNotes: editForm.notes || undefined
      };

      editOrderMutation.mutate({ 
        id: selectedOrder.id, 
        ...editData
      });
    } catch (error) {
      toast({ 
        title: "Invalid JSON", 
        description: "Please check the shipping address format",
        variant: "destructive" 
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
                      <div className="flex gap-2 flex-wrap">
                        {order.status === "pending" && order.paymentStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => verifyPaymentMutation.mutate(order.id)}
                              disabled={verifyPaymentMutation.isPending}
                              data-testid={`button-verify-${order.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectPaymentMutation.mutate(order.id)}
                              disabled={rejectPaymentMutation.isPending}
                              data-testid={`button-reject-${order.id}`}
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
                          data-testid={`button-update-status-${order.id}`}
                        >
                          Update Status
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOrderEdit(order)}
                          data-testid={`button-edit-order-${order.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchTrackingHistory(order.id)}
                          data-testid={`button-tracking-${order.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Tracking
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchAuditLogs(order.id)}
                          data-testid={`button-audit-logs-${order.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Audit Logs
                        </Button>
                        
                        {/* Invoice Actions */}
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(order)}
                            data-testid={`button-view-invoice-${order.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(order)}
                            data-testid={`button-download-admin-invoice-${order.id}`}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintInvoice(order)}
                            data-testid={`button-print-admin-invoice-${order.id}`}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
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

      {/* Comprehensive Order Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Address</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Order Status *</Label>
                    <Select 
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                    >
                      <SelectTrigger data-testid="select-edit-status">
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
                    <Label htmlFor="edit-payment-status">Payment Status *</Label>
                    <Select 
                      value={editForm.paymentStatus}
                      onValueChange={(value) => setEditForm({ ...editForm, paymentStatus: value })}
                    >
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-tracking">Tracking Number</Label>
                    <Input
                      id="edit-tracking"
                      value={editForm.trackingNumber}
                      onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                      placeholder="ABC123456789"
                      data-testid="input-edit-tracking"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-estimated-delivery">Estimated Delivery</Label>
                    <Input
                      id="edit-estimated-delivery"
                      type="datetime-local"
                      value={editForm.estimatedDelivery}
                      onChange={(e) => setEditForm({ ...editForm, estimatedDelivery: e.target.value })}
                      data-testid="input-estimated-delivery"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-subtotal">Subtotal (₹) *</Label>
                    <Input
                      id="edit-subtotal"
                      type="number"
                      step="0.01"
                      value={editForm.subtotal}
                      onChange={(e) => setEditForm({ ...editForm, subtotal: e.target.value })}
                      data-testid="input-edit-subtotal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-tax">Tax Amount (₹) *</Label>
                    <Input
                      id="edit-tax"
                      type="number"
                      step="0.01"
                      value={editForm.taxAmount}
                      onChange={(e) => setEditForm({ ...editForm, taxAmount: e.target.value })}
                      data-testid="input-edit-tax"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-shipping">Shipping Amount (₹) *</Label>
                    <Input
                      id="edit-shipping"
                      type="number"
                      step="0.01"
                      value={editForm.shippingAmount}
                      onChange={(e) => setEditForm({ ...editForm, shippingAmount: e.target.value })}
                      data-testid="input-edit-shipping"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-discount">Discount Amount (₹)</Label>
                    <Input
                      id="edit-discount"
                      type="number"
                      step="0.01"
                      value={editForm.discountAmount}
                      onChange={(e) => setEditForm({ ...editForm, discountAmount: e.target.value })}
                      data-testid="input-edit-discount"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-total">Total Amount (₹) *</Label>
                  <Input
                    id="edit-total"
                    type="number"
                    step="0.01"
                    value={editForm.totalAmount}
                    onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                    data-testid="input-edit-total"
                    required
                  />
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-4">
                <div>
                  <Label htmlFor="edit-address">Shipping Address (JSON format)</Label>
                  <Textarea
                    id="edit-address"
                    value={editForm.shippingAddress}
                    onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                    placeholder='{"fullName": "John Doe", "address": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "phone": "+91-9876543210"}'
                    rows={6}
                    className="font-mono text-sm"
                    data-testid="textarea-shipping-address"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Admin Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Internal notes about this order edit..."
                    rows={3}
                    data-testid="textarea-admin-notes"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editOrderMutation.isPending} data-testid="button-save-order-edit">
                {editOrderMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Audit Logs Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Logs - Order #{selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found for this order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log: any) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by Admin {log.actorId}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                          </span>
                        </div>
                        
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Changes made:</p>
                            <div className="bg-muted p-3 rounded-lg">
                              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Invoice - Order #{selectedOrder?.id?.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Invoice Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Invoice Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Company Header */}
                    <div className="text-center border-b pb-4">
                      <h1 className="text-2xl font-bold text-green-600">ReWeara</h1>
                      <p className="text-sm text-muted-foreground">Sustainable Fashion for a Better Tomorrow</p>
                    </div>
                    
                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Invoice To:</h3>
                        <p>{selectedOrder.userId ? `User ID: ${selectedOrder.userId.slice(0, 8)}` : selectedOrder.guestEmail}</p>
                        {selectedOrder.items && selectedOrder.items.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedOrder.items.length} item(s)
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold mb-2">Invoice Details:</h3>
                        <p>Invoice #: REW-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                        <p>Date: {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy')}</p>
                        <p>Status: {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</p>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Order Items:</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.items.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.productName || 'Product'}</TableCell>
                                  <TableCell>{item.quantity || 1}</TableCell>
                                  <TableCell>₹{parseFloat(item.price || '0').toFixed(2)}</TableCell>
                                  <TableCell>₹{(parseFloat(item.price || '0') * (item.quantity || 1)).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {/* Total Section */}
                    <div className="border-t pt-4">
                      <div className="space-y-2 max-w-xs ml-auto">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{parseFloat(selectedOrder.subtotal || '0').toFixed(2)}</span>
                        </div>
                        {parseFloat(selectedOrder.taxAmount || '0') > 0 && (
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>₹{parseFloat(selectedOrder.taxAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(selectedOrder.shippingAmount || '0') > 0 && (
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>₹{parseFloat(selectedOrder.shippingAmount).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(selectedOrder.discountAmount || '0') > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-₹{parseFloat(selectedOrder.discountAmount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>₹{parseFloat(selectedOrder.totalAmount || '0').toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceDialog(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}