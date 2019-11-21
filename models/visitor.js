const mongoose = require('mongoose')

const visitorSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String
})

module.exports = mongoose.model('Visitor', visitorSchema)
