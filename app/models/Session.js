'use strict';
module.exports = function(sequelize, DataTypes) {
    var Session = sequelize.define('session',
        {
            sid: {
                type: DataTypes.STRING(40),
                primaryKey: true
            },
            userAgent: {
                type: DataTypes.STRING
            },
            activeAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            updatedAt: false
        }
    );

    Session.associate = function(models) {
        Session.belongsTo(models.Person, {as: 'user'});
    };

    return Session;
};
