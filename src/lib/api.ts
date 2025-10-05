const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Minimum loading delay for better UX (2 seconds)
const MINIMUM_LOADING_DELAY = 2000;

// Helper function to add artificial delay for better UX
const withMinimumDelay = async <T>(promise: Promise<T>): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, MINIMUM_LOADING_DELAY))
  ]);
  return result;
};

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (pin: string) => {
    return withMinimumDelay(authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }));
  },

  verify: async () => {
    return authFetch('/auth/verify');
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('staffInfo');
  },
};

// Menu API
export const menuAPI = {
  getAll: async (availableOnly = false) => {
    const query = availableOnly ? '?available=true' : '';
    return withMinimumDelay(authFetch(`/menu${query}`));
  },

  getById: async (id: string) => {
    return authFetch(`/menu/${id}`);
  },

  updateAvailability: async (id: string, isAvailable: boolean) => {
    return authFetch(`/menu/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    });
  },

  create: async (menuItem: any) => {
    return authFetch('/menu', {
      method: 'POST',
      body: JSON.stringify(menuItem),
    });
  },

  update: async (id: string, menuItem: any) => {
    return authFetch(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuItem),
    });
  },

  delete: async (id: string) => {
    return authFetch(`/menu/${id}`, {
      method: 'DELETE',
    });
  },
};

// Order API
export const orderAPI = {
  create: async (orderData: {
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
    customerEmail?: string;
    customerPhone?: string;
    paymentMethod?: string;
    orderType?: string;
  }) => {
    return authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getById: async (id: string) => {
    return authFetch(`/orders/${id}`);
  },

  getAll: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return withMinimumDelay(authFetch(`/orders${query}`));
  },

  updateStatus: async (id: string, status: string) => {
    return authFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  createPayment: async (id: string) => {
    return authFetch(`/orders/${id}/create-payment`, {
      method: 'POST',
    });
  },

  verifyPayment: async (id: string, paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    return authFetch(`/orders/${id}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  // Prepayment methods (create order ONLY after payment succeeds)
  createPrepayment: async (items: Array<{ menuItemId: string; quantity: number; notes?: string }>) => {
    return authFetch('/orders/create-prepayment', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  verifyPrepayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
    orderType?: string;
  }) => {
    return authFetch('/orders/verify-prepayment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  markPaid: async (id: string, paymentMethod = 'cash') => {
    return withMinimumDelay(authFetch(`/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    }));
  },

  cancelOrder: async (id: string) => {
    return authFetch(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  removeOrderItem: async (orderId: string, itemId: string) => {
    return authFetch(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return authFetch('/orders/stats/summary');
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    return authFetch('/staff');
  },

  create: async (staffData: { name: string; pin: string; role?: string }) => {
    return authFetch('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  },
};

