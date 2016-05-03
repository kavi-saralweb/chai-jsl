var JSL = require('jsl');

module.exports = function (chai, utils) {
    var Assertion = chai.Assertion,
        expect = chai.expect;

    Assertion.addMethod('pattern', function (pattern) {
        var response = this._obj;
        var expectedResponse;

        expect(pattern).to.be.instanceOf(Object);
        expectedResponse = pattern;

        var jslSetup = {
            rules : [ [ expectedResponse ] ],
            query : [ response ]
        };

        var result = new JSL(jslSetup).run();

        this.assert(
            result[0] != null,
            'expected #{this} to contain the pattern #{exp} but it doesn\'t',
            'expected #{this} to not contain the pattern #{exp} but it does',
            JSON.stringify(expectedResponse),
            JSON.stringify(result[0])
        );
    });

    Assertion.addMethod('patternFromRules', function (rules, callbacks) {
        callbacks = callbacks != null ? callbacks : {};
        var response = this._obj;

        expect(rules).to.be.instanceof(Array);
        var query = [
            { expectedResponse : '$x'},
            { $and : [ 
                {$or : [ 
                    { $and: [
                        { $bind : [ '$x', response] },
                        { $bind : [ '$result', 'ok' ] }
                    ] },
                    { $bind : [ '$result', 'fail' ] }
                ]}
            ] } ];

        var transform = { expectedResponse : '$x', result : '$result' };
        var jsl = new JSL({
            rules : rules,
            query : query,
            transform : transform,
            callbacks : callbacks
        });

        var result = jsl.run();

        this.assert(
            result[0].result === 'ok',
            'expected #{this} to contain the pattern #{exp} but it doesn\'t',
            'expected #{this} to not contain the pattern #{exp} but it does',
            JSON.stringify(result[0].expectedResponse),
            JSON.stringify(response)
        );
    });
};
