import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const { accessToken } = response.data;
        useAuthStore.getState().setTokens(accessToken, refreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Staking API
export const stakingApi = {
  // Get all staking pools
  getPools: (params?: { currency?: string; active?: boolean }) =>
    api.get('/staking/pools', { params }),

  // Get specific pool
  getPool: (poolId: string) => api.get(`/staking/pools/${poolId}`),

  // Get user's stakes
  getUserStakes: (params?: { status?: string; poolId?: string }) =>
    api.get('/staking/stakes', { params }),

  // Create new stake
  createStake: (data: { poolId: string; amount: number }) =>
    api.post('/staking/stakes', data),

  // Unstake
  unstake: (stakeId: string) => api.post(`/staking/stakes/${stakeId}/unstake`),

  // Claim rewards
  claimRewards: (stakeId: string) =>
    api.post(`/staking/stakes/${stakeId}/claim`),

  // Get rewards history
  getRewardsHistory: (params?: { limit?: number; offset?: number }) =>
    api.get('/staking/rewards', { params }),

  // Get staking statistics
  getStats: () => api.get('/staking/stats'),
};

// Mining API
export const miningApi = {
  // Get all mining pools
  getPools: (params?: { currency?: string; type?: string; active?: boolean }) =>
    api.get('/mining/pools', { params }),

  // Get specific pool
  getPool: (poolId: string) => api.get(`/mining/pools/${poolId}`),

  // Get user's miners
  getMiners: () => api.get('/mining/miners'),

  // Create miner configuration
  createMiner: (data: { poolId: string; minerName?: string; walletId: string }) =>
    api.post('/mining/miners', data),

  // Get workers for a miner
  getWorkers: (minerId: string) => api.get(`/mining/miners/${minerId}/workers`),

  // Add worker
  addWorker: (minerId: string, data: { workerName: string; workerPassword?: string }) =>
    api.post(`/mining/miners/${minerId}/workers`, data),

  // Update worker status
  updateWorkerStatus: (workerId: string, data: { hashrate?: number; isOnline?: boolean }) =>
    api.put(`/mining/workers/${workerId}/status`, data),

  // Get mining statistics
  getStats: (params?: { minerId?: string; period?: string }) =>
    api.get('/mining/stats', { params }),

  // Get dashboard overview
  getDashboard: () => api.get('/mining/dashboard'),

  // Get payouts
  getPayouts: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/mining/payouts', { params }),

  // Request payout
  requestPayout: (minerId: string) =>
    api.post('/mining/payouts/request', { minerId }),
};

export default api;
