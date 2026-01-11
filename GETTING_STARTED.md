# Getting Started with Cryptex Development

## Initial Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**AI Service:**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database Setup

**Create PostgreSQL database:**
```bash
createdb cryptex
```

**Initialize schema:**
```bash
psql cryptex < backend/src/database/schema.sql
```

**Or using Docker:**
```bash
docker run --name cryptex-postgres -e POSTGRES_PASSWORD=cryptex -e POSTGRES_DB=cryptex -p 5432:5432 -d postgres:16-alpine
```

### 3. Redis Setup

**Using Docker:**
```bash
docker run --name cryptex-redis -p 6379:6379 -d redis:7-alpine
```

**Or install locally:**
- macOS: `brew install redis && brew services start redis`
- Ubuntu: `sudo apt install redis-server && sudo systemctl start redis`

### 4. Environment Configuration

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cryptex
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret
AI_SERVICE_URL=http://localhost:5000
```

**Frontend:**
Create `.env` in frontend directory:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3001/ws
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Service:**
```bash
cd ai-service
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build
```

## Testing the Application

### 1. Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# AI service health
curl http://localhost:5000/health
```

### 2. Create a Test User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456!"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

Save the `accessToken` from the response for authenticated requests.

### 4. Test Trading Endpoints

```bash
# Get trading pairs
curl http://localhost:3000/api/v1/market/pairs

# Get ticker
curl http://localhost:3000/api/v1/market/ticker/BTCUSDT

# Place an order (requires authentication)
curl -X POST http://localhost:3000/api/v1/trading/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "buy",
    "type": "limit",
    "quantity": 0.001,
    "price": 45000
  }'
```

## Common Development Tasks

### Reset Database

```bash
psql cryptex < backend/src/database/schema.sql
```

### View Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service

# Database logs
docker-compose logs -f postgres
```

### Database Management

```bash
# Connect to database
docker exec -it cryptex-postgres psql -U postgres -d cryptex

# Common queries
SELECT * FROM users;
SELECT * FROM orders WHERE status = 'pending';
SELECT * FROM wallets;
```

### Redis Management

```bash
# Connect to Redis
docker exec -it cryptex-redis redis-cli

# Common commands
KEYS *
GET ticker:BTCUSDT
FLUSHALL  # Clear all cache
```

## Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Server auto-restarts with nodemon
   - Check logs for errors

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Vite hot-reloads automatically
   - Check browser console

3. **AI Service Changes:**
   - Edit files in `ai-service/`
   - Restart Flask server manually
   - Test with curl or Postman

### Adding New Features

1. **New API Endpoint:**
   - Add route in `backend/src/routes/`
   - Add controller in `backend/src/controllers/`
   - Update API documentation

2. **New Frontend Page:**
   - Create page in `frontend/src/pages/`
   - Add route in `frontend/src/App.tsx`
   - Update navigation

3. **New AI Feature:**
   - Add service in `ai-service/services/`
   - Add endpoint in `ai-service/app.py`
   - Update frontend to consume

## Debugging Tips

### Backend Debugging

```typescript
// Add debug logs
console.log('Debug:', variable);

// Check database queries
const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
console.log('Query result:', result.rows);
```

### Frontend Debugging

```typescript
// React Query DevTools
// Add to App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Database connection errors:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check firewall settings

**WebSocket connection failed:**
- Verify WS_PORT is correct
- Check CORS configuration
- Ensure backend is running

## Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Build with Docker
docker-compose build

# Deploy
docker-compose up -d
```

## Next Steps

1. ✅ Set up development environment
2. ✅ Run the application locally
3. ✅ Create test user and try features
4. 📚 Read API documentation
5. 🎨 Customize the frontend
6. 🤖 Enhance AI features
7. 🔐 Add more security features
8. 📊 Implement advanced analytics
9. 🚀 Deploy to production

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)

## Getting Help

- Check the [README.md](README.md) for overview
- Review code comments for implementation details
- Open an issue on GitHub for bugs
- Join our Discord community for discussions

---

Happy coding! 🚀
