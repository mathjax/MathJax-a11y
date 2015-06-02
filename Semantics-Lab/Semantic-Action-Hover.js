MathJax.Hub.Register.StartupHook("HTML-CSS maction Ready",function () {
  var HTMLCSS = MathJax.OutputJax["HTML-CSS"],
      MML = MathJax.ElementJax.mml;
  var TOGGLE = MML.maction.prototype.HTMLaction.toggle;
  var CLICK = MML.maction.prototype.HTMLclick;
  
  function MouseOver(event) {
    var frame = event.currentTarget;
    if (frame.className !== "MathJax_HitBox") frame = frame.previousSibling;
    frame.style.background = "blue"; frame.style.opacity = .1;
    return  MathJax.Extension.MathEvents.Event.False(event);
  };

  function MouseOut(event) {
    var frame = event.currentTarget;
    if (frame.className !== "MathJax_HitBox") frame = frame.previousSibling;
    frame.style.background = ""; frame.style.opacity = "";
    return  MathJax.Extension.MathEvents.Event.False(event);
  };
  
  function OpenCollapsed(mml) {
    if (mml.collapsible) mml.selection = 2;
    for (var i = 0, m = mml.data.length; i < m; i++) {
      var child = mml.data[i];
      if (child && !child.isToken) OpenCollapsed(child);
    }
  };

  MML.maction.Augment({
    HTMLaction: {
      toggle: function (span,frame,selection) {
        frame.onmouseover = span.childNodes[1].onmouseover = MouseOver;
        frame.onmouseout = span.childNodes[1].onmouseout = MouseOut;
        TOGGLE.apply(this,arguments);
      }
    },
    HTMLclick: function (event) {
      if (this.collapsible && event.shiftKey) {
        if (this.selection === 1) OpenCollapsed(this);
        this.selection = 1;
      }
      return CLICK.apply(this,arguments);
    }
  });
});
