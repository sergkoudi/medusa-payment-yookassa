# Создание плагина YooKassa для Medusa

## 1. **Изучение API YooKassa**
- **Документация**: [YooKassa API](https://yookassa.ru/developers/api).
- **Ключевые методы**:
  - `POST /payments` — создание платежа.
  - `POST /payments/{id}/capture` — подтверждение платежа.
  - `POST /payments/{id}/cancel` — отмена платежа.
  - `POST /refunds` — возврат средств.
  - Вебхуки для обработки уведомлений.

---

## 2. **Структура проекта**
```bash
medusa-payment-yookassa/
├── src/
│ ├── core/
│ │ └── yookassa-payment-provider.ts # Основной класс плагина
│ ├── services/ # Сервисы, определяющие различные способы оплаты
│ ├── types/ # Типы данных
│ ├── utils/ # Вспомогательные функции
│ └── index.ts # Экспорт плагина
├── test/ # Тесты
├── package.json
├── README.md # Документация
└── tsconfig.json
```

---

## 3. **Реализация класса платежного процессора**
Наследуем от `AbstractPaymentProcessor` и реализуем необходимые методы.

---

## 4. **Интеграция вебхуков**

---

## 5. **Конфигурация плагина**
Добавьте настройки в medusa-config.js:

```bash
{
  plugins: [
    {
      resolve: "medusa-payment-yookassa",
      options: {
        shop_id: "your_shop_id",
        secret_key: "your_secret_key",
        capture: true,  // Автоподтверждение платежа
      },
    },
  ],
}
```

---

## 6. **Тестирование**
Тесты для ключевых методов:

```
describe("YooKassaPayment", () => {
  it("should create payment", async () => {
    const processor = new YooKassaPaymentProcessor({}, { shop_id: "test", secret_key: "test" });
    const result = await processor.initiatePayment({ amount: 1000, currency_code: "RUB" });
    expect(result.session_url).toContain("yookassa.ru");
  });
});
```
