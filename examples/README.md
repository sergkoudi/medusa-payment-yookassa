
# `medusa-payment-yookassa` example

Handy examples for setting up a development environment for the [medusa-payment-yookassa](https://www.npmjs.com/package/medusa-payment-yookassa) plugin.

## Prerequisites

- Node.js v20+
- Yarn
- Docker & Docker Compose (optional, for spinning up PosgreSQL)
- A [YooKassa](https://yookassa.ru/joinups/?source=ks) account, a shop identifier `shopId` and a secret API key `secretKey`.

## Bootstrap development

1. Clone the repository:
   ```bash
   git clone https://github.com/sergkuodi/medusa-payment-yookassa
   ```

2. Install the `medusa-payment-yookassa` plugin in local:
   ```bash
   # Open a separate terminal window and run
   cd packages/medusa-payment-yookassa
   
   # Install
   yarn

   # Publish locally and develop by watching changes
   yarn dev

   # Keep the terminal window opened
   ```

3. Install PostgreSQL using Docker Compose:
   ```bash
   # Open a separate terminal window and run
   cd examples
   docker compose up -d
   ```
   It creates a database `medusa-payment-yookassa` with the credentials `medusa:supersecret`.

4. Install and run the Medusa Admin:
   ```bash
   # Open a separate terminal window and run
   cd examples/medusa
   
   # Install dependencies
   yarn

   # Install the local plugin dependency
   npx medusa plugin:add medusa-payment-yookassa
   yarn

   # Set up environment variables
   cp .env.template .env
   # and configure your own `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY` inside .env

   # Migrate the database
   npx medusa db:create # optional, must be already created in with Docker Compose
   npx medusa db:migrate

   # Create an admin user (optional)
   npx medusa user -e admin@medusajs.com -p supersecret

   # TODO: proper seeding Medusa

   # Run the Medusa Admin
   yarn dev

   # Keep the terminal window opened
   ```

5. Install and run the Medusa Storefront:
   ```bash
   # Open a separate terminal window and run
   cd examples/medusa-storefront

   # Set up environment variables
   cp .env.template .env
   # and configure your own `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` inside .env
   
   # Run the Medusa Storefront
   yarn dev

   # Eliminate terminal errors with settings in Medusa Admin

   # Keep the terminal window opened
   ```