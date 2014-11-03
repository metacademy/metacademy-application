/*
 * notifIt! by @naoxink
 */
function notif(config) {
    var to = null;
    var defaults = {
        type: "info",
        width: 400,
        height: 60,
        position: "right",
        autohide: 1,
        msg: "This is my default message",
        opacity: 1,
        multiline: 0,
        fade: 0,
        bgcolor: "",
        color: "",
        timeout: 5000
    };
    $.extend(defaults, config);
    
    position = defaults.position;

    if (defaults.width > 0) {
        defaults.width = defaults.width;
    } else if (defaults.width === "all") {
        defaults.width = screen.width - 60;
    }

    if (defaults.height < 100 && defaults.height > 0) {
        height = defaults.height;
    }

    var div = "<div id='ui_notifIt'><p>" + defaults.msg + "</p></div>";
    $("#ui_notifIt").remove();
    clearInterval(to);
    $("body").append(div);


    if (defaults.multiline) {
        $("#ui_notifIt").css("padding", 15);
    } else {
        $("#ui_notifIt").css("height", height);
        $("#ui_notifIt p").css("line-height", height + "px");
    }

    $("#ui_notifIt").css("width", defaults.width);

    $("#ui_notifIt").css("opacity", defaults.opacity);

    switch (defaults.type) {
        case "error":
            $("#ui_notifIt").addClass("error");
            break;
        case "success":
            $("#ui_notifIt").addClass("success");
            break;
        case "info":
            $("#ui_notifIt").addClass("info");
            break;
        case "warning":
            $("#ui_notifIt").addClass("warning");
            break;
        default:
            $("#ui_notifIt").addClass("default");
            break;
    }

    $("#ui_notifIt").css("background-color", defaults.bgcolor);
    
    $("#ui_notifIt").css("color", defaults.color);
    
    switch (defaults.position) {
        case "left":
            $("#ui_notifIt").css("left", parseInt(0 - (defaults.width + 10)));
            $("#ui_notifIt").css("left", parseInt(0 - (defaults.width * 2)));
            $("#ui_notifIt").animate({left: 10});
            break;
        case "right":
            $("#ui_notifIt").css("right", parseInt(0 - (defaults.width + 10)));
            $("#ui_notifIt").css("right", parseInt(0 - (defaults.width * 2)));
            $("#ui_notifIt").animate({right: 10});
            break;
        case "center":
            var mid = window.innerWidth / 2;
            $("#ui_notifIt").css("top", parseInt(0 - (defaults.height + 10)));
            $("#ui_notifIt").css("left", mid - parseInt(defaults.width / 2));
            $("#ui_notifIt").animate({top: 10});
            break;
        default:
            var mid = window.innerWidth / 2;
            $("#ui_notifIt").css("right", parseInt(0 - (defaults.width + 10)));
            $("#ui_notifIt").css("left", mid - parseInt(defaults.width / 2));
            $("#ui_notifIt").animate({right: 10});
            break;
    }
    
    $("#ui_notifIt").click(function() {
        notifit_dismiss(to, defaults);
    });

    if (defaults.autohide) {
            if (!isNaN(defaults.timeout)) { // Take the timeout if is a number
                to = setTimeout(function() {
                    $("#ui_notifIt").click();
                }, defaults.timeout);
            }
        
    }
}

function notifit_dismiss(to, config) {
    clearInterval(to);
    if (!config.fade) {
        switch(config.position){
            case "center":
                $("#ui_notifIt").animate({
                    top: parseInt(config.height - (config.height / 2))
                }, 100, function() {
                    $("#ui_notifIt").animate({
                        top: parseInt(0 - (config.height * 2))
                    }, 100, function() {
                        $("#ui_notifIt").remove();
                    });
                });
            break;
            case "right":
                $("#ui_notifIt").animate({
                    right: parseFloat(config.width - (config.width * 0.9))
                }, 100, function() {
                    $("#ui_notifIt").animate({
                        right: parseInt(0 - (config.width * 2))
                    }, 100, function() {
                        $("#ui_notifIt").remove();
                    });
                });
            break;
            case "left":
                $("#ui_notifIt").animate({
                    left: parseFloat(config.width - (config.width * 0.9))
                }, 100, function() {
                    $("#ui_notifIt").animate({
                        left: parseInt(0 - (config.width * 2))
                    }, 100, function() {
                        $("#ui_notifIt").remove();
                    });
                });
            break;
        }
    } else {
        $("#ui_notifIt").fadeOut("slow", function() {
            $("#ui_notifIt").remove();
        });
    }
}
