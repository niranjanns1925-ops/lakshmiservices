import toast from 'react-hot-toast';
import { load } from '@cashfreepayments/cashfree-js';

export type PaymentMethod = 'razorpay' | 'cashfree';

export interface PaymentDetails {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export const processPayment = async (
  method: PaymentMethod,
  details: PaymentDetails,
  onSuccess: (transactionId: string) => void,
  onFailure: (error: any) => void
) => {
  if (method === 'cashfree') {
    let tId = toast.loading(`Initiating Cashfree gateway...`, { id: 'payment-init' });
    try {
      // 1. Call Backend to create Cashfree Order Session
      const response = await fetch('/api/create-cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: details.orderId,
          orderAmount: details.amount,
          customerId: `cust_${Date.now()}`, // Or a real internal user ID
          customerName: details.customerName,
          customerEmail: details.customerEmail,
          customerPhone: details.customerPhone,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
         toast.dismiss(tId);
         throw new Error(data.error || 'Failed to initialize Cashfree payment.');
      }

      // Initialize SDK
      const cashfree = await load({
         mode: data.environment === 'PRODUCTION' ? "production" : "sandbox",
      });

      toast.dismiss(tId);

      // Open Cashfree Checkout Modal
      const checkoutOptions = {
         paymentSessionId: data.payment_session_id,
         redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
          if (result.error) {
              // User clicks close icon or any error
              onFailure(new Error(result.error.message || "Payment cancelled or failed."));
          } else if (result.redirect) {
              toast("Redirecting to Cashfree");
          } else {
              // Checkout happened, verify the payment status via backend
              const verifyId = toast.loading("Verifying payment...");
              try {
                const verifyRes = await fetch('/api/verify-cashfree-order', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ orderId: data.order_id })
                });
                const verifyData = await verifyRes.json();
                toast.dismiss(verifyId);
                
                if (!verifyRes.ok) {
                   throw new Error(verifyData.error || "Failed to verify transaction");
                }
                
                if (verifyData.order_status === "PAID") {
                   onSuccess(data.order_id);
                } else {
                   throw new Error(`Payment not successful. Status: ${verifyData.order_status}`);
                }
              } catch (err: any) {
                toast.dismiss(verifyId);
                onFailure(err);
              }
          }
      });
    } catch (error) {
      toast.dismiss(tId);
      onFailure(error);
    }
    return;
  }

  // ==== RAZORPAY MOCK FALLBACK ====
  try {
    toast.loading(`Initiating Razorpay gateway...`, { id: 'payment-init' });
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.dismiss('payment-init');

    const isSuccess = window.confirm(`[Mock Payment Gateway - ${method}]\n\nOrder ID: ${details.orderId}\nAmount: ₹${details.amount}\n\nDo you want to simulate a successful payment?`);

    if (isSuccess) {
      const mockTxnId = `txn_${method}_${Date.now()}`;
      onSuccess(mockTxnId);
    } else {
      throw new Error(`Payment cancelled by user in ${method} gateway.`);
    }

  } catch (error) {
    onFailure(error);
  }
};

