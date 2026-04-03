const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// PRODUCTS ENDPOINTS
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || !price || stock === undefined) {
    return res.status(400).json({ error: 'Name, price, and stock required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
      [name, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, stock } = req.body;
  if (!name || !price || stock === undefined) {
    return res.status(400).json({ error: 'Name, price, and stock required' });
  }

  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *',
      [name, price, stock, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/products/:id/stock', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  if (quantity === undefined) return res.status(400).json({ error: 'Quantity required' });

  try {
    const result = await pool.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// BOOKINGS ENDPOINTS
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, p.name as product_name, p.price as product_price
      FROM bookings b
      LEFT JOIN products p ON b.product_id = p.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { customer_name, customer_phone, product_id, quantity, delivery_date, remark } = req.body;
  if (!customer_name || !customer_phone || !product_id || !quantity || !delivery_date) {
    return res.status(400).json({ error: 'Customer name, phone, product, quantity, and delivery date required' });
  }

  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (product.rows[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const booking = await pool.query(
      `INSERT INTO bookings (customer_name, customer_phone, product_id, quantity, delivery_date, remark, status, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [customer_name, customer_phone, product_id, quantity, delivery_date, remark || '', 'pending', false]
    );

    await pool.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, product_id]
    );

    res.status(201).json(booking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const { status, is_paid } = req.body;
  if (!status && is_paid === undefined) return res.status(400).json({ error: 'Status or is_paid required' });

  try {
    const currentBooking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (currentBooking.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const { status: currentStatus, product_id, quantity } = currentBooking.rows[0];

    if (status === 'confirmed' && currentStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cannot confirm a cancelled booking' });
    }

    let updateQuery = 'UPDATE bookings SET';
    const updateValues = [];
    let paramCount = 1;

    if (status) {
      updateQuery += ` status = $${paramCount}`;
      updateValues.push(status);
      paramCount++;
    }

    if (is_paid !== undefined) {
      if (status) updateQuery += ',';
      updateQuery += ` is_paid = $${paramCount}`;
      updateValues.push(is_paid);
      paramCount++;
    }

    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    updateValues.push(id);

    const result = await pool.query(updateQuery, updateValues);

    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      await pool.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [quantity, product_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// REPORTS ENDPOINTS
app.get('/api/reports/sales/:period', async (req, res) => {
  const { period } = req.params;
  let dateFilter = '';

  if (period === 'daily') {
    dateFilter = `WHERE DATE(b.created_at) = CURRENT_DATE`;
  } else if (period === 'weekly') {
    dateFilter = `WHERE b.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
  } else if (period === 'monthly') {
    dateFilter = `WHERE DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)`;
  } else {
    return res.status(400).json({ error: 'Invalid period' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.name as product_name, 
        COUNT(b.id) as total_bookings,
        SUM(b.quantity) as total_quantity,
        SUM(b.quantity * p.price) as total_sales,
        p.price
      FROM bookings b
      LEFT JOIN products p ON b.product_id = p.id
      ${dateFilter}
      AND b.status = 'confirmed'
      GROUP BY p.id, p.name, p.price
      ORDER BY total_sales DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/reports/inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        price,
        stock,
        CASE 
          WHEN stock < 5 THEN 'critical'
          WHEN stock < 10 THEN 'low'
          ELSE 'normal'
        END as status,
        CASE
          WHEN stock < 5 THEN CEIL(stock * 3)
          WHEN stock < 10 THEN CEIL(stock * 2)
          ELSE CEIL(stock * 1.5)
        END as recommended_stock
      FROM products
      ORDER BY stock ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Fallback to React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Initialize DB
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL,
        delivery_date TIMESTAMP NOT NULL,
        remark TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        is_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('Database initialized');
  } catch (err) {
    console.error('DB init error:', err);
  }
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await initDB();
  console.log(`Server running on port ${PORT}`);
});
