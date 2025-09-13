import { Order, OrderItem, Product, User } from '@shared/schema';

interface OrderForPDF extends Order {
  items: (OrderItem & { product: Product })[];
  user?: User;
}

// HTML escape function to prevent XSS and script injection
function escapeHtml(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

// Status sanitization and mapping to prevent injection
function sanitizeOrderStatus(status: any): { safeClass: string; displayLabel: string } {
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const statusString = String(status || '').toLowerCase();
  const safeStatus = allowedStatuses.includes(statusString) ? statusString : 'pending';
  
  const statusLabels: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed', 
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return {
    safeClass: safeStatus, // Safe for CSS class since it's whitelisted
    displayLabel: statusLabels[safeStatus]
  };
}

export function generateOrderSlipHTML(order: OrderForPDF, isAdmin = false): string {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  
  const orderDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const orderTime = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Guest Customer';
  const customerEmail = order.user?.email || order.guestEmail || 'N/A';

  // Sanitize order status to prevent injection
  const sanitizedStatus = sanitizeOrderStatus(order.status);

  // Safely parse shipping address with try/catch
  let shippingAddress = null;
  if (order.shippingAddress) {
    try {
      shippingAddress = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress;
    } catch (error) {
      console.error('Error parsing shipping address:', error);
      shippingAddress = null;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Slip - ${escapeHtml(order.id.slice(0, 8).toUpperCase())}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: white;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #16a34a;
          padding-bottom: 20px;
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          color: #16a34a; 
          margin-bottom: 5px;
        }
        .tagline { 
          font-size: 14px; 
          color: #666; 
          font-style: italic;
        }
        .order-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .info-section h3 { 
          color: #16a34a; 
          margin-bottom: 10px; 
          font-size: 16px;
        }
        .info-item { 
          margin-bottom: 5px; 
          font-size: 14px;
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .items-table th { 
          background: #16a34a; 
          color: white; 
          padding: 12px; 
          text-align: left;
          font-weight: 600;
        }
        .items-table td { 
          padding: 12px; 
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table tr:nth-child(even) { 
          background-color: #f9fafb; 
        }
        .totals { 
          text-align: right; 
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .totals .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 8px;
          padding: 5px 0;
        }
        .totals .final-total { 
          font-weight: bold; 
          font-size: 18px; 
          color: #16a34a;
          border-top: 2px solid #16a34a;
          padding-top: 10px;
          margin-top: 10px;
        }
        .payment-info { 
          background: #fef3c7; 
          padding: 20px; 
          border-radius: 8px; 
          margin-bottom: 20px;
          border-left: 4px solid #f59e0b;
        }
        .payment-info h3 { 
          color: #92400e; 
          margin-bottom: 10px;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-confirmed { background: #dcfce7; color: #166534; }
        .status-shipped { background: #dbeafe; color: #1e40af; }
        .status-delivered { background: #dcfce7; color: #166534; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">ReWeara</div>
        <div class="tagline">Sustainable Fashion • Eco-Friendly Designs</div>
      </div>

      <div class="order-info">
        <div class="info-section">
          <h3>Order Details</h3>
          <div class="info-item"><strong>Order ID:</strong> #${escapeHtml(order.id.slice(0, 8).toUpperCase())}</div>
          <div class="info-item"><strong>Date:</strong> ${orderDate}</div>
          <div class="info-item"><strong>Time:</strong> ${orderTime}</div>
          <div class="info-item">
            <strong>Status:</strong> 
            <span class="status-badge status-${sanitizedStatus.safeClass}">
              ${sanitizedStatus.displayLabel}
            </span>
          </div>
        </div>

        <div class="info-section">
          <h3>Customer Information</h3>
          <div class="info-item"><strong>Name:</strong> ${escapeHtml(customerName)}</div>
          <div class="info-item"><strong>Email:</strong> ${escapeHtml(customerEmail)}</div>
          ${isAdmin && order.user ? `<div class="info-item"><strong>User ID:</strong> ${escapeHtml(order.user.id)}</div>` : ''}
        </div>

        ${shippingAddress ? `
        <div class="info-section">
          <h3>Shipping Address</h3>
          <div class="info-item">${escapeHtml(shippingAddress.fullName || customerName)}</div>
          <div class="info-item">${escapeHtml(shippingAddress.address)}</div>
          <div class="info-item">${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.state)} ${escapeHtml(shippingAddress.zipCode)}</div>
          <div class="info-item">${escapeHtml(shippingAddress.country || 'India')}</div>
          ${shippingAddress.phone ? `<div class="info-item"><strong>Phone:</strong> ${escapeHtml(shippingAddress.phone)}</div>` : ''}
        </div>
        ` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Condition</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>
                <strong>${escapeHtml(item.product.name)}</strong>
              </td>
              <td>${escapeHtml(item.product.condition || 'N/A')}</td>
              <td>${item.quantity}</td>
              <td>₹${Number(item.price).toFixed(2)}</td>
              <td>₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${Number(order.subtotal).toFixed(2)}</span>
        </div>
        ${Number(order.taxAmount) > 0 ? `
        <div class="total-row">
          <span>Tax:</span>
          <span>₹${Number(order.taxAmount).toFixed(2)}</span>
        </div>
        ` : ''}
        ${Number(order.shippingAmount) > 0 ? `
        <div class="total-row">
          <span>Shipping:</span>
          <span>₹${Number(order.shippingAmount).toFixed(2)}</span>
        </div>
        ` : ''}
        ${Number(order.discountAmount) > 0 ? `
        <div class="total-row">
          <span>Discount:</span>
          <span>-₹${Number(order.discountAmount).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final-total">
          <span>Total Amount:</span>
          <span>₹${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>

      <div class="payment-info">
        <h3>Payment Information</h3>
        <div class="info-item"><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'N/A')}</div>
        <div class="info-item"><strong>Payment Status:</strong> ${escapeHtml(order.paymentStatus)}</div>
        ${order.notes ? `<div class="info-item"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ''}
        ${order.trackingNumber ? `<div class="info-item"><strong>Tracking Number:</strong> ${escapeHtml(order.trackingNumber)}</div>` : ''}
      </div>

      <div class="footer">
        <p><strong>ReWeara - Sustainable Fashion Platform</strong></p>
        <p>Thank you for choosing eco-friendly fashion! 🌱</p>
        <p>For support, contact: support@reweara.com | Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}