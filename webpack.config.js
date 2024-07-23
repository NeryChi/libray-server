const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const Libraries = require('./src/components/libraries');

module.exports = {
  entry: './src/components/libraries.js', // Tu punto de entrada principal
  mode: 'development',
  target: 'web',
  output: {
    publicPath: 'http://localhost:3000/'
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'server',
      filename: 'remoteEntry.js',
      exposes: Libraries,
      shared: {
        react: { singleton: true, requiredVersion: false, strictVersion: false, eager: false },
        'react-dom': { singleton: true, requiredVersion: false, strictVersion: false, eager: false }
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Añade jsx si también utilizas archivos .jsx
        exclude: /node_modules/, // Ignora los módulos de node
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'] // Asegura que Babel sepa cómo manejar JSX y ES6+
          }
        }
      }
    ]
  },
  
  // Asegúrate de agregar esta línea si estás usando extensiones .jsx
  resolve: {
    extensions: ['.js', '.jsx'] // Añade .jsx si no está presente
  },
};
