# Development Guide

Complete setup and development instructions.

## **Prerequisites**

- **For Docker setup**: Docker & Docker Compose installed
- **For local setup**: Node.js 20+, PostgreSQL 16+, npm/yarn

---

## **Development with Docker (Recommended)**

### Start All Services
```bash
cd webApp
docker compose up
```

This will start:
- **Frontend**: React dev server (http://localhost:3000)
- **Backend**: Express API (http://localhost:3001)
- **Database**: PostgreSQL (localhost:5432)

### First Run
On first run, the database is automatically initialized with tables and schema.

### Hot Reload
Both client and server have file watching enabled:

**Client Changes:**
- Edit files in `client/src/` or `client/public/`
- Browser auto-refreshes

**Server Changes:**
- Edit files in `server/`
- Server auto-restarts (via nodemon)

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f server
docker compose logs -f client
docker compose logs -f db
```

### Stop Services
```bash
docker compose down
```

### Reset Database
```bash
# Stop everything and remove volumes
docker compose down -v

# Restart (database will reinitialize)
docker compose up
```

---

## **Local Development (Without Docker)**

### 1. Set Up Database
```bash
# Install PostgreSQL
# macOS: brew install postgresql@16
# Ubuntu: sudo apt install postgresql

# Start PostgreSQL
brew services start postgresql@16

# Create database
psql -U postgres -c "CREATE DATABASE webapp;"

# Initialize schema
psql -U postgres -d webapp < database/init.sql
```

### 2. Start Backend
```bash
cd webApp/server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_NAME=webapp
DB_PORT=5432
NODE_ENV=development
PORT=3001
EOF

# Start server
npm run dev
```

Server runs on http://localhost:3001

### 3. Start Frontend (New Terminal)
```bash
cd webApp/client

# Install dependencies
npm install

# Create .env file (if needed)
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env

# Start dev server
npm start
```

Frontend runs on http://localhost:3000

---

## **Database Access**

### Docker
```bash
# Access PostgreSQL shell
docker compose exec db psql -U postgres -d webapp

# Useful commands in psql:
# \dt              - List tables
# \d products      - Show products table schema
# SELECT * FROM products;  - Query products
```

### Local
```bash
psql -U postgres -d webapp

# Same psql commands as above
```

---

## **Environment Variables**

### Backend (server/.env)
```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_NAME=webapp
DB_PORT=5432

# Server
PORT=3001
NODE_ENV=development

# Optional (for production)
DATABASE_URL=postgresql://user:password@host:5432/webapp
```

### Frontend (client/.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## **Building for Production**

### Docker Build
```bash
# Build images
docker compose build

# Start production-like containers
docker compose up
```

### Local Build
```bash
# Client
cd webApp/client
npm run build
# Output: client/build/

# Backend
cd webApp/server
npm install --production
NODE_ENV=production npm start
```

---

## **Common Tasks**

### Add a Backend Dependency
```bash
cd server
npm install <package-name>
```

### Add a Frontend Dependency
```bash
cd client
npm install <package-name>
```

### Run Database Migrations/Scripts
```bash
# Via Docker
docker compose exec db psql -U postgres -d webapp < script.sql

# Local
psql -U postgres -d webapp < script.sql
```

### Check What's Running
```bash
docker compose ps
```

### Clean Rebuild
```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get products
curl http://localhost:3001/api/products

# Create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":9.99,"stock":10}'
```

---

## **Debugging**

### Check Container Logs
```bash
docker compose logs -f [service-name]
```

### Inspect Container
```bash
docker compose exec [service-name] sh
```

### Database Issues
```bash
# Check if database is healthy
docker compose exec db pg_isready -U postgres

# View PostgreSQL logs
docker compose logs db

# Rebuild database
docker compose down -v
docker compose up
```

### Port Already in Use
```bash
# Find process on port
lsof -i :3000   # Frontend
lsof -i :3001   # Backend
lsof -i :5432   # Database

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Node Modules Issues
```bash
# Clear and reinstall
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## **Project Structure Reference**

```
server/
├── index.js           # Express app & database logic
├── package.json       # Dependencies
├── Dockerfile         # Container config
├── Procfile          # Heroku config
└── node_modules/

client/
├── src/
│   └── index.js      # React app entry point
├── public/
│   └── index.html    # HTML template
├── package.json      # Dependencies
├── Dockerfile        # Container config
├── nginx.conf        # Web server config
└── node_modules/
```

---

## **Tips & Best Practices**

1. **Always use `docker compose watch`** for development
2. **Commit `package.json` & `package-lock.json`** to version control
3. **Don't commit `node_modules/`** (add to `.gitignore`)
4. **Test APIs in Docker** before deploying
5. **Use environment variables** for sensitive data
6. **Keep `.env` files local** (add to `.gitignore`)

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| Port 3000/3001 in use | Change ports in `docker-compose.yml` |
| Database won't start | Run `docker compose down -v && docker compose up` |
| Node modules error | Delete `node_modules/` and rebuild |
| API not responding | Check backend logs: `docker compose logs server` |
| Frontend can't reach API | Verify `REACT_APP_API_URL` environment variable |

---

## **Next Steps**

- Review [API.md](./API.md) for endpoint documentation
- Check `database/init.sql` for schema details
- See [HEROKU_DEPLOYMENT.md](./HEROKU_DEPLOYMENT.md) for production deploy
