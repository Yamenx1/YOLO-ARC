export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || 'https://mature-duck-4515.clerk.accounts.dev',
      applicationID: 'convex'
    }
  ]
};
