'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        await queryInterface.createTable("gateway_carrier", {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            gateway_id: {
                type: Sequelize.UUID,
                allowNull: false,
                onDelete: "RESTRICT",
                references: {
                    model: "gateways",
                    key: "id",
                    as: "gateway_id",
                }
            },
            carrier_id: {
                type: Sequelize.UUID,
                allowNull: false,
                onDelete: "RESTRICT",
                references: {
                    model: "carriers",
                    key: "id",
                    as: "carrier_id",
                }
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            }
        }, {
            uniqueKeys: {
                unique_gateway_carrier: {
                    fields: ['gateway_id', 'carrier_id']
                }
            }
        })
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.dropTable("gateway_carrier");
        await queryInterface.removeConstraint("gateway_carrier", "unique_gateway_carrier");
    }
};
