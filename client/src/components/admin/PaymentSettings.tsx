import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, QrCode, CreditCard, Save, Trash2, Eye } from "lucide-react";
import type { PaymentSettings } from "@shared/schema";

export function PaymentSettingsForm() {
  const { toast } = useToast();
  const [upiId, setUpiId] = useState("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Fetch existing payment settings
  const { data: paymentSettings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/admin/payment-settings"],
    retry: false,
  });

  // Save payment settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/admin/payment-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Payment Settings Updated",
        description: "Payment configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update payment settings",
        variant: "destructive",
      });
    },
  });

  // Handle QR code file upload
  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrCodePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save settings
  const handleSave = () => {
    const bankDetailsObj = bankDetails ? {
      accountName: bankDetails.split('\n')[0] || '',
      accountNumber: bankDetails.split('\n')[1] || '',
      ifscCode: bankDetails.split('\n')[2] || '',
      bankName: bankDetails.split('\n')[3] || '',
    } : {};

    saveSettingsMutation.mutate({
      upiId,
      qrCodeUrl: qrCodePreview || paymentSettings?.qrCodeUrl,
      bankDetails: bankDetailsObj,
      isActive,
    });
  };

  // Initialize form with existing data
  useEffect(() => {
    if (paymentSettings) {
      setUpiId(paymentSettings.upiId || "");
      setQrCodePreview(paymentSettings.qrCodeUrl || "");
      setIsActive(paymentSettings.isActive ?? true);
      
      if (paymentSettings.bankDetails) {
        const details = paymentSettings.bankDetails as any;
        setBankDetails(`${details.accountName || ''}\n${details.accountNumber || ''}\n${details.ifscCode || ''}\n${details.bankName || ''}`);
      }
    }
  }, [paymentSettings]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-20 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-40 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UPI Settings */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            UPI Configuration
          </CardTitle>
          <CardDescription>
            Set up UPI ID for direct payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="your-business@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* QR Code Settings */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Configuration
          </CardTitle>
          <CardDescription>
            Upload QR code for payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-upload">QR Code Image</Label>
            <div className="flex items-center gap-4">
              <Input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleQrCodeUpload}
                className="rounded-xl"
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => document.getElementById('qr-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
          
          {qrCodePreview && (
            <div className="space-y-2">
              <Label>QR Code Preview</Label>
              <div className="border rounded-xl p-4 bg-muted/30">
                <img
                  src={qrCodePreview}
                  alt="QR Code Preview"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Bank Details (Optional)</CardTitle>
          <CardDescription>
            Add bank account details for manual transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-details">Bank Details</Label>
            <Textarea
              id="bank-details"
              placeholder={`Account Holder Name\nAccount Number\nIFSC Code\nBank Name`}
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings Control */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>
            Control payment system availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="payment-active">Enable Payment System</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to make payments through configured methods
              </p>
            </div>
            <Switch
              id="payment-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}