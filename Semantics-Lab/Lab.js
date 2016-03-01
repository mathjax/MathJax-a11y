//
//  The code to drive the interactive page
//
var Lab = {
  //
  //  Defaults for the options
  //
  defaults: {
    enhance: "collapse",
    width: 100,
    overflow: false,
    walker: "dummy",
    highlight: "none",
    background: "blue",
    foreground: "black"
  },
  //
  //  Current option values
  //
  OPTION: {},
  //
  //  DOM element cache
  //
  DOM: {},
  //
  // The assistive extension
  //
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
      var math = this.DOM.input.value;
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
  //  Rerender the enriched math when options change
  //
  Rerender: function () {
    MathJax.Hub.Queue(
      ["Reprocess",this.jax[1]],
      ["ShowMathML",this],
      ["CollapseWideMath",MathJax.Extension.SemanticCollapse]
    );
  },

  //
  //  Encode the TeX and add it to the URL so that reloading the page
  //  keeps the same TeX in place (so when you edit the code, you don't
  //  have to retype the TeX to view it again).
  //
  Keep: function () {
    window.location = 
      String(window.location).replace(/\?.*/,"")+"?"
        +[this.DOM.example.value,
          this.DOM.width.value,
          this.DOM.renderer.value,
          this.DOM.enhance.value,
          this.OPTION.overflow,
          Lab.ASSISTIVE.getOption("walker"),
          Lab.ASSISTIVE.getOption("highlight"),
          Lab.ASSISTIVE.getOption("background"),
          Lab.ASSISTIVE.getOption("foreground"),
          ""].join(';')
        +escape(this.DOM.input.value);
  },

  //
  //  Select a specific example equation
  //
  Select: function (n) {
    if (n === "-" || n === "?") return;
    this.DOM.input.value = this.Examples[n];
    this.Typeset();
  },
  
  //
  //  Show the enhanced MathML
  //
  ShowMathML: function () {
    var mathml = this.jax[1].root.toMathML().replace(/data-semantic-/g,"");
    this.DOM.mathml.innerHTML = "";
    MathJax.HTML.addText(this.DOM.mathml,mathml);
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
    this.DOM.container.style.width = width + "%";
    this.DOM.range_output.innerHTML = width + "%";
    if (!skipHandler) MathJax.Extension.SemanticCollapse.resizeHandler({});
  },
  
  //
  //  The enhance toggle
  //
  setEnhance: function (type,skipUpdate) {
    var n = {none:0, enrich:1, complexity:2, collapse:3}[type];
    for (var i = 1; i < 4; i++) {
      this.OPTION[["","enrich","complexity","collapse"][i]] = (i <= n);
      var extension = MathJax.Extension["Semantic"+["","MathML","Complexity","Collapse"][i]];
      extension[i <= n ? "Enable" : "Disable"]();
    }
    if (!skipUpdate) this.Rerender();
  },
  
  //
  //  The overflow toggle
  //
  setOverflow: function (type,skipUpdate) {
    this.OPTION.overflow = type;
    if (!skipUpdate) MathJax.Hub.Queue(["Rerender",MathJax.Hub]);
  },
  NewMath: function (message) {
    if (!this.OPTION.overflow) return;
    var jax = MathJax.Hub.getJaxFor(message[1]);
    if (jax.root.Get("display") === "block") {
      var div = jax.SourceElement().previousSibling;
      div.style.overflowX = "auto";
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
  //  Set a Lab option (either boolean or string)
  //
  setOption: function (id,value) {
    if (value.match(/^(true|false)$/)) {
      value = this.DOM[id].checked = (value === "true");
    } else {
      this.DOM[id].value = value;
    }
    var method = "set"+id.charAt(0).toUpperCase()+id.substr(1);
    if (this[method]) this[method](value,true);
  },

  //
  //  Directly select a specific test equation
  //
  DirectSelect: function (n) {
    (n < 1 && (this.Current = this.Examples.length)) ||
      (n > this.Examples.length && (this.Current = 1)) ||
      (this.Current = parseInt(n));
    this.DOM.input.value = this.Examples[this.Current - 1];
    this.DOM.example.value = this.Current;
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
  //  Get DOM elements needed by the Lab
  //
  GetDomElements: function () {
    var ids = ["input","container","enhance","overflow","renderer",
               "mathml","example","container","width","range_output"];
    for (var i = 0, id; id = ids[i]; i++) Lab.DOM[id] = document.getElementById(id);
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
//  Wait for explorer to be ready and set its options
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
        Lab.DOM.renderer.value = message[1].value;
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
  Lab.GetDomElements();
  var defaults = [
    "0",
    String(Lab.defaults.width),
    Lab.defaults.renderer,
    String(Lab.defaults.enhance),
    String(Lab.defaults.overflow),
    Lab.defaults.walker,
    Lab.defaults.highlight,
    Lab.defaults.background,
    Lab.defaults.foreground,
    "",
  ];
  if (window.location.search.length > 1) 
    defaults = window.location.search.replace(/.*\?/,"").split(/;/);
  Lab.SMML = MathJax.Extension.SemanticMathML;
  Lab.jax = MathJax.Hub.getAllJax();
  Lab.Current = parseInt(defaults[0]);
  Lab.setOption("example",defaults[0]);
  Lab.DOM.container.style.width = defaults[1]+"%";
  Lab.setOption("width",defaults[1]);
  Lab.setOption("renderer",defaults[2]);
  Lab.setOption("enhance",defaults[3]);
  Lab.setOption("overflow",defaults[4]);
  Lab.setExplorerOption("walker", document.getElementById("walker").value = defaults[5]);
  Lab.setExplorerOption("highlight", document.getElementById("highlight").value = defaults[6]);
  Lab.setExplorerOption("background", document.getElementById("background").value = defaults[7]);
  Lab.setExplorerOption("foreground", document.getElementById("foreground").value = defaults[8]);
  Lab.setOption("input",unescape(defaults[9]));
  if (Lab.DOM.input.value !== "") Lab.Typeset();
  Lab.EnableInputs(true);
});
