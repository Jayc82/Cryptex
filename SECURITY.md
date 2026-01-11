# Cryptex Security Configuration Guide

## Overview
This document outlines the security measures implemented in the Cryptex cryptocurrency trading platform.

## Critical Security Features

### 1. Authentication & Authorization

#### JWT Configuration
- **JWT_SECRET**: Must be a strong, random 64+ character string
- **JWT_REFRESH_SECRET**: Separate secret for refresh tokens
- **Token Expiration**: Access tokens expire in 24h, refresh tokens in 7d
- **Token Blacklisting**: Revoked tokens stored in Redis

#### Password Policy
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*(),.?":{}|<>)
- Maximum 128 characters (DoS protection)

#### Session Management
- Refresh tokens stored in database with expiration
- IP address and user agent tracking
- Automatic session cleanup on logout

### 2. Input Validation & Sanitization

#### Implemented Validations
- **Email**: RFC-compliant email format validation
- **Username**: 3-30 alphanumeric characters, underscores, hyphens
- **Passwords**: Strong password requirements enforced
- **Trading Orders**: Symbol format, order type, quantity, and price validation
- **Pagination**: Limit (1-1000), offset (>=0) validation
- **Numeric Values**: Range validation to prevent overflow/underflow

#### XSS Protection
- All string inputs sanitized to remove HTML tags
- Input length limits to prevent DoS
- Output encoding in responses

### 3. Rate Limiting

#### Configured Limits
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Trading**: 30 trades per minute per user

### 4. Security Headers (Helmet)

#### Configured Headers
- **Content Security Policy (CSP)**: Restricts resource loading
- **HTTP Strict Transport Security (HSTS)**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **X-XSS-Protection**: Browser XSS protection

### 5. CORS Configuration

#### Settings
- **Allowed Origins**: Configurable via CORS_ORIGIN environment variable
- **Credentials**: Enabled for authenticated requests
- **Methods**: GET, POST, PUT, DELETE, PATCH
- **Headers**: Content-Type, Authorization
- **Max Age**: 10 minutes

### 6. Database Security

#### SQL Injection Protection
- All queries use parameterized statements
- PostgreSQL prepared statements via pg library
- No string concatenation in SQL queries

#### Connection Security
- Connection pooling with limits (max 20 connections)
- Connection timeout: 2 seconds
- Idle timeout: 30 seconds
- Credentials from environment variables only

### 7. Redis Security

#### Configuration
- Optional password authentication
- Connection error handling
- Secure token blacklist storage
- Automatic cache expiration

### 8. WebSocket Security

#### Measures
- Authentication required before connection
- Token validation on connect
- Heartbeat/ping-pong for connection health
- Message size limits
- Rate limiting per connection

## Environment Variables Security

### Required Environment Variables

```bash
# NEVER commit actual values to git
# NEVER use default values in production

# JWT Secrets (Generate with: openssl rand -base64 64)
JWT_SECRET=<64+ character random string>
JWT_REFRESH_SECRET=<64+ character random string>

# Database Password
DB_PASSWORD=<strong database password>

# Redis Password (if enabled)
REDIS_PASSWORD=<strong redis password>

# Encryption Key (32 bytes for AES-256)
ENCRYPTION_KEY=<32 character encryption key>

# External API Keys (if applicable)
BINANCE_API_KEY=<your key>
BINANCE_API_SECRET=<your secret>
```

### Generating Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64

# Generate encryption key
openssl rand -hex 32

# Generate strong passwords
openssl rand -base64 32
```

## Deployment Security Checklist

### Before Production

- [ ] Change all default passwords and secrets
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up proper CORS origins
- [ ] Enable database SSL connections
- [ ] Review and harden security headers
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Enable rate limiting
- [ ] Set up backup procedures
- [ ] Configure WAF (Web Application Firewall)
- [ ] Perform security audit/penetration testing

### Docker Security

- [ ] Use non-root users in containers
- [ ] Keep images updated
- [ ] Scan images for vulnerabilities
- [ ] Use secrets management (Docker secrets/Kubernetes secrets)
- [ ] Limit container resources
- [ ] Use read-only file systems where possible
- [ ] Enable Docker Content Trust

### Database Security

- [ ] Use strong passwords
- [ ] Enable SSL/TLS connections
- [ ] Implement row-level security
- [ ] Regular backups with encryption
- [ ] Principle of least privilege for DB users
- [ ] Monitor slow queries and suspicious activity
- [ ] Enable query logging in production

### Network Security

- [ ] Use private networks for backend services
- [ ] Implement network segmentation
- [ ] Configure security groups/firewalls
- [ ] Use VPN for database access
- [ ] Enable DDoS protection
- [ ] Set up intrusion detection/prevention

## Monitoring & Incident Response

### What to Monitor

1. **Failed Authentication Attempts**
   - Multiple failed logins from same IP
   - Password reset abuse
   - Invalid token attempts

2. **Unusual Trading Activity**
   - Large volume trades
   - Rapid order placement/cancellation
   - Unusual trading patterns

3. **API Abuse**
   - Rate limit violations
   - Unusual request patterns
   - Large payloads

4. **System Health**
   - Database connection issues
   - Redis failures
   - High memory/CPU usage
   - Slow response times

### Incident Response

1. **Detection**: Automated alerts, log monitoring
2. **Containment**: Rate limiting, IP blocking, user suspension
3. **Investigation**: Log analysis, forensics
4. **Recovery**: Patch vulnerabilities, restore from backup
5. **Post-Incident**: Review, documentation, improvements

## Regular Security Maintenance

### Weekly
- Review authentication logs
- Check for failed login patterns
- Monitor rate limiting triggers

### Monthly
- Update dependencies
- Review and rotate API keys
- Check for security advisories
- Audit user permissions

### Quarterly
- Security audit
- Penetration testing
- Review and update security policies
- Disaster recovery testing

### Annually
- Comprehensive security assessment
- Update security documentation
- Review compliance requirements
- Staff security training

## Security Best Practices for Developers

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive configuration
3. **Validate all inputs** on both client and server
4. **Use parameterized queries** for database operations
5. **Implement proper error handling** without exposing internals
6. **Keep dependencies updated** and scan for vulnerabilities
7. **Follow principle of least privilege** for all access
8. **Log security events** but never log sensitive data
9. **Use HTTPS everywhere** in production
10. **Implement proper session management** with secure cookies

## Compliance Considerations

- **GDPR**: User data protection, right to deletion, data portability
- **PCI DSS**: If handling payment cards (use payment processors)
- **AML/KYC**: Know Your Customer regulations for crypto trading
- **SOC 2**: Security controls and audit requirements

## Contact & Reporting

For security issues, contact: security@cryptex.example.com

**Do not** open public GitHub issues for security vulnerabilities.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
