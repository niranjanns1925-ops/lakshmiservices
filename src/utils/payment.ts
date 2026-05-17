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

      cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
              // This will be true whenever user clicks on close icon inside the modal or any error happens during the payment
              onFailure(new Error(result.error.message || "Payment cancelled or failed."));
          } else if (result.redirect) {
              // This will be true, if the merchant is not using _modal, thus redirecting
              toast("Redirecting to Cashfree");
          } else if (result.paymentDetails) {
              // This will be called whenever the payment is completed successfully
              onSuccess(data.order_id);
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

