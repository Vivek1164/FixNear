import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { services } from "../config/services.js";

const router = Router();

function proxyTo(target, prefix, servicePath) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,

    // Match the original URL before rewriting it.
    pathFilter: (path) => path === prefix || path.startsWith(`${prefix}/`),

    pathRewrite: (path) => path.replace(prefix, servicePath),

    on: {
      error(error, req, res) {
        console.error("Upstream service error:", {
          target,
          message: error.message,
        });

        if (!res.headersSent) {
          res.writeHead(502, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              success: false,
              message: "Upstream service unavailable",
            }),
          );
        }
      },
    },
  });
}

router.use(proxyTo(services.users, "/api/users", "/users"));

router.use(proxyTo(services.providers, "/api/providers", "/providers"));

router.use(proxyTo(services.bookings, "/api/bookings", "/bookings"));

router.use(proxyTo(services.payments, "/api/payments", "/payments"));

router.use(proxyTo(services.matching, "/api/matching", "/matching"));

export default router;
