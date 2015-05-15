(function() {
  
  var $closestSVG;
  var $baloon;
  var $widthInput;
  var $heightInput;
  var $downloadButton;

  var __mouseX__;
  var __mouseY__;

  BALOON_TMPL = "\
    <div style='position: absolute; left: 0; top: 0; z-index: 1000; background-color: rgba(255,255,255,0.8); border: 1px solid #2980b9; border-radius: 5px; display: none; width: 150px; text-align: center; padding: 10px; color: #313131; font-family: Helvetica; font-size: 14px;'>\
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

  var __min_max__ = function(v, min, max) {
    return (v < min) ? min : ((v > max) ? max : v);
  }
  var __show__ = function(cb) {
    var originalSize = getOriginalSize();
    $widthInput.val(originalSize.width);
    $heightInput.val(originalSize.height);
    var width  = $baloon.width()|0;
    var height = $baloon.height()|0;
    var windowWidth  = $(window).width();
    var windowHeight = $(window).height();
    var left = __min_max__(
      __mouseX__ - width / 2,
      0,
      windowWidth - width
    );
    var top = __min_max__(
      __mouseY__ - height / 2,
      0,
      windowHeight - height
    );
    
    $baloon.css({
      left: left,
      top:  top,
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
    saveSvgAsPng(
      getSVGHTMLElement(),
      picName,
      {
        scale: scale
      }
    );
    hideBaloon();
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
      if ($closestSVG.length) {
        __mouseX__ = e.pageX|0;
        __mouseY__ = e.pageY|0;
        sendMessage("onSVGMouseDown");
      } else {
        sendMessage("onOtherElMouseDown");
      }
    });

    $("body").on("mouseover", "svg", function() {
      sendMessage("onSVGMouseDown");
    }).on("mouseout", "svg", function() {
      sendMessage("onOtherElMouseDown");
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
