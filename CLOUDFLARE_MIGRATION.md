# Integritas360 Cloudflare migration

Target: Cloudflare Pages + Pages Functions + D1 + R2. Firebase is not used by the new backend.

1. Create a D1 database named integritas360.
2. Apply migrations/0001_initial.sql to the production D1 database.
3. In Cloudflare Pages, bind the D1 database using binding name DB.
4. Create a Pages secret named BOOTSTRAP_TOKEN. Never commit it or any password.
5. POST /api/auth/bootstrap-owner with header x-bootstrap-token and JSON email/password to create the first Owner account, then rotate/remove the bootstrap secret.
6. R2 will be used for report evidence/files; do not store evidence as base64 in D1.

This is the migration foundation. Firebase frontend calls must be migrated endpoint-by-endpoint before Firebase can be removed safely.
