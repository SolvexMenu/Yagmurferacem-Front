import { PayTRClient } from "paytr";

export const paytr = new PayTRClient({
  merchant_id:     `${process.env.PAYTR_MERCHANT_ID}` || '000000',
  merchant_key:    `${process.env.PAYTR_MERCHANT_KEY}` || 'key provided by paytr',
  merchant_salt:   `${process.env.PAYTR_MERCHANT_SALT}` || 'salt provided by paytr',
  debug_on:        process.env.NODE_ENV === 'development',
  no_installment:  false,
  max_installment: 12,
  timeout_limit:   30,
  test_mode:       process.env.NODE_ENV !== 'production',
});