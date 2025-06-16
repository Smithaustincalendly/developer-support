/**
 * Node.js Server Script - Calendly OAuth & Event Type API Demo
 * This file sets up a Fastify server with endpoints to:
 * - Serve static assets
 * - Handle OAuth flow with Calendly
 * - Fetch user data
 * - Create, list, and update event types
 */

const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const fastify = require("fastify")({ logger: false });

// Token storage (in-memory for now)
let storedToken = null;

/* -------------------------------------
   STATIC FILES & TEMPLATE CONFIGURATION
-------------------------------------- */

// Serve static assets (public folder)
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// Enable parsing of form data
fastify.register(require("@fastify/formbody"));

// Setup view engine for server-side rendering
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// SEO configuration setup
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/* -------------------------
   HOMEPAGE & FORM HANDLING
-------------------------- */

fastify.get("/", function (request, reply) {
  let params = { seo };
  if (request.query.randomize) {
    const colors = require("./src/colors.json");
    const allColors = Object.keys(colors);
    let currentColor = allColors[(allColors.length * Math.random()) << 0];
    params = {
      color: colors[currentColor],
      colorError: null,
      seo,
    };
  }
  return reply.view("/src/pages/index.hbs", params);
});

fastify.post("/", function (request, reply) {
  let params = { seo };
  let color = request.body.color;
  if (color) {
    const colors = require("./src/colors.json");
    color = color.toLowerCase().replace(/\s/g, "");
    if (colors[color]) {
      params = {
        color: colors[color],
        colorError: null,
        seo,
      };
    } else {
      params = {
        colorError: request.body.color,
        seo,
      };
    }
  }
  return reply.view("/src/pages/index.hbs", params);
});

/* ----------------------------
   OAUTH FLOW WITH CALENDLY
----------------------------- */

fastify.get("/auth", async (req, reply) => {
  const authorizeUrl = `https://auth.calendly.com/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}`;
  reply.redirect(authorizeUrl);
});

fastify.get("/callback", async (req, reply) => {
  const { code } = req.query;
  try {
    const response = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });
    const data = await response.json();
    storedToken = data.access_token;
    reply.redirect("/dashboard.html");
  } catch (error) {
    console.error("Token exchange failed:", error);
    reply.status(500).send({ error: "Token exchange failed" });
  }
});

/* ----------------------------
   USER INFORMATION ENDPOINTS
----------------------------- */

fastify.get("/me", async (req, reply) => {
  const token = req.query.token;
  try {
    const response = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to fetch user info" });
  }
});

fastify.get("/me-from-store", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  try {
    const response = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to fetch user info" });
  }
});

fastify.get("/locations", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  const { user } = req.query;
  if (!user) return reply.status(400).send({ error: "Missing user URI" });
  try {
    const response = await fetch(`https://api.calendly.com/locations?user=${encodeURIComponent(user)}`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to fetch locations" });
  }
});

/* ----------------------------
   EVENT TYPE API ENDPOINTS
----------------------------- */

fastify.post("/create-event-type", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  try {
    const response = await fetch("https://api.calendly.com/event_types", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...req.body,
        active: req.body.active === true || req.body.active === "true"
      }),
    });
    const data = await response.json();
    if (!response.ok) return reply.status(response.status).send(data);
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to create event type" });
  }
});

fastify.get("/list-event-types", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  const query = new URLSearchParams(req.query).toString();
  try {
    const response = await fetch(`https://api.calendly.com/event_types?${query}`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to list event types" });
  }
});

fastify.patch("/update-event-type/:uuid", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  try {
    const response = await fetch(`https://api.calendly.com/event_types/${req.params.uuid}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) return reply.status(response.status).send(data);
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to update event type" });
  }
});

fastify.patch("/update-event-availability", async (req, reply) => {
  if (!storedToken) return reply.status(401).send({ error: "No token stored yet" });
  try {
    const response = await fetch("https://api.calendly.com/event_type_availability_schedules", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${storedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) return reply.status(response.status).send(data);
    reply.send(data);
  } catch (error) {
    reply.status(500).send({ error: "Failed to update availability" });
  }
});

/* -------------------
   START THE SERVER
-------------------- */

fastify.listen({ port: process.env.PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});