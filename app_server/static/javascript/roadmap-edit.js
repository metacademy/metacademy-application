$("#roadmap-preview-button").click(function() {
  var params = {'title': $("#id_title").val(), 
                'author': $("#id_author").val(), 
                'body': $("#id_body").val()};

  $.post('/roadmaps/preview', params, function(data) {
    $("#roadmap-preview-area").html(data);
  });

});
