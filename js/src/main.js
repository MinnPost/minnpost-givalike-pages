// main.js
$(document).ready(function() {
	// call plugin
	$('.support--donate').minnpost_givalike({
		'active' : 'panel--review',
		'query' : 'step',
		'percentage' : 0.05,
		'pay_cc_processing_selector' : '#PaymentControl_cbPayFees',
		'level_amount_selector' : '.amount .level-amount',
		'frequency_selector' : '.frequency',
		'full_amount_selector' : '.full-amount',
		'level_indicator_selector' : 'h2.level',
		'level_name_selector' : '.level-name',
		'review_benefits_selector' : '.review-benefits',
		'allow_upsell' : true,
		'upsell_btn_selector' : '.btn--upsell',
		'upsell_selector' : '.well--upsell',
		'upsell_amount_selector' : '.upsell-amount',
		'name_selector' : '.form-item--display-name',
		'anonymous_selector' : '#PaymentControl_AdditionalInfoFields_AdditionalInfoCheckbox_3',
		'shipping_address_selector' : '.form-item--shipping-address',
		'use_for_shipping_selector' : '#useforshipping',
		'create_mp_selector' : '#creatempaccount',
		'password_selector' : '.form-item--password',
		'billing_selector' : 'fieldset.billing',
		'shipping_selector' : 'fieldset.shipping',
		'credit_card_fieldset' : '.credit-card-group',
		'cc_num_selector' : '#credit-card-number',
		'cc_exp_selector' : '#card-expiration',
		'cc_cvv_selector' : '#card-cvv',
		'debug' : false
	});
});