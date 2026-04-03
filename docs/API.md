# API Reference

Complete documentation of all available endpoints.

## **Base URL**

```
http://localhost:3001/api
```

---

## **Health Check**

### Get Server Status
```
GET /health
```

**Response:**
```json
{ "status": "ok" }
```

---

## **Products**

### List All Products
```
GET /products
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Coffee",
    "price": "3.50",
    "stock": 20,
    "created_at": "2026-04-15T10:30:00Z"
  }
]
```

---

### Create Product
```
POST /products
Content-Type: application/json

{
  "name": "Espresso",
  "price": 2.50,
  "stock": 15
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "Espresso",
  "price": "2.50",
  "stock": 15,
  "created_at": "2026-04-15T10:35:00Z"
}
```

---

### Update Product
```
PUT /products/:id
Content-Type: application/json

{
  "name": "Updated Coffee",
  "price": 4.00,
  "stock": 25
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Coffee",
  "price": "4.00",
  "stock": 25,
  "created_at": "2026-04-15T10:30:00Z"
}
```

---

### Adjust Stock
```
PUT /products/:id/stock
Content-Type: application/json

{
  "quantity": 5
}
```

**Notes:**
- Positive number: increase stock
- Negative number: decrease stock

**Response:**
```json
{
  "id": 1,
  "name": "Coffee",
  "price": "3.50",
  "stock": 25,
  "created_at": "2026-04-15T10:30:00Z"
}
```

---

## **Bookings (Orders)**

### List All Bookings
```
GET /bookings
```

**Response:**
```json
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "customer_phone": "555-1234",
    "product_id": 1,
    "product_name": "Coffee",
    "product_price": "3.50",
    "quantity": 2,
    "delivery_date": "2026-04-16T14:00:00Z",
    "remark": "Extra hot",
    "status": "pending",
    "is_paid": false,
    "created_at": "2026-04-15T10:35:00Z"
  }
]
```

---

### Create Booking
```
POST /bookings
Content-Type: application/json

{
  "customer_name": "Jane Smith",
  "customer_phone": "555-5678",
  "product_id": 1,
  "quantity": 3,
  "delivery_date": "2026-04-17T10:00:00Z",
  "remark": "For office meeting"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "customer_name": "Jane Smith",
  "customer_phone": "555-5678",
  "product_id": 1,
  "quantity": 3,
  "delivery_date": "2026-04-17T10:00:00Z",
  "remark": "For office meeting",
  "status": "pending",
  "is_paid": false,
  "created_at": "2026-04-15T10:40:00Z"
}
```

**Status Codes:**
- `201`: Booking created successfully
- `400`: Insufficient stock or missing required fields
- `404`: Product not found
- `500`: Database error

---

### Update Booking
```
PUT /bookings/:id
Content-Type: application/json

{
  "status": "confirmed",
  "is_paid": true
}
```

**Status Values:**
- `pending` - Initial state
- `confirmed` - Order confirmed
- `cancelled` - Order cancelled (stock restored)

**Response:**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "customer_phone": "555-1234",
  "product_id": 1,
  "quantity": 2,
  "delivery_date": "2026-04-16T14:00:00Z",
  "remark": "Extra hot",
  "status": "confirmed",
  "is_paid": true,
  "created_at": "2026-04-15T10:35:00Z"
}
```

---

## **Reports**

### Sales Report by Period
```
GET /reports/sales/:period
```

**Period Values:** `daily`, `weekly`, `monthly`

**Response:**
```json
[
  {
    "id": 1,
    "product_name": "Coffee",
    "total_bookings": 5,
    "total_quantity": 12,
    "total_sales": "42.00",
    "price": "3.50"
  }
]
```

**Examples:**
```
GET /reports/sales/daily   # Today's sales
GET /reports/sales/weekly  # Last 7 days
GET /reports/sales/monthly # Current month
```

---

### Inventory Report
```
GET /reports/inventory
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Coffee",
    "price": "3.50",
    "stock": 5,
    "status": "low",
    "recommended_stock": 10
  },
  {
    "id": 2,
    "name": "Espresso",
    "price": "2.50",
    "stock": 2,
    "status": "critical",
    "recommended_stock": 6
  }
]
```

**Status Indicators:**
- 🟢 `normal` - Stock > 10 units
- 🟠 `low` - Stock 5-10 units
- 🔴 `critical` - Stock < 5 units

---

## **Error Responses**

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `400` - Bad request (missing fields, insufficient stock)
- `404` - Resource not found
- `500` - Server error

---

## **Testing with cURL**

### Create a product
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tea",
    "price": 2.00,
    "stock": 30
  }'
```

### Get all products
```bash
curl http://localhost:3001/api/products
```

### Create a booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Alice",
    "customer_phone": "555-1111",
    "product_id": 1,
    "quantity": 2,
    "delivery_date": "2026-04-16T15:00:00Z",
    "remark": "Cold brew"
  }'
```

### Get daily sales
```bash
curl http://localhost:3001/api/reports/sales/daily
```

---

## **Notes**

- All timestamps are in ISO 8601 format (UTC)
- Prices are returned as strings to preserve decimal precision
- Stock adjustments are atomic to prevent race conditions
- Cancelled orders automatically restore product stock
