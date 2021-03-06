var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../../../config');
var Hapi = require('hapi');
var hapiAuthBasic = require('hapi-auth-basic');
var proxyquire = require('proxyquire');
var authPlugin = require('../../../plugins/auth');
var logoutPlugin = require('../../../plugins/api/logout');
var authenticatedUser = require('../../fixtures/credentials-admin');
var stub, modelsPlugin, server, request;


lab.beforeEach(function (done) {

    stub = {
        Session: {}
    };

    modelsPlugin = proxyquire('../../../plugins/models', {
        '../models/session': stub.Session
    });

    var plugins = [ hapiAuthBasic, modelsPlugin, authPlugin, logoutPlugin ];
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


lab.experiment('Logout Plugin (Delete Session)', function () {

    lab.beforeEach(function (done) {

        request = {
            method: 'DELETE',
            url: '/logout',
            credentials: {
                user: authenticatedUser,
                roles: authenticatedUser._roles
            }
        };

        done();
    });


    lab.test('it returns an error when remove fails', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(Error('remove failed'));
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(500);

            done();
        });
    });


    lab.test('it returns a not found when remove misses', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, 0);
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(404);
            Lab.expect(response.result.message).to.match(/session not found/i);

            done();
        });
    });


    lab.test('it removes the authenticated user session successfully', function (done) {

        stub.Session.remove = function () {

            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();

            callback(null, 1);
        };

        server.inject(request, function (response) {

            Lab.expect(response.statusCode).to.equal(200);
            Lab.expect(response.result.message).to.match(/success/i);

            done();
        });
    });
});
