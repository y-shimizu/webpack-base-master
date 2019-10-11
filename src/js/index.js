import 'babel-polyfill';
import $ from 'jquery';

import '../html/index.html';
import '../css/style.css';

$(function() {
  $('#message').text(`これは${ENV}環境です。`);
});

