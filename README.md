# E-Shop Essentials 🛒

A full-stack e-commerce web application that provides a complete online shopping experience with product browsing, category filtering, search, shopping cart, checkout, user authentication, order tracking, and an admin dashboard for product and order management.

## 📌 Project Overview

E-Shop Essentials is designed as a real-world e-commerce application where users can browse products across multiple categories, add products to their cart, place orders, and track their order status.

The application also includes an admin dashboard that allows authorized administrators to manage products, inventory, and customer orders.

All important application data is stored using a persistent backend database.

## ✨ Features

### 👤 User Features

- User registration and authentication
- User login and logout
- Browse products
- Product category filtering
- Search products
- View product details
- Add products to cart
- Update cart quantities
- Remove products from cart
- Checkout with shipping information
- Place orders
- View previous orders
- Track order status

### 🛍️ Product Categories

The application contains multiple products under the following categories:

- Audio
- Desk
- Home
- Apparel
- Travel
- Wearables
- Photo

The **All** category displays all available products.

### 🔎 Search & Filtering

Users can:

- Filter products by category
- Search products by name
- Combine search and category filtering
- View multiple products within each category

### 🛒 Shopping Cart

The shopping cart supports:

- Adding products
- Increasing/decreasing quantity
- Removing products
- Automatic total calculation
- Stock validation
- Checkout

### 💳 Checkout

The checkout system collects:

- Customer name
- Phone number
- Shipping address

After placing an order:

- The order is saved to the database
- Order items are created
- Product stock is reduced
- The cart is cleared
- The order becomes available in the user's Orders page

> Note: This project uses demo checkout functionality and does not process real payments.

## 📦 Order Tracking

Users can view their orders with:

- Order ID
- Product name
- Product image
- Quantity
- Product price
- Total amount
- Order date
- Shipping information
- Current order status

### Order Status

Orders can move through the following stages:

```text
Ordered
   ↓
Packed
   ↓
Shipped
   ↓
Out for Delivery
   ↓
Delivered
