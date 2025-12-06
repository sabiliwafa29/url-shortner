# URL Shortener Backend API

Production-ready URL shortener service built with Node.js, PostgreSQL, Redis, and JWT authentication.

## Features

✨ **Core Functionality**
- Create shortened URLs with random or custom aliases
- Fast redirect with Redis caching
- URL expiration management
- QR code generation for each URL

🔐 **Authentication & Security**
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (Redis-backed)
- Input validation with Joi
- Security headers with Helmet

📊 **Analytics**
- Click tracking with detailed metadata
- Device, browser, and OS detection
- Geographic data support
- Time-series analytics
- User dashboard with statistics

⚡ **Performance**
- Redis caching layer
- Connection pooling
- Asynchronous analytics tracking
- Database indexing

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Authentication:** JWT + bcrypt
- **Validation:** Joi
- **Containerization:** Docker

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Installation

1. Clone the repository
\`\`\`bash
git clone <your-repo-url>
cd url-shortener
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Setup environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start services with Docker
\`\`\`bash
docker-compose up -d
\`\`\`

5. Run database migrations
\`\`\`bash
npm run migrate
\`\`\`

6. Start development server
\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:3000`

## API Documentation

### Authentication Endpoints

#### Register User
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
\`\`\`

#### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
\`\`\`

#### Get Profile
\`\`\`http
GET /api/auth/me
Authorization: Bearer <token>
\`\`\`

### URL Management Endpoints

#### Create Short URL
\`\`\`http
POST /api/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "originalUrl": "https://example.com/very/long/url",
  "customAlias": "mylink",
  "expiresIn": 30,
  "title": "My Cool Link"
}
\`\`\`

#### Get User URLs
\`\`\`http
GET /api/urls?page=1&limit=10
Authorization: Bearer <token>
\`\`\`

#### Redirect (Public)
\`\`\`http
GET /:shortCode
\`\`\`

#### Delete URL
\`\`\`http
DELETE /api/urls/:id
Authorization: Bearer <token>
\`\`\`

### Analytics Endpoints

#### Get Dashboard Stats
\`\`\`http
GET /api/analytics/dashboard
Authorization: Bearer <token>
\`\`\`

#### Get URL Statistics
\`\`\`http
GET /api/analytics/:urlId/stats?days=30
Authorization: Bearer <token>
\`\`\`

#### Get Detailed Analytics
\`\`\`http
GET /api/analytics/:urlId?limit=100
Authorization: Bearer <token>
\`\`\`

## Project Structure

\`\`\`
url-shortener/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── urlController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimit.js
│   │   └── validator.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── urlRoutes.js
│   │   └── analyticsRoutes.js
│   ├── utils/
│   │   └── generateShortCode.js
│   └── app.js
├── migrations/
│   ├── 001_create_tables.sql
│   └── migrate.js
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── README.md
\`\`\`

## Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
\`\`\`

## Deployment

### Using Docker

\`\`\`bash
docker build -t url-shortener .
docker run -p 3000:3000 --env-file .env url-shortener
\`\`\`

### Environment Variables for Production

Make sure to set these in production:
- `NODE_ENV=production`
- `JWT_SECRET` (use a strong 64+ character secret)
- `DATABASE_URL` (production database)
- `REDIS_URL` (production Redis)
- `BASE_URL` (your production domain)

## Performance Considerations

- Redis cache TTL: 7 days
- Rate limiting: 100 requests per 15 minutes
- Connection pool: 20 max connections
- Analytics tracked asynchronously
- Database indexes on frequently queried columns

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this for your portfolio or commercial projects!

## Author

Your Name - [Your Portfolio/GitHub]

## Acknowledgments

Built as a portfolio project to demonstrate:
- RESTful API design
- Authentication & authorization
- Database design & optimization
- Caching strategies
- Rate limiting
- Analytics implementation
- Docker containerization