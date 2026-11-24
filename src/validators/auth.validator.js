const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب ويجب أن يكون حرفين على الأقل'),
  phone: z.string().trim().min(8, 'رقم التليفون غير صالح'),
  dateOfBirth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'تاريخ الميلاد غير صالح'),
  occupation: z.string().trim().min(2, 'المهنة مطلوبة'),
  hobbies: z.string().trim().min(2, 'الهوايات مطلوبة'),
  selfIqRating: z.enum(['ذكاء عالي', 'ذكاء متوسط', 'أقل من المتوسط'], {
    errorMap: () => ({ message: 'تصنيف الذكاء غير صالح' })
  })
});

const loginSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب'),
  phone: z.string().trim().min(8, 'رقم التليفون غير صالح')
});

const adminLoginSchema = z.object({
  username: z.string().trim().optional().default(''),
  password: z.string().optional().default('')
});

module.exports = {
  registerSchema,
  loginSchema,
  adminLoginSchema
};
