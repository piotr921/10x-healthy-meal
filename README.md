# HealthyMeal

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](./LICENSE)

---

## Table of Contents

1. [Project Name](#project-name)
2. [Project Description](#project-description)
3. [Tech Stack](#tech-stack)
4. [Getting Started Locally](#getting-started-locally)
5. [Available Scripts](#available-scripts)
6. [Project Scope](#project-scope)
7. [Project Status](#project-status)
8. [License](#license)

---

## Project Name

**HealthyMeal**

---

## Project Description

HealthyMeal is a web application designed to help users adapt culinary recipes to their personal dietary needs. Powered by AI, the app suggests modifications to user-provided recipes based on saved dietary preferences, making it simple and efficient to create personalized, health-conscious meals. The MVP focuses on user account management, recipe storage, and AI-driven recipe modification, with an emphasis on simplicity and low-cost solutions.

---

## Tech Stack

- **Frontend**:
  - [Astro 5](https://astro.build/)
  - [React 19](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**:
  - [Supabase (PostgreSQL)](https://supabase.com/)
- **AI Communication**:
  - [OpenRouter.ai](https://openrouter.ai/)
- **CI/CD**:
  - [GitHub Actions](https://github.com/features/actions)
- **Hosting**:
  - [Digital Ocean](https://www.digitalocean.com/)

---

## Getting Started Locally

### Prerequisites

- [Node.js 22.x](https://nodejs.org/) (see `.nvmrc`)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/10x-healthy-meal.git
   cd 10x-healthy-meal
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```

### Running the Project

> **Note:** Build/start/dev scripts are not defined in `package.json` yet. Please refer to future updates or project documentation for running the application locally.

### Running Tests

To run the test suite:
```sh
npm test
```

---

## Available Scripts

- `npm test` — Runs the test suite using [Vitest](https://vitest.dev/).

---

## Project Scope

### In Scope (MVP)
- Email/password authentication
- User profile page for managing dietary preferences (forbidden ingredients, vegan/vegetarian)
- Full CRUD for text-based recipes
- AI integration for recipe modification based on user preferences
- Simple, chronological recipe list
- Web application interface

### Out of Scope (MVP)
- Recipe import from URL
- Multimedia content (images, videos)
- Recipe sharing or social features
- Advanced filtering or search
- Third-party social logins (Google, Facebook, etc.)

### Constraints
- 6-week development timeline
- Free or low-cost technologies and services

For detailed requirements and user stories, see the [Product Requirements Document](./.ai/prd.md).

---

## Project Status

**In Development** — The project is currently focused on building the MVP as described in the [PRD](./.ai/prd.md). Core features are being implemented with a focus on simplicity, efficiency, and cost-effectiveness.

---

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.

