const logger = require("../logger")
const helper = require("../helpers")
const Group = require("../models/Group")

/**
 * Returns true if groups array is valid
 * @param {array|required} groups - groups ids
 * @return {Promise<null|boolean>}
 */
exports.groupsValid = async groups => {

	try {

		if (groups?.length > 0) {
			// check if values are valid uuids
			const valid_uuids = groups.every(id => helper.isValidUuid(id))
			if (!valid_uuids) return false

			for (const id in groups)
			{
				const group = await Group.findByPk(id)
				if (!group) return false
			}
		}

		return true
	}
	catch (error)
	{
		logger.error("error groupsValid: ", error)
		return null
	}
}