module.exports = function(config) {
  config.set({
    basePath: '.',
    files: [
     '../target/war/app/*-node_modules/**/*.js',
     '../target/war/app/*-lib/*.js',
     '../target/war/app/*.js',
     'init.js',
      '../web/*.js',	
      'tests/test_*.js',
    ],

    autoWatch: false,
    singleRun: true,

    frameworks: ['mocha', 'sinon', 'chai'],

    browsers: ['Chrome_no_proxy'],
    customLaunchers: {
      Chrome_no_proxy: {
        base: 'Chrome',
        flags: ['--no-proxy-server']
      }
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    reporters: ['mocha'],

    plugins: [
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-chai',
      'karma-sinon'
      ]
  });
};
