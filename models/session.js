const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
	name: String,
	phone: String,
	checkInTime: Date,
	checkOutTime: Date,
	hostName: String,
	address: String
})

module.exports = mongoose.model('Session', sessionSchema)
