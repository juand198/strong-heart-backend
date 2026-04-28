const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    senderRole:  { type: String, enum: ['user', 'admin'], required: true },
    text:        { type: String, required: true, maxlength: 1000 },
    readByAdmin: { type: Boolean, default: false },
    readByUser:  { type: Boolean, default: false },
    deleteAt:    { type: Date, default: null },
  },
  { timestamps: true }
);

// MongoDB borra automáticamente los documentos cuando deleteAt llega
messageSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { deleteAt: { $type: 'date' } } });

module.exports = mongoose.model('Message', messageSchema);
