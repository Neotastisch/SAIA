# Shopify AI Customer Service Integration

A Node.js application that combines Shopify's API with OpenAI to provide intelligent order lookup and natural language responses to customer inquiries. This integration helps automate customer service by extracting order information from customer messages and providing both structured data and human-like responses.

## 🌟 Features

- 🔍 Intelligent order number extraction from customer messages
- 🛍️ Seamless Shopify order lookup and verification
- 🤖 AI-powered natural language responses
- 🔒 Secure API key management
- 🚀 Easy to deploy and customize

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v14 or higher) installed
- A Shopify store with API access
- An OpenRouter API key
- Basic knowledge of REST APIs

## 🚀 Quick Start

1. Clone the repository:

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
```bash
cp .env.example .env
```

4. Configure your `.env` file:

5. Start the server:
```bash
npm start
```

## 🔒 Security

1. Never commit your `.env` file
2. Keep your API keys secure
3. Use environment variables for sensitive data
4. Implement rate limiting in production
5. Add authentication for the API endpoints in production

## 🛠️ API Usage

### Process Customer Text
`POST /api/process-customer-text`

Request body:
```json
{
  "text": "Hi, what's the status on #5033?"
}
```

Response:
```json
{
  "success": true,
  "extractedInfo": {
    "orderId": "5033"
  },
  "orderFound": true,
  "orderDetails": {
    "id": "123456789",
    "orderNumber": "5033",
    "createdAt": "2024-01-16T00:00:00Z",
    "totalPrice": "99.99",
    "fulfillmentStatus": "fulfilled",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    },
    "shippingAddress": {
      "address1": "123 Main St",
      "city": "Example City",
      "province": "State",
      "zip": "12345",
      "country": "Country"
    }
  },
  "naturalResponse": "Hi! I can help you with order #5033. The order is currently fulfilled and was shipped to 123 Main St, Example City. Is there anything specific about the order you'd like to know?"
}
```

## 🔧 Configuration

### Shopify Setup

1. Go to your Shopify admin panel
2. Navigate to Apps > Develop apps
3. Create a new app
4. Generate an access token with the required permissions
5. Copy your store's subdomain (from your myshopify.com URL)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request (e.g., no text provided)
- 500: Server Error (e.g., API failures)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

For support, please open an issue in the GitHub repository.