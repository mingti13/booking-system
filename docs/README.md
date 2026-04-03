# Booking System - POS Application

A modern, full-stack booking and inventory management system with a professional POS interface.

## **Tech Stack**

- **Frontend**: React (POS UI with Simphony-inspired design)
- **Backend**: Express.js
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Hosting**: Heroku (or DigitalOcean/AWS)

---

## **Features**

✅ **POS System** - Add products to cart, checkout with customer info
✅ **Order Management** - View, confirm, cancel orders with payment tracking
✅ **Inventory Management** - Track stock, get alerts for low/critical stock
✅ **Sales Reports** - Daily/Weekly/Monthly revenue analytics
✅ **Product Management** - Add, edit, delete products
✅ **Professional UI** - Modern design with purple gradient theme

---

## **Project Structure**

```
webApp/
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── package.json                # Root workspace
├── docs/                       # Documentation
│   ├── README.md              # This file
│   ├── API.md                 # API endpoints reference
│   ├── DEVELOPMENT.md         # Development guide
│   └── HEROKU_DEPLOYMENT.md   # Heroku deployment
├── scripts/                    # Utility scripts
│   ├── backup-db.sh
│   └── reset-db.sh
├── database/                   # Database schema
│   └── init.sql
├── server/                     # Express API backend
│   ├── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── Procfile
├── client/                     # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
└── postgres_data/              # Database volume (auto-created)
```

---

## **Quick Start**

### **With Docker (Recommended)**
```bash
cd webApp
docker compose up
```

### **Without Docker**
See [DEVELOPMENT.md](./DEVELOPMENT.md) for local setup instructions.

---

## **Useful Commands**

| Command | Purpose |
|---------|---------|
| `docker compose up` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | View service logs |
| `docker compose ps` | View running containers |
| `npm run db:reset` | Reset database |
| `npm run db:backup` | Backup database |

---

## **Access Points**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432 (PostgreSQL)

---

## **Documentation**

- [API Reference](./API.md) - Complete API endpoints
- [Development Guide](./DEVELOPMENT.md) - Local setup & development

---

## **Support**

- [Docker Docs](https://docs.docker.com)
- [Express Docs](https://expressjs.com)
- [React Docs](https://react.dev)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---

**Version**: 1.0.0 | **Status**: Production Ready
