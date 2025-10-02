const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    return authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
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
    return authFetch(`/menu${query}`);
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
    return authFetch(`/orders${query}`);
  },

  updateStatus: async (id: string, status: string) => {
    return authFetch(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  markPaid: async (id: string, paymentMethod = 'cash') => {
    return authFetch(`/orders/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
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

