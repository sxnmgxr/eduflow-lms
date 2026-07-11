const crypto = require('crypto')
const axios = require('axios')

const ESEWA_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://epay.esewa.com.np'
  : 'https://rc-epay.esewa.com.np'

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST'
const ESEWA_SECRET = process.env.ESEWA_SECRET || '8gBm/:&EnhH.1/q'

/**
 * Generate HMAC-SHA256 signature for eSewa
 */
const generateSignature = (totalAmount, transactionUuid, productCode) => {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`
  return crypto.createHmac('sha256', ESEWA_SECRET).update(message).digest('base64')
}

/**
 * Get eSewa payment form data
 */
const getPaymentFormData = ({ amount, transactionId, successUrl, failureUrl }) => {
  const taxAmount = 0
  const totalAmount = amount
  const signature = generateSignature(totalAmount, transactionId, ESEWA_PRODUCT_CODE)

  return {
    amount,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    transaction_uuid: transactionId,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
    payment_url: `${ESEWA_BASE_URL}/api/epay/main/v2/form`,
  }
}

/**
 * Verify eSewa payment
 */
const verifyPayment = async (transactionId, totalAmount) => {
  try {
    const response = await axios.get(
      `${ESEWA_BASE_URL}/api/epay/transaction/status/`,
      {
        params: {
          product_code: ESEWA_PRODUCT_CODE,
          total_amount: totalAmount,
          transaction_uuid: transactionId,
        },
      }
    )
    return response.data
  } catch (err) {
    throw new Error('eSewa verification failed: ' + err.message)
  }
}

module.exports = { getPaymentFormData, verifyPayment, ESEWA_BASE_URL }