const { z } = require('zod');

const answerItemSchema = z.object({
  questionId: z.string().trim().min(1, 'معرف السؤال مطلوب'),
  answer: z.any().optional(),
  selectedOptionKey: z.string().trim().optional(),
  selectedCellIndex: z.number().int().min(0).optional(),
  solved: z.boolean().optional()
});

const submitExamSchema = z.object({
  answers: z.array(answerItemSchema).default([])
});

module.exports = {
  submitExamSchema
};
