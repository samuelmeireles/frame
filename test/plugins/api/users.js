var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var hapiAuthBasic = require('hapi-auth-basic');
var proxyquire = require('proxyquire');
var authPlugin = require('../../../plugins/auth');
var userPlugin = require('../../../plugins/api/users');
var authenticatedUser = require('../../fixtures/credentials-admin');
var stub, modelsPlugin, server, request;


lab.beforeEach(function (done) {

    stub = {
        User: {}
    };

    modelsPlugin = proxyquire('../../../plugins/models', {
        '../models/user': stub.User
    });

    var plugins = [ hapiAuthBasic, modelsPlugin, authPlugin, userPlugin ];
    server = new Hapi.Server(config.get('/port/api'));
    server.pack.register(plugins, function (err) {

        if (err) {
            return done(err);
        }

        done();
    });
});


lab.afterEach(function (done) {

    server.plugins.models.BaseModel.disconnect();

    done();
});


lab.experiment('User Plugin Result List', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/users',
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when paged find fails', function (done) {

        stub.User.pagedFind = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('paged find failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns an array of documents successfully', function (done) {

        stub.User.pagedFind = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, { data: [{}, {}, {}] });
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result.data).to.be.an('array');
            Lab.expect(response.result.data[0]).to.be.an('object');

            done();
        });
    });


    lab.test('it returns an array of documents successfully using filters', function (done) {

        stub.User.pagedFind = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, { data: [{}, {}, {}] });
        };

        request.url = '/users?username=ren&isActive=true&role=admin&limit=10&page=1';

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result.data).to.be.an('array');
            Lab.expect(response.result.data[0]).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin Read', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/users/93EP150D35',
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when find by id fails', function (done) {

        stub.User.findById = function (id, callback) {

            callback(Error('find by id failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when find by id misses', function (done) {

        stub.User.findById = function (id, callback) {

            callback();
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(404);
            Lab.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it returns a document successfully', function (done) {

        stub.User.findById = function (id, callback) {

            callback(null, { _id: '93EP150D35' });
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin (My) Read', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'GET',
            url: '/users/my',
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when find by id fails', function (done) {

        stub.User.findById = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('find by id failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when find by id misses', function (done) {

        stub.User.findById = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback();
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(404);
            Lab.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it returns a document successfully', function (done) {

        stub.User.findById = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, { _id: '93EP150D35' });
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin Create', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'POST',
            url: '/users',
            payload: {
                username: 'muddy',
                password: 'dirtandwater',
                email: 'mrmud@mudmail.mud'
            },
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when find one fails for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(null, {});
            }
            else {
                callback(Error('find one failed'));
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when find one fails for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(null, {});
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when create fails', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.create = function (username, password, email, callback) {

            callback(Error('create failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it creates a document successfully', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.create = function (username, password, email, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin Update', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'PUT',
            url: '/users/420000000000000000000000',
            payload: {
                isActive: true,
                username: 'muddy',
                email: 'mrmud@mudmail.mud'
            },
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when find one fails for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(null, {});
            }
            else {
                callback(Error('find one failed'));
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when find one fails for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(null, {});
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when update fails', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.findByIdAndUpdate = function (id, update, callback) {

            callback(Error('update failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it updates a document successfully', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.findByIdAndUpdate = function (id, update, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin (My) Update', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'PUT',
            url: '/users/my',
            payload: {
                username: 'muddy',
                email: 'mrmud@mudmail.mud'
            },
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when find one fails for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for username check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.username) {
                callback(null, {});
            }
            else {
                callback(Error('find one failed'));
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when find one fails for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(Error('find one failed'));
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a conflict when find one hits for email check', function (done) {

        stub.User.findOne = function (conditions, callback) {

            if (conditions.email) {
                callback(null, {});
            }
            else {
                callback();
            }
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(409);

            done();
        });
    });


    lab.test('it returns an error when update fails', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.findByIdAndUpdate = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('update failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it updates a document successfully', function (done) {

        stub.User.findOne = function (conditions, callback) {

            callback();
        };

        stub.User.findByIdAndUpdate = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, {});
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result).to.be.an('object');

            done();
        });
    });
});


lab.experiment('Users Plugin Set Password', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'PUT',
            url: '/users/420000000000000000000000/password',
            payload: {
                password: 'fromdirt'
            },
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when generate password hash fails', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(Error('generate password hash failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns an error when update fails', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(null, { password: '', hash: '' });
        };

        stub.User.findByIdAndUpdate = function (id, update, callback) {

            callback(Error('update failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it sets the password successfully', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(null, { password: '', hash: '' });
        };

        stub.User.findByIdAndUpdate = function (id, update, callback) {

            callback(null, {});
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});


lab.experiment('Users Plugin (My) Set Password', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'PUT',
            url: '/users/my/password',
            payload: {
                password: 'fromdirt'
            },
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when generate password hash fails', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(Error('generate password hash failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns an error when update fails', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(null, { password: '', hash: '' });
        };

        stub.User.findByIdAndUpdate = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('update failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it sets the password successfully', function (done) {

        stub.User.generatePasswordHash = function (password, callback) {

            callback(null, { password: '', hash: '' });
        };

        stub.User.findByIdAndUpdate = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, {});
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});


lab.experiment('Users Plugin Delete', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'DELETE',
            url: '/users/93EP150D35',
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when remove by id fails', function (done) {

        stub.User.findByIdAndRemove = function (id, callback) {

            callback(Error('remove by id failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when remove by id misses', function (done) {

        stub.User.findByIdAndRemove = function (id, callback) {

            callback(null, 0);
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(404);
            Lab.expect(response.result.message).to.match(/document not found/i);

            done();
        });
    });


    lab.test('it removes a document successfully', function (done) {

        stub.User.findByIdAndRemove = function (id, callback) {

            callback(null, 1);
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result.message).to.match(/success/i);

            done();
        });
    });
});