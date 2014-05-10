({
  baseUrl: ".",
  name: "main.js",
  out: "main-built.js",
    paths: {
    jquery:"lib/jquery-1.10.2",
    underscore: "lib/underscore",
    backbone: "lib/backbone-min",
    d3: "lib/d3",
    "dagre": "lib/dagre",
    "btouch": "lib/backbone.touch",
    "colorbox": "lib/jquery.colorbox-min",
    "sidr": "lib/jquery.sidr.min",
    "filesaver": "lib/FileSaver"
  },
  shim: {
    completely: {
      exports: "completely"
    },
    d3: {
      exports: "d3"
    },
    colorbox: {
      deps: ["jquery"]
    },
    filesaver: {
      exports: "Blob"
    },
    dagre: {
      exports: "dagre"
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    "btouch": {
      deps: ["jquery", "underscore", "backbone"]
    },
    "sidr": ["jquery"]
  }
})
