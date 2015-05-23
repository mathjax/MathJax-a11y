//
//  The code to drive the interactive page
//
var Lab = {
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
        ["ShowMathML",this]
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
        +this.example.value+';'
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
//  Initialize everything once MathJax has run the first time
//
MathJax.Hub.Queue(function () {
  Lab.SMML = MathJax.Extension.SemanticMathML;
  Lab.jax = MathJax.Hub.getAllJax();
  Lab.input = document.getElementById("input");
  Lab.mathml = document.getElementById("mathml");
  Lab.example = document.getElementById("example");
  if (window.location.search.length > 1) {
    var match = window.location.search.match(/^\?(.*?);(.*)$/);
    Lab.example.value = match[1]; Lab.Current = parseInt(match[1]);
    Lab.input.value = unescape(match[2]);
    Lab.Typeset();
  }
});
