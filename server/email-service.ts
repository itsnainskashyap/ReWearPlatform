// Simple email service without external dependencies
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Enhanced email service that can use SendGrid when configured
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Check if SendGrid is configured in database settings
    const { storage } = await import('./storage');
    const integrationSettings = await storage.getIntegrationSettings();
    
    if (integrationSettings?.sendgridEnabled && integrationSettings.sendgridApiKey) {
      return await sendEmailWithSendGrid(params, integrationSettings);
    }
    
    // Fallback to console logging for development
    console.log('='.repeat(50));
    console.log('EMAIL NOTIFICATION (Console Mode)');
    console.log('='.repeat(50));
    console.log(`To: ${params.to}`);
    console.log(`From: ${params.from}`);
    console.log(`Subject: ${params.subject}`);
    console.log('-'.repeat(50));
    console.log('Text Content:');
    console.log(params.text);
    console.log('='.repeat(50));
    
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

// SendGrid implementation
async function sendEmailWithSendGrid(params: EmailParams, settings: any): Promise<boolean> {
  try {
    console.log('Sending email via SendGrid...');
    
    const sendGridData = {
      personalizations: [
        {
          to: [{ email: params.to }],
          subject: params.subject,
        },
      ],
      from: { 
        email: settings.sendgridFromEmail || params.from,
        name: 'ReWeara'
      },
      content: [
        {
          type: params.html ? 'text/html' : 'text/plain',
          value: params.html || params.text,
        },
      ],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendGridData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('Email sent successfully via SendGrid');
    return true;
  } catch (error) {
    console.error('SendGrid email sending failed:', error);
    
    // Fallback to console logging
    console.log('='.repeat(50));
    console.log('EMAIL NOTIFICATION (SendGrid Failed - Console Fallback)');
    console.log('='.repeat(50));
    console.log(`To: ${params.to}`);
    console.log(`From: ${params.from}`);
    console.log(`Subject: ${params.subject}`);
    console.log('='.repeat(50));
    
    return false;
  }
}

// Order confirmation email template
export function getOrderConfirmationEmail(order: any, userEmail: string) {
  const orderItemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.product?.name || 'Product'}</strong><br>
        Quantity: ${item.quantity}<br>
        Price: ₹${item.price}
      </td>
    </tr>
  `).join('');

  return {
    to: userEmail,
    from: 'rewearaofficials@gmail.com',
    subject: `Order Confirmation - ${order.id}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #16a34a, #eab308); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ReWeara</h1>
          <p style="color: white; margin: 10px 0 0 0;">Sustainable Fashion</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #16a34a; margin-top: 0;">Order Confirmed! 🎉</h2>
          
          <p>Thank you for your order! Your sustainable fashion choices are helping make the world better.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>
          
          <h3 style="color: #16a34a;">Items Ordered</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${orderItemsHtml}
          </table>
          
          <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px;">
            <h3 style="color: #16a34a; margin-top: 0;">What's Next?</h3>
            <p>• We'll prepare your order with care</p>
            <p>• You'll receive shipping updates via email</p>
            <p>• Track your order in the ReWeara app</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Need help? Contact us:</p>
            <p style="color: #16a34a; font-weight: bold;">📞 6200613195 (WhatsApp available)</p>
            <p>📧 rewearaofficials@gmail.com</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Thank you for choosing sustainable fashion! 🌱</p>
        </div>
      </div>
    `,
    text: `
Order Confirmation - ReWeara

Thank you for your order!

Order ID: ${order.id}
Total Amount: ₹${order.totalAmount}
Status: ${order.status}
Payment Method: ${order.paymentMethod}

Items:
${order.items.map((item: any) => `- ${item.product?.name || 'Product'} (Qty: ${item.quantity}, Price: ₹${item.price})`).join('\n')}

Need help? Contact us at 6200613195 (WhatsApp) or rewearaofficials@gmail.com

Thank you for choosing sustainable fashion!
ReWeara Team
    `
  };
}

// Order status update email template
export function getStatusUpdateEmail(order: any, userEmail: string, newStatus: string) {
  const statusMessages: { [key: string]: string } = {
    'confirmed': 'Your order has been confirmed and is being prepared! 📦',
    'shipped': 'Great news! Your order is on its way! 🚚',
    'delivered': 'Your order has been delivered! We hope you love it! 🎉',
    'cancelled': 'Your order has been cancelled. If this was unexpected, please contact us.'
  };

  const statusColors: { [key: string]: string } = {
    'confirmed': '#3b82f6',
    'shipped': '#8b5cf6',
    'delivered': '#10b981',
    'cancelled': '#ef4444'
  };

  return {
    to: userEmail,
    from: 'rewearaofficials@gmail.com',
    subject: `Order Update - ${order.id} (${newStatus.toUpperCase()})`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #16a34a, #eab308); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ReWeara</h1>
          <p style="color: white; margin: 10px 0 0 0;">Order Status Update</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: ${statusColors[newStatus] || '#16a34a'}; margin-top: 0;">
            ${statusMessages[newStatus] || 'Your order status has been updated'}
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Order Information</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>New Status:</strong> <span style="color: ${statusColors[newStatus] || '#16a34a'}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Questions? We're here to help!</p>
            <p style="color: #16a34a; font-weight: bold;">📞 6200613195 (WhatsApp available)</p>
            <p>📧 rewearaofficials@gmail.com</p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666;">
          <p style="margin: 0;">Thank you for choosing sustainable fashion! 🌱</p>
        </div>
      </div>
    `,
    text: `
Order Status Update - ReWeara

${statusMessages[newStatus] || 'Your order status has been updated'}

Order ID: ${order.id}
New Status: ${newStatus.toUpperCase()}
Total Amount: ₹${order.totalAmount}

Questions? Contact us at 6200613195 (WhatsApp) or rewearaofficials@gmail.com

Thank you!
ReWeara Team
    `
  };
}