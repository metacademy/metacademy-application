// Create simple event liseners and utility functions for headers -- this may eventually be tied in with an MVC framework but it's pretty simple and universal at the moment
// requires: jQuery

if (typeof window.define === "undefined"){
  var genutil = genFun($);
  genutil.prep();
}
else{
  window.define(["jquery"], function($){
    return genFun($);
  } );
}


function genFun($){
  "use strict";
  return {
    prep: function(){
      /**
       * Parse the text in the search box after enter is pressed
       */
      $('.searchbox').bind('keyup', function(event){
        if (event.which === 13 || event.keyCode === 13){
          var cval = event.currentTarget.value;
          if (cval.length > 0){
            window.location.href = "/search?q=" + window.encodeURI(event.currentTarget.value);
          }
        }
      });
      // IE placehold hack from http://www.hagenburger.net/BLOG/HTML5-Input-Placeholder-Fix-With-jQuery.html
      $('[placeholder]').focus(function() {
        var input = $(this);
        if (input.val() == input.attr('placeholder')) {
          input.val('');
          input.removeClass('placeholder');
        }
      }).blur(function() {
        var input = $(this);
        if (input.val() == '' || input.val() == input.attr('placeholder')) {
          input.addClass('placeholder');
          input.val(input.attr('placeholder'));
        }
      }).blur();

      $('[placeholder]').parents('form').submit(function() {
        $(this).find('[placeholder]').each(function() {
          var input = $(this);
          if (input.val() == input.attr('placeholder')) {
            input.val('');
          }

          // piwik tracking
          if (window.PRODUCTION){
            var _paq = _paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u=(("https:" == document.location.protocol) ? "https" : "http") + "://metacademy.org/analytics/piwik//";
              _paq.push(['setTrackerUrl', u+'piwik.php']);
              _paq.push(['setSiteId', 1]);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0]; g.type='text/javascript';
              g.defer=true; g.async=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
            })();
          }
        });
      });
    }
  };
}
