module.exports = {
  options: {
    // this makes sure the whole thing is built as a static site
    buildType: 'single-page-application',
  },
  modifyWebpackConfig({
    env: {
      target, // the target 'node' or 'web'
      dev, // is this a development build? true or false
    },
    webpackConfig, // the created webpack config
    webpackObject, // the imported webpack node module
    options: {
      razzleOptions, // the modified options passed to Razzle in the `options` key in `razzle.config.js` (options: { key: 'value'})
      webpackOptions, // the modified options that will be used to configure webpack/ webpack loaders and plugins
    },
    paths, // the modified paths that will be used by Razzle.
  }) {
    // this makes sure cdk and sdk aren't bundled
    webpackConfig.externals = {
      ['cdk-web']: 'CDK',
      ['aws-sdk']: 'AWS',
    };
    return webpackConfig;
  },
};