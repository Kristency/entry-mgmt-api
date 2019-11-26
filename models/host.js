const mongoose = require('mongoose')

const hostSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String,
	pendingVisitors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Visitor'
		}
	],
	currentAddress: String
})

module.exports = mongoose.model('Host', hostSchema)
