/*$(function() {
	
});*/

// main.js
$(document).ready(function() {

	// call plugin
	$('.support--donate').minnpost_givalike({
		'active' : 'panel--review',
		'query' : 'step',
		'percentage' : 0.05,
		'level_amount_selector' : '.amount .level-amount',
		'full_amount_selector' : '.full-amount',
		'name_selector' : '.form-item--display-name',
		'anonymous_selector' : '#PaymentControl_AdditionalInfoFields_AdditionalInfoCheckbox_3',
		'shipping_address_selector' : '.form-item--shipping-address',
		'use_for_shipping_selector' : '#useforshipping',
		'create_mp_selector' : '#creatempaccount',
		'password_selector' : '.form-item--password',
		'billing_selector' : 'fieldset.billing',
		'shipping_selector' : 'fieldset.shipping',
		'debug' : true
	});

});