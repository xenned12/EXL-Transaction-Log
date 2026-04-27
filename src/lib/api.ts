const API_BASE = '/api';

export const api = {
  async login(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  async register(username, email, password) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role: 'user', needsPasswordChange: true })
    });
    if (!res.ok) throw new Error('Register failed');
    return res.json();
  },

  async updateUser(id, updates) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Update user failed');
    return res.json();
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getTransactions() {
    const res = await fetch(`${API_BASE}/transactions`);
    return res.json();
  },

  async addTransaction(tx) {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    return res.json();
  },

  async addShift(shiftObj) {
    const res = await fetch(`${API_BASE}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shiftObj)
    });
    return res.json();
  }
};
