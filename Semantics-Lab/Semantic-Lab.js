//
//  The code to drive the interactive page
//
var Lab = {
  //
  //  Defaults for the options
  //
  defaults: {
    collapse: true,
    width: 100,
    overflow: false,
    walker: "dummy",
    highlight: "none",
    background: "blue",
    foreground: "black"
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
        +[this.example.value, this.width.value, this.renderer.value,
          this.collapse, this.overflow, this.explorer.walker, this.explorer.highlight,
          this.explorer.background, this.explorer.foreground, ""].join(';')
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
  //  The renderer selection
  //
  setRenderer: function (mode,skipUpdate) {
    MathJax.Hub.Queue(["setRenderer",MathJax.Hub,mode,"jax/mml"]);
    if (!skipUpdate) MathJax.Hub.Queue(["Rerender",MathJax.Hub]);
  },
  
  //
  //  The static highlight selection
  //
  explorer: {
    walker: "dummy",
    highlight: "none",
    background: "blue",
    foreground: "black"
  },
  setExplorerOption: function(key, value) {
    if (this.explorer[key] === value) return;
    this.explorer[key] = value;
    MathJax.Extension.Explorer.Reset();
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
//  Hook into "New Math" signal to set overflow
//
MathJax.Hub.Register.MessageHook("New Math",["NewMath",Lab]);

//
//  Hook into menu renderer changes
//
MathJax.Hub.Register.StartupHook("MathMenu Ready",function () {
  MathJax.Extension.MathMenu.signal.Interest(function (message) {
    if (message[0] === "radio button") {
      var renderer = message[1].value;
      if (String(renderer).match(/^(HTML-CSS|CommonHTML|PreviewHTML|NativeMML|SVG)$/)) {
        Lab.renderer.value = renderer;
      }
    }
  });
});

//
//  Initialize everything once MathJax has run the first time
//
MathJax.Hub.Queue(function () {
  var defaults = [null,"0",
    String(Lab.defaults.width),
    Lab.defaults.renderer,
    String(Lab.defaults.collapse),
    String(Lab.defaults.overflow),
    Lab.defaults.walker,
    Lab.defaults.highlight,
    Lab.defaults.background,
    Lab.defaults.foreground,
    "",
  ];
  Lab.SMML = MathJax.Extension.SemanticMathML;
  Lab.jax = MathJax.Hub.getAllJax();
  Lab.input = document.getElementById("input");
  Lab.container = document.getElementById("container");
  Lab.enriched = document.getElementById("enriched");
  Lab.mathml = document.getElementById("mathml");
  Lab.example = document.getElementById("example");
  Lab.width = document.getElementById("width");
  Lab.renderer = document.getElementById("renderer");
  if (window.location.search.length > 1) 
    defaults = window.location.search.match(
        /^\?(.*?);(.*?);(.*?);(.*?);(.*?);(.*?);(.*?);(.*?);(.*?);(.*)$/);
  Lab.example.value = defaults[1];
  Lab.Current = parseInt(defaults[1]);
  Lab.width.value = defaults[2];
  Lab.enriched.style.width = defaults[2];
  Lab.renderer.value = defaults[3];
  Lab.setRenderer(Lab.renderer.value,true);
  Lab.renderer.onchange = function () {Lab.setRenderer(this.value)};
  Lab.setWidth(Lab.width.value,true);
  Lab.collapse = document.getElementById("collapse").checked = (defaults[4] === "true");
  Lab.setCollapse(Lab.collapse,true);
  Lab.overflow = document.getElementById("overflow").checked = (defaults[5] === "true");
  Lab.setOverflow(Lab.overflow,true);
  Lab.setExplorerOption("walker", document.getElementById("walker").value = defaults[6]);
  Lab.setExplorerOption("highlight", document.getElementById("highlight").value = defaults[7]);
  Lab.setExplorerOption("background", document.getElementById("background").value = defaults[8]);
  Lab.setExplorerOption("foreground", document.getElementById("foreground").value = defaults[9]);
  Lab.input.value = unescape(defaults[10]);
  if (Lab.input.value !== "") Lab.Typeset();
});
