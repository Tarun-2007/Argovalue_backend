import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { productService } from '../services/productService';
import ProductApproval from './ProductApproval';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeNow: 0, totalProducts: 0 });
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // User edit state
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});

  // Product edit state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductForm, setEditProductForm] = useState({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, statsRes, productsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        productService.getAllProducts()
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setProducts(productsRes);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 3000); };

  // ── USER CRUD ──
  const startEditUser = (user) => {
    setEditingUser(user.id);
    setEditUserForm({ name: user.name, email: user.email, role: user.role });
  };

  const saveUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}`, editUserForm);
      setEditingUser(null);
      showSuccess('User updated successfully!');
      loadData();
    } catch (err) { showError('Failed to update user'); }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Delete this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        showSuccess('User deleted!');
        loadData();
      } catch (err) { showError('Failed to delete user'); }
    }
  };

  // ── PRODUCT CRUD ──
  const startEditProduct = (product) => {
    setEditingProduct(product.id);
    setEditProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock ?? 0,
      description: product.description
    });
  };

  const saveProduct = async (productId) => {
    try {
      await productService.updateProduct(productId, editProductForm);
      setEditingProduct(null);
      showSuccess('Product updated successfully!');
      loadData();
    } catch (err) { showError('Failed to update product'); }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('Delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        showSuccess('Product deleted!');
        loadData();
      } catch (err) { showError('Failed to delete product'); }
    }
  };

  const formatDate = (dateStr) => !dateStr ? 'Never' : new Date(dateStr).toLocaleString();
  const isOnline = (lastLogin) => lastLogin && new Date() - new Date(lastLogin) < 5 * 60 * 1000;

  const btnStyle = (color) => ({ background: color, color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '4px' });

  return (
    <div className="admin-dashboard">
      <h1>👑 Admin Control Panel</h1>
      <p className="admin-subtitle">Manage all users, products and system data</p>

      <div className="stats-grid">
        <div className="stat-card"><h3>{stats.totalUsers}</h3><p>Total Users</p></div>
        <div className="stat-card" style={{borderTop:'4px solid #22c55e'}}>
          <h3 style={{color:'#22c55e'}}>{stats.activeNow}</h3><p>🟢 Online Now</p>
        </div>
        <div className="stat-card"><h3>{stats.totalProducts}</h3><p>Total Products</p></div>
      </div>

      {success && <div style={{background:'#dcfce7',color:'#16a34a',padding:'10px',borderRadius:'8px',margin:'10px 0'}}>{success}</div>}
      {error && <div style={{background:'#fee2e2',color:'#dc2626',padding:'10px',borderRadius:'8px',margin:'10px 0'}}>{error}</div>}

      {/* Tabs */}
      <div style={{display:'flex', gap:'10px', margin:'20px 0'}}>
        <button onClick={() => setActiveTab('users')} style={{...btnStyle(activeTab==='users'?'#16a34a':'#6b7280'), padding:'10px 24px', fontSize:'15px'}}>👥 Users</button>
        <button onClick={() => setActiveTab('products')} style={{...btnStyle(activeTab==='products'?'#16a34a':'#6b7280'), padding:'10px 24px', fontSize:'15px'}}>📦 Products</button>
        <button onClick={() => setActiveTab('approval')} style={{...btnStyle(activeTab==='approval'?'#16a34a':'#6b7280'), padding:'10px 24px', fontSize:'15px'}}>✓ Approvals</button>
      </div>

      {loading ? <p style={{textAlign:'center',padding:'40px'}}>Loading...</p> : (
        <>
          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div className="users-section">
              <h2>All Registered Users</h2>
              <p className="section-subtitle">Live from MySQL — auto-refreshes every 30 seconds</p>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>Password</th><th>Role</th>
                    <th>Products</th><th>Last Login</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="8" style={{textAlign:'center',padding:'40px'}}>No users yet</td></tr>
                  ) : users.map(user => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td>{editingUser === user.id
                        ? <input value={editUserForm.name} onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})} style={{width:'100%',padding:'4px'}} />
                        : user.name}
                      </td>
                      <td>{editingUser === user.id
                        ? <input value={editUserForm.email} onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})} style={{width:'100%',padding:'4px'}} />
                        : user.email}
                      </td>
                      <td>{user.password || 'N/A'}</td>
                      <td>{editingUser === user.id
                        ? <select value={editUserForm.role} onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value})} style={{padding:'4px'}}>
                            <option value="FARMER">FARMER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        : <span className={`role-badge ${user.role}`}>{user.role}</span>}
                      </td>
                      <td>{user.productCount || 0}</td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td>{isOnline(user.lastLogin) ? <span style={{color:'#22c55e'}}>🟢 Online</span> : <span style={{color:'#9ca3af'}}>⚫ Offline</span>}</td>
                      <td>
                        {editingUser === user.id ? (
                          <>
                            <button onClick={() => saveUser(user.id)} style={btnStyle('#16a34a')}>✓ Save</button>
                            <button onClick={() => setEditingUser(null)} style={btnStyle('#6b7280')}>✕</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditUser(user)} style={btnStyle('#2563eb')}>✏ Edit</button>
                            <button onClick={() => deleteUser(user.id)} style={btnStyle('#dc2626')}>🗑 Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {activeTab === 'products' && (
            <div className="users-section">
              <h2>All Products</h2>
              <p className="section-subtitle">Manage all products from all users</p>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Category</th><th>Price (₹)</th>
                    <th>Quantity</th><th>Description</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="7" style={{textAlign:'center',padding:'40px'}}>No products yet</td></tr>
                  ) : products.map(product => (
                    <tr key={product.id}>
                      <td>#{product.id}</td>
                      <td>{editingProduct === product.id
                        ? <input value={editProductForm.name} onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})} style={{width:'100%',padding:'4px'}} />
                        : product.name}
                      </td>
                      <td>{editingProduct === product.id
                        ? <select value={editProductForm.category} onChange={(e) => setEditProductForm({...editProductForm, category: e.target.value})} style={{padding:'4px'}}>
                            <option value="Dairy & Honey">Dairy & Honey</option>
                            <option value="Pickles">Pickles</option>
                            <option value="Grains">Grains</option>
                            <option value="Spices">Spices</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Vegetables">Vegetables</option>
                            <option value="Other">Other</option>
                          </select>
                        : product.category}
                      </td>
                      <td>{editingProduct === product.id
                        ? <input type="number" value={editProductForm.price} onChange={(e) => setEditProductForm({...editProductForm, price: e.target.value})} style={{width:'80px',padding:'4px'}} />
                        : `₹${product.price}`}
                      </td>
                      <td>{editingProduct === product.id
                        ? <input type="number" value={editProductForm.stock} onChange={(e) => setEditProductForm({...editProductForm, stock: e.target.value})} style={{width:'70px',padding:'4px'}} />
                        : product.stock ?? 0}
                      </td>
                      <td>{editingProduct === product.id
                        ? <input value={editProductForm.description} onChange={(e) => setEditProductForm({...editProductForm, description: e.target.value})} style={{width:'100%',padding:'4px'}} />
                        : product.description?.substring(0, 40) + '...'}
                      </td>
                      <td>
                        {editingProduct === product.id ? (
                          <>
                            <button onClick={() => saveProduct(product.id)} style={btnStyle('#16a34a')}>✓ Save</button>
                            <button onClick={() => setEditingProduct(null)} style={btnStyle('#6b7280')}>✕</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditProduct(product)} style={btnStyle('#2563eb')}>✏ Edit</button>
                            <button onClick={() => deleteProduct(product.id)} style={btnStyle('#dc2626')}>🗑 Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PRODUCT APPROVAL TAB ── */}
          {activeTab === 'approval' && (
            <ProductApproval />
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
