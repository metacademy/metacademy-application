
/*global require, mocha*/
require.config({
  baseUrl: window.STATIC_PATH + "javascript",
  paths: {
    jquery:"lib/jquery-2.0.3.min",
    underscore: "lib/underscore-min",
    backbone: "lib/backbone-min",
    d3: "lib/d3",
    "dagre": "lib/dagre",
    "btouch": "lib/backbone.touch",
    "sidr": "lib/jquery.sidr.min",
    "chai": "lib/chai",
    "mocha": "lib/mocha"
  },

  shim: {
    'underscore': {
      exports: '_'
    },
    dagre: {
      exports: "dagre"
    },
    'jquery': {
      exports: '$'
    },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    "btouch": {
      deps: ["jquery", "underscore", "backbone"]
    },
    'mocha': {
      init: function () {
        this.mocha.setup('bdd');
        return this.mocha;
      }
    },
    "sidr": ["jquery"]
  },
  urlArgs: 'bust=' + (new Date()).getTime()
});

require(['require', 'chai', 'mocha', 'jquery'], function(require, chai, mocha, $){

  require([
    'test/trivial-test',
    'test/gc/test-editable-graph'
  ], function(require) {
    if (window.mochaPhantomJS) { window.mochaPhantomJS.run(); }
    else { mocha.run(); }
  });

});
