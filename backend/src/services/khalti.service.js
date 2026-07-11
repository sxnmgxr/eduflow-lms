const axios = require('axios')

const khaltiClient = axios.create({
  baseURL: process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2',
  headers: {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

/**
 * Initiate Khalti payment
 */
const initiatePayment = async ({ amount, orderId, orderName, customerName, customerEmail, customerPhone, returnUrl }) => {
  const response = await khaltiClient.post('/epayment/initiate/', {
    return_url: returnUrl,
    website_url: process.env.CLIENT_URL,
    amount: amount * 100, // Khalti uses paisa (1 NPR = 100 paisa)
    purchase_order_id: orderId,
    purchase_order_name: orderName,
    customer_info: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone || '9800000000',
    },
  })
  return response.data
}

/**
 * Verify Khalti payment after redirect
 */
const verifyPayment = async (pidx) => {
  const response = await khaltiClient.post('/epayment/lookup/', { pidx })
  return response.data
}

module.exports = { initiatePayment, verifyPayment }
