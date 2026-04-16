import axios from 'axios';

export const registerUser = async (payload) => {
  const response = await axios.post('/api/auth/register', payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axios.post('/api/auth/login', payload);
  return response.data;
};

export const getProfile = async (token) => {
  const response = await axios.get('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateProfile = async (token, payload) => {
  const response = await axios.put('/api/auth/me', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getAdminPanel = async (token) => {
  const response = await axios.get('/api/panel/admin', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getSellerPanel = async (token) => {
  const response = await axios.get('/api/panel/seller', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getDeliveryPanel = async (token) => {
  const response = await axios.get('/api/panel/delivery', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createSellerProduct = async (token, payload) => {
  const response = await axios.post('/api/products', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getMySellerProducts = async (token) => {
  const response = await axios.get('/api/products/my-products', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateSellerProduct = async (token, productId, payload) => {
  const response = await axios.put(`/api/products/${productId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteSellerProduct = async (token, productId) => {
  const response = await axios.delete(`/api/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const createOrder = async (token, payload) => {
  const response = await axios.post('/api/orders', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getSellerOrders = async (token) => {
  const response = await axios.get('/api/orders/seller', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getDeliveryOrders = async (token) => {
  const response = await axios.get('/api/orders/delivery', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getMyOrders = async (token) => {
  const response = await axios.get('/api/orders/my-orders', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateSellerOrderStatus = async (token, orderId, status) => {
  const response = await axios.patch(`/api/orders/${orderId}/status`, { status }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateDeliveryOrderStatus = async (token, orderId, status) => {
  const response = await axios.patch(`/api/orders/${orderId}/deliver`, { status }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const sendDeliveryOtp = async (token, orderId) => {
  const response = await axios.post(`/api/orders/${orderId}/delivery-otp/send`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const verifyDeliveryOtp = async (token, orderId, otp) => {
  const response = await axios.post(`/api/orders/${orderId}/delivery-otp/verify`, { otp }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const uploadSellerMedia = async (token, imageFiles, videoFile) => {
  const formData = new FormData();

  if (Array.isArray(imageFiles) && imageFiles.length > 0) {
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
  }

  if (videoFile) {
    formData.append('video', videoFile);
  }

  const response = await axios.post('/api/upload/media', formData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};
