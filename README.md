Calendly OAuth + Event Type Manager

This project is a full-stack Node.js application built with the Fastify framework. It demonstrates OAuth 2.0 integration with Calendly’s API and provides an interactive frontend for creating, listing, updating, and managing availability for event types.

The app includes:
	•	A secure OAuth flow for authenticating Calendly users
	•	A dynamic dashboard for managing event types and availability
	•	RESTful API calls to Calendly endpoints
	•	Fastify-powered backend with handlebars templating
	•	Modular structure with clearly defined endpoints and views

⸻

Features
	•	OAuth 2.0 Authorization Flow with Calendly
	•	Create new event types with custom properties
	•	List and paginate through existing event types
	•	Update event type properties (duration, description, locale, etc.)
	•	Manage availability schedules (per weekday)
	•	Interactive Frontend using vanilla JS
	•	Built-in token management and error handling

⸻

Prerequisites
	•	Basic understanding of JavaScript (especially fetch, promises, and async/await)
	•	Familiarity with OAuth 2.0 concepts is helpful but not required
	•	Calendly Developer Account (to register your OAuth App)

⸻

Project Structure
├── public/                         # Static HTML/CSS/JS
│   ├── dashboard.html             # Event type creation UI
│   └── update-et.html            # Event type update + availability UI
│
├── server.js                      # Fastify server with all routes
├── package.json                   # Dependencies and scripts
├── .env                           # (not included) store client credentials here
│
├── src/
│   ├── pages/index.hbs           # Landing page template
│   ├── colors.json               # Color picker for demo
│   └── seo.json                  # SEO settings for deployed site
│
└── README.md                      # Project documentation (this file)