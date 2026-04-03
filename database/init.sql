-- Initialize Booking System Database
-- Run this once on first startup

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bookings table
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
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Insert sample data (optional - remove if not needed)
INSERT INTO products (name, price, stock) VALUES
  ('Espresso', 2.50, 30),
  ('Cappuccino', 3.50, 25),
  ('Latte', 3.75, 20),
  ('Americano', 2.75, 35),
  ('Mocha', 4.00, 15)
ON CONFLICT DO NOTHING;

-- Add timestamps
COMMENT ON TABLE products IS 'Product catalog with pricing and stock levels';
COMMENT ON TABLE bookings IS 'Customer orders with delivery and payment tracking';
