const express = require('express')
const app = express()
require('dotenv').config()
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const Nexmo = require('nexmo')
const moment = require('moment')
const cors = require('cors')

//app config
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/entry-mgmt', {
	useNewUrlParser: true,
	useFindAndModify: false //   DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#-findandmodify-
})

// mongoose.connect(
// 	'mongodb+srv://innovacer:innovacer@cluster0-lbpix.mongodb.net/test?retryWrites=true&w=majority',
// 	{
// 		useNewUrlParser: true
// 		// useUnifiedTopology: true, //  DeprecationWarning: current Server Discovery and Monitoring engine is deprecated, and will be removed in a future version. To use the new Server Discover and Monitoring engine, pass option { useUnifiedTopology: true } to the MongoClient constructor.
// 		// useFindAndModify: false //   DeprecationWarning: Mongoose: `findOneAndUpdate()` and `findOneAndDelete()` without the `useFindAndModify` option set to false are deprecated. See: https://mongoosejs.com/docs/deprecations.html#-findandmodify-
// 	}
// )

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
		.populate('pendingVisitors')
		.exec((err, foundHost) => {
			if (err) {
				console.log(err)
			} else {
				res.json(foundHost)
			}
		})
})

app.post('/hosts', (req, res) => {
	let { name, email, phone, currentAddress } = req.body
	Host.findOne({ phone, email }, (err, foundHost) => {
		if (err) {
			console.log(err)
		} else if (foundHost) {
			res.json(foundHost)
		} else {
			Host.create({ name, email, phone, currentAddress }, (err, createdHost) => {
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
	let { name, email, phone, hostId, checkInTime } = req.body

	const transporter = nodemailer.createTransport({
		service: process.env.NODEMAILER_MAIL_SERVICE,
		auth: {
			user: process.env.NODEMAILER_FROM_ADDRESS,
			pass: process.env.NODEMAILER_PASSWORD
		},
		rejectUnauthorized: false
	})

	const nexmo = new Nexmo({
		apiKey: process.env.NEXMO_API_KEY,
		apiSecret: process.env.NEXMO_API_SECRET
	})

	let textToSend = `<strong>Name : </strong>${name}<br/><br/><strong>Email address : </strong>${email}<br/><br/><strong>Phone : </strong>${phone}<br/><br/><strong>Check-in time : </strong>${moment(
		checkInTime
	).format('h:mm a, dddd, MMMM Do YYYY')}`

	let SMStextToSend = `Name : ${name}\n\nEmail address : ${email}\n\nPhone : ${phone}\n\nCheck-in time : ${moment(
		checkInTime
	).format('h:mm a, dddd, MMMM Do YYYY')}`

	Visitor.findOne({ phone, email }, (err, foundVisitor) => {
		if (err) {
			console.log(err)
		} else {
			if (foundVisitor) {
				Host.findById(hostId, (err, foundHost) => {
					if (err) {
						console.log(err)
					} else {
						let hostName = foundHost.name
						let currentAddress = foundHost.currentAddress
						let emailToSend = foundHost.email
						let numberToSend = `91${foundHost.phone}`

						foundHost.pendingVisitors.push(foundVisitor)
						foundHost.save()

						Session.create(
							{ name, email, phone, hostName, address: currentAddress, checkInTime },
							(err, createdSession) => {
								if (err) {
									console.log(err)
								} else {
									res.json({ ...createdSession, hostId })

									let mailOptions = {
										from: process.env.NODEMAILER_FROM_ADDRESS,
										to: emailToSend,
										subject: `Visitor checked in`,
										html: textToSend
									}

									transporter.sendMail(mailOptions, (err, info) => {
										if (err) {
											console.log(err)
										}
									})

									nexmo.message.sendSms(process.env.NEXMO_FROM_NUMBER, numberToSend, SMStextToSend)
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
								let currentAddress = foundHost.currentAddress
								let emailToSend = foundHost.email
								let numberToSend = `91${foundHost.phone}`

								foundHost.pendingVisitors.push(createdVisitor)
								foundHost.save()

								Session.create(
									{ name, email, phone, hostName, address: currentAddress, checkInTime },
									(err, createdSession) => {
										if (err) {
											console.log(err)
										} else {
											res.json({ ...createdSession, hostId })

											let mailOptions = {
												from: process.env.NODEMAILER_FROM_ADDRESS,
												to: emailToSend,
												subject: `Visitor checked in`,
												html: textToSend
											}

											transporter.sendMail(mailOptions, (err, info) => {
												if (err) {
													console.log(err)
												}
											})

											nexmo.message.sendSms(
												process.env.NEXMO_FROM_NUMBER,
												numberToSend,
												SMStextToSend
											)
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
	// console.log(checkOutTime)

	const transporter = nodemailer.createTransport({
		service: process.env.NODEMAILER_MAIL_SERVICE,
		auth: {
			user: process.env.NODEMAILER_FROM_ADDRESS,
			pass: process.env.NODEMAILER_PASSWORD
		},
		rejectUnauthorized: false
	})

	Session.findByIdAndUpdate(sessionId, { checkOutTime }, (err, updatedSession) => {
		if (err) {
			console.log(err)
		} else {
			res.json('Successfully checked out. Visit Details have been sent to your email.')

			let { name, phone, checkInTime, hostName, address } = updatedSession

			let emailToSend
			let textToSend = `<strong>Name : </strong>${name}<br/><br/><strong>Phone : </strong>${phone}<br/><br/><strong>Check-in time : </strong>${moment(
				checkInTime
			).format('h:mm a, dddd, MMMM Do YYYY')}<br/><br/><strong>Check-out time : </strong>${moment(
				checkOutTime
			).format(
				'h:mm a, dddd, MMMM Do YYYY'
			)}<br/><br/><strong>Host name : </strong>${hostName}<br/><br/><strong>Address visited : </strong>${address}`

			Host.findById(selectedHostId)
				.populate('pendingVisitors')
				.exec((err, foundHost) => {
					if (err) {
						console.log(err)
					} else {
						let pendingVisitors = foundHost.pendingVisitors

						for (let i = 0; i < pendingVisitors.length; i++) {
							if (name === pendingVisitors[i].name && phone === pendingVisitors[i].phone) {
								emailToSend = pendingVisitors[i].email
								foundHost.pendingVisitors.splice(i, 1)
								foundHost.save()
								break
							}
						}

						let mailOptions = {
							from: process.env.NODEMAILER_FROM_ADDRESS,
							to: emailToSend,
							subject: `Session Details of the meeting with ${foundHost.name}`,
							html: textToSend
						}

						transporter.sendMail(mailOptions, (err, info) => {
							if (err) {
								console.log(err)
							}
						})
					}
				})
		}
	})
})

app.get('*', (req, res) => {
	res.json({ error: "Endpoint doesn't exist!" })
})

app.listen(process.env.PORT || 8080, process.env.IP, () => {
	console.log('Server is running!')
})
