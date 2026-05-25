module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'uniwind/babel',
        {
          config: './uniwind.config.ts',
        },
      ],
      'react-native-reanimated',
    ],
  };
};