window.onload = (function($){
  // handle previews
  $(".cbox-preview").on("click", function(evt){
    evt.preventDefault();
    var curTar = evt.currentTarget;
    curTar.innerHTML = '<img src="/static/images/white-ajax-loader.gif">';

    var url = evt.currentTarget.href;
    $.ajax({url: url, type: "GET", dataType: "html",
      success: function(res){
        curTar.innerHTML = 'Preview';
        $.colorbox({inline: true, href: $(res).find(".container"), transition: "none", width: "85%", height: "85%"});
    }});
  });

  // handle reversions
  $(".revision-history-revert a").on("click", function(evt){

    // set curtarg to be a spinner
    var curTar = evt.currentTarget;
    curTar.innerHTML = '<img src="/static/images/white-ajax-loader.gif">';

    // propagate reversions to the server and then reload the page
    evt.preventDefault();
    // should send a put request to the specific address
    $.ajax({
        type: "PUT",
        url: evt.currentTarget.href
    }).complete(function(){
      curTar.innerHTML = 'Revert';
      // remove spinner
      // TODO change the currently activated element
      alert("done");
    });
             
  });
  
})(window.$);
