# Print Catalog Ordering Web App

This is a full-stack web application for managing and ordering prints, with admin and user features as described in your requirements.

## Tech Stack
- Frontend: React + Material-UI
- Backend: Node.js + Express
- Database: SQLite (easy to migrate to Postgres)

## Project Structure
- `client/` - React frontend
- `server/` - Express backend

## Setup Instructions

### 1. Backend
```
cd server
npm install
npm run dev
```

### 2. Frontend
```
cd client
npm install
npm start
```

The frontend will run on http://localhost:3000 and the backend on http://localhost:5000 by default.

---

## Features

### Admin
- Upload Excel catalog of prints
- Manage prints (add/edit/delete)
- Edit announcement header
- View all orders, update status (pending/ordered)
- See registered user count

### Users
- Register, login, edit profile
- View/search prints
- Place orders (quantity, description, Google Photos link)
- View, edit, delete own orders

---

## Environment Variables
- See `server/.env.example` for backend configuration.

---

## To Do
- Implement authentication (JWT)
- Implement print, order, user management
- Excel upload and parsing
- Responsive, modern UI

---

## License
MIT
