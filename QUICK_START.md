# 🚀 QUICK START GUIDE

## Step 1: MongoDB Atlas Setup (Required First)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a free account
3. Create a new cluster (select "Free" tier)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `ecommerce_user`
   - Password: `YourStrongPassword123` (save this!)
5. Allow network access:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your IP)
6. Get your connection string:
   - Go to "Clusters" and click "Connect"
   - Choose "Drivers" > "Node.js"
   - Copy the connection string
   - It should look like: `mongodb+srv://ecommerce_user:password@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority`

## Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file and update these values:
# MONGODB_URI=<your MongoDB Atlas connection string>
# PORT=5000
# NODE_ENV=development
# JWT_SECRET=your_jwt_secret_key_here
# CLIENT_URL=http://localhost:3000
# OTP_SECRET=any_strong_random_secret
# TWILIO_ACCOUNT_SID=optional_for_real_sms
# TWILIO_AUTH_TOKEN=optional_for_real_sms
# TWILIO_PHONE_NUMBER=optional_for_real_sms

# Seed sample products to database (optional)
npm run seed

# Start backend server
npm run dev
```

Backend will be available at: **http://localhost:5000**

## Step 3: Frontend Setup

```bash
# In a new terminal, navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

Frontend will open at: **http://localhost:3000**

## 🎯 What You Can Do Now

1. **View Products** - Browse all products on the home page
2. **Add to Cart** - Click "Add to Cart" on any product
3. **View Cart** - Go to Cart page and see all items
4. **Update Quantities** - Change quantity in cart
5. **Remove Items** - Remove items from cart

## 📊 API Endpoints (Backend)

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/health` - Check server status

## 🔧 Troubleshooting

### Error: "MongooseError: Cannot connect to MongoDB"
- Check your MONGODB_URI in .env file
- Verify MongoDB Atlas cluster is running
- Make sure IP is whitelisted in MongoDB Atlas

### Error: "CORS Error" 
- Backend must be running on http://localhost:5000
- Frontend proxy setting is correct in package.json

### Port Already in Use
- Backend: Change PORT in .env to different number (e.g., 5001)
- Frontend: `npm start -- --port 3001`

## 📝 Sample Product Data

8 sample products are automatically added when you run:
```bash
npm run seed
```

Includes: Headphones, Smart Watch, Backpack, T-Shirt, Running Shoes, Books, etc.

## 🎨 Customization

- Edit `backend/seed.js` to add more sample products
- Modify `frontend/src/App.css` for styling changes
- Add more categories in `backend/models/Product.js`

## 📚 Next Steps

1. Add user authentication (sign up/login)
2. Implement payment gateway (Stripe/Razorpay)
3. Add user profile and order history
4. Implement search and filter functionality
5. Add admin dashboard
6. Deploy to production (Heroku, Vercel, etc.)

---

Happy Coding! 🎉

For more details, see the main **README.md** file.
