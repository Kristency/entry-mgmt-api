const mongoose = require('mongoose')

const hostSchema = new mongoose.Schema({
	name: String,
	email: String,
	phone: String,
	visitors: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Visitor'
		}
	]
})

module.exports = mongoose.model('Host', hostSchema)
