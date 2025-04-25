# Lalding's Portfolio Website

This is a portfolio website built with Next.js. It features a responsive and modern design. The website is built using Tailwind CSS for styling and Next.js for server-side rendering.

## Setup

1. Add NEXT_PUBLIC_RESEND_API_KEY environment variable in .env.local
2. In the send-email.ts action file, change the "to" email to your own email

## Getting Started

To start the project, run the following command:

```bash
npm install
```

This will install all the necessary dependencies for the project.

Next, run the following command to start the development server:

```bash
npm run dev
```

The development server will start at `http://localhost:3333`. You can access the application by navigating to this URL in your web browser.

Please visit prod live site at https://lalding.in/

# Sentry Monitoring

Sentry is a popular open-source error tracking and monitoring tool that helps developers track and fix issues in their applications. It provides a centralized platform for collecting, organizing, and displaying error reports, making it easier for developers to identify and resolve problems.

To set up Sentry monitoring for your application, follow these steps:

1. Sign up for a Sentry account at https://sentry.io/signup/.
2. Create a new project and select the Nextjs template.
3. Follow the instructions to set up the project, including configuring the environment variables.
4. Copy & paste the following commands to your terminal:

```bash
npx @sentry/wizard@latest -i nextjs --saas --org private-a871950a2 --project lalding-portfolio
```

This will setup Sentry monitoring for your application, including configuring the environment variables and setting up the necessary integrations.

## Monitoring Tools

There are several monitoring tools available for monitoring the performance and health of your application. Some popular ones include:

1. New Relic: A comprehensive monitoring tool that provides insights into the performance and health of your application. It offers features like transaction tracing, error tracking, and performance monitoring.
2. Datadog: A cloud-based monitoring platform that provides real-time visibility into the performance and health of your application. It offers features like distributed tracing, log management, and alerting.
3. Prometheus: A monitoring and alerting tool that collects and stores metrics from your application. It provides features like real-time monitoring, alerting, and visualization.
4. Grafana: A visualization tool that allows you to create dashboards and monitor the performance and health of your application. It provides features like real-time monitoring, alerting, and visualization.

These monitoring tools can help you identify and resolve issues in your application, ensuring that it runs smoothly and performs optimally.

1. Sentry Documentation: https://docs.sentry.io/
