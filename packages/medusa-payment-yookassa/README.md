<p align="center">
  <a href="https://www.medusajs.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/9a99f9e8-f80e-4411-9bed-6e2032b1ab1c">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/9a99f9e8-f80e-4411-9bed-6e2032b1ab1c">
      <img alt="Medusa logo" src="https://github.com/user-attachments/assets/9a99f9e8-f80e-4411-9bed-6e2032b1ab1c" height="120">
    </picture>
  </a>
  
</p>

<h1 align="center">
YooKassa Payments for Medusa
</h1>

<p align="center">
A Medusa plugin that provides YooKassa payments.
</p>

<p align="center">
  <a href="https://medusajs.com">
    <img src="https://img.shields.io/badge/Medusa-^2.7.0-blue?logo=medusa" alt="Medusa" />
  </a>
  <a href="https://medusajs.com">
    <img src="https://img.shields.io/badge/Tested_with_Medusa-v2.9.0-green?logo=checkmarx" alt="Medusa" />
  </a>
</p>

<p align="center">
  <a href="https://t.me/medusajs_yookassa">
    <img src="https://img.shields.io/badge/Telegram-Medusa.js⊷YooKassa_Support_Chat-0088cc?logo=telegram&style=social" alt="Medusa.js⊷YooKassa on Telegram" />
  </a>
</p>

<p align="center">
  <a href="https://t.me/medusajs_chat">
    <img src="https://img.shields.io/badge/Telegram-Medusa.js_Dev_Community_Chat-0088cc?logo=telegram&style=social" alt="Medusa.js Chat on Telegram" />
  </a>
</p>

## 💬 Plugin Support Chat on Telegram

Join the [Medusa.js ⊷ YooKassa](https://t.me/medusajs_yookassa) community chat to discuss features and get support.

## 👥 Medusa.js Community Chat on Telegram

Join the [Medusa.js Chat](https://t.me/medusajs_chat) to connect with developers building on Medusa.

## Prerequisites

- Medusa server v2.7.0 or later
- Node.js v20 or later
- A YooKassa account — [sign in or create one](https://yookassa.ru/joinups/?source=ks)

## Installation

```bash
yarn add medusa-payment-yookassa
# or
npm install medusa-payment-yookassa
```

## Configuration

Add the provider configuration in your `medusa-config.js` file of the Medusa admin application:

```js
# ...
module.exports = defineConfig({
  # ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-payment-yookassa/providers/payment-yookassa",
            id: "yookassa",
            options: {
              shopId: process.env.YOOKASSA_SHOP_ID,
              secretKey: process.env.YOOKASSA_SECRET_KEY,
              capture: true,
              paymentDescription: "Test payment",
              useReceipt: true,
              taxItemDefault: 1,
              taxShippingDefault: 1
            },
          }
        ]
      }
    }
  ]
})
```

Add environment variables with your shop identifier `shopId` and a secret API key `secretKey`:

```
YOOKASSA_SHOP_ID=1234567
YOOKASSA_SECRET_KEY=live_secret_api_key
```

Then, set up a webhook URL for notifications from YooKassa [here](https://yookassa.ru/my/merchant/integration/http-notifications). The URL should be in the following format:

```
https://{YOUR_MEDUSA_DOMAIN}/hooks/payment/yookassa_yookassa
```

## Storefront Integration

Make the necessary changes to your Medusa storefront.
You can refer to the modifications made in the [Medusa Next.js Starter Template](https://github.com/medusajs/nextjs-starter-medusa), which are located in the [`examples/medusa-storefront`](https://github.com/sergkoudi/medusa-payment-yookassa/tree/main/examples/medusa-storefront) directory.

To view the specific changes, visit the [comparison page](https://github.com/sergkoudi/medusa-payment-yookassa/compare/v0.0.3...main), open the "Files changed" tab, and explore the differences under the `examples/medusa-storefront` directory. Or run diff in the terminal:

```bash
git clone https://github.com/sergkoudi/medusa-payment-yookassa
cd medusa-payment-yookassa
git diff v0.0.3...main -- examples/medusa-storefront
```

## Development

Find documentation on bootstrapping a development environment [here](https://github.com/sergkoudi/medusa-payment-yookassa/tree/main/examples).

## License

Licensed under the [MIT License](LICENSE).