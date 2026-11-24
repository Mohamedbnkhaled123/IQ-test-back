const { z } = require('zod');

const traitImpactSchema = z.object({
  traitName: z.string().trim().min(1),
  traitValue: z.string().trim().min(1),
  priority: z.enum(['primary', 'fallback']).default('primary')
});

const optionSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  isCorrect: z.boolean().default(false),
  traitImpacts: z.array(traitImpactSchema).default([])
});

const questionPayloadSchema = z.object({
  section: z.coerce.number().int().min(1).max(4),
  sectionTitle: z.string().trim().min(1),
  order: z.coerce.number().int().min(1),
  prompt: z.string().trim().min(1),
  imageUrl: z.string().trim().nullable().optional(),
  questionType: z.enum(['mcq', 'text', 'memory_preview', 'memory_grid', 'canvas_connect']),
  inputConstraint: z.enum(['any', 'numbers_only', 'letters_only']).default('any'),
  timeLimitSeconds: z.coerce.number().int().min(1).max(600),
  points: z.coerce.number().min(0).default(0),
  acceptedAnswers: z.array(z.string().trim()).default([]),
  options: z.array(optionSchema).default([]),
  gridConfig: z
    .object({
      rows: z.coerce.number().int().min(1),
      cols: z.coerce.number().int().min(1),
      correctCellIndex: z.coerce.number().int().min(0).nullable().optional()
    })
    .optional(),
  canvasConfig: z
    .object({
      colors: z.array(z.string().trim()).default([]),
      requiredPairs: z.coerce.number().int().min(1).default(4)
    })
    .optional(),
  isActive: z.boolean().default(true),
  adminNote: z.string().trim().default('')
});

const updateQuestionSchema = questionPayloadSchema.partial();

const updateSettingsSchema = z.object({
  examTitle: z.string().trim().min(2).optional(),
  baseExamPrice: z.coerce.number().min(0).optional(),
  retakeMultiplier: z.coerce.number().min(1).optional(),
  iqScaleMin: z.coerce.number().min(10).optional(),
  iqScaleMax: z.coerce.number().max(300).optional(),
  iqBands: z
    .object({
      lowMax: z.coerce.number(),
      averageMax: z.coerce.number()
    })
    .optional()
});

const createGrantSchema = z.object({
  nomineeName: z.string().trim().min(2, 'الاسم مطلوب'),
  nomineePhone: z.string().trim().min(8, 'رقم التليفون غير صالح'),
  source: z.enum(['admin_complimentary', 'manual_admin']).default('admin_complimentary'),
  amountPaid: z.coerce.number().min(0).default(0)
});

module.exports = {
  questionPayloadSchema,
  updateQuestionSchema,
  updateSettingsSchema,
  createGrantSchema
};
