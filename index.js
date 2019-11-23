const express = require('express')
const app = express()
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const cors = require('cors')

//app config
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/entry-mgmt', {
	useNewUrlParser: true
})

//requiring models
const Host = require('./models/host')
const Visitor = require('./models/visitor')
const Session = require('./models/session')

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

app.get('/host/:id', (req, res) => {
	Host.findById(req.params.id)
		.populate('currentVisitors')
		.exec((err, foundHost) => {
			if (err) {
				console.log(err)
			} else {
				res.json(foundHost)
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

app.post('/visitors', (req, res) => {
	let { name, email, phone, hostId, address, checkInTime } = req.body
	Visitor.findOne({ phone }, (err, foundVisitor) => {
		if (err) {
			console.log(err)
		} else {
			if (foundVisitor) {
				Host.findById(hostId, (err, foundHost) => {
					if (err) {
						console.log(err)
					} else {
						let hostName = foundHost.name
						foundHost.currentVisitors.push(foundVisitor)
						foundHost.save()
						Session.create(
							{ name, email, phone, hostName, address, checkInTime },
							(err, createdSession) => {
								if (err) {
									console.log(err)
								} else {
									res.json({ ...createdSession, hostId })
								}
							}
						)
					}
				})
			} else {
				Visitor.create({ name, email, phone }, (err, createdVisitor) => {
					if (err) {
						console.log(err)
					} else {
						Host.findById(hostId, (err, foundHost) => {
							if (err) {
								console.log(err)
							} else {
								let hostName = foundHost.name
								foundHost.currentVisitors.push(createdVisitor)
								foundHost.save()
								Session.create(
									{ name, email, phone, hostName, address, checkInTime },
									(err, createdSession) => {
										if (err) {
											console.log(err)
										} else {
											res.json({ ...createdSession, hostId })
										}
									}
								)
							}
						})
					}
				})
			}
		}
	})
})

app.patch('/checkoutVisitor', (req, res) => {
	let { sessionId, selectedHostId, checkOutTime } = req.body

	Session.findByIdAndUpdate(sessionId, { $set: { checkOutTime } }, (err, updatedSession) => {
		if (err) {
			console.log(err)
		} else {
			Host.findById(selectedHostId, (err, foundHost) => {
				if (err) {
					console.log(err)
				} else {
					currentVisitors = foundHost.currentVisitors
					let { name, phone, checkInTime } = updatedSession
					for (let i = 0; i < currentVisitors.length; i++) {
						if (
							name === currentVisitors[i].name &&
							phone === currentVisitors[i].phone &&
							checkInTime === currentVisitors[i].checkInTime
						) {
							foundHost.currentVisitors.splice(i, 1)
							foundHost.save()
							break
						}
					}
					res.json('Successfully checked out')
				}
			})
		}
	})
})

app.get('*', (req, res) => {
	res.json({ error: "Endpoint doesn't exist!" })
})

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log('Server is running on port 8080')
})
