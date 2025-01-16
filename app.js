const express = require('express');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const config = require('./config');

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.openrouter.key
});

// Helper function to extract order information from text
function extractOrderInfo(text) {
    // First try to find #number pattern
    const hashMatch = text.match(/#(\d+)/);
    if (hashMatch) {
        const orderNumber = hashMatch[1];
        console.log('Found order number with # prefix:', orderNumber);
        return { orderId: orderNumber };
    }

    // If no #number, look for standalone numbers
    const numberMatches = text.match(/\b\d+\b/g);
    if (numberMatches) {
        // Get the last number in the text
        const orderNumber = numberMatches[numberMatches.length - 1];
        console.log('Found standalone order number:', orderNumber);
        return { orderId: orderNumber };
    }

    console.log('No order number found in text');
    return null;
}

// Helper function to generate natural language response
async function generateNaturalResponse(question, orderDetails, requestedOrderId) {
    try {
        const completion = await openai.chat.completions.create({
            model: "openai/gpt-3.5-turbo",
            messages: [{
                role: 'system',
                content: `You are a helpful customer service representative. 
                         The customer asked about order #${requestedOrderId}.
                         Respond naturally to their question using the order details provided.
                         If the order number doesn't match what they asked about, make sure to mention this discrepancy.
                         Keep the response concise but friendly.`
            }, {
                role: 'user',
                content: `Customer Question: "${question}"
                         Requested Order: #${requestedOrderId}
                         Order Details: ${JSON.stringify(orderDetails, null, 2)}`
            }]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating natural response:', error);
        return null;
    }
}

// Helper function to find order in Shopify
async function findShopifyOrder(orderInfo) {
    if (!orderInfo) return null;

    try {
        if (orderInfo.orderId) {
            console.log('Searching for order number:', orderInfo.orderId);
            
            // Construct Shopify Admin API URL
            const shopifyUrl = `https://${config.shopify.shopName}.myshopify.com/admin/api/${config.shopify.apiVersion}/orders.json?status=any&name=%23${orderInfo.orderId}`;
            console.log('Shopify API URL:', shopifyUrl);
            
            const response = await fetch(shopifyUrl, {
                headers: {
                    'X-Shopify-Access-Token': config.shopify.accessToken,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('Shopify API response:', JSON.stringify(data, null, 2));

            if (!response.ok) {
                throw new Error(`Shopify API error: ${response.status} ${response.statusText}\n${JSON.stringify(data, null, 2)}`);
            }

            // Check if the returned order matches the requested order number
            if (data.orders && data.orders.length > 0) {
                const matchingOrder = data.orders.find(order => 
                    order.order_number.toString() === orderInfo.orderId ||
                    order.name === `#${orderInfo.orderId}`
                );

                if (matchingOrder) {
                    console.log('Matching order found:', matchingOrder.id, 'Order number:', matchingOrder.order_number);
                    return { order: matchingOrder, error: null };
                }
            }

            return {
                order: null,
                error: {
                    message: `Order #${orderInfo.orderId} not found`,
                    searchCriteria: orderInfo
                }
            };
        }

        return {
            order: null,
            error: {
                message: 'No order ID provided',
                searchCriteria: orderInfo
            }
        };
    } catch (err) {
        console.error('Error searching orders:', err);
        return {
            order: null,
            error: {
                message: err.message,
                searchCriteria: orderInfo
            }
        };
    }
}

// Main endpoint to process customer text
app.post('/api/process-customer-text', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'No text provided'
            });
        }

        console.log('Processing text:', text);

        // Extract order information from text
        const orderInfo = extractOrderInfo(text);
        console.log('Extracted order info:', orderInfo);
        
        if (!orderInfo) {
            return res.json({
                success: true,
                extractedInfo: {},
                orderFound: false,
                orderDetails: null,
                naturalResponse: "I couldn't find an order number in your message. Could you please provide the order number you're inquiring about?",
                error: {
                    message: "No order number found in text"
                }
            });
        }
        
        // Find order in Shopify if order info was extracted
        const { order: shopifyOrder, error: shopifyError } = await findShopifyOrder(orderInfo);
        console.log('Shopify order found:', shopifyOrder ? 'yes' : 'no');

        // Prepare order details
        const orderDetails = shopifyOrder ? {
            id: shopifyOrder.id,
            orderNumber: shopifyOrder.order_number,
            createdAt: shopifyOrder.created_at,
            totalPrice: shopifyOrder.total_price,
            fulfillmentStatus: shopifyOrder.fulfillment_status,
            customer: {
                email: shopifyOrder.email,
                name: `${shopifyOrder.customer?.first_name || ''} ${shopifyOrder.customer?.last_name || ''}`.trim()
            },
            shippingAddress: shopifyOrder.shipping_address
        } : null;

        // Generate natural language response
        const naturalResponse = await generateNaturalResponse(
            text,
            orderDetails || { error: 'Order not found' },
            orderInfo.orderId
        );

        // Prepare response
        const response = {
            success: true,
            extractedInfo: orderInfo,
            orderFound: !!shopifyOrder,
            orderDetails: orderDetails,
            naturalResponse: naturalResponse,
            error: shopifyError
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});