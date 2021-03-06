var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/users',
        config: {
            auth: 'simple',
            validate: {
                query: {
                    username: Joi.string().token(),
                    isActive: Joi.string(),
                    role: Joi.string(),
                    fields: Joi.string(),
                    sort: Joi.string(),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var query = {};
            if (request.query.username) {
                query.username = new RegExp('^.*?'+ request.query.username +'.*$', 'i');
            }
            if (request.query.isActive) {
                query.isActive = request.query.isActive === 'true';
            }
            if (request.query.role) {
                query['roles.' + request.query.role] = { $exists: true };
            }
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            User.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    plugin.route({
        method: 'GET',
        path: '/users/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;

            User.findById(request.params.id, function (err, user) {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'GET',
        path: '/users/my',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole(['account', 'admin'])
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var id = request.auth.credentials.user._id.toString();
            var fields = User.fieldsAdapter('username email');

            User.findById(id, fields, function (err, user) {

                if (err) {
                    return reply(err);
                }

                if (!user) {
                    return reply({ message: 'Document not found. That is strange.' }).code(404);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'POST',
        path: '/users',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    username: Joi.string().token().required(),
                    password: Joi.string().required(),
                    email: Joi.string().email().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            username: request.payload.username
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Username already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }, {
                    assign: 'emailCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            email: request.payload.email.toLowerCase()
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Email already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var username = request.payload.username;
            var password = request.payload.password;
            var email = request.payload.email;

            User.create(username, password, email, function (err, user) {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/users/{id}',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    isActive: Joi.boolean().required(),
                    username: Joi.string().token().required(),
                    email: Joi.string().email().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            username: request.payload.username,
                            _id: { $ne: User._idClass(request.params.id) }
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Username already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }, {
                    assign: 'emailCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            email: request.payload.email.toLowerCase(),
                            _id: { $ne: User._idClass(request.params.id) }
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Email already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var id = request.params.id;
            var update = {
                $set: {
                    isActive: request.payload.isActive,
                    username: request.payload.username,
                    email: request.payload.email.toLowerCase()
                }
            };

            User.findByIdAndUpdate(id, update, function (err, user) {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/users/my',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    username: Joi.string().token().required(),
                    email: Joi.string().email().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole(['account', 'admin']),
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            username: request.payload.username,
                            _id: { $ne: request.auth.credentials.user._id }
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Username already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }, {
                    assign: 'emailCheck',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;
                        var conditions = {
                            email: request.payload.email.toLowerCase(),
                            _id: { $ne: request.auth.credentials.user._id }
                        };

                        User.findOne(conditions, function (err, user) {

                            if (err) {
                                return reply(err);
                            }

                            if (user) {
                                var response = {
                                    message: 'Email already in use.'
                                };

                                return reply(response).takeover().code(409);
                            }

                            reply(true);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var id = request.auth.credentials.user._id.toString();
            var update = {
                $set: {
                    username: request.payload.username,
                    email: request.payload.email
                }
            };
            var options = {
                fields: User.fieldsAdapter('username email')
            };

            User.findByIdAndUpdate(id, update, options, function (err, user) {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/users/{id}/password',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root'),
                {
                    assign: 'password',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;

                        User.generatePasswordHash(request.payload.password, function (err, hash) {

                            if (err) {
                                return reply(err);
                            }

                            reply(hash);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var id = request.params.id;
            var update = {
                $set: {
                    password: request.pre.password.hash
                }
            };

            User.findByIdAndUpdate(id, update, function (err, user) {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'PUT',
        path: '/users/my/password',
        config: {
            auth: 'simple',
            validate: {
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole(['account', 'admin']),
                {
                    assign: 'password',
                    method: function (request, reply) {

                        var User = request.server.plugins.models.User;

                        User.generatePasswordHash(request.payload.password, function (err, hash) {

                            if (err) {
                                return reply(err);
                            }

                            reply(hash);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;
            var id = request.auth.credentials.user._id.toString();
            var update = {
                $set: {
                    password: request.pre.password.hash
                }
            };
            var options = {
                fields: User.fieldsAdapter('username email')
            };

            User.findByIdAndUpdate(id, update, options, function (err, user) {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    plugin.route({
        method: 'DELETE',
        path: '/users/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var User = request.server.plugins.models.User;

            User.findByIdAndRemove(request.params.id, function (err, count) {

                if (err) {
                    return reply(err);
                }

                if (count === 0) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'users'
};
