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
        });
    });


})(window.$);
