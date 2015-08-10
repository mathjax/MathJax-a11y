//
//  The code to drive the interactive page
//
var Lab = {
  //
  //  Defaults for the options
  //
  defaults: {
    collapse: true,
    highlight: "none",
    width: 100,
    overflow: false
  },
  //
  //  The TeX code for the examples menu
  //
  Examples: [],
  //
  //  Typeset the math from the text area
  //
  Typeset: function () {
    if (this.jax) {
      var math = this.input.value;
      MathJax.Hub.Queue(
        ["Disable",this.SMML],
        ["Text",this.jax[0],math],
        ["Enable",this.SMML],
        ["Text",this.jax[1],math],
        ["ShowMathML",this],
        ["CollapseWideMath",MathJax.Extension.Collapse]
      );
    }
  },
  //
  //  Encode the TeX and add it to the URL so that reloading the page
  //  keeps the same TeX in place (so when you edit the code, you don't
  //  have to retype the TeX to view it again).
  //
  Keep: function () {
    window.location = 
      String(window.location).replace(/\?.*/,"")+"?"
        +[this.example.value, this.width.value,
          this.collapse, this.overflow, this.highlight,""].join(';')
        +escape(this.input.value);
  },
  //
  //  Select a specific example equation
  //
  Select: function (n) {
    if (n === "-" || n === "?") return;
    this.input.value = this.Examples[n];
    this.Typeset();
  },
  //
  //  Show the enhanced MathML
  //
  ShowMathML: function () {
    this.mathml.innerHTML = "";
    MathJax.HTML.addText(this.mathml,this.jax[1].root.toMathML().replace(/data-semantic-/g,""));
  },
  //
  //  Check for RETURN with any meta key as an alternative to clicking
  //  the TYPESET button
  //
  CheckKey: function (event) {
    if (!event) event = window.event;
    var code = event.which || event.keyCode;
    if ((event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) &&
        (code === 13 || code === 10)) {
      if (event.preventDefault) event.preventDefault();
      event.returnValue = false;
      this.Typeset();
    }
  },
  //
  //  Set the width of the output div
  //
  setWidth: function (width,skipHandler) {
    this.container.style.width = width+"%";
    document.getElementById("range_output").innerHTML = width+"%";
    if (!skipHandler) MathJax.Extension.Collapse.resizeHandler({});
  },
  //
  //  The highlight selection
  //
  highlight: "none",
  setHighlight: function (type,skipUpdate) {
    this.highlight = type;
    if (!skipUpdate) MathJax.Hub.Queue(["Rerender",this.jax[1]]);
  },
  //
  //  The collapse toggle
  //
  collapse: true,
  setCollapse: function (type,skipUpdate) {
    this.collapse = type;
    MathJax.Extension.Collapse[type ? "Enable" : "Disable"]();
    if (!skipUpdate) {
      MathJax.Hub.Queue(
        ["Reprocess",this.jax[1]],
        ["ShowMathML",this],
        ["CollapseWideMath",MathJax.Extension.Collapse]
      );
    }
  },
  //
  //  The overflow toggle
  //
  overflow: false,
  setOverflow: function (type,skipUpdate) {
    this.overflow = type;
    if (!skipUpdate) MathJax.Hub.Queue(["Rerender",MathJax.Hub]);
  },
  NewMath: function (message) {
    if (!this.overflow) return;
    var jax = MathJax.Hub.getJaxFor(message[1]);
    if (jax.root.Get("display") === "block") {
      var div = jax.SourceElement().previousSibling;
      div.style.overflow = "auto";
      div.style.minHeight = (div.offsetHeight+1) + "px"; // force height to be big enough
    }
  },
  //
  //  Directly select a specific test equation
  //
  DirectSelect: function (n) {
    (n < 1 && (this.Current = this.Examples.length)) ||
      (n > this.Examples.length && (this.Current = 1)) ||
      (this.Current = parseInt(n));
    this.input.value = this.Examples[this.Current - 1];
    this.example.value = this.Current;
    this.Typeset();
  },
  //
  // Current test equation.
  //
  Current: 0,
  //
  // Select next test equation.
  //
  Next: function() {
    this.DirectSelect(this.Current + 1);
  },
  //
  // Select previous test equation.
  //
  Prev: function() {
    this.DirectSelect(this.Current - 1);
  }

};
//
//  Hook into toggle action for highlighting
//
MathJax.Hub.Register.StartupHook("HTML-CSS maction Ready",function () {
  var MML = MathJax.ElementJax.mml;
  var TOGGLE = MML.maction.prototype.HTMLaction.toggle;
  MML.maction.prototype.HTMLaction.toggle = function (span,frame,selection) {
    TOGGLE.apply(this,arguments);
    var child = span.childNodes[1];
    if (Lab.highlight !== "hover") {
      frame.onmouseover = frame.onmouseout = child.onmouseover = child.onmouseout = null;
    }
    if (Lab.highlight === "flame") {
      frame.style.backgroundColor = "blue"; frame.style.opacity = .05;
    }
  };
},20);

//
//  Hook into "New Math" signal to set overflow
//
MathJax.Hub.Register.MessageHook("New Math",["NewMath",Lab]);

//
//  Initialize everything once MathJax has run the first time
//
MathJax.Hub.Queue(function () {
  var defaults = [null,"0",
    String(Lab.defaults.width),
    String(Lab.defaults.collapse),
    String(Lab.defaults.overflow),
    Lab.defaults.highlight,
    ""
  ];
  Lab.SMML = MathJax.Extension.SemanticMathML;
  Lab.jax = MathJax.Hub.getAllJax();
  Lab.input = document.getElementById("input");
  Lab.container = document.getElementById("container");
  Lab.enriched = document.getElementById("enriched");
  Lab.mathml = document.getElementById("mathml");
  Lab.example = document.getElementById("example");
  Lab.width = document.getElementById("width");
  if (window.location.search.length > 1) 
    defaults = window.location.search.match(/^\?(.*?);(.*?);(.*?);(.*?);(.*?);(.*)$/);
  Lab.example.value = defaults[1]; Lab.Current = parseInt(defaults[1]);
  Lab.width.value = defaults[2]; Lab.enriched.style.width = defaults[2];
  Lab.setWidth(Lab.width.value,true);
  Lab.collapse = document.getElementById("collapse").checked = (defaults[3] === "true");
  Lab.setCollapse(Lab.collapse,true);
  Lab.overflow = document.getElementById("overflow").checked = (defaults[4] === "true");
  Lab.setOverflow(Lab.overflow,true);
  Lab.highlight = document.getElementById("highlight").value = defaults[5];
  Lab.setHighlight(Lab.highlight,true);
  Lab.input.value = unescape(defaults[6]);
  if (Lab.input.value !== "") Lab.Typeset();
});
