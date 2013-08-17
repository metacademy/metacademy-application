/*
 Utils for handling errors
 */

window.define([], function(){
  "use strict";

  var errorHandler = {};

  /**
   * Assert stmt is true, else throw error with msg
   * TODO log errors to the server
   */
  errorHandler.assert = function (stmt, msg){
    if (!stmt){
      throw new Error(msg);
    }
  };

  /**
   * Report jquery AJAX errors
   */
  errorHandler.reportAjaxError = function(xhr, ajaxOptions, errorThrown){
    if (xhr.status === 0) {
      console.error('Ajax error: Could not connect.\n Verify Network.');
    } else if (xhr.status == 404) {
      console.error('Ajax error: Requested page not found. [404]');
    } else if (xhr.status == 500) {
      console.error('Ajax error: Internal Server Error [500].');
    } else if (xhr.statusText === 'parsererror') {
      console.error('Ajax error: Requested JSON parse failed.');
    } else if (xhr.statusText === 'timeout') {
      console.error('Ajax error: Time out error.');
    } else if (xhr.statusText === 'abort') {
      console.error('Ajax error: request aborted.');
    } else {
      console.error('Uncaught Error.\n' + xhr.responseText);
    }
  };

  // return require.js obj
  return errorHandler;
});
