window.onload = (function($){
  $(".cbox-preview").on("click", function(evt){
    evt.preventDefault();
    var url = evt.currentTarget.href;
    $.ajax({url: url, type: "GET", dataType: "html",
      success: function(res){
        $.colorbox({inline: true, href: $(res).find(".container"), transition: "none", width: "85%", height: "85%"});
    }});
  });
})(window.$);
