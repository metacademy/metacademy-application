window.onload = (function($){
  $("#preview-button").click(function(evt) {
    var $curTar = $(this);

    evt.preventDefault();
    $curTar.prop('disabled', true);
    $curTar.html('<img src="/static/images/white-ajax-loader.gif">');
    var params = {'title': $("#id_title").val(),
                  'author': $("#id_author").val(),
                  'audience': $("#id_audience").val(),
                  'body': $("#id_body").val()};


    $.post('/roadmaps/preview', params, function(data) {
      $curTar.html('Preview');
      $curTar.prop('disabled', false);
      var $res = $(data);
      $.colorbox({inline: true, href: $res, transition: "elastic", width: "85%", height: "85%"});
    });
  });
})(window.$);
