// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

	// undefined is used here as the undefined global variable in ECMAScript 3 is
	// mutable (ie. it can be changed by someone else). undefined isn't really being
	// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
	// can no longer be modified.

	// window and document are passed through as local variable rather than global
	// as this (slightly) quickens the resolution process and can be more efficiently
	// minified (especially when both are regularly referenced in your plugin).

	// Create the defaults once
	var pluginName = 'minnpost_givalike',
	defaults = {
		'debug' : false, // this can be set to true on page level options
		'active' : 'panel--review',
		'query' : 'step',
		'percentage' : 0.05,
		'pay_cc_processing_selector' : '#PaymentControl_cbPayFees',
		'level_amount_selector' : '.level-amount',
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
		'levels' : {
			1 : {
				'name' : 'bronze',
				'max' : 60
			},
			2 : {
				'name' : 'silver',
				'min' : 60,
				'max' : 120
			},
			3 : {
				'name' : 'gold',
				'min' : 120,
				'max' : 240
			},
			4 : {
				'name' : 'platinum',
				'min' : 240
			}
		},
		'upsell' : {
			'bronze' : true,
			'silver' : 9,
			'gold' : 19
		}
	}; // end defaults

	// The actual plugin constructor
	function Plugin( element, options ) {

		this.element = element;

		// jQuery has an extend method which merges the contents of two or
		// more objects, storing the result in the first object. The first object
		// is generally empty as we don't want to alter the default options for
		// future instances of the plugin
		this.options = $.extend( {}, defaults, options );

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	} // end constructor

	Plugin.prototype = {

		init: function(reset, amount) {

			// Place initialization logic here
			// You already have access to the DOM element and
			// the options via the instance, e.g. this.element
			// and this.options
			// you can add more functions like the one below and
			// call them like so: this.yourOtherFunction(this.element, this.options).

			// modify options as needed
			//var this.options.amount = '';
			if (reset !== true) {
				console.log('do not reset');
				this.options.amount = parseFloat($(this.options.level_amount_selector, this.element).text());
			} else {
				console.log('reset here with ' + amount);
				this.options.amount = amount;
			}
			this.options.frequency = parseFloat($(this.options.frequency_selector, this.element).data('year-freq'));
			this.options.processing_percent = parseFloat(this.options.percentage);
			this.options.processing_fee = this.options.amount * this.options.processing_percent;
			this.options.new_amount = this.options.amount + this.options.processing_fee;
			console.log('new amount is ' + this.options.new_amount);
			this.options.processing_fee = parseFloat(this.options.processing_fee).toFixed(2);
			this.options.upsell_amount = parseFloat($(this.options.upsell_amount_selector, this.element).text());
			this.options.upsold = this.options.amount + this.options.upsell_amount;

			if (this.options.debug === true) {
				this.debug(this.options);
				// return;
			}

			// tab stuff
			var query_panel = this.qs[this.options.query];
			if (typeof query_panel === 'undefined') {
				query_panel = this.options.active;
			}

			// call functions

			// geocomplete addresses if library loaded successfully
			if (typeof google !== 'undefined' && google.hasOwnProperty('maps')) {
				// add combined address fields for geocomplete
				$(this.options.billing_selector, this.element).prepend('<div class="form-item form-item--billing-address form-item--geocode"><label>Billing Address<input type="text" autocapitalize="off" autocorrect="off" name="full_address" id="full_address" class="geocomplete" placeholder="" required></label><label class="additional-option"><input type="checkbox" name="useforshipping" id="useforshipping" checked="checked"> Use this address for shipping</label></div>');
				$(this.options.shipping_selector, this.element).prepend('<div class="form-item form-item--shipping-address form-item--geocode"><label>Shipping Address<input type="text" autocapitalize="off" autocorrect="off" name="full_shipping_address" id="full_shipping_address" class="geocomplete" placeholder=""></label></div>');
				this.getFullAddress();
			} else {
				$('.form-item--nojs').show();
				$('.form-item--nojs input').each(function() {
					$(this).attr('type', 'text');
				});
				$('.form-item--geocode label:first').hide();
			}

			this.paymentPanels(query_panel); // tabs
			this.creditCardProcessingFees(this.options, reset); // processing fees
			this.options.level = this.checkLevel(this.element, this.options); // check what level it is
			this.upsell(this.element, this.options, this.options.amount, this.options.frequency); // upsell to next level
			this.donateAnonymously(this.element, this.options); // anonymous
			this.shippingAddress(this.element, this.options); // shipping address
			this.allowMinnpostAccount(this.element, this.options); // option for creating minnpost account
			this.creditCardFields(this.element, this.options); // do stuff with the credit card fields

		}, // init

		qs: (function(a) {
			if (a === '') {
				return {};
			}
			var b = {};
			for (var i = 0; i < a.length; ++i) {
				var p=a[i].split('=', 2);
				if (p.length === 1) {
					b[p[0]] = '';
				} else {
					b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
				}
			}
			return b;
		})(window.location.search.substr(1).split('&')),

		debug: function(message) {
			if (this.options.debug === true) {
				if (typeof message !== 'object') {
					console.log(message);
				} else {
					console.dir(message);
				}
				console.dir(this);
			}
		}, // debug

		loadAnalytics: function(options) {
			var gaq = window._gaq;
			var that = this;
			if (gaq) {	// is gaq object present?
				this.debug('we have analytics');									
				jQuery.each(options, function( key, value ) {
					that.debug('key is '+key+' and value is '+value);
					if (typeof value === 'object') {
						var onevent = options.on;
						var label = options.label($(this));
						var selector = value.selector;
						var category = value.category;
						var action = value.action;
						if (typeof value.on !== 'undefined') {
							onevent = value.on;
						}
						$(selector).on(onevent, function(event) {
							if (options.debug === true) {
								if (typeof value.label !== 'undefined') {
									label = value.label($(this));
								} else {
									label = options.label($(this));
								}
								this.debug('we did a '+onevent+' on the '+selector+' object which has the category '+category+' and action '+action+' and label '+label);
								_gaq.push(['_trackEvent', category, action, label]);
								return false; // do i actually need this?
							}
						});
					}
				}); // for each option

				// Push data to google. do we still need this or is it replaced by line 275?
				/* $.when(gaq.push(args)).done(
				function () {
				// Redirect the location - delayed so that any other page functionality has time to run.
				setTimeout(function () {
				var href = that.attr('href');
				if (href && href.indexOf('#'') !== 0) {
				window.location = href;
				}
				}, 100);
				}
				);*/

			} else {
				this.debug('Google Analaytics _gaq is not defined');
			}

		}, // loadAnalytics

		getQueryStrings: function(link) {
			if (link === '') {
				return {};
			} else {
				link = '?' + link.split('?')[1];
				link = link.substr(1).split('&');
			}
			var b = {};
			for (var i = 0; i < link.length; ++i) {
				var p=link[i].split('=', 2);
				if (p.length === 1) {
					b[p[0]] = '';
				} else {
					b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '));
				}
			}
			return b;
		}, // getQueryStrings

		getFullAddress: function() {
			$('.geocomplete').click(function() {
				$(this).trigger('geocode');
				var attribute = $(this).closest('fieldset').attr('data-geo');
				$(this).geocomplete({
					details: 'form',
					detailsAttribute: attribute
				});
			});
		}, // getFullAddress

		paymentPanels: function(active) {
			var that = this;
			// make some tabs for form
			$('.panel').hide();
			$('#' + active).fadeIn();
			// activate the tabs
			$('.progress--donation li.' + active + ' a').addClass('active');
			$('.progress--donation li a, a.btn.btn--next').click(function(event) {
				event.preventDefault();
				$('.progress--donation li a').removeClass('active');
				var link = $(this).attr('href');
				var query = that.getQueryStrings(link);
				query = query['step'];
				$('.progress--donation li.' + query + ' a').addClass('active');
				that.paymentPanels(query);		
			});
		}, // paymentPanels

		creditCardProcessingFees: function(options, reset) {
			var full_amount;
			var that = this;
			var remove = false;
			$(this.options.pay_cc_processing_selector).parent().html('<a href="#" class="add-credit-card-processing">Add $<span class="processing-amount"></span></a> for credit card processing to each charge?');
			$('.processing-amount').text(options.processing_fee);
			//console.log('new amount is ' + options.new_amount);
			if (reset === true) {
				remove = false;
				full_amount = that.options.amount;
				$('.add-credit-card-processing').text('Add $' + that.options.processing_fee);
			}
			$('.add-credit-card-processing').click(function(event) {
				$('.amount .level-amount').addClass('full-amount');
				if (!remove) {
					remove = true;
					console.log('new amount after click is ' + options.new_amount);
					full_amount = that.options.new_amount;
					$(this).text('Remove $' + options.processing_fee);
				} else {
					remove = false;
					full_amount = that.options.amount;
					$(this).text('Add $' + options.processing_fee);
				}
				$(this).toggleClass('remove');
				$(options.full_amount_selector).text(parseFloat(full_amount).toFixed(2));
				event.stopPropagation();
				event.preventDefault();
			});
		}, // creditCardProcessingFees

		donateAnonymously: function(element, options) {
			if ($(options.anonymous_selector, element).is(':checked')) {
				$(options.name_selector + ' label:first', element).hide();
			} else {
				$(options.name_selector + ' label:first', element).show();
			}

			$(options.anonymous_selector, element).change(function() {
				if ($(this).is(':checked')) {
					$(options.name_selector + ' label:first', element).hide();
				} else {
					$(options.name_selector + ' label:first', element).show();
				}
			});
		}, // donateAnonymously

		checkLevel: function(element, options) {
			var level = '';
			var levelclass = 'level level--';
			var amount_yearly;
			var frequency = options.frequency;
			var amount = options.amount;

			if (frequency === 12) {
				amount_yearly = amount * frequency;
			} else if (frequency === 1) {
				amount_yearly = amount;
			}
			
			$.each(options.levels, function(index, value) {
				var name = value.name;
				var num = index;
				var max = value.max;
				var min = value.min;
				if (typeof min !== 'undefined' && typeof max !== 'undefined') {
					if (amount_yearly >= min && amount_yearly < max) {
						level = name;
						levelclass += num;
						return false;
					}
				} else if (typeof max !== 'undefined') {
					if (amount_yearly < max) {
						level = name;
						levelclass += num;
						return false;
					}
				} else if (typeof min !== 'undefined') {
					if (amount_yearly >= min) {
						level = name;
						levelclass += num;
						return false;
					}
				}
			});
			$(options.level_indicator_selector, element).attr('class', levelclass);
			$(options.level_name_selector).text(level.charAt(0).toUpperCase() + level.slice(1));

			var review_level_benefits = this.getQueryStrings($(options.review_benefits_selector, element).attr('href'));
			review_level_benefits = review_level_benefits['level'];
			
			var link = $(options.review_benefits_selector, element).attr('href');
			link = link.replace(review_level_benefits, level);
			$(options.review_benefits_selector).attr('href', link);
			return level;
		}, // checkLevel

		upsell: function(element, options, amount, frequency) {
			if (options.allow_upsell === true) {
				var that = this;
				var amount_monthly;

				if (frequency === 12) {
					amount_monthly = amount;
				} else if (frequency === 1) {
					amount_monthly = amount / frequency;
				}

				$.each(options.upsell, function(index, value) {
					if (index === options.level) { // current level upsell
						if (value !== true && amount_monthly < value) {
							$(options.upsell_selector, element).hide();
						}
					}
				});

				$(options.upsell_btn_selector, element).click(function(event) {
					var upsold = options.upsold;
					that.options.amount = upsold;
					console.log('click amount is ' + that.options.amount);
					$(options.level_amount_selector, element).text(upsold);
					$(options.full_amount_selector, element).text(upsold);
					$(this).remove();
					event.stopPropagation();
					event.preventDefault();
					that.init(true, upsold);
				});
			} else {
				$(options.upsell_selector, element).hide();
			}
		}, // upsell

		shippingAddress: function(element, options) {
			if ($(options.use_for_shipping_selector, element).is(':checked')) {
				$(options.shipping_address_selector, element).hide();
			} else {
				$(options.shipping_address_selector, element).show();
			}
			$(options.use_for_shipping_selector, element).change(function() {
				if ($(this).is(':checked')) {
					$(options.shipping_address_selector, element).hide();
				} else {
					$(options.shipping_address_selector, element).show();
				}
			});
		}, // shippingAddress

		allowMinnpostAccount: function(element, options) {
			if ($(options.create_mp_selector, element).is(':checked')) {
				$(options.password_selector, element).show();
			} else {
				$(options.password_selector, element).hide();
			}

			$(options.create_mp_selector, element).change(function() {
				if ($(this).is(':checked')) {
					$(options.password_selector, element).show();
				} else {
					$(options.password_selector, element).hide();
				}
			});

			// allow users to show plain text, or to see pw criteria
			$(options.password_selector, element).append('<div class="help-link"><span>Password help</span></div><div class="form-help">Password must be at least 6 characters.</div><label class="additional-option"><input type="checkbox" name="showpassword" id="showpassword"> Show password</label>');

			$('#showpassword').click(function() {
				if ($(this).is(':checked')) {
					$('#password').get(0).type = 'text';
				} else {
					$('#password').get(0).type = 'password';
				}
			});

			$('.form-item .form-help').hide();
			$('.form-item--with-help label, .form-item--with-help input').next('.help-link').click(function() {
				$(this).next('.form-help').toggle();
				return false;
			});
		}, // allowMinnpostAccount

		creditCardFields: function(element, options) {
			if (typeof $.payment !== 'undefined') {
				$('input[type="num"]').payment('restrictNumeric');
				$(options.credit_card_fieldset + ' input').focusin(function() {
					$(this).parent().addClass('focus');
				}).focusout(function() {
					$(this).parent().removeClass('focus');
				});
				$(options.credit_card_fieldset, element).prepend('<span class="card-image"></span>');

				$(options.cc_num_selector, element).payment('formatCardNumber');
				$(options.cc_exp_selector, element).payment('formatCardExpiry');
				$(options.cc_cvv_selector, element).payment('formatCardCVC');

				$(options.cc_num_selector, element).on('keyup', function() {
					var cardType = $.payment.cardType($(options.cc_num_selector, element).val());
					//$('#credit-card-number').toggleInputError(!$.payment.validateCardNumber($('#credit-card-number').val()));
					//if (cardType !== null) {
					$('.card-image').attr('class', 'card-image ' + cardType);
					//}
				});

				//$('#card-expiration').toggleInputError(!$.payment.validateCardExpiry($('#card-expiration').payment('cardExpiryVal')));
				//$('#card-cvv').toggleInputError(!$.payment.validateCardCVC($('#card-cvv').val(), cardType));
				//$('.cc-brand').text(cardType);

			}
		}, // creditCardFields

	}; // plugin.prototype

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
			}
		});
	};

})( jQuery, window, document );