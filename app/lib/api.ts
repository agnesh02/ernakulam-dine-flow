const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Minimum loading delay for better UX
const MINIMUM_LOADING_DELAY = 800;

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
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('staffInfo');
    }
  },
};

// Restaurant API
export const restaurantAPI = {
  getAll: async (activeOnly = true) => {
    const query = activeOnly ? '?active=true' : '';
    return withMinimumDelay(authFetch(`/restaurants${query}`));
  },

  getById: async (id: string) => {
    return authFetch(`/restaurants/${id}`);
  },

  getStats: async (id: string) => {
    return authFetch(`/restaurants/${id}/stats`);
  },

  create: async (restaurantData: any) => {
    return authFetch('/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData),
    });
  },

  update: async (id: string, restaurantData: any) => {
    return authFetch(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(restaurantData),
    });
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return authFetch(`/restaurants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  delete: async (id: string) => {
    return authFetch(`/restaurants/${id}`, {
      method: 'DELETE',
    });
  },
};

// Menu API
export const menuAPI = {
  getAll: async (availableOnly = false, restaurantId?: string) => {
    const params = new URLSearchParams();
    if (availableOnly) params.append('available', 'true');
    if (restaurantId) params.append('restaurantId', restaurantId);
    const query = params.toString() ? `?${params.toString()}` : '';
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
    existingOrderGroupId?: string;
  }) => {
    return authFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getById: async (id: string) => {
    return authFetch(`/orders/${id}`);
  },

  getByGroupId: async (orderGroupId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/group/${orderGroupId}`);
    if (!response.ok) throw new Error('Failed to fetch order group');
    return response.json();
  },

  getAll: async (status?: string, restaurantId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (restaurantId) params.append('restaurantId', restaurantId);
    const query = params.toString() ? `?${params.toString()}` : '';
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
    existingOrderGroupId?: string;
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

  updateItemQuantity: async (orderId: string, itemId: string, quantity: number) => {
    return authFetch(`/orders/${orderId}/items/${itemId}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
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

