import "@testing-library/jest-dom/vitest";

process.env.NEXTAUTH_URL ??= "http://localhost:3000";
process.env.AUTH_SECRET ??= "test-secret-for-vitest-only-not-for-production-use";
process.env.RAZORPAY_KEY_ID ??= "rzp_test_dummy";
process.env.RAZORPAY_KEY_SECRET ??= "dummy_secret_for_tests";
process.env.RAZORPAY_WEBHOOK_SECRET ??= "dummy_webhook_secret_for_tests";
