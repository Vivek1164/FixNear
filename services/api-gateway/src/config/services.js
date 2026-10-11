const requiredUrl = (name, fallback) => {
  const value = process.env[name] || fallback;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported protocol");
    }

    return url.origin;
  } catch {
    throw new Error(`Invalid service URL: ${name}`);
  }
};

export const services = {
  users: requiredUrl("USER_SERVICE_URL", "http://localhost:4001"),
  providers: requiredUrl("PROVIDER_SERVICE_URL", "http://localhost:4002"),
  bookings: requiredUrl("BOOKING_SERVICE_URL", "http://localhost:4003"),
  payments: requiredUrl("PAYMENT_SERVICE_URL", "http://localhost:4004"),
  matching: requiredUrl("MATCHING_SERVICE_URL", "http://localhost:4005"),
};
