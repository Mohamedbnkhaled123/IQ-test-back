const { z } = require('zod');

function safeParseJsonArray(val) {
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val !== 'string') {
    return val;
  }
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

const nomineeSchema = z.object({
  name: z.string().trim().min(2, 'اسم المرشح مطلوب'),
  phone: z.string().trim().min(8, 'رقم تليفون المرشح غير صالح')
});

const verifySelfSchema = z.object({
  method: z.enum(['instapay', 'wallet'], {
    errorMap: () => ({ message: 'طريقة الدفع يجب أن تكون instapay أو wallet' })
  })
});

const verifyBulkSchema = z.object({
  method: z.enum(['instapay', 'wallet'], {
    errorMap: () => ({ message: 'طريقة الدفع يجب أن تكون instapay أو wallet' })
  }),
  nominees: z.preprocess(
    safeParseJsonArray,
    z.array(nomineeSchema).min(1, 'يجب إضافة شخص واحد على الأقل').max(100)
  )
});

module.exports = {
  verifySelfSchema,
  verifyBulkSchema
};
