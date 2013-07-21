// Create simple event liseners and utility functions for headers -- this may eventually be tied in with an MVC framework but it's pretty simple and universal at the moment
// requires: jQuery

(function($){
    /**
     * Parse the text in the search box after enter is pressed
     */
    $('#searchbox').bind('keyup', function(event){
        if (event.which === 13 || event.keyCode === 13){
            window.location.href = "/search?q=" + window.encodeURI(event.currentTarget.value);
        }
    });
})(window.$);
