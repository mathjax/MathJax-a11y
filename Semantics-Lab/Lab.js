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
  // The assistive extension
  ASSISTIVE: null,
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
        ["CollapseWideMath",MathJax.Extension.SemanticCollapse]
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
          this.collapse, this.overflow,
          Lab.ASSISTIVE.config.walker,
          Lab.ASSISTIVE.config.highlight,
          Lab.ASSISTIVE.config.background,
          Lab.ASSISTIVE.config.foreground,
          ""].join(';')
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
    if (!skipHandler) MathJax.Extension.SemanticCollapse.resizeHandler({});
  },
  
  //
  //  The collapse toggle
  //
  collapse: true,
  setCollapse: function (type,skipUpdate) {
    this.collapse = type;
    MathJax.Extension.SemanticCollapse[type ? "Enable" : "Disable"]();
    if (!skipUpdate) {
      MathJax.Hub.Queue(
        ["Reprocess",this.jax[1]],
        ["CollapseWideMath",MathJax.Extension.SemanticCollapse]
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
  explorerOptions: [],
  executeExplorerOptions: function() {
    while (Lab.ASSISTIVE && Lab.explorerOptions.length > 0) {
      Lab.ASSISTIVE.setOption.apply(Lab.ASSISTIVE,
                                    Lab.explorerOptions.pop());
    }
  },
  setExplorerOption: function(key, value) {
    Lab.explorerOptions.push([key, value]);
    Lab.executeExplorerOptions();
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
  },
  
  //
  //  Enable/Disable inputs
  //
  EnableInputs: function (enable) {
    var INPUTS = ["input","select","textarea"];
    for (var k = 0; k < INPUTS.length; k++) {
      var inputs = document.getElementsByTagName(INPUTS[k]);
      for (var i = 0, m = inputs.length; i < m; i++) inputs[i].disabled = !enable;
    }
  }
};

//
//  Hook into "New Math" signal to set overflow
//
MathJax.Hub.Register.MessageHook("New Math",["NewMath",Lab]);

//
// Wait for explorer to be ready and set its options
//
MathJax.Hub.Register.StartupHook("Explorer Ready",
                                 function() {
                                   Lab.ASSISTIVE = MathJax.Extension.Assistive;
                                   Lab.executeExplorerOptions();
                                 });

//
// Hook into reprocess as this can be also triggered from the menu.
//
MathJax.Hub.Register.MessageHook('End Reprocess', ['ShowMathML', Lab]);

//
//  Hook into menu renderer changes
//
MathJax.Hub.Register.StartupHook("MathMenu Ready",function () {
  MathJax.Extension.MathMenu.signal.Interest(function (message) {
    if (message[0] === "radio button") {
      var variable = message[1].variable;
      if (variable === 'renderer') {
        Lab.renderer.value = message[1].value;
        return;
      }
      if (String(variable).match(/^Assistive-/)) {
        var key = String(variable).replace('Assistive-', '');
        var element = document.getElementById(key);
        if (element) {
          element.value = message[1].value;
        }
      }
    }
  });
});

//
//  Initialize everything once MathJax has run the first time
//
MathJax.Hub.Register.StartupHook("onLoad",[Lab.EnableInputs,false]);
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
  MathJax.Extension.SemanticCollapse.config.disabled = !Lab.defaults.enableCollapse;
  if (Lab.input.value !== "") Lab.Typeset();
  Lab.EnableInputs(true);
});
