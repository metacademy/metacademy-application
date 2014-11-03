window.onload = (function($){
  // handle previews
  $(".cbox-preview, .cbox-changes").on("click", function(evt){
    evt.preventDefault();
    var curTar = evt.currentTarget;
    var prevHTML = curTar.innerHTML;
    curTar.innerHTML = '<img src="/static/images/white-ajax-loader.gif">';

    var url = evt.currentTarget.href;
    $.ajax({url: url, type: "GET", dataType: "html",
      success: function(res){
        curTar.innerHTML = prevHTML;
        var $iel = $(res).find(".container");
        if ($iel.length == 0) {
          $iel = $(res);
        }
        $.colorbox({inline: true, href: $iel, transition: "none", width: "85%", height: "85%"});
    }});
  });

  // handle reversions
  $(".revision-history-revert a").on("click", function(evt){

    // set curtarg to be a spinner
    var $curTar = $(this);
    $curTar.html('<img src="/static/images/white-ajax-loader.gif">');

    // propagate reversions to the server and then reload the page
    evt.preventDefault();
    // should send a put request to the specific address
    $.ajax({
        type: "PUT",
        url: evt.currentTarget.href,
        success: function(){
          $curTar.html('Revert');
          $(".current").removeClass("current");
          $curTar.parent().parent().addClass("current");                    
        }
    });
             
  });
  
})(window.$);
