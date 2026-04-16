# E-Commerce MERN Stack Application

A complete e-commerce platform built with **MongoDB**, **Express**, **React**, and **Node.js** (MERN Stack).

## 🚀 Features

- Product catalog with filtering and search
- User authentication and authorization
- Shopping cart functionality
- Order management
- MongoDB Atlas database integration
- RESTful API with Express
- Responsive React frontend
- JWT authentication

## 📋 Prerequisites

- Node.js v16 or higher
- MongoDB Atlas account (free tier available)
- npm or yarn

## 🛠️ Setup Instructions

### 1. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is available)
3. Create a database user with a strong password
4. Add your IP address to the IP Whitelist
5. Get your connection string (it will look like this):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
   ```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB Atlas URI
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
# PORT=5000
# NODE_ENV=development

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The frontend will run on `http://localhost:3000`

## 📝 API Endpoints

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

## 📁 Project Structure

```
e-comares/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── productController.js
│   ├── models/
│   │   ├── Product.js
│   │   ├── User.js
│   │   └── Order.js
│   ├── routes/
│   │   └── productRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   └── ProductCard.js
│   │   ├── pages/
│   │   │   ├── ProductList.js
│   │   │   ├── ProductDetail.js
│   │   │   └── Cart.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## 🔧 Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **CSS3** - Styling

## 📚 Sample Data

To add sample products to your database, you can use:

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "description": "This is a sample product",
    "price": 999,
    "category": "Electronics",
    "stock": 10,
    "image": "https://via.placeholder.com/400"
  }'
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify your MongoDB Atlas connection string is correct
- Check if your IP address is added to the whitelist
- Ensure your username and password are correct

### CORS Errors
- Ensure the backend is running on `http://localhost:5000`
- Check the `CLIENT_URL` in your backend `.env` file

### Port Already in Use
- Change the PORT in `.env` file to an available port

## 📦 Deployment

### Backend (Heroku/Railway)
```bash
npm install -g heroku
heroku login
heroku create your-app-name
git push heroku main
```

### Frontend (Vercel)
```bash
npm install -g vercel
vercel
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For issues and questions, please create an issue on GitHub.

---

Happy Coding! 🎉
