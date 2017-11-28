var IS_SHORT = function(){
  return (d3.select("#isShort").style("display") == "block")
}
var IS_PHONE = function(){
  return (d3.select("#isPhone").style("display") == "block")
}
var IS_MOBILE = function(){
  return (d3.select("#isMobile").style("display") == "block")
}
var SECTION_INDEX = function(){
  return d3.select("#sectionIndex").attr("data-index")
}

var IS_IE = false;
function getInternetExplorerVersion()
{
  var rv = -1;
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  else if (navigator.appName == 'Netscape')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

var PHONE_VIS_WIDTH = 230;
var PHONE_VIS_HEIGHT = 400;
var SHORT_VIS_WIDTH = 600;
var SHORT_VIS_HEIGHT = 480;
var SHORT_SCATTER_WIDTH = 480;
var PHONE_SCATTER_WIDTH = 235
var VIS_WIDTH = 600;
var VIS_HEIGHT = 680;

var DURATION = 800;


var MARGIN = { top: 100, left: 120, bottom: 104, right: 20 };
var PHONE_MARGIN = { top: 110, left: 40, bottom: 30, right: 30 };


var DOT_MARGIN = {top: 80, bottom: 0}
var PHONE_DOT_MARGIN = {top: 60, bottom: 70}

var ANIMATION_DELAY = true;

var DOLLARS = d3.format("$,.0f")
var RATIOS = d3.format(".2f")

var dotMin = 1;
var dotMax = 1.4;

var thresholdSmall = 6000;
var thresholdLarge = 10000;