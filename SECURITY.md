# Security Features

This document outlines the security measures implemented in the Hackathon Team Search Platform.

## Overview

The platform has been designed with security as a top priority, implementing multiple layers of protection against common web vulnerabilities.

## Security Features Implemented

### 1. Authentication & Authorization

- **Telegram-based Authentication**: No password storage, reducing the risk of credential theft
- **Session Management**: Secure session cookies with `httpOnly`, `sameSite: strict`, and `secure` flags
- **Session Expiration**: 7-day session timeout with automatic cleanup
- **Brute Force Protection**: Maximum 10 authentication attempts per IP address within 15 minutes
- **Auth Code Expiration**: Authentication codes expire after 5 minutes

### 2. Rate Limiting

- **General Endpoints**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 5 requests per 15 minutes per IP
- **CSRF Token Endpoint**: Protected with general rate limiter
- **Static Files**: Rate limited to prevent resource exhaustion

### 3. Cross-Site Request Forgery (CSRF) Protection

- CSRF tokens required for all state-changing operations (POST, PUT, DELETE)
- Token validation on every authenticated request
- Tokens bound to user sessions
- Cookie-based token storage with secure flags

### 4. Cross-Site Scripting (XSS) Prevention

- **Output Encoding**: All user-generated content is HTML-escaped before display
- **Input Sanitization**: Dangerous characters removed from Telegram notifications
- **No Inline Event Handlers**: All event handlers use `addEventListener` instead of inline `onclick`
- **Content Security**: Special characters filtered in message content

### 5. Input Validation

All user inputs are validated on the server side:

- **Message Content**: Max 5000 characters, non-empty after trim
- **Profile Name**: Max 100 characters
- **Profile Bio**: Max 500 characters
- **Profile Experience**: Max 1000 characters
- **Skills**: Max 20 skills, 50 characters each
- **Role**: Must be one of predefined valid roles
- **Pagination**: Validated page and limit parameters

### 6. Database Security

- **MongoDB Injection Prevention**: Using Mongoose ODM with parameterized queries
- **Connection Security**: Support for MongoDB Atlas with encrypted connections
- **Data Validation**: Schema-level validation for all database models
- **Query Optimization**: Indexes on frequently queried fields

### 7. Session Security

- **Secret Key**: Strong session secret required (minimum entropy recommended)
- **Cookie Settings**:
  - `httpOnly: true` - Prevents JavaScript access to cookies
  - `secure: true` - HTTPS only in production
  - `sameSite: 'strict'` - Prevents CSRF attacks
  - `maxAge: 7 days` - Automatic session expiration

### 8. Memory Management

- **Periodic Cleanup**: Expired auth codes removed every minute
- **Failed Attempt Cleanup**: Old failed attempts purged every minute
- **Efficient Data Structures**: Using Maps for temporary data with proper cleanup

### 9. Error Handling

- **No Information Leakage**: Generic error messages to users
- **Detailed Server Logs**: Full error details logged server-side only
- **Graceful Degradation**: Telegram notification failures don't break message sending

### 10. API Security

- **CORS Configuration**: Restricted to specified origins
- **Request Size Limits**: Enforced by Express middleware
- **Type Validation**: All inputs validated for correct types
- **Length Limits**: Maximum lengths enforced for all string inputs

## Configuration Constants

All security-related values are centralized in `server/config/constants.js`:

```javascript
{
  MAX_MESSAGE_LENGTH: 5000,
  MAX_AUTH_ATTEMPTS: 10,
  AUTH_ATTEMPT_WINDOW: 15 * 60 * 1000,
  AUTH_CODE_EXPIRATION: 5 * 60 * 1000,
  // ... and more
}
```

## Security Best Practices for Deployment

### Required

1. ✅ **Use HTTPS in production** - Set `secure: true` for cookies
2. ✅ **Set strong SESSION_SECRET** - Use cryptographically random string
3. ✅ **Configure MongoDB authentication** - Never use unauthenticated MongoDB in production
4. ✅ **Set NODE_ENV=production** - Enables production optimizations
5. ✅ **Keep dependencies updated** - Regularly run `npm audit` and `npm update`

### Recommended

1. 🔒 **Use MongoDB Atlas** - Provides encryption at rest and in transit
2. 🔒 **Set up firewall rules** - Restrict access to MongoDB and application ports
3. 🔒 **Enable logging and monitoring** - Track suspicious activity
4. 🔒 **Regular backups** - Automated database backups
5. 🔒 **Use environment variables** - Never hardcode secrets
6. 🔒 **Rate limiting headers** - Configure reverse proxy rate limiting
7. 🔒 **Security headers** - Add Helmet.js for additional HTTP headers

### Optional Enhancements

1. 🛡️ **Two-factor authentication** - Additional auth layer
2. 🛡️ **API key rotation** - Periodic Telegram bot token rotation
3. 🛡️ **Web Application Firewall (WAF)** - Additional protection layer
4. 🛡️ **DDoS protection** - Use services like Cloudflare
5. 🛡️ **Security scanning** - Regular automated security scans
6. 🛡️ **Penetration testing** - Professional security audit

## Monitoring and Incident Response

### What to Monitor

- Failed authentication attempts
- Rate limit violations
- Database connection issues
- Unusual traffic patterns
- Error rates and types

### Incident Response

1. **Detect**: Monitor logs and metrics
2. **Contain**: Rate limiting and IP blocking
3. **Investigate**: Review logs and user activity
4. **Remediate**: Fix vulnerabilities and update code
5. **Communicate**: Notify affected users if needed

## Security Testing

The platform has been tested with:

- ✅ **CodeQL Security Scanning** - Zero vulnerabilities detected
- ✅ **Automated Code Review** - All security issues addressed
- ✅ **Input Validation Testing** - All inputs validated
- ✅ **XSS Testing** - Output encoding verified
- ✅ **CSRF Testing** - Token validation confirmed
- ✅ **Rate Limiting Testing** - Limits enforced correctly

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email the maintainer directly with details
3. Allow reasonable time for a fix before disclosure
4. Provide steps to reproduce the issue

## Updates and Maintenance

- Review security advisories regularly
- Update dependencies monthly (or when vulnerabilities are announced)
- Run `npm audit` before each deployment
- Review and rotate secrets periodically
- Monitor for unusual activity

## Compliance

The platform implements security controls aligned with:

- OWASP Top 10 recommendations
- Node.js security best practices
- Express.js security guidelines
- MongoDB security checklist

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**Last Updated**: December 2025

**Security Review Status**: ✅ All known vulnerabilities addressed
