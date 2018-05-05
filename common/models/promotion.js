'use strict';

module.exports = function(Promotion) {
	Promotion.validatesUniquenessOf('name', {message: 'name is not unique'});
};
