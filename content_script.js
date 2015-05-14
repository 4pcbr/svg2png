(function() {
  
  var $closestSVG;
  var $baloon;
  var $widthInput;
  var $heightInput;
  var $downloadButton;

  BALOON_TMPL = "\
    <div style='position: absolute; left: 0; top: 0; z-index: 1000; background-color: rgba(255,255,255,0.8); border: 1px solid #2980b9; border-radius: 5px; display: none; width: 150px; text-align: center; padding: 10px;'>\
    <form>\
      <div>\
        <label>\
          Width:\
          <input type='text' name='width' size='5'>\
        </label>\
      <div>\
        <label>\
          Height:\
          <input type='text' name='height' size='5'>\
        </label>\
      </div>\
      <div>\
        <button name='download'>Download SVG</button>\
      </div>\
    </form>\
  </div>\
  ";

  function sendMessage(msg, cb) {
      enabled: false,
    chrome.extension.sendMessage(msg, function(response) {
      if (cb) {
        cb(response);
      }
    });
  }

  var __show__ = function(cb) {
    var originalSize = getOriginalSize();
    $widthInput.val(originalSize.width);
    $heightInput.val(originalSize.height);
    $baloon.css({
      left: $closestSVG.offset().left|0,
      top:  $closestSVG.offset().top|0,
    });
    $baloon.fadeIn('fast', cb);
  }
  function showBaloon() {
    if ($closestSVG) {
      if ($baloon.is(":visible")) {
        $baloon.fadeOut('fast', __show__);
      } else {
        __show__();
      }
    }
  }

  function hideBaloon() {
    if ($baloon.is(":visible")) {
      $baloon.fadeOut('fast');
    }
    $closestSVG = null;
  }

  function getPicName() {
    var xmlSerializer = new XMLSerializer();
    var sha1 = "" + CryptoJS.SHA1(
      xmlSerializer.serializeToString($closestSVG[0])
    );
    return sha1.substring(0, 7) +
            "_" +
            ($widthInput.val()|0) +
            "x" +
            ($heightInput.val()|0) +
            ".png";
  }

  function getScale() {
    var originalSize = getOriginalSize();
    var scaleW = Math.abs(
      parseFloat($widthInput.val()) / originalSize.width
    );
    var scaleH = Math.abs(
      parseFloat($heightInput.val()) / originalSize.height
    );
    return Math.min(scaleW, scaleH);
  }

  function saveThePicture() {
    var picName = getPicName();
    var scale = getScale();
    console.log(
      getSVGHTMLElement(),
      picName,
      {
        scale: scale
      }
    );
    saveSvgAsPng(
      getSVGHTMLElement(),
      picName,
      {
        scale: scale
      }
    );
  }

  function getSVGHTMLElement() {
    return $closestSVG[0];
  }

  function getOriginalSize() {
    return {
      width:  $closestSVG.width()|0, //attr("width")|0,
      height: $closestSVG.height()|0, //attr("height")|0,
    }
  }

  function getScaledSize() {
    var originalSize = getOriginalSize();
    var scale        = getScale();
    return {
      width:  scale * originalSize.width,
      height: scale * originalSize.height,
    }
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Runtime message: ", request, sender);
    if (request == "svg2pngDidClick") {
      if ($closestSVG.length) showBaloon();
    }
  });

  $(function() {

    $baloon = $(BALOON_TMPL).appendTo("body");
    $widthInput = $baloon.find("input[name=width]");
    $heightInput = $baloon.find("input[name=height]");
    $downloadButton = $baloon.find("[name=download]");

    $(document).mousedown(function(e) {
      if (e.button != 2) return;
      $closestSVG = $(e.target).closest("svg");
      if (!$closestSVG.length) {
        sendMessage("onSVGMouseDown");
      } else {
        sendMessage("onOtherElMouseDown");
      }
    });
    
    $(document).keydown(function(e) {
      if (e.keyCode == 27) {
        hideBaloon();
      }
    });

    $downloadButton.click(function(e) {
      e.stopPropagation();
      e.preventDefault();
      saveThePicture();
    });

    $widthInput.add($heightInput).on("change keyup paste", function(e) {
      var $element = $(event.target);
      var elementName = $element.attr("name");
      var elementValue = $element.val()|0;
      if (!elementName) {
        console.warn("Unable to fetch the element name");
        return;
      }
      var $siblingElement = ({
        width:  $heightInput,
        height: $widthInput,
      })[elementName];
      if (!$siblingElement) {
        console.warn("No sibling element found for elemeent name %s", elementName);
        return;
      }
      var originalSize = getOriginalSize();
      var scale = elementValue / originalSize[elementName];
      var siblingName = $siblingElement.attr("name");
      var newSiblingValue = Math.round(originalSize[siblingName] * scale);
      $siblingElement.val(newSiblingValue);
    });

    sendMessage("onSVGDOMContentLoaded");
  })

})();