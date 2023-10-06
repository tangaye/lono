/**
 * Returns true if msisdns are valid orange and lonestar numbers
 * @param {Array|required} msisdns
 * @return {boolean}
 */
exports.validate = msisdns => {

	if (msisdns.length <= 0) return false

	return msisdns.every(msisdn => {
		msisdn = msisdn.trim()
		let valid_numbers = /^[0-9]*$/.test(msisdn)
		let starting_digits = msisdn.substring(0, 5)
		let valid_msisdn_starting = ["23177", "23188", "23155"].includes(starting_digits)
		let length_is_valid = msisdn.length === 12

		return valid_msisdn_starting && length_is_valid && valid_numbers
	})

}


/**
 * Returns true if a msisdn is valid
 * @param {string|required} msisdn
 * @return {boolean}
 */
exports.validateMsisdn = msisdn => {

	if (msisdn.length <= 0) return false

	msisdn = msisdn.trim()
    let valid_numbers = /^[0-9]*$/.test(msisdn)
    let starting_digits = msisdn.substring(0, 5)
    let valid_msisdn_starting = ["23177", "23188", "23155"].includes(starting_digits)
    let length_is_valid = msisdn.length === 12

    return valid_msisdn_starting && length_is_valid && valid_numbers

}