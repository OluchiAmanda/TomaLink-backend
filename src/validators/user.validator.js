const Joi = require('joi');

// Deliberately limited to `name` for now — changing email or phone touches
// verification/uniqueness rules that belong in a dedicated flow, not a
// generic profile update.
exports.updateMeSchema = Joi.object({
  name: Joi.string().min(2).max(100),
}).min(1);
