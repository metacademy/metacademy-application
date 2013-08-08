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
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {});
