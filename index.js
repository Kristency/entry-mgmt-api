const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

//app config
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/entry-mgmt', {
	useNewUrlParser: true
})

//requiring models
const Host = require('./models/host')

//setting up routes
app.get('/hosts', (req, res) => {
	Host.find({}, (err, foundHosts) => {
		if (err) {
			console.log(err)
		} else {
			res.json(foundHosts)
		}
	})
})

app.post('/hosts', (req, res) => {
	let { name, email, phone } = req.body
	Host.findOne({ phone }, (err, foundHost) => {
		if (err) {
			console.log(err)
		} else if (foundHost) {
			res.json(foundHost)
		} else {
			Host.create({ name, email, phone }, (err, createdHost) => {
				if (err) {
					console.log(err)
				} else {
					res.json(createdHost)
				}
			})
		}
	})
})

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log('Server is running on port 8080')
})
