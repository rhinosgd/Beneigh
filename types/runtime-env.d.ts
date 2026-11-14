declare namespace Cloudflare {
  interface Env {
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD?: string;
    STAFF_USERNAME?: string;
    STAFF_PASSWORD?: string;
    SESSION_SECRET?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  }
}
