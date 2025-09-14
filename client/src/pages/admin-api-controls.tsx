import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  BarChart3,
  Zap,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react";

// Payment Settings Schema
const paymentSettingsSchema = z.object({
  upiId: z.string().optional(),
  qrCodeUrl: z.string().url().optional().or(z.literal("")),
  bankDetails: z.any().optional(),
  stripeSecretKey: z.string().optional(),
  stripePublishableKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  stripeEnabled: z.boolean().default(false),
  upiEnabled: z.boolean().default(true),
  codEnabled: z.boolean().default(true),
});

// Analytics Settings Schema
const analyticsSettingsSchema = z.object({
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  hotjarId: z.string().optional(),
  mixpanelToken: z.string().optional(),
  amplitudeApiKey: z.string().optional(),
  googleAnalyticsEnabled: z.boolean().default(false),
  facebookPixelEnabled: z.boolean().default(false),
  googleTagManagerEnabled: z.boolean().default(false),
  hotjarEnabled: z.boolean().default(false),
  mixpanelEnabled: z.boolean().default(false),
  amplitudeEnabled: z.boolean().default(false),
});

// Integration Settings Schema
const integrationSettingsSchema = z.object({
  sendgridApiKey: z.string().optional(),
  sendgridFromEmail: z.string().email().optional().or(z.literal("")),
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioFromNumber: z.string().optional(),
  razorpayKeyId: z.string().optional(),
  razorpayKeySecret: z.string().optional(),
  sendgridEnabled: z.boolean().default(false),
  openaiEnabled: z.boolean().default(false),
  geminiEnabled: z.boolean().default(false),
  twilioEnabled: z.boolean().default(false),
  razorpayEnabled: z.boolean().default(false),
});

type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;
type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;

export default function AdminApiControls() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if user is admin
  const isAdmin = user && typeof user === 'object' && 'email' in user ? user.email === "rewearaofficials@gmail.com" : false;

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  if (!isAuthenticated || !isAdmin) {
    navigate("/");
    return null;
  }

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderSecretInput = (
    field: any,
    label: string,
    placeholder: string,
    isSet: boolean,
    fieldName: string
  ) => (
    <FormItem data-testid={`input-${fieldName}`}>
      <FormLabel>{label}</FormLabel>
      <div className="relative">
        <FormControl>
          <Input
            type={showSecrets[fieldName] ? "text" : "password"}
            placeholder={isSet ? "••••••••••••••••" : placeholder}
            {...field}
          />
        </FormControl>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => toggleSecretVisibility(fieldName)}
          data-testid={`button-toggle-${fieldName}`}
        >
          {showSecrets[fieldName] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isSet && (
        <FormDescription className="text-xs text-green-600">
          ✓ Secret key is configured
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  );

  const renderTestStatus = (status: string | null, lastTestAt: string | null) => {
    if (!status) {
      return (
        <Badge variant="outline" data-testid="badge-test-status">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Never Tested
        </Badge>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={status === 'success' ? 'default' : 'destructive'}
          data-testid="badge-test-status"
        >
          {status === 'success' ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <XCircle className="w-3 h-3 mr-1" />
          )}
          {status === 'success' ? 'Success' : 'Failed'}
        </Badge>
        {lastTestAt && (
          <span className="text-xs text-muted-foreground" data-testid="text-last-test">
            {new Date(lastTestAt).toLocaleString()}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          API Controls
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-page-description">
          Manage and configure all external API integrations for ReWeara
        </p>
      </div>

      <Tabs defaultValue="payments" className="space-y-6" data-testid="tabs-api-controls">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Zap className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <PaymentSettingsTab 
          renderSecretInput={renderSecretInput}
          renderTestStatus={renderTestStatus}
        />
        
        <AnalyticsSettingsTab 
          renderSecretInput={renderSecretInput}
          renderTestStatus={renderTestStatus}
        />
        
        <IntegrationSettingsTab 
          renderSecretInput={renderSecretInput}
          renderTestStatus={renderTestStatus}
        />
      </Tabs>
    </div>
  );
}

// Payment Settings Tab Component
function PaymentSettingsTab({ 
  renderSecretInput, 
  renderTestStatus 
}: { 
  renderSecretInput: any; 
  renderTestStatus: any; 
}) {
  const { toast } = useToast();

  // Fetch payment settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/payment-settings"],
  });

  const form = useForm<PaymentSettings>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      upiId: "",
      qrCodeUrl: "",
      bankDetails: null,
      stripeSecretKey: "",
      stripePublishableKey: "",
      stripeWebhookSecret: "",
      stripeEnabled: false,
      upiEnabled: true,
      codEnabled: true,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        upiId: settings.upiId || "",
        qrCodeUrl: settings.qrCodeUrl || "",
        bankDetails: settings.bankDetails,
        stripeSecretKey: "",
        stripePublishableKey: settings.stripePublishableKey || "",
        stripeWebhookSecret: "",
        stripeEnabled: settings.stripeEnabled || false,
        upiEnabled: settings.upiEnabled !== undefined ? settings.upiEnabled : true,
        codEnabled: settings.codEnabled !== undefined ? settings.codEnabled : true,
      });
    }
  }, [settings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettings) => {
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

  // Test mutations
  const testStripeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/payment-settings/test-stripe", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Stripe Test Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Stripe Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const testUpiMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/payment-settings/test-upi", {});
    },
    onSuccess: (data) => {
      toast({
        title: "UPI Test Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "UPI Test Failed",
        description: error.message || "Validation failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentSettings) => {
    // Only include fields that have values
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );
    saveSettingsMutation.mutate(filteredData);
  };

  if (isLoading) {
    return (
      <TabsContent value="payments">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="payments" data-testid="content-payments">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Settings
              </CardTitle>
              <CardDescription>
                Configure payment methods and gateways
              </CardDescription>
            </div>
            {renderTestStatus(settings?.lastTestStatus, settings?.lastTestAt)}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* UPI Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">UPI Payments</h3>
                  <FormField
                    control={form.control}
                    name="upiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-upi-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem data-testid="input-upi-id">
                        <FormLabel>UPI ID</FormLabel>
                        <FormControl>
                          <Input placeholder="example@upi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qrCodeUrl"
                    render={({ field }) => (
                      <FormItem data-testid="input-qr-code">
                        <FormLabel>QR Code URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/qr.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testUpiMutation.mutate()}
                    disabled={testUpiMutation.isPending || !form.watch("upiId")}
                    data-testid="button-test-upi"
                  >
                    {testUpiMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test UPI
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Stripe Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Stripe Payments</h3>
                  <FormField
                    control={form.control}
                    name="stripeEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-stripe-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="stripeSecretKey"
                    render={({ field }) => 
                      renderSecretInput(
                        field, 
                        "Secret Key", 
                        "sk_test_...", 
                        settings?.stripeSecretKeySet,
                        "stripe-secret-key"
                      )
                    }
                  />

                  <FormField
                    control={form.control}
                    name="stripePublishableKey"
                    render={({ field }) => (
                      <FormItem data-testid="input-stripe-publishable-key">
                        <FormLabel>Publishable Key</FormLabel>
                        <FormControl>
                          <Input placeholder="pk_test_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripeWebhookSecret"
                    render={({ field }) => 
                      renderSecretInput(
                        field, 
                        "Webhook Secret", 
                        "whsec_...", 
                        settings?.stripeWebhookSecretSet,
                        "stripe-webhook-secret"
                      )
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testStripeMutation.mutate()}
                    disabled={testStripeMutation.isPending || !form.watch("stripeSecretKey")}
                    data-testid="button-test-stripe"
                  >
                    {testStripeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Stripe
                  </Button>
                </div>
              </div>

              <Separator />

              {/* COD Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Cash on Delivery</h3>
                  <FormField
                    control={form.control}
                    name="codEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-cod-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-payment-settings"
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Payment Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// Analytics Settings Tab Component
function AnalyticsSettingsTab({ 
  renderSecretInput, 
  renderTestStatus 
}: { 
  renderSecretInput: any; 
  renderTestStatus: any; 
}) {
  const { toast } = useToast();

  // Fetch analytics settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics-settings"],
  });

  const form = useForm<AnalyticsSettings>({
    resolver: zodResolver(analyticsSettingsSchema),
    defaultValues: {
      googleAnalyticsId: "",
      facebookPixelId: "",
      googleTagManagerId: "",
      hotjarId: "",
      mixpanelToken: "",
      amplitudeApiKey: "",
      googleAnalyticsEnabled: false,
      facebookPixelEnabled: false,
      googleTagManagerEnabled: false,
      hotjarEnabled: false,
      mixpanelEnabled: false,
      amplitudeEnabled: false,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        googleAnalyticsId: settings.googleAnalyticsId || "",
        facebookPixelId: settings.facebookPixelId || "",
        googleTagManagerId: settings.googleTagManagerId || "",
        hotjarId: settings.hotjarId || "",
        mixpanelToken: "",
        amplitudeApiKey: "",
        googleAnalyticsEnabled: settings.googleAnalyticsEnabled || false,
        facebookPixelEnabled: settings.facebookPixelEnabled || false,
        googleTagManagerEnabled: settings.googleTagManagerEnabled || false,
        hotjarEnabled: settings.hotjarEnabled || false,
        mixpanelEnabled: settings.mixpanelEnabled || false,
        amplitudeEnabled: settings.amplitudeEnabled || false,
      });
    }
  }, [settings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: AnalyticsSettings) => {
      return await apiRequest("PUT", "/api/admin/analytics-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Analytics Settings Updated",
        description: "Analytics configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics-settings"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update analytics settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AnalyticsSettings) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );
    saveSettingsMutation.mutate(filteredData);
  };

  if (isLoading) {
    return (
      <TabsContent value="analytics">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="analytics" data-testid="content-analytics">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Settings
              </CardTitle>
              <CardDescription>
                Configure analytics and tracking services
              </CardDescription>
            </div>
            {renderTestStatus(settings?.lastTestStatus, settings?.lastTestAt)}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Google Analytics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Google Analytics</h3>
                  <FormField
                    control={form.control}
                    name="googleAnalyticsEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-google-analytics-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="googleAnalyticsId"
                  render={({ field }) => (
                    <FormItem data-testid="input-google-analytics-id">
                      <FormLabel>Google Analytics ID</FormLabel>
                      <FormControl>
                        <Input placeholder="G-XXXXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Facebook Pixel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Facebook Pixel</h3>
                  <FormField
                    control={form.control}
                    name="facebookPixelEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-facebook-pixel-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="facebookPixelId"
                  render={({ field }) => (
                    <FormItem data-testid="input-facebook-pixel-id">
                      <FormLabel>Facebook Pixel ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Google Tag Manager */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Google Tag Manager</h3>
                  <FormField
                    control={form.control}
                    name="googleTagManagerEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-google-tag-manager-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="googleTagManagerId"
                  render={({ field }) => (
                    <FormItem data-testid="input-google-tag-manager-id">
                      <FormLabel>Google Tag Manager ID</FormLabel>
                      <FormControl>
                        <Input placeholder="GTM-XXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Hotjar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Hotjar</h3>
                  <FormField
                    control={form.control}
                    name="hotjarEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-hotjar-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hotjarId"
                  render={({ field }) => (
                    <FormItem data-testid="input-hotjar-id">
                      <FormLabel>Hotjar Site ID</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Mixpanel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Mixpanel</h3>
                  <FormField
                    control={form.control}
                    name="mixpanelEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-mixpanel-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mixpanelToken"
                  render={({ field }) => 
                    renderSecretInput(
                      field, 
                      "Mixpanel Token", 
                      "abc123def456...", 
                      settings?.mixpanelTokenSet,
                      "mixpanel-token"
                    )
                  }
                />
              </div>

              <Separator />

              {/* Amplitude */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Amplitude</h3>
                  <FormField
                    control={form.control}
                    name="amplitudeEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-amplitude-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amplitudeApiKey"
                  render={({ field }) => 
                    renderSecretInput(
                      field, 
                      "Amplitude API Key", 
                      "abc123def456...", 
                      settings?.amplitudeApiKeySet,
                      "amplitude-api-key"
                    )
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-analytics-settings"
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Analytics Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// Integration Settings Tab Component
function IntegrationSettingsTab({ 
  renderSecretInput, 
  renderTestStatus 
}: { 
  renderSecretInput: any; 
  renderTestStatus: any; 
}) {
  const { toast } = useToast();

  // Fetch integration settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/integration-settings"],
  });

  const form = useForm<IntegrationSettings>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      sendgridApiKey: "",
      sendgridFromEmail: "",
      openaiApiKey: "",
      geminiApiKey: "",
      twilioAccountSid: "",
      twilioAuthToken: "",
      twilioFromNumber: "",
      razorpayKeyId: "",
      razorpayKeySecret: "",
      sendgridEnabled: false,
      openaiEnabled: false,
      geminiEnabled: false,
      twilioEnabled: false,
      razorpayEnabled: false,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        sendgridApiKey: "",
        sendgridFromEmail: settings.sendgridFromEmail || "",
        openaiApiKey: "",
        geminiApiKey: "",
        twilioAccountSid: settings.twilioAccountSid || "",
        twilioAuthToken: "",
        twilioFromNumber: settings.twilioFromNumber || "",
        razorpayKeyId: settings.razorpayKeyId || "",
        razorpayKeySecret: "",
        sendgridEnabled: settings.sendgridEnabled || false,
        openaiEnabled: settings.openaiEnabled || false,
        geminiEnabled: settings.geminiEnabled || false,
        twilioEnabled: settings.twilioEnabled || false,
        razorpayEnabled: settings.razorpayEnabled || false,
      });
    }
  }, [settings, form]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: IntegrationSettings) => {
      return await apiRequest("PUT", "/api/admin/integration-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Integration Settings Updated",
        description: "Integration configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update integration settings",
        variant: "destructive",
      });
    },
  });

  // Test mutations
  const testSendgridMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/integration-settings/test-sendgrid", {});
    },
    onSuccess: (data) => {
      toast({
        title: "SendGrid Test Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "SendGrid Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const testOpenaiMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/integration-settings/test-openai", {});
    },
    onSuccess: (data) => {
      toast({
        title: "OpenAI Test Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "OpenAI Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const testGeminiMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/integration-settings/test-gemini", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Gemini Test Successful",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integration-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gemini Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IntegrationSettings) => {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    );
    saveSettingsMutation.mutate(filteredData);
  };

  if (isLoading) {
    return (
      <TabsContent value="integrations">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="integrations" data-testid="content-integrations">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Integration Settings
              </CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </div>
            {renderTestStatus(settings?.lastTestStatus, settings?.lastTestAt)}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* SendGrid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">SendGrid Email</h3>
                  <FormField
                    control={form.control}
                    name="sendgridEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-sendgrid-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sendgridApiKey"
                    render={({ field }) => 
                      renderSecretInput(
                        field, 
                        "SendGrid API Key", 
                        "SG.xxxxx...", 
                        settings?.sendgridApiKeySet,
                        "sendgrid-api-key"
                      )
                    }
                  />

                  <FormField
                    control={form.control}
                    name="sendgridFromEmail"
                    render={({ field }) => (
                      <FormItem data-testid="input-sendgrid-from-email">
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                          <Input placeholder="noreply@reweara.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testSendgridMutation.mutate()}
                    disabled={testSendgridMutation.isPending || !form.watch("sendgridApiKey")}
                    data-testid="button-test-sendgrid"
                  >
                    {testSendgridMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test SendGrid
                  </Button>
                </div>
              </div>

              <Separator />

              {/* OpenAI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">OpenAI</h3>
                  <FormField
                    control={form.control}
                    name="openaiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-openai-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="openaiApiKey"
                  render={({ field }) => 
                    renderSecretInput(
                      field, 
                      "OpenAI API Key", 
                      "sk-xxxxx...", 
                      settings?.openaiApiKeySet,
                      "openai-api-key"
                    )
                  }
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testOpenaiMutation.mutate()}
                    disabled={testOpenaiMutation.isPending || !form.watch("openaiApiKey")}
                    data-testid="button-test-openai"
                  >
                    {testOpenaiMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test OpenAI
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Gemini */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Google Gemini</h3>
                  <FormField
                    control={form.control}
                    name="geminiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-gemini-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="geminiApiKey"
                  render={({ field }) => 
                    renderSecretInput(
                      field, 
                      "Gemini API Key", 
                      "AIza...", 
                      settings?.geminiApiKeySet,
                      "gemini-api-key"
                    )
                  }
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => testGeminiMutation.mutate()}
                    disabled={testGeminiMutation.isPending || !form.watch("geminiApiKey")}
                    data-testid="button-test-gemini"
                  >
                    {testGeminiMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Gemini
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Twilio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Twilio SMS</h3>
                  <FormField
                    control={form.control}
                    name="twilioEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-twilio-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="twilioAccountSid"
                    render={({ field }) => (
                      <FormItem data-testid="input-twilio-account-sid">
                        <FormLabel>Account SID</FormLabel>
                        <FormControl>
                          <Input placeholder="ACxxxxx..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twilioAuthToken"
                    render={({ field }) => 
                      renderSecretInput(
                        field, 
                        "Auth Token", 
                        "xxxxx...", 
                        settings?.twilioAuthTokenSet,
                        "twilio-auth-token"
                      )
                    }
                  />
                </div>

                <FormField
                  control={form.control}
                  name="twilioFromNumber"
                  render={({ field }) => (
                    <FormItem data-testid="input-twilio-from-number">
                      <FormLabel>From Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Razorpay */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Razorpay</h3>
                  <FormField
                    control={form.control}
                    name="razorpayEnabled"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-razorpay-enabled"
                        />
                        <span className="text-sm">Enabled</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="razorpayKeyId"
                    render={({ field }) => (
                      <FormItem data-testid="input-razorpay-key-id">
                        <FormLabel>Key ID</FormLabel>
                        <FormControl>
                          <Input placeholder="rzp_test_..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="razorpayKeySecret"
                    render={({ field }) => 
                      renderSecretInput(
                        field, 
                        "Key Secret", 
                        "xxxxx...", 
                        settings?.razorpayKeySecretSet,
                        "razorpay-key-secret"
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-integration-settings"
                >
                  {saveSettingsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Integration Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}