$("#preview-button").click(function() {
  var params = {'title': $("#id_title").val(), 
                'author': $("#id_author").val(), 
                'audience': $("#id_audience").val(),
                'body': $("#id_body").val()};

  $.post('/roadmaps/preview', params, function(data) {
    $("#preview-area").html(data);
  });

});
