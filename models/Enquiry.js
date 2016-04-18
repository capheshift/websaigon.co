var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Enquiry Model
 * =============
 */

var Enquiry = new keystone.List('Enquiry', {
	// noedit: true,
	nocreate: true
});

Enquiry.add({
	name: { type: Types.Text, required: true},
	email: { type: Types.Email, required: true},
	message: { type: Types.Markdown, required: true},
	phone: { type: String },
	enquiryType: { type: Types.Select, options: [
		{ value: 'message', label: 'Just leaving a message' },
		{ value: 'question', label: 'I\'ve got a question' },
		{ value: 'other', label: 'Something else...' }
	] },
	createdAt: { type: Date, default: Date.now }
}, 'Progress', {
	isResolved: { type: Types.Boolean, index: true }
});

Enquiry.schema.pre('save', function(next) {
	this.wasNew = this.isNew;
	next();
});

Enquiry.schema.post('save', function() {
	if (this.wasNew) {
		this.sendNotificationEmail();
	}
});

Enquiry.schema.methods.sendNotificationEmail = function(callback) {
	if ('function' !== typeof callback) {
		callback = function() {
			console.log('Emails sent');
		};
	}
	var enquiry = this;
	
	keystone.list('User').model.find().where('isReceiveEmails', true).exec(function(err, admins) {
		if (err) return callback(err);
		new keystone.Email({
			'templateMandrillName': 'websaigon-new-order--notification'
		}).send({
			to: admins,
			from: {
				name: 'Websaigon Team',
				email: 'hello@websaigon.co'
			},
			subject: 'Thông báo đơn hàng mới',
			enquiry: enquiry,
			globalMergeVars :  {
				HOST_URL: process.env.HOST_URL
			}
		}, callback);
	});
	
};

Enquiry.defaultSort = 'isResolved -createdAt';
Enquiry.defaultColumns = 'name, email, phone, createdAt, isResolved';
Enquiry.register();
