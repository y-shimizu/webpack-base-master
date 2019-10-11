import glob from 'glob';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import webpack from  'webpack';

const src = path.resolve('./src');
const dist = path.resolve('./dist');

export default {
  entry: glob.sync(path.resolve(src, './js/*.js')).reduce((obj, p) => {
    const basename = path.basename(p, '.js');
    obj[basename === 'index' ? 'bundle' : `${basename}/bundle`] = p;
    return obj;
  }, {}),

  output: {
    path: dist,
    filename: '[name].js'
  },

  devServer: {
    contentBase: 'dist',
    port: 8000,
    host: '0.0.0.0',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(ejs|html)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].html',
              context: path.resolve(src, './html'),
              publicPath: '/'
            }
          },
          'extract-loader',
          {
            loader: 'html-srcsets-loader',
            options: {
              interpolate: true,
              root: src,
              attrs: ['img:src', 'img:srcset']
            }
          },
          'ejs-html-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('postcss-import'),
                require('postcss-nesting'),
                require('postcss-cssnext')({
                  browsers: ['last 3 versions', '> 5%', 'iOS >= 8'],
                  features: {
                    customProperties: {
                      preserve: true
                    },
                    overflowWrap: {
                      method: 'copy'
                    },
                    nesting: false
                  }
                }),
                require('css-mqpacker'),
                require('csswring')
              ]
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          context: path.resolve(src, './images'),
          name: 'images/[path][name].[ext]?v=[sha512:hash:hex:8]',
          publicPath: '/'
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    function () {
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      this.plugin('done', (stats) => {
        for (let key in stats.compilation.namedChunks) {
          const hash = stats.compilation.namedChunks[key].renderedHash;
          const sp = key.split('/');
          const dir = sp.slice(0, sp.length - 1).join('/');
          const target = path.join(dist, dir, '*.html');
          glob.sync(target).map((filepath) => {
            const html = fs.readFileSync(filepath, 'utf8');
            const htmlOutput = html.replace('bundle.js', `bundle.js?v=${hash}`);
            fs.writeFileSync(filepath, htmlOutput);
          });
        }
      });
    }
  ]
};
