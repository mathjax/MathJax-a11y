MathJax.Hub.Register.StartupHook("HTML-CSS maction Ready",function () {
  var HTMLCSS = MathJax.OutputJax["HTML-CSS"],
      MML = MathJax.ElementJax.mml;
  var TOGGLE = MML.maction.prototype.HTMLaction.toggle;
  var CLICK = MML.maction.prototype.HTMLclick;
  
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
        frame.style.backgroundColor = "blue"; frame.style.opacity = .05;
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
