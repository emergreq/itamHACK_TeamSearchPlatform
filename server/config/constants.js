// Application-wide constants

module.exports = {
  // Message constraints
  MAX_MESSAGE_LENGTH: 5000,
  
  // Profile constraints
  MAX_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_EXPERIENCE_LENGTH: 1000,
  MAX_SKILLS_COUNT: 20,
  MAX_SKILL_LENGTH: 50,
  
  // Pagination
  MAX_USERS_PER_PAGE: 100,
  DEFAULT_USERS_PER_PAGE: 50,
  
  // Valid user roles
  VALID_ROLES: [
    'frontend',
    'backend',
    'fullstack',
    'designer',
    'project-manager',
    'data-scientist',
    'mobile',
    'other'
  ],
  
  // Auth
  AUTH_CODE_EXPIRATION: 5 * 60 * 1000, // 5 minutes
  MAX_AUTH_ATTEMPTS: 10,
  AUTH_ATTEMPT_WINDOW: 15 * 60 * 1000 // 15 minutes
};
