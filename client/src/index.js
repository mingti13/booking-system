import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Global Styles
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    background: #f8f9fa;
    color: #2c3e50;
    line-height: 1.6;
  }
  
  input, textarea, select {
    font-family: inherit;
  }
  
  button {
    font-family: inherit;
    transition: all 0.2s ease;
  }
`;

// Inject global styles
const style = document.createElement('style');
style.textContent = globalStyles;
document.head.appendChild(style);

function App() {
  const [view, setView] = useState('pos');
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [salesReport, setSalesReport] = useState([]);
  const [inventoryReport, setInventoryReport] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('daily');
  const [searchTerm, setSearchTerm] = useState('');

  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '' });
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_date: '',
    remark: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchBookings();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createBooking = async (e) => {
    e.preventDefault();
    if (!checkoutForm.customer_name || !checkoutForm.customer_phone || !checkoutForm.delivery_date || cart.length === 0) {
      alert('Please fill all fields and add items to cart');
      return;
    }

    setLoading(true);
    try {
      for (const item of cart) {
        await axios.post(`${API_URL}/bookings`, {
          customer_name: checkoutForm.customer_name,
          customer_phone: checkoutForm.customer_phone,
          product_id: item.id,
          quantity: item.quantity,
          delivery_date: checkoutForm.delivery_date,
          remark: checkoutForm.remark || '',
        });
      }
      setCart([]);
      setCheckoutForm({ customer_name: '', customer_phone: '', delivery_date: '', remark: '' });
      setShowCheckoutModal(false);
      await fetchBookings();
      await fetchProducts();
      alert('Order placed successfully!');
    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err.response?.data?.error || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || productForm.stock === '') return;
    setLoading(true);

    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, {
          name: productForm.name,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
        });
        alert('Product updated!');
      } else {
        await axios.post(`${API_URL}/products`, {
          name: productForm.name,
          price: parseFloat(productForm.price),
          stock: parseInt(productForm.stock),
        });
        alert('Product added!');
      }
      setProductForm({ name: '', price: '', stock: '' });
      setShowAddProductModal(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    setShowAddProductModal(true);
  };

  const fetchSalesReport = async (period) => {
    try {
      const response = await axios.get(`${API_URL}/reports/sales/${period}`);
      setSalesReport(response.data);
    } catch (err) {
      console.error('Error fetching sales report:', err);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports/inventory`);
      setInventoryReport(response.data);
    } catch (err) {
      console.error('Error fetching inventory report:', err);
    }
  };

  const updateBookingStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/bookings/${id}`, { status: newStatus });
      await fetchBookings();
      await fetchProducts();
      if (newStatus === 'cancelled') {
        alert('Order cancelled and stock restored!');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order');
    }
  };

  const updateBookingPaid = async (id, isPaid) => {
    try {
      await axios.put(`${API_URL}/bookings/${id}`, { is_paid: isPaid });
      await fetchBookings();
    } catch (err) {
      alert('Failed to update payment status');
    }
  };

  const handleReportPeriodChange = (period) => {
    setReportPeriod(period);
    fetchSalesReport(period);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: 'pos', icon: '🛒', label: 'POS' },
    { id: 'orders', icon: '📋', label: 'Orders' },
    { id: 'reports', icon: '📊', label: 'Reports' },
    { id: 'products', icon: '📦', label: 'Products' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <div style={{
        width: '70px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '24px',
        gap: '16px',
      }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setView(item.id);
              if (item.id === 'reports') {
                fetchSalesReport(reportPeriod);
                fetchInventoryReport();
              }
            }}
            title={item.label}
            style={{
              width: '50px',
              height: '50px',
              background: view === item.id ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (view !== item.id) e.target.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              if (view !== item.id) e.target.style.background = 'transparent';
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e6ed',
          padding: '20px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '600',
            color: '#2c3e50',
            letterSpacing: '-0.5px',
          }}>
            {view === 'pos' && '🛒 Point of Sale'}
            {view === 'orders' && '📋 Order Management'}
            {view === 'reports' && '📊 Analytics & Reports'}
            {view === 'products' && '📦 Product Catalog'}
          </h1>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
          {view === 'pos' && (
            <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
              {/* Products Grid */}
              <div style={{ flex: 2 }}>
                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '12px 16px',
                      border: '1px solid #e0e6ed',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}>
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      style={{
                        padding: '16px',
                        background: product.stock === 0 
                          ? '#f0f1f4' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: product.stock === 0 ? '#999' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        opacity: product.stock === 0 ? 0.6 : 1,
                        boxShadow: product.stock === 0 ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.2)',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock > 0) {
                          e.target.style.transform = 'translateY(-4px)';
                          e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock > 0) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                        }
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>
                        ${product.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Stock: {product.stock}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({ name: '', price: '', stock: '' });
                    setShowAddProductModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#667eea';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#667eea';
                  }}
                >
                  + Add Product
                </button>
              </div>

              {/* Cart Panel */}
              <div style={{
                flex: 1,
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '320px',
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
                  Shopping Cart
                </h3>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛒</div>
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '12px',
                          background: '#f8f9fa',
                          marginBottom: '10px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          border: '1px solid #e0e6ed',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <strong style={{ color: '#2c3e50' }}>{item.name}</strong>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f44336',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              style={{
                                background: '#e0e6ed',
                                border: 'none',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600',
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                              style={{
                                width: '40px',
                                padding: '4px',
                                textAlign: 'center',
                                border: '1px solid #e0e6ed',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            />
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              style={{
                                background: '#e0e6ed',
                                border: 'none',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600',
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div style={{ fontWeight: '600', color: '#667eea' }}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ borderTop: '1px solid #e0e6ed', paddingTop: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#666',
                  }}>
                    <span>Items:</span>
                    <strong>{cartItems}</strong>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#667eea',
                  }}>
                    <span>Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setShowCheckoutModal(true)}
                    disabled={cart.length === 0}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: cart.length === 0 ? '#ddd' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      if (cart.length > 0) {
                        e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (cart.length > 0) {
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'orders' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px',
              }}>
                {bookings.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: '#999', fontSize: '16px' }}>No orders yet</p>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div
                      key={b.id}
                      style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: '1px solid #e0e6ed',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{b.customer_name}</strong>
                        <span style={{
                          background: b.status === 'confirmed' ? '#d4edda' : b.status === 'cancelled' ? '#f8d7da' : '#fff3cd',
                          color: b.status === 'confirmed' ? '#155724' : b.status === 'cancelled' ? '#721c24' : '#856404',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          {b.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', lineHeight: '1.6' }}>
                        <div>📞 {b.customer_phone}</div>
                        <div>📦 {b.product_name}</div>
                        <div>🔢 {b.quantity}x @ ${b.product_price} = <strong style={{ color: '#667eea' }}>${(b.quantity * b.product_price).toFixed(2)}</strong></div>
                        <div>📅 {new Date(b.delivery_date).toLocaleDateString()}</div>
                        {b.remark && <div style={{ fontStyle: 'italic', marginTop: '8px', color: '#999' }}>💬 {b.remark}</div>}
                      </div>

                      <div style={{
                        background: b.is_paid ? '#d4edda' : '#f8d7da',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: b.is_paid ? '#155724' : '#721c24',
                      }}>
                        {b.is_paid ? '✓ Paid' : '✗ Unpaid'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          disabled={b.status === 'cancelled'}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: b.status === 'cancelled' ? '#ddd' : '#d4edda',
                            color: b.status === 'cancelled' ? '#999' : '#155724',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: b.status === 'cancelled' ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateBookingStatus(b.id, 'cancelled')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#f8d7da',
                            color: '#721c24',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateBookingPaid(b.id, !b.is_paid)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: b.is_paid ? '#fff3cd' : '#cfe2ff',
                            color: b.is_paid ? '#856404' : '#084298',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {b.is_paid ? 'Unpaid' : 'Paid'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'reports' && (
            <div>
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#2c3e50' }}>Sales Report</h2>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {['daily', 'weekly', 'monthly'].map(period => (
                    <button
                      key={period}
                      onClick={() => handleReportPeriodChange(period)}
                      style={{
                        padding: '10px 20px',
                        background: reportPeriod === period ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                        color: reportPeriod === period ? 'white' : '#666',
                        border: '1px solid #e0e6ed',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {salesReport.length === 0 ? (
                    <p style={{ color: '#999' }}>No sales data for this period</p>
                  ) : (
                    <>
                      {salesReport.map(item => (
                        <div
                          key={item.id}
                          style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid #e0e6ed',
                          }}
                        >
                          <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{item.product_name}</strong>
                          <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                            <div>Orders: <strong>{item.total_bookings}</strong></div>
                            <div>Quantity: <strong>{item.total_quantity}</strong></div>
                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e0e6ed', fontSize: '18px', fontWeight: '700', color: '#667eea' }}>
                              ${parseFloat(item.total_sales).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '24px',
                        borderRadius: '12px',
                        color: 'white',
                        gridColumn: 'span 1',
                      }}>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Revenue</div>
                        <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>
                          ${salesReport.reduce((sum, item) => sum + parseFloat(item.total_sales || 0), 0).toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#2c3e50' }}>Inventory Status</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {inventoryReport.length === 0 ? (
                    <p style={{ color: '#999' }}>No inventory data</p>
                  ) : (
                    inventoryReport.map(item => (
                      <div
                        key={item.id}
                        style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: `2px solid ${item.status === 'critical' ? '#f44336' : item.status === 'low' ? '#ff9800' : '#4caf50'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{item.name}</strong>
                          <span style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: item.status === 'critical' ? '#f44336' : item.status === 'low' ? '#ff9800' : '#4caf50',
                          }}>
                            {item.stock}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                          <div>Price: ${item.price}</div>
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e0e6ed' }}>
                            Status: <strong style={{
                              color: item.status === 'critical' ? '#f44336' : item.status === 'low' ? '#ff9800' : '#4caf50',
                            }}>
                              {item.status === 'critical' ? '🔴 Critical' : item.status === 'low' ? '🟠 Low' : '🟢 Normal'}
                            </strong>
                          </div>
                          <div>Recommended: <strong>{item.recommended_stock}</strong></div>
                        </div>
                        {item.status === 'critical' && (
                          <div style={{ marginTop: '12px', padding: '8px', background: '#ffebee', borderRadius: '6px', fontSize: '12px', color: '#f44336', fontWeight: '600' }}>
                            ⚠️ Reorder immediately!
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {view === 'products' && (
            <div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({ name: '', price: '', stock: '' });
                  setShowAddProductModal(true);
                }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                }}
              >
                + Add New Product
              </button>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
              }}>
                {products.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      border: '1px solid #e0e6ed',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    }}
                  >
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                      {p.name}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.8' }}>
                      <div>Price: <strong style={{ color: '#667eea' }}>${p.price.toFixed(2)}</strong></div>
                      <div>Stock: <strong>{p.stock}</strong></div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditModal(p)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Edit Product
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#2c3e50' }}>
              Checkout
            </h2>
            <form onSubmit={createBooking}>
              {[
                { label: 'Customer Name', key: 'customer_name', type: 'text', placeholder: 'John Doe' },
                { label: 'Phone Number', key: 'customer_phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
                { label: 'Delivery Date & Time', key: 'delivery_date', type: 'datetime-local' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={checkoutForm[field.key]}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e6ed',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                  />
                </div>
              ))}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                  Remark
                </label>
                <textarea
                  value={checkoutForm.remark}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, remark: e.target.value })}
                  placeholder="Add any additional notes..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e6ed',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    height: '80px',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                />
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Total Items:</span>
                  <strong>{cartItems}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#667eea',
                }}>
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: loading ? '#ddd' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#2c3e50' }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={addProduct}>
              {[
                { label: 'Product Name', key: 'name', type: 'text', placeholder: 'Product name' },
                { label: 'Price', key: 'price', type: 'number', placeholder: '0.00' },
                { label: 'Stock', key: 'stock', type: 'number', placeholder: '0' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={productForm[field.key]}
                    onChange={(e) => setProductForm({ ...productForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e6ed',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e6ed'}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                    setProductForm({ name: '', price: '', stock: '' });
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    color: '#667eea',
                    border: '2px solid #667eea',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: loading ? '#ddd' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
