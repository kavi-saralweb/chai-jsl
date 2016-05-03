var chai = require('chai');
var expect = chai.expect;
var chaiJSL = require('../../chai-jsl');
chai.use(chaiJSL);

var promise = require('promise');

describe('Authentication test example', function() {
    var failedAttempts = 0;

    function unblockUser() {
        failedAttempts = 0;
    }

    function login(params) {
        var response = { status: 200, logged_in: false };
        return new promise(function(resolve, reject) {
            if(failedAttempts >= 3) {
                failedAttempts++;
                response.msg = 'Account blocked';
            } else {
                if(params.username === 'username') {
                    if(params.password === 'password') {
                        response.logged_in = true;
                    } else {
                        failedAttempts++;
                        response.msg = 'Incorrect password';
                    }
                } else {
                    failedAttempts++;
                    response.msg = 'Incorrect username';
                }
            }
            resolve(response);
        });
    }

    function logout() {
        var response = { status: 200, logged_in: false, msg: 'Successfully logged out' };
        return new promise(function(resolve, reject) {
            resolve(response);
        });
    }

    function isLimitExhausted() {
        var exhausted;
        if(failedAttempts > 3) {
            exhausted = true;
        }
        return exhausted;
    }

    var responseRules = [
        [
            { response : '$response' },
            { $or : [
                { $and : [
                    { $call: [ 'isLimitExhausted', ['$exhausted'] ] },
                    { $bind : [ '$response', { status: 200, logged_in: false, msg: 'Account blocked' } ] },
                ] },
                { $and : [
                    { txn : 'login', username : 'username', password : 'password' },
                    { $bind : [ '$response', { status: 200, logged_in: true } ] },
                ] },
                { $and : [
                    { txn : 'login', username : 'username' },
                    { $bind : [ '$response', { status: 200, logged_in: false, msg : 'Incorrect password' } ] },
                ] },
                { $and : [
                    { txn : 'login' },
                    { $bind : [ '$response', { status: 200, logged_in: false, msg : 'Incorrect username' } ] },
                ] },
                { $and : [
                    { txn : 'logout' },
                    { $bind : [ '$response', { status: 200, logged_in: false, msg : 'Successfully logged out' } ] },
                ] }
            ] }
        ]
    ];

    var responseCallbacks = {
        isLimitExhausted: isLimitExhausted,
    };

    it('should not login the user with incorrect username and incorrect password', function(done) {
        login({ username: 'wrong_username', password: 'wrong_password' })
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'login', username: 'wrong_username', password: 'wrong_password' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            done();
        });
    });

    it('should not login the user with correct username and incorrect password', function(done) {
        login({ username: 'username', password: 'wrong_password' })
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'login', username: 'username', password: 'wrong_password' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            done();
        });
    });

    it('should not login the user with correct username and incorrect password and block the user account', function(done) {
        login({ username: 'username', password: 'wrong_password' })
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'login', username: 'username', password: 'wrong_password' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            done();
        });
    });

    it('should not login the user even with correct username and correct password due to blocked account, then unblock the account', function(done) {
        login({ username: 'username', password: 'password' })
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'login', username: 'username', password: 'password' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            unblockUser();
            done();
        });
    });

    it('should login the user with correct username and correct password', function(done) {
        login({ username: 'username', password: 'password' })
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'login', username: 'username', password: 'password' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            done();
        });
    });

    it('should logout the user', function(done) {
        logout()
        .then(function(response) {
            var specs = {
                rules: responseRules.concat([ [ { txn: 'logout' } ] ]),
                query: [ { response: '$x' } ],
                callbacks: responseCallbacks,
            };

            expect(response).to.have.patternFrom(specs);
            done();
        });
    });
});
