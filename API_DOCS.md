# 📚 API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Products Endpoints

### 1. Get All Products
```
GET /products
```

**Description:** Retrieve all products from the database

**Response:**
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wireless Headphones",
      "description": "High-quality wireless headphones...",
      "price": 2999,
      "category": "Electronics",
      "stock": 25,
      "image": "https://...",
      "ratings": 4.5,
      "numReviews": 128,
      "createdAt": "2024-04-15T10:00:00Z",
      "updatedAt": "2024-04-15T10:00:00Z"
    }
  ]
}
```

---

### 2. Get Single Product
```
GET /products/:id
```

**Description:** Retrieve a specific product by ID

**Parameters:**
- `id` (string, required) - MongoDB ObjectId of the product

**Example:**
```
GET /products/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones...",
    "price": 2999,
    "category": "Electronics",
    "stock": 25,
    "image": "https://...",
    "ratings": 4.5,
    "numReviews": 128,
    "createdAt": "2024-04-15T10:00:00Z",
    "updatedAt": "2024-04-15T10:00:00Z"
  }
}
```

---

### 3. Create Product
```
POST /products
```

**Description:** Create a new product (admin only)

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 1999,
  "category": "Electronics",
  "stock": 50,
  "image": "https://via.placeholder.com/400"
}
```

**Valid Categories:**
- Electronics
- Clothing
- Books
- Home
- Sports
- Other

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "New Product",
    "description": "Product description",
    "price": 1999,
    "category": "Electronics",
    "stock": 50,
    "image": "https://via.placeholder.com/400",
    "ratings": 0,
    "numReviews": 0,
    "createdAt": "2024-04-15T10:00:00Z",
    "updatedAt": "2024-04-15T10:00:00Z"
  }
}
```

---

### 4. Update Product
```
PUT /products/:id
```

**Description:** Update an existing product

**Parameters:**
- `id` (string, required) - MongoDB ObjectId of the product

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 2499,
  "stock": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Product Name",
    "description": "...",
    "price": 2499,
    "category": "Electronics",
    "stock": 30,
    "image": "https://...",
    "ratings": 4.5,
    "numReviews": 128,
    "updatedAt": "2024-04-15T11:00:00Z"
  }
}
```

---

### 5. Delete Product
```
DELETE /products/:id
```

**Description:** Delete a product from the database

**Parameters:**
- `id` (string, required) - MongoDB ObjectId of the product

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Health Check

### Get Server Status
```
GET /health
```

**Response:**
```json
{
  "message": "Server is running",
  "status": "OK"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Product name is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Using cURL Examples

### Get all products
```bash
curl http://localhost:5000/api/products
```

### Get single product
```bash
curl http://localhost:5000/api/products/507f1f77bcf86cd799439011
```

### Create a product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 79999,
    "category": "Electronics",
    "stock": 5,
    "image": "https://via.placeholder.com/400"
  }'
```

### Update a product
```bash
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 84999,
    "stock": 3
  }'
```

### Delete a product
```bash
curl -X DELETE http://localhost:5000/api/products/507f1f77bcf86cd799439011
```

---

## Future Enhancements

- [ ] User Authentication endpoints (POST /auth/signup, POST /auth/login)
- [ ] Order management endpoints (POST /orders, GET /orders/:userId)
- [ ] Payment integration endpoints
- [ ] Search and filter functionality
- [ ] Review and rating system
- [ ] Wishlist management

---

## Data Models

### Product Schema
```javascript
{
  _id: ObjectId,
  name: String (required, max 100 chars),
  description: String (required, max 1000 chars),
  price: Number (required, min 0),
  category: String (enum: ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other']),
  stock: Number (required, min 0, default 0),
  image: String (default: placeholder URL),
  ratings: Number (0-5, default 0),
  numReviews: Number (default 0),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

---

For more information, refer to the main README.md file.
