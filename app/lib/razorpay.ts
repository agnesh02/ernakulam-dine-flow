// Razorpay configuration and utilities
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(); // Resolve anyway to prevent hanging
    };
    document.body.appendChild(script);
  });
};

export const openRazorpayPayment = async (options: RazorpayOptions): Promise<void> => {
  await loadRazorpayScript();
  
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded');
  }

  // Close any existing modals that might interfere
  const existingModals = document.querySelectorAll('[data-radix-portal]');
  existingModals.forEach(modal => {
    const modalElement = modal as HTMLElement;
    modalElement.style.display = 'none';
  });

  // Create Razorpay instance with enhanced options
  const razorpayOptions = {
    ...options,
    modal: {
      ...options.modal,
      ondismiss: () => {
        // Restore any hidden modals
        existingModals.forEach(modal => {
          const modalElement = modal as HTMLElement;
          modalElement.style.display = '';
        });
        if (options.modal?.ondismiss) {
          options.modal.ondismiss();
        }
      },
    },
    // Ensure proper z-index and modal behavior
    config: {
      display: {
        blocks: {
          banks: {
            name: "Pay via Bank",
            instruments: [
              {
                method: "card",
                issuers: ["HDFC", "SBI", "ICICI", "AXIS"]
              },
              {
                method: "upi"
              },
              {
                method: "wallet",
                wallets: ["paytm", "phonepe", "gpay"]
              }
            ]
          }
        },
        sequence: ["block.banks"],
        preferences: {
          show_default_blocks: true
        }
      }
    }
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  
  // Ensure the modal opens with proper focus
  setTimeout(() => {
    try {
      razorpay.open();
      
      // Check if modal opened successfully
      setTimeout(() => {
        const razorpayModal = document.querySelector('.razorpay-checkout-modal');
        if (!razorpayModal) {
          console.warn('Razorpay modal may not have opened properly');
          // Try to force focus
          const iframe = document.querySelector('iframe[src*="razorpay"]');
          if (iframe) {
            (iframe as HTMLElement).focus();
          }
        }
      }, 500);
    } catch (error) {
      console.error('Failed to open Razorpay modal:', error);
      throw new Error('Payment modal failed to open. Please try again.');
    }
  }, 100);
};

// Razorpay key from environment or fallback
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ROcWTytWkpNMYw';

// Debug function to check Razorpay environment
export const debugRazorpayEnvironment = () => {
  console.log('🔍 Razorpay Debug Info:');
  console.log('Razorpay SDK loaded:', !!window.Razorpay);
  console.log('Razorpay Key ID:', RAZORPAY_KEY_ID);
  console.log('Current URL:', window.location.href);
  console.log('User Agent:', navigator.userAgent);
  
  // Check for conflicting modals
  const modals = document.querySelectorAll('[data-radix-portal], .modal, [role="dialog"]');
  console.log('Active modals:', modals.length);
  
  // Check for iframe blockers
  const iframes = document.querySelectorAll('iframe');
  console.log('Iframes on page:', iframes.length);
  
  return {
    sdkLoaded: !!window.Razorpay,
    keyId: RAZORPAY_KEY_ID,
    activeModals: modals.length,
    iframes: iframes.length
  };
};
