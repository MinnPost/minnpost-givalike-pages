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
		'level_amount_selector' : '.level-amount',
		'full_amount_selector' : '.full-amount',
		'name_selector' : '.form-item--display-name',
		'anonymous_selector' : '#PaymentControl_AdditionalInfoFields_AdditionalInfoCheckbox_3',
		'shipping_address_selector' : '.form-item--shipping-address',
		'use_for_shipping_selector' : '#useforshipping',
		'create_mp_selector' : '#creatempaccount',
		'password_selector' : '.form-item--password',
		'billing_selector' : 'fieldset.billing',
		'shipping_selector' : 'fieldset.shipping'
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

		init: function() {

			// Place initialization logic here
			// You already have access to the DOM element and
			// the options via the instance, e.g. this.element
			// and this.options
			// you can add more functions like the one below and
			// call them like so: this.yourOtherFunction(this.element, this.options).

			// modify options as needed
			this.options.amount = parseFloat($(this.options.level_amount_selector, this.element).text());
			this.options.processing_percent = parseFloat(this.options.percentage);
			this.options.processing_fee = this.options.amount * this.options.processing_percent;
			this.options.new_amount = this.options.amount + this.options.processing_fee;

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
			this.creditCardProcessingFees(this.options); // processing fees
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
			if (gaq) {	// is gaq object present?
				this.debug('we have analytics');									
				jQuery.each(options, function( key, value ) {
					this.debug('key is '+key+' and value is '+value);
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

				// Set the context for our deferred callback.
				var that = this;

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
		},

		getFullAddress: function() {
			$('.geocomplete').click(function() {
				$(this).trigger('geocode');
				var attribute = $(this).closest('fieldset').attr('data-geo');
				$(this).geocomplete({
					details: 'form',
					detailsAttribute: attribute
				});
			});
		},

		paymentPanels: function(active) {
			// make some tabs for form
			$('.panel').hide();
			$('#' + active).fadeIn();
			var that = this;

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

		creditCardProcessingFees: function(options) {
			$('.processing-amount').text(options.processing_fee);
			var full_amount;
			$('.add-credit-card-processing').click(function() {
				$('.amount .level-amount').addClass('full-amount');
				if (!$(this).hasClass('remove')) {
					//$('.amount .level-amount').text(new_amount);
					full_amount = options.new_amount;
					$(this).text('Remove $' + parseFloat(options.processing_fee));
				} else {
					//$('.amount .level-amount').text(amount);
					full_amount = options.amount;
					$(this).text('Add $' + parseFloat(options.processing_fee));
				}
				$(this).toggleClass('remove');
				$(options.full_amount_selector).text(full_amount);
				return false;
			});
		},

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
		},

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
		},

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
		},

		creditCardFields: function(element, options) {
			if (typeof $.payment !== 'undefined') {
				$('input[type="num"]').payment('restrictNumeric');
				$('.credit-card-group input').focusin(function() {
					$(this).parent().addClass('focus');
				}).focusout(function() {
					$(this).parent().removeClass('focus');
				});
				$('.credit-card-group').prepend('<span class="card-image"></span>');

				$('#credit-card-number').payment('formatCardNumber');
				$('#card-expiration').payment('formatCardExpiry');
				$('#card-cvv').payment('formatCardCVC');

				$('#credit-card-number').on('keyup', function() {
					var cardType = $.payment.cardType($('#credit-card-number').val());
					//$('#credit-card-number').toggleInputError(!$.payment.validateCardNumber($('#credit-card-number').val()));
					//if (cardType !== null) {
					$('.card-image').attr('class', 'card-image ' + cardType);
					//}
				});

				//$('#card-expiration').toggleInputError(!$.payment.validateCardExpiry($('#card-expiration').payment('cardExpiryVal')));
				//$('#card-cvv').toggleInputError(!$.payment.validateCardCVC($('#card-cvv').val(), cardType));
				//$('.cc-brand').text(cardType);

			}
		},

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