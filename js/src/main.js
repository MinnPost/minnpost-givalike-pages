var qs = (function(a) {
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
})(window.location.search.substr(1).split('&'));

function paymentPanels(active) {
	$('.panel').hide();
	$('#' + active).fadeIn();
}

function getFullAddress() {

	//$('.use-geocomplete').show();

	/*$('#full_address').geocomplete({
	details: 'form',
	detailsAttribute: 'data-geo'
	});
	$('#full_address').click(function(){
	$('#full_address').trigger('geocode');
	});*/

	// need to figure out if we can pass this somehow without showing it
	$('.geocomplete').click(function() {
		$(this).trigger('geocode');

		var attribute = $(this).closest('fieldset').attr('data-geo');

		$(this).geocomplete({
			details: 'form',
			detailsAttribute: attribute
		});

	});

}

function donateAnonymously() {
	if ($('#PaymentControl_AdditionalInfoFields_AdditionalInfoCheckbox_3').is(':checked')) {
		$('.form-item--display-name label:first').hide();
	} else {
		$('.form-item--display-name label:first').show();
	}

	$('#PaymentControl_AdditionalInfoFields_AdditionalInfoCheckbox_3').change(function() {
		if ($(this).is(':checked')) {
			$('.form-item--display-name label:first').hide();
		} else {
			$('.form-item--display-name label:first').show();
		}
	});
}

function shippingAddress() {
	if ($('#useforshipping').is(':checked')) {
		$('.form-item--shipping-address').hide();
	} else {
		$('.form-item--shipping-address').show();
	}

	$('#useforshipping').change(function() {
		if ($(this).is(':checked')) {
			$('.form-item--shipping-address').hide();
		} else {
			$('.form-item--shipping-address').show();
		}
	});
}

function minnpostAccount() {
	if ($('#creatempaccount').is(':checked')) {
		$('.form-item--password').show();
	} else {
		$('.form-item--password').hide();
	}

	$('#creatempaccount').change(function() {
		if ($(this).is(':checked')) {
			$('.form-item--password').show();
		} else {
			$('.form-item--password').hide();
		}
	});

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


}

$(function() {
	if (typeof google !== 'undefined' && google.hasOwnProperty('maps')) {
		getFullAddress();
	} else {
		$('.form-item--nojs').show();
		$('.form-item--nojs input').each(function() {
			$(this).attr('type', 'text');
		});
		$('.form-item--geocode label:first').hide();
	}
});

// main.js
$(document).ready(function() {
	var query = qs['step'];
	var active = '';
	if (typeof query === 'undefined') {
		active = 'panel--review';
	} else {
		active = query;
	}
	paymentPanels(active);
	$('.progress--donation li.' + active + ' a').addClass('active');
	$('.progress--donation li a').click(function(event) {
		$('.progress--donation li a').removeClass('active');
		$(this).addClass('active');
		paymentPanels($(this).parent().attr('class'));
		event.preventDefault();
	});
	donateAnonymously();
	shippingAddress();
	minnpostAccount();
});


