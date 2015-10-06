//
//  Hook into toggle action for highlighting
//

var HIGHLIGHT = MathJax.Extension.Highlight = {
  ToggleMethod: null,
  ClickMethod: null,
  Events: function () {
  var MML = MathJax.ElementJax.mml;
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
  },
  Toggle: function (span,frame,selection) {
    HIGHLIGHT.ToggleMethod.apply(this,arguments);
  },
  SetToggle: function () {
    var MML = MathJax.ElementJax.mml;
    HIGHLIGHT.GetToggle();
    MML.maction.prototype.HTMLaction.toggle = HIGHLIGHT.Toggle;
  },
  GetToggle: function() {
    var MML = MathJax.ElementJax.mml;
    HIGHLIGHT.ToggleMethod = MML.maction.prototype.HTMLaction.toggle;
    HIGHLIGHT.ClickMethod = MML.maction.prototype.HTMLclick;
  }
};

MathJax.Hub.Register.StartupHook("HTML-CSS maction Ready",
                                 MathJax.Extension.Highlight.Events);

MathJax.Hub.Register.StartupHook("HTML-CSS maction Ready",
                                 MathJax.Extension.Highlight.SetToggle, 20);
