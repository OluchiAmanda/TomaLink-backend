const Joi = require('joi');

exports.ownerProfileSchema = Joi.object({
  businessName: Joi.string().min(2).max(150).required(),
  serviceType: Joi.string()
    .valid('warehouse', 'cold_storage', 'logistics', 'transport')
    .required(),
});

exports.createListingSchema = Joi.object({
  type: Joi.string().valid('warehouse', 'cold_storage', 'logistics', 'transport').required(),
  brandName: Joi.string().min(2).max(150).required(),
  description: Joi.string().max(2000).allow('', null),
  address: Joi.string().required(),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  dailyPrice: Joi.number().min(0).required(),
  capacity: Joi.number().min(0),
  vehicleType: Joi.string().max(100),
});

exports.updateListingSchema = Joi.object({
  brandName: Joi.string().min(2).max(150),
  description: Joi.string().max(2000).allow('', null),
  address: Joi.string(),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  dailyPrice: Joi.number().min(0),
  capacity: Joi.number().min(0),
  vehicleType: Joi.string().max(100),
}).min(1);
