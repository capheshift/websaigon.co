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
		callback = function() {};
	}
	
	var enquiry = this;
	
	keystone.list('User').model.find().where('isAdmin', true).exec(function(err, admins) {
		
		if (err) return callback(err);
		
		new keystone.Email('enquiry-notification').send({
			to: admins,
			from: {
				name: 'Dash',
				email: 'contact@dash.com'
			},
			subject: 'New Enquiry for Dash',
			enquiry: enquiry
		}, callback);
		
	});
	
};

Enquiry.defaultSort = '-createdAt isResolved';
Enquiry.defaultColumns = 'name, email, phone, enquiryType, createdAt, isResolved';
Enquiry.register();
