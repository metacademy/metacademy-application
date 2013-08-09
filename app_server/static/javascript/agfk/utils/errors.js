/*
 Utils for handling errors
*/

(function(AGFK, undefined){
  "use strict";
  AGFK = typeof AGFK == "object" ? AGFK : {}; // namespace
  AGFK.errorHandler = {};

  /**
   * Assert stmt is true, else throw error with msg
   * TODO log errors to the server
   */
  AGFK.errorHandler.assert = function (stmt, msg){
    if (!stmt){
      throw new Error(msg);
    }
  };

  /**
   * Report jquery AJAX errors
   */
  AGFK.reportAjaxError = function(xhr, textStatus, errorThrown){
    console.error(textStatus, errorThrown);
    if (xhr.status === 0) {
      console.error('Could not connect.\n Verify Network.');
    } else if (xhr.status == 404) {
      console.error('Requested page not found. [404]');
    } else if (xhr.status == 500) {
      console.error('Internal Server Error [500].');
    } else if (exception === 'parsererror') {
      console.error('Requested JSON parse failed.');
    } else if (exception === 'timeout') {
      console.error('Time out error.');
    } else if (exception === 'abort') {
      console.error('Ajax request aborted.');
    } else {
      console.error('Uncaught Error.\n' + xhr.responseText);
    }
  };
  
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {});
