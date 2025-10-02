# Centralized Error Handling Guide

## Overview

The Kin2 Workforce platform uses a centralized error handling system with typed responses and standard error classes for consistent error management across all API endpoints.

## Error Response Format

All errors return a standardized JSON response:

```typescript
{
  error: string;        // Human-readable error message
  code: string;         // Machine-readable error code
  timestamp: string;    // ISO timestamp
  path: string;         // Request path
  details?: any;        // Optional error details
  stack?: string;       // Stack trace (development only)
}
```

## Standard Error Classes

### ValidationError (400)
Used for request validation failures.

```typescript
import { ValidationError } from './middleware/error-handler';

throw new ValidationError('Invalid input', { 
  field: 'email', 
  message: 'Invalid email format' 
});
```

### AuthenticationError (401)
Used when authentication is required but missing or invalid.

```typescript
import { AuthenticationError } from './middleware/error-handler';

throw new AuthenticationError('Authentication required');
```

### AuthorizationError (403)
Used when user lacks required permissions.

```typescript
import { AuthorizationError } from './middleware/error-handler';

throw new AuthorizationError('Admin access required');
```

### NotFoundError (404)
Used when a resource cannot be found.

```typescript
import { NotFoundError } from './middleware/error-handler';

throw new NotFoundError('User', { id: userId });
```

### ConflictError (409)
Used for resource conflicts (e.g., duplicate records).

```typescript
import { ConflictError } from './middleware/error-handler';

throw new ConflictError('Email already exists', { email: 'user@example.com' });
```

### BusinessLogicError (422)
Used for business rule violations.

```typescript
import { BusinessLogicError } from './middleware/error-handler';

throw new BusinessLogicError('Cannot delete active job', { jobId, status: 'active' });
```

### RateLimitError (429)
Used when rate limits are exceeded.

```typescript
import { RateLimitError } from './middleware/error-handler';

throw new RateLimitError('Too many requests, please try again later');
```

### ExternalServiceError (502)
Used when external service calls fail.

```typescript
import { ExternalServiceError } from './middleware/error-handler';

throw new ExternalServiceError('Stripe', { 
  operation: 'createPayment',
  originalError: err.message 
});
```

## Using asyncHandler for Async Routes

Wrap async route handlers with `asyncHandler` to automatically catch errors:

```typescript
import { asyncHandler } from './middleware/error-handler';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.getUser(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User', { id: req.params.id });
  }
  
  res.json(user);
}));
```

## Utility Functions

### createValidationError
Quick validation error creation:

```typescript
import { createValidationError } from './middleware/error-handler';

throw createValidationError('email', 'Invalid email format');
```

### createNotFoundError
Quick not found error creation:

```typescript
import { createNotFoundError } from './middleware/error-handler';

throw createNotFoundError('User', userId);
```

## Best Practices

### 1. Always Use Standard Error Classes
Don't create custom error responses - use the provided classes:

```typescript
// ❌ Bad
res.status(400).json({ error: 'Invalid input' });

// ✅ Good
throw new ValidationError('Invalid input');
```

### 2. Include Relevant Details
Provide context in the details object:

```typescript
// ❌ Bad
throw new NotFoundError('Job');

// ✅ Good
throw new NotFoundError('Job', { id: jobId, organizationId });
```

### 3. Use asyncHandler for Async Routes
Always wrap async handlers:

```typescript
// ❌ Bad
router.post('/jobs', async (req, res) => {
  try {
    const job = await storage.createJob(req.body);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ✅ Good
router.post('/jobs', asyncHandler(async (req, res) => {
  const job = await storage.createJob(req.body);
  res.json(job);
}));
```

### 4. Log Appropriately
The error handler automatically logs errors:
- 5xx errors: Logged as `error` level
- 4xx errors: Logged as `warn` level

### 5. Don't Expose Sensitive Information
Never include sensitive data in error messages or details:

```typescript
// ❌ Bad
throw new ValidationError('Login failed', { 
  password: req.body.password,
  hash: storedHash 
});

// ✅ Good
throw new AuthenticationError('Invalid credentials');
```

## Error Codes Reference

| Error Class | HTTP Status | Code |
|------------|-------------|------|
| ValidationError | 400 | VALIDATION_ERROR |
| AuthenticationError | 401 | AUTHENTICATION_ERROR |
| AuthorizationError | 403 | AUTHORIZATION_ERROR |
| NotFoundError | 404 | NOT_FOUND |
| ConflictError | 409 | CONFLICT |
| BusinessLogicError | 422 | BUSINESS_LOGIC_ERROR |
| RateLimitError | 429 | RATE_LIMIT_EXCEEDED |
| ExternalServiceError | 502 | EXTERNAL_SERVICE_ERROR |
| Generic Error | 500 | INTERNAL_SERVER_ERROR |

## Frontend Integration

Frontend can handle errors consistently:

```typescript
try {
  const response = await apiRequest('/api/jobs');
  return response;
} catch (error) {
  // All errors follow standard format
  switch (error.code) {
    case 'AUTHENTICATION_ERROR':
      // Redirect to login
      break;
    case 'VALIDATION_ERROR':
      // Show validation errors
      toast.error(error.details?.message || error.error);
      break;
    case 'NOT_FOUND':
      // Show 404 page
      break;
    default:
      // Generic error handling
      toast.error(error.error);
  }
}
```

## Migration Guide

To migrate existing routes to the new error handling:

1. **Import error classes:**
   ```typescript
   import { ValidationError, NotFoundError, asyncHandler } from './middleware/error-handler';
   ```

2. **Replace manual error responses:**
   ```typescript
   // Before
   if (!user) {
     return res.status(404).json({ error: 'User not found' });
   }
   
   // After
   if (!user) {
     throw new NotFoundError('User', { id });
   }
   ```

3. **Wrap async handlers:**
   ```typescript
   // Before
   router.get('/users', async (req, res) => { ... });
   
   // After
   router.get('/users', asyncHandler(async (req, res) => { ... }));
   ```

## Testing Error Responses

Example error response in development:

```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-10-02T13:37:00.000Z",
  "path": "/api/users/123",
  "details": {
    "id": "123"
  },
  "stack": "Error: User not found\n    at ..."
}
```

Example error response in production:

```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-10-02T13:37:00.000Z",
  "path": "/api/users/123",
  "details": {
    "id": "123"
  }
}
```

Note: Stack traces are only included in development mode.
